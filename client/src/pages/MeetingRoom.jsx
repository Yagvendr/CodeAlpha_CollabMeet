import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MonitorUp,
  MonitorOff,
} from "lucide-react";

import ChatBox from "../components/ChatBox";
import FileUpload from "../components/FileUpload";
import Whiteboard from "../components/Whiteboard";
import VideoGrid from "../components/VideoGrid";

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function MeetingRoom({ meetingId, onLeave }) {
  const socketRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const cameraTrackRef = useRef(null);
  const mediaReadyRef = useRef(false);
  const mountedRef = useRef(true);
  const [myRole, setMyRole] = useState("participant");
  const [myName, setMyName] = useState("");
  const [handRaised, setHandRaised] = useState(false);
  const [raisedHands, setRaisedHands] = useState([]);

  // A separate RTCPeerConnection and DataChannel are kept for each participant.
  const peerConnectionsRef = useRef(new Map());
  const dataChannelsRef = useRef(new Map());
  const pendingCandidatesRef = useRef(new Map());
  const fileTransfersRef = useRef(new Map());

  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [mediaReady, setMediaReady] = useState(false);
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [error, setError] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [file, setFile] = useState(null);
  const [incomingFile, setIncomingFile] = useState(null);
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);
  const [remoteParticipants, setRemoteParticipants] = useState([]);
  const participantNamesRef = useRef(new Map());

  const updateConnectionStatus = useCallback(() => {
    const connected = [...peerConnectionsRef.current.values()].some(
      (peer) => peer.connectionState === "connected"
    );
    if (mountedRef.current) setRemoteConnected(connected);
  }, []);

  const addPendingCandidate = useCallback((sender, candidate) => {
    const list = pendingCandidatesRef.current.get(sender) || [];
    list.push(candidate);
    pendingCandidatesRef.current.set(sender, list);
  }, []);

  const flushPendingCandidates = useCallback(async (peer, sender) => {
    if (!peer.remoteDescription) return;
    const candidates = pendingCandidatesRef.current.get(sender) || [];
    for (const candidate of candidates) {
      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Could not add queued ICE candidate:", err);
      }
    }
    pendingCandidatesRef.current.delete(sender);
  }, []);

  const setupDataChannel = useCallback((channel, participantId) => {
    channel.binaryType = "arraybuffer";
    dataChannelsRef.current.set(participantId, channel);

    channel.onopen = () => {
      console.log("File DataChannel open for:", participantId);
    };
    channel.onclose = () => {
      console.log("File DataChannel closed for:", participantId);
      if (dataChannelsRef.current.get(participantId) === channel) {
        dataChannelsRef.current.delete(participantId);
      }
    };
    channel.onerror = (event) => {
      console.error("File DataChannel error:", participantId, event);
    };
    channel.onmessage = (event) => {
      // Each peer channel has its own transfer buffer, so simultaneous transfers
      // from different participants do not overwrite one another.
      if (typeof event.data === "string") {
        let data;
        try {
          data = JSON.parse(event.data);
        } catch {
          console.warn("Ignoring invalid file-transfer metadata.");
          return;
        }

        if (data.type === "file-start") {
          fileTransfersRef.current.set(participantId, {
            name: data.name || "shared-file",
            mimeType: data.mimeType || "application/octet-stream",
            size: Number(data.size) || 0,
            chunks: [],
            receivedSize: 0,
          });
          console.log("File receiving started from:", participantId, data.name);
          return;
        }

        if (data.type === "file-end") {
          const transfer = fileTransfersRef.current.get(participantId);
          if (!transfer) {
            console.warn("File end received without file metadata.");
            return;
          }
          const blob = new Blob(transfer.chunks, { type: transfer.mimeType });
          if (mountedRef.current) {
            setIncomingFile({ name: transfer.name, blob });
          }
          console.log("File received:", transfer.name);
          fileTransfersRef.current.delete(participantId);
        }
        return;
      }

      const transfer = fileTransfersRef.current.get(participantId);
      if (!transfer) {
        console.warn("Received a file chunk before file metadata from:", participantId);
        return;
      }

      const chunk = event.data instanceof Blob ? event.data : event.data;
      transfer.chunks.push(chunk);
      transfer.receivedSize += chunk.byteLength ?? chunk.size ?? 0;
    };
  }, []);

  const createPeerConnection = useCallback((participantId, shouldCreateDataChannel = false) => {
    const existing = peerConnectionsRef.current.get(participantId);
    if (existing && existing.signalingState !== "closed") {
      return existing;
    }

    console.log("Creating peer connection with:", participantId);
    const peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peerConnectionsRef.current.set(participantId, peer);

    const localStream = streamRef.current;
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        const alreadyAdded = peer.getSenders().some((sender) => sender.track === track);
        if (!alreadyAdded) peer.addTrack(track, localStream);
      });
    }

    peer.onicecandidate = (event) => {
      if (event.candidate && socketRef.current?.connected) {
        socketRef.current.emit("ice-candidate", {
          target: participantId,
          candidate: event.candidate,
        });
      }
    };

    peer.ontrack = (event) => {
      let remoteStream = event.streams?.[0];
      if (!remoteStream) {
        remoteStream = new MediaStream();
        remoteStream.addTrack(event.track);
      }

      setRemoteParticipants((previous) => {
        const index = previous.findIndex((participant) => participant.id === participantId);
        if (index === -1) {
          return [
            ...previous,
            {
              id: participantId,
              name: participantNamesRef.current.get(participantId) || "Guest",
              stream: remoteStream,
              muted: false,
            },
          ];
        }
        return previous.map((participant) =>
          participant.id === participantId
            ? {
                ...participant,
                name: participantNamesRef.current.get(participantId) || participant.name || "Guest",
                stream: remoteStream,
              }
            : participant
        );
      });
    };

    peer.onconnectionstatechange = () => {
      console.log("WebRTC connection state:", participantId, peer.connectionState);
      updateConnectionStatus();
      if (peer.connectionState === "failed") {
        console.warn("Peer connection failed. Check network/STUN/TURN configuration:", participantId);
      }
    };

    peer.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", participantId, peer.iceConnectionState);
      updateConnectionStatus();
    };

    peer.ondatachannel = (event) => {
      setupDataChannel(event.channel, participantId);
    };

    if (shouldCreateDataChannel) {
      const channel = peer.createDataChannel("file-transfer");
      setupDataChannel(channel, participantId);
    }

    return peer;
  }, [setupDataChannel, updateConnectionStatus]);

  const sendFile = async () => {
    if (!file) {
      alert("Please select a file first.");
      return;
    }

    const openChannels = [...dataChannelsRef.current.values()].filter(
      (channel) => channel.readyState === "open"
    );
    if (openChannels.length === 0) {
      alert("File connection is not ready. Wait until a participant is connected.");
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const chunkSize = 16 * 1024;

      for (const channel of openChannels) {
        channel.send(JSON.stringify({
          type: "file-start",
          name: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
        }));
        for (let offset = 0; offset < buffer.byteLength; offset += chunkSize) {
          while (channel.readyState === "open" && channel.bufferedAmount > 1024 * 1024) {
            await wait(50);
          }
          if (channel.readyState !== "open") {
            throw new Error("A file connection closed during transfer.");
          }
          channel.send(buffer.slice(offset, Math.min(offset + chunkSize, buffer.byteLength)));
        }
        channel.send(JSON.stringify({ type: "file-end" }));
      }

      alert(`File sent successfully to ${openChannels.length} connected participant(s): ${file.name}`);
      setFile(null);
    } catch (err) {
      console.error("File transfer failed:", err);
      alert(`File transfer failed: ${err.message || "Unknown error"}`);
    }
  };

  const downloadFile = () => {
    if (!incomingFile) return;
    const url = URL.createObjectURL(incomingFile.blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = incomingFile.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  useEffect(() => {
    mountedRef.current = true;
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Your login session has expired. Please log in again.");
      return undefined;
    }

    const socket = io("http://localhost:5000", {
      auth: { token },
    });
    socketRef.current = socket;

    const joinMeeting = () => {
      console.log("Socket connected:", socket.id);
      socket.emit("join-meeting", meetingId);
      console.log("Join meeting request sent:", meetingId);
    };

   const onMeetingJoined = (data = {}) => {
  console.log("MEETING JOINED:", data);

  setMyRole(data.role === "host" ? "host" : "participant");
  setMyName(data.name || data.username || "You");
  setError("");
};

    const onMeetingError = (details) => {
      console.error("Meeting join error:", details);
      setError(details?.message || "Unable to join this meeting.");
    };

    const onChatMessage = ({ sender, message: receivedMessage }) => {
      setMessages((previous) => [...previous, { sender, message: receivedMessage }]);
    };

    const onExistingParticipants = (participants = []) => {
      participants.forEach((participant) => {
        if (!participant?.socketId) return;
        const displayName = participant.name || participant.username || "Guest";
        participantNamesRef.current.set(participant.socketId, displayName);
      });

      setRemoteParticipants((previous) =>
        previous.map((participant) => ({
          ...participant,
          name: participantNamesRef.current.get(participant.id) || participant.name || "Guest",
        }))
      );
    };

    const onUserJoined = async ({ socketId, name, username } = {}) => {
      if (!socketId || socketId === socket.id) return;
      const displayName = name || username || "Guest";
      participantNamesRef.current.set(socketId, displayName);
      setRemoteParticipants((previous) =>
        previous.map((participant) =>
          participant.id === socketId
            ? { ...participant, name: displayName }
            : participant
        )
      );
      console.log("Another user joined:", displayName);

      // Only the existing participant initiates. The new participant answers.
      // This avoids both sides creating an offer at the same time.
      let attempts = 0;
      while (!mediaReadyRef.current && attempts < 100 && socket.connected) {
        await wait(100);
        attempts += 1;
      }
      if (!mediaReadyRef.current || !socket.connected) {
        console.warn("Media/socket not ready; not starting offer for:", socketId);
        return;
      }

      try {
        let peer = peerConnectionsRef.current.get(socketId);
        if (peer && peer.signalingState !== "closed") {
          console.log("Peer already exists; skipping duplicate offer:", socketId);
          return;
        }

        peer = createPeerConnection(socketId, true);
        if (peer.signalingState !== "stable") {
          console.warn("Cannot create offer in state:", peer.signalingState);
          return;
        }

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit("offer", {
          target: socketId,
          offer: peer.localDescription,
        });
        console.log("Offer sent to:", socketId);
      } catch (err) {
        console.error("Offer creation failed for:", socketId, err);
        setError("Unable to start a video connection. Please rejoin the meeting.");
      }
    };

    const onOffer = async ({ sender, offer }) => {
      if (!sender || !offer) return;
      console.log("Offer received from:", sender);

      let attempts = 0;
      while (!mediaReadyRef.current && attempts < 100 && socket.connected) {
        await wait(100);
        attempts += 1;
      }
      if (!mediaReadyRef.current) {
        console.warn("Local media is not ready; cannot answer offer from:", sender);
        return;
      }

      try {
        let peer = peerConnectionsRef.current.get(sender);
        if (!peer || peer.signalingState === "closed") {
          peer = createPeerConnection(sender, false);
        }

        // In this room design, only the existing user should initiate.
        // If an offer collision occurs, do not replace a live peer connection.
        if (peer.signalingState === "have-local-offer") {
          console.warn("Offer collision; rolling back local offer for:", sender);
          await peer.setLocalDescription({ type: "rollback" });
        }
        if (peer.signalingState !== "stable") {
          console.warn("Cannot accept offer in signaling state:", peer.signalingState);
          return;
        }

        await peer.setRemoteDescription(new RTCSessionDescription(offer));
        await flushPendingCandidates(peer, sender);

        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit("answer", {
          target: sender,
          answer: peer.localDescription,
        });
        console.log("Answer sent to:", sender);
      } catch (err) {
        console.error("Offer handling failed for:", sender, err);
        setError("Unable to answer a video connection. Please rejoin the meeting.");
      }
    };

    const onAnswer = async ({ sender, answer }) => {
      if (!sender || !answer) return;
      const peer = peerConnectionsRef.current.get(sender);
      if (!peer) {
        console.warn("Answer received without a peer connection:", sender);
        return;
      }
      if (peer.signalingState !== "have-local-offer") {
        console.warn("Ignoring unexpected answer from:", sender, "state:", peer.signalingState);
        return;
      }
      try {
        await peer.setRemoteDescription(new RTCSessionDescription(answer));
        await flushPendingCandidates(peer, sender);
        console.log("Remote answer accepted for:", sender);
      } catch (err) {
        console.error("Answer handling failed for:", sender, err);
      }
    };

    const onIceCandidate = async ({ sender, candidate }) => {
      if (!sender || !candidate) return;
      const peer = peerConnectionsRef.current.get(sender);
      if (!peer || !peer.remoteDescription) {
        addPendingCandidate(sender, candidate);
        return;
      }
      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("ICE candidate error from:", sender, err);
      }
    };

    const onUserLeft = ({ socketId }) => {
      if (!socketId) return;
      console.log("User left:", socketId);
      const peer = peerConnectionsRef.current.get(socketId);
      if (peer) peer.close();
      peerConnectionsRef.current.delete(socketId);

      const channel = dataChannelsRef.current.get(socketId);
      if (channel && channel.readyState !== "closed") channel.close();
      dataChannelsRef.current.delete(socketId);
      pendingCandidatesRef.current.delete(socketId);
      fileTransfersRef.current.delete(socketId);
      participantNamesRef.current.delete(socketId);
      setRemoteParticipants((previous) => previous.filter((participant) => participant.id !== socketId));
      updateConnectionStatus();
    };

    socket.on("connect", joinMeeting);
    socket.on("meeting-joined", onMeetingJoined);
    socket.on("meeting-error", onMeetingError);
    socket.on("meeting-join-error", onMeetingError);
    socket.on("chat-message", onChatMessage);
    socket.on("existing-participants", onExistingParticipants);
    socket.on("user-joined", onUserJoined);
    socket.on("offer", onOffer);
    socket.on("answer", onAnswer);
    socket.on("ice-candidate", onIceCandidate);
    socket.on("user-left", onUserLeft);
    socket.on("removed-from-meeting", ({ message }) => {
  setError(message || "You were removed from the meeting");
  socket.disconnect();
});

    const onHandStatus = (data) => {
  if (!data?.socketId) return;

  setRaisedHands((previous) => {
    const withoutUser = previous.filter(
      (person) => person.socketId !== data.socketId
    );

    return data.raised
      ? [...withoutUser, {
          socketId: data.socketId,
          name: data.name || "Participant",
        }]
      : withoutUser;
  });

  if (data.socketId === socket.id) {
    setHandRaised(Boolean(data.raised));
  }
};

socket.on("hand-status", onHandStatus);

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      setError("Unable to connect to the CollabMeet server. Check that the backend is running.");
    });

    if (socket.connected) joinMeeting();

    return () => {
      mountedRef.current = false;
      socket.emit("leave-meeting", meetingId);
      socket.off("hand-status", onHandStatus);
      socket.removeAllListeners();
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;

      peerConnectionsRef.current.forEach((peer) => peer.close());
      peerConnectionsRef.current.clear();
      participantNamesRef.current.clear();
      dataChannelsRef.current.forEach((channel) => {
        try { channel.close(); } catch { /* no-op */ }
      });
      dataChannelsRef.current.clear();
      pendingCandidatesRef.current.clear();
      fileTransfersRef.current.clear();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }
    };
  }, [meetingId, createPeerConnection, flushPendingCandidates, addPendingCandidate, updateConnectionStatus]);

  useEffect(() => {
    let cancelled = false;

    const startMedia = async () => {
      try {
        setError("");
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera and microphone are not supported by this browser.");
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (err) {
            console.warn("Local video playback will retry when ready:", err);
          }
        }

        mediaReadyRef.current = true;
        setMediaReady(true);
        setMicOn(true);
        setCameraOn(true);
        console.log("Camera and microphone are ready.");
      } catch (err) {
        console.error("Media error:", err);
        mediaReadyRef.current = false;
        setMediaReady(false);
        setError(`Media error: ${err.name || "Unknown"} - ${err.message || "Unable to access camera/microphone."}`);
      }
    };

    startMedia();

    return () => {
      cancelled = true;
      mediaReadyRef.current = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const toggleMic = () => {
    const track = streamRef.current?.getAudioTracks()[0];
    if (!track) {
      setError("Microphone is not available.");
      return;
    }
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  };

  const toggleCamera = () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) {
      setError("Camera is not available.");
      return;
    }
    track.enabled = !track.enabled;
    setCameraOn(track.enabled);
  };

  const replaceVideoTrackForAllPeers = async (track) => {
    const replacements = [];
    peerConnectionsRef.current.forEach((peer) => {
      const sender = peer.getSenders().find((item) => item.track?.kind === "video");
      if (sender) replacements.push(sender.replaceTrack(track));
    });
    await Promise.all(replacements);
  };

  const stopScreenShare = async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    const cameraTrack = cameraTrackRef.current || streamRef.current?.getVideoTracks()[0];
    if (cameraTrack) await replaceVideoTrackForAllPeers(cameraTrack);
    if (videoRef.current && streamRef.current) videoRef.current.srcObject = streamRef.current;
    setScreenSharing(false);
  };

  const toggleScreenShare = async () => {
    try {
      if (screenSharing) {
        await stopScreenShare();
        return;
      }
      if (!navigator.mediaDevices?.getDisplayMedia) {
        setError("Screen sharing is not supported by this browser.");
        return;
      }

      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const screenTrack = displayStream.getVideoTracks()[0];
      if (!screenTrack) return;

      cameraTrackRef.current = streamRef.current?.getVideoTracks()[0] || null;
      screenStreamRef.current = displayStream;
      await replaceVideoTrackForAllPeers(screenTrack);

      if (videoRef.current) {
        videoRef.current.srcObject = displayStream;
        try { await videoRef.current.play(); } catch { /* browser may retry */ }
      }
      setScreenSharing(true);

      screenTrack.onended = () => {
        stopScreenShare().catch((err) => console.error("Could not restore camera track:", err));
      };
    } catch (err) {
      console.error("Screen sharing error:", err);
      if (err.name !== "NotAllowedError") {
        setError(`Screen sharing error: ${err.message || "Unable to share screen."}`);
      }
    }
  };

  const sendMessage = () => {
    const text = message.trim();
    if (!text) return;
    if (!socketRef.current?.connected) {
      setError("Chat is not connected to the server.");
      return;
    }
    socketRef.current.emit("chat-message", { meetingId, message: text });
    setMessage("");
  };

  const handleLeave = () => {
    if (socketRef.current) {
      socketRef.current.emit("leave-meeting", meetingId);
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    peerConnectionsRef.current.forEach((peer) => peer.close());
    peerConnectionsRef.current.clear();
    dataChannelsRef.current.forEach((channel) => {
      try { channel.close(); } catch { /* no-op */ }
    });
    dataChannelsRef.current.clear();
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    mediaReadyRef.current = false;
    onLeave();
  };

  return (

    

    <div className="min-h-screen bg-gray-950 text-white">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 bg-gray-900 px-6 py-4">
        <div>
          <h1 className="text-xl font-bold text-indigo-400">CollabMeet</h1>
          <p className="text-sm text-gray-400">Meeting ID: {meetingId}</p>
        </div>
        <div className="flex items-center gap-3">
          {mediaReady && (
            <span className="rounded-full bg-green-600/20 px-3 py-1 text-xs text-green-400">
              Camera &amp; Mic Ready
            </span>
          )}
          {remoteConnected && (
            <span className="rounded-full bg-blue-600/20 px-3 py-1 text-xs text-blue-400">
              Participant Connected
            </span>
          )}
          <button
            onClick={handleLeave}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-medium hover:bg-red-700"
          >
            <PhoneOff size={18} />
            Leave Meeting
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <ChatBox
          chatOpen={chatOpen}
          setChatOpen={setChatOpen}
          messages={messages}
          message={message}
          setMessage={setMessage}
          sendMessage={sendMessage}
          socketId={socketRef.current?.id}
        />

        <FileUpload
          file={file}
          setFile={setFile}
          sendFile={sendFile}
          incomingFile={incomingFile}
          downloadFile={downloadFile}
        />

        {whiteboardOpen && (
          <Whiteboard
            onClose={() => setWhiteboardOpen(false)}
            socket={socketRef.current}
            meetingId={meetingId}
          />
        )}

        <section className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Participants</h2>
            <span className="text-sm text-gray-400">{remoteParticipants.length + 1} in this view</span>
          </div>

          <div className="mb-4 max-w-2xl">
            <div className="relative overflow-hidden rounded-2xl bg-black shadow-2xl">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="aspect-video w-full object-cover"
              />
              {!cameraOn && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <div className="text-center">
                    <VideoOff size={42} className="mx-auto text-gray-400" />
                    <p className="mt-3 text-gray-300">Camera is off</p>
                  </div>
                </div>
              )}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-black/60 px-3 py-1 text-sm">
  <span>{myName || "You"}</span>

  {myRole === "host" && (
    <span className="rounded bg-indigo-600 px-2 py-0.5 text-xs font-semibold">
      Host
    </span>
  )}
</div>
            </div>
          </div>
          <VideoGrid
  participants={remoteParticipants}
  myRole={myRole}
  onRemoveParticipant={(targetSocketId) => {
    socketRef.current?.emit("remove-participant", {
      targetSocketId,
    });
  }}
/>
        </section>

        {error && (
          <div className="mt-4 rounded-lg bg-red-600/95 px-4 py-3 text-center text-sm">
            {error}
          </div>
        )}

        <div className="mt-5 text-center text-sm text-gray-400">
          {remoteConnected
            ? "Connected to one or more participants."
            : "Waiting for another participant to connect..."}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={toggleMic}
            title={micOn ? "Mute microphone" : "Unmute microphone"}
            className={`flex h-14 w-14 items-center justify-center rounded-full ${micOn ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-700"}`}
          >
            {micOn ? <Mic size={22} /> : <MicOff size={22} />}
          </button>
          <button
            type="button"
            onClick={toggleCamera}
            title={cameraOn ? "Turn camera off" : "Turn camera on"}
            className={`flex h-14 w-14 items-center justify-center rounded-full ${cameraOn ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-700"}`}
          >
            {cameraOn ? <Video size={22} /> : <VideoOff size={22} />}
          </button>
          <button
            type="button"
            onClick={toggleScreenShare}
            title={screenSharing ? "Stop screen sharing" : "Share screen"}
            className={`flex h-14 w-14 items-center justify-center rounded-full ${screenSharing ? "bg-red-600 hover:bg-red-700" : "bg-gray-700 hover:bg-gray-600"}`}
          >
            {screenSharing ? <MonitorOff size={22} /> : <MonitorUp size={22} />}
          </button>
          <button
            type="button"
            onClick={() => setWhiteboardOpen(true)}
            className="rounded-full bg-indigo-600 px-5 py-3 font-medium hover:bg-indigo-500"
          >
            🎨 Whiteboard
          </button>
          <button
            type="button"
            onClick={handleLeave}
            className="flex h-14 items-center gap-2 rounded-full bg-red-600 px-6 font-semibold hover:bg-red-700"
          >
            <PhoneOff size={20} />
            Leave
          </button>
          
<button
  type="button"
  onClick={() => {
    const nextState = !handRaised;

    setHandRaised(nextState);
    socketRef.current?.emit("raise-hand", {
      raised: nextState,
    });
  }}
  className={`flex h-14 items-center justify-center gap-2 rounded-full px-5 font-semibold text-white ${
    handRaised
      ? "bg-yellow-500 hover:bg-yellow-600"
      : "bg-gray-700 hover:bg-gray-600"
  }`}
  title={handRaised ? "Lower hand" : "Raise hand"}
>
  <span>✋</span>
  {handRaised ? "Lower Hand" : "Raise Hand"}
</button>

         
        </div>
      </main>
    </div>
  );
}

export default MeetingRoom;

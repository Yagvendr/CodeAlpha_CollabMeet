const User = require("./models/User");
const connectDB = require("./config/db");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const authRoutes = require("./routes/authRoutes");
const meetingRoutes = require("./routes/meetingRoutes");
const Meeting = require("./models/Meeting");
dotenv.config();
connectDB();
const app = express();

const server = http.createServer(app);


 

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});


const jwt = require("jsonwebtoken");


io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error("Authentication required"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded.userId;

    if (!userId) {
      return next(new Error("User ID missing from token"));
    }

    const user = await User.findById(userId).select("name username");

    if (!user) {
      return next(
        new Error("User not found. Please log in again.")
      );
    }

    socket.user = {
      userId: user._id.toString(),
      name: user.name || user.username || "Guest",
      username: user.username || "",
    };
socket.data.user = socket.user;
    next();
  } catch (error) {
    console.error("Socket authentication error:", error.message);
    next(new Error("Invalid or expired token. Please log in again."));
  }
});




app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/meetings", meetingRoutes);
app.get("/", (req, res) => {
  res.json({
    message: "CollabMeet Server is running 🚀",
  });
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  // Host removes a participant
socket.on("remove-participant", async ({ targetSocketId } = {}) => {
  try {
    const meetingId = socket.data.meetingId;

    if (!meetingId || !socket.rooms.has(meetingId)) return;

    const meeting = await Meeting.findOne({
      meetingId,
      status: "active",
    });

    if (!meeting) return;

    // Only the meeting host can remove participants
    if (String(meeting.host) !== String(socket.data.userId)) {
      socket.emit("meeting-error", {
        message: "Only the host can remove participants",
      });
      return;
    }

    if (
      !targetSocketId ||
      targetSocketId === socket.id
    ) {
      return;
    }

    const targetSocket = io.sockets.sockets.get(targetSocketId);

    if (
      !targetSocket ||
      !targetSocket.rooms.has(meetingId)
    ) {
      return;
    }

    targetSocket.emit("removed-from-meeting", {
      message: "The host removed you from the meeting",
    });

    targetSocket.leave(meetingId);

    targetSocket.to(meetingId).emit("user-left", {
      socketId: targetSocket.id,
    });
  } catch (error) {
    console.error("Remove participant error:", error);
  }
});

  // Join meeting
 

socket.on("join-meeting", async (meetingId) => {
  try {
    if (
  typeof meetingId !== "string" ||
  !/^[A-F0-9]{16}$/i.test(meetingId.trim())
) {
  socket.emit("meeting-error", {
    message: "Invalid meeting ID",
  });
  return;
}

    const safeMeetingId = meetingId.trim().toUpperCase();
    const userId = socket.user?.userId;

    if (!userId) {
      socket.emit("meeting-error", {
        message: "Authentication required",
      });
      return;
    }

    const meeting = await Meeting.findOne({
      meetingId: safeMeetingId,
      status: "active",
    });

    if (!meeting) {
      socket.emit("meeting-error", {
        message: "Meeting not found or has ended",
      });
      return;
    }

    const isParticipant = meeting.participants.some(
      (participantId) =>
        participantId.toString() === String(userId)
    );

    if (!isParticipant) {
      socket.emit("meeting-error", {
        message: "Please verify meeting access before joining",
      });
      return;
    }
 

const hostId = String(meeting.host?._id || meeting.host);

socket.data.userId = String(userId);
socket.data.user = socket.user;

socket.data.meetingRole =
  hostId === String(userId) ? "host" : "participant";

const existingSockets = await io
  .in(safeMeetingId)
  .fetchSockets();

const existingParticipants = existingSockets.map((s) => ({
  socketId: s.id,
  name: s.data?.user?.name || s.data?.user?.username || "Guest",
  username: s.data?.user?.username || "",
  role:
    String(s.data?.userId) === hostId
      ? "host"
      : "participant",
}));

socket.join(safeMeetingId);
socket.data.meetingId = safeMeetingId;
socket.emit("existing-participants", existingParticipants);

socket.to(safeMeetingId).emit("user-joined", {
  socketId: socket.id,
  name: socket.user.name,
  username: socket.user.username,
  role: socket.data.meetingRole,
});

console.log(`${socket.id} joined meeting: ${safeMeetingId}`);
console.log("HOST ROLE CHECK:", {
  meetingHost: meeting.host.toString(),
  currentUser: String(userId),
  role: socket.data.meetingRole,
});
socket.emit("meeting-joined", {
  meetingId: safeMeetingId,
  message: "Joined meeting successfully",
  role: socket.data.meetingRole,
  hostId,
  name: socket.user.name || socket.user.username || "You",
  username: socket.user.username || "",
});
    
    //hand raise // 
socket.on("raise-hand", ({ raised } = {}) => {
  const meetingId = socket.data.meetingId;

  // Only authorized meeting members can raise/lower hands.
  if (!meetingId || !socket.rooms.has(meetingId)) {
    return;
  }

  if (typeof raised !== "boolean") {
    return;
  }

  const user = socket.user || {};

  io.to(meetingId).emit("hand-status", {
    socketId: socket.id,
    name: user.name || user.username || "Participant",
    raised,
  });
});

  
  } catch (error) {
    console.error("Meeting authorization error:", error);

    socket.emit("meeting-error", {
      message: "Unable to verify meeting access",
    });
  }
});


   // ----------------------------------------
// CHAT MESSAGE
// ----------------------------------------

socket.on("chat-message", ({ meetingId, message }) => {
  console.log(
    `Chat message from ${socket.id}: ${message}`
  );

  io.to(meetingId).emit("chat-message", {
    sender: socket.id,
    message,
  });
});

socket.on("whiteboard-draw", (data) => {
  socket.to(data.meetingId).emit("whiteboard-draw", {
    x: data.x,
    y: data.y,
    prevX: data.prevX,
    prevY: data.prevY,
    color: data.color,
    size: data.size,
  });
});

  // WebRTC Offer
  socket.on("offer", ({ target, offer }) => {
    socket.to(target).emit("offer", {
      sender: socket.id,
      offer,
    });
  });

  // WebRTC Answer
  socket.on("answer", ({ target, answer }) => {
    socket.to(target).emit("answer", {
      sender: socket.id,
      answer,
    });
  });

  // ICE Candidate
  socket.on("ice-candidate", ({ target, candidate }) => {
    socket.to(target).emit("ice-candidate", {
      sender: socket.id,
      candidate,
    });
  });

  // User leaves meeting
  socket.on("leave-meeting", (meetingId) => {
    socket.to(meetingId).emit("user-left", {
      socketId: socket.id,
    });

    socket.leave(meetingId);

    console.log(
      `${socket.id} left meeting: ${meetingId}`
    );
  });

  // User disconnects
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
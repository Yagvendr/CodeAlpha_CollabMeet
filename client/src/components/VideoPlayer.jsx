
import { useEffect, useRef } from "react";

function VideoPlayer({
  stream,
  name = "Participant",
  muted = false,
}) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;

    video.muted = muted;
    video.autoplay = true;
    video.playsInline = true;

    if (video.srcObject !== stream) {
      video.srcObject = stream || null;
    }

    const playVideo = async () => {
      if (cancelled || !stream || !videoRef.current) return;

      try {
        await video.play();
      } catch (error) {
        if (error.name === "AbortError") {
          console.debug("Video source changed; retrying on next load.");
        } else if (error.name === "NotAllowedError") {
          console.warn("Browser requires user interaction to play video.");
        } else {
          console.error("Video playback failed:", error);
        }
      }
    };

    video.addEventListener("loadedmetadata", playVideo);

    if (video.readyState >= 1 && stream) {
      playVideo();
    }

    return () => {
      cancelled = true;
      video.removeEventListener("loadedmetadata", playVideo);
    };
  }, [stream, muted]);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-lg">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className="aspect-video w-full bg-black object-cover"
      />

      <div className="px-3 py-2">
        <p className="truncate text-sm font-medium text-white">
          {name}
        </p>
      </div>
    </div>
  );
}

export default VideoPlayer;

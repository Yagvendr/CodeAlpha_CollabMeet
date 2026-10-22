import VideoPlayer from "./VideoPlayer";

function VideoGrid({
  participants = [],
  myRole,
  onRemoveParticipant,
}) {
  if (participants.length === 0) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-2xl bg-slate-900 p-6 text-center text-slate-300">
        Waiting for participants to join...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {participants.map((participant) => (
        <div
          key={participant.id}
          className="relative"
        >
          <VideoPlayer
            stream={participant.stream}
            name={participant.name || "Guest"}
            muted={participant.muted ?? false}
          />

          {myRole === "host" && (
            <button
              type="button"
              onClick={() =>
                onRemoveParticipant?.(participant.id)
              }
              className="absolute right-3 top-3 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-red-700"
            >
              Remove
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default VideoGrid;
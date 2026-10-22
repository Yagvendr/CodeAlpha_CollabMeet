
import { useState } from "react";
import { Video, Copy, ArrowLeft } from "lucide-react";

function CreateMeeting({ onBack, onMeetingCreated }) {
  const [meetingId, setMeetingId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateMeeting = async () => {
    if (meetingId) {
      onMeetingCreated(meetingId);
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login first.");
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/meetings",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Unable to create meeting");
        return;
      }

      const id = data.meeting.meetingId;
      setMeetingId(id);
    } catch (error) {
      console.error("Create meeting error:", error);
      alert("Server connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyMeetingId = async () => {
    if (!meetingId) return;

    try {
      await navigator.clipboard.writeText(meetingId);
      alert("Meeting ID copied!");
    } catch (error) {
      console.error("Copy error:", error);
      alert("Unable to copy Meeting ID.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-lg">
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-indigo-600"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
              <Video size={32} className="text-indigo-600" />
            </div>

            <h1 className="mt-5 text-3xl font-bold text-gray-900">
              Create Meeting
            </h1>

            <p className="mt-2 text-gray-500">
              Create a meeting and share the Meeting ID with your team.
            </p>
          </div>

          {meetingId && (
            <div className="mt-8">
              <label className="text-sm font-medium text-gray-700">
                Meeting ID
              </label>

              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={meetingId}
                  readOnly
                  className="w-full rounded-lg border bg-gray-50 px-4 py-3 font-semibold tracking-wider outline-none"
                />

                <button
                  onClick={copyMeetingId}
                  className="rounded-lg bg-gray-900 px-4 text-white hover:bg-gray-800"
                  title="Copy Meeting ID"
                >
                  <Copy size={20} />
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleCreateMeeting}
            disabled={loading}
            className="mt-8 w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading
              ? "Creating Meeting..."
              : meetingId
              ? "Start Meeting"
              : "Generate Meeting ID"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateMeeting;

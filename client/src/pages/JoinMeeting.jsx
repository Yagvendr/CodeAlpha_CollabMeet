import { useState } from "react";
import { Users, ArrowLeft, Video } from "lucide-react";

function JoinMeeting({ onBack, onJoinMeeting }) {
  const [meetingId, setMeetingId] = useState("");

  
const handleJoin = async () => {
  const id = meetingId.trim().toUpperCase();

  if (!id) {
    alert("Please enter Meeting ID");
    return;
  }

  try {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first.");
      return;
    }

    console.log("Meeting ID entered:", id);
console.log("Meeting ID type:", typeof id);

console.log("Meeting ID value:", JSON.stringify(id));
console.log("Meeting ID length:", id?.length);

    const response = await fetch(
      "http://localhost:5000/api/meetings/join",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ meetingId: id }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Unable to join meeting");
      return;
    }

    onJoinMeeting(id);
  } catch (error) {
    console.error("Join meeting error:", error);
    alert("Server connection failed. Please try again.");
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

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Users
                size={32}
                className="text-green-600"
              />
            </div>

            <h1 className="mt-5 text-3xl font-bold text-gray-900">
              Join Meeting
            </h1>

            <p className="mt-2 text-gray-500">
              Enter the Meeting ID shared with you.
            </p>

          </div>

          <div className="mt-8">

            <label className="text-sm font-medium text-gray-700">
              Meeting ID
            </label>

            <input
              type="text"
              value={meetingId}
              onChange={(e) => setMeetingId(e.target.value)}
              placeholder="Enter Meeting ID"
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />

          </div>

          <button
            onClick={handleJoin}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 py-3 font-semibold text-white hover:bg-green-700"
          >
            <Video size={20} />
            Join Meeting
          </button>

        </div>

      </div>
    </div>
  );
}

export default JoinMeeting;
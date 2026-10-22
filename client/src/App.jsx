import { useState } from "react";

import Home from "./Home";
import Login from "./Login";
import Signup from "./Signup";
import CreateMeeting from "./pages/CreateMeeting";
import JoinMeeting from "./pages/JoinMeeting";
import MeetingRoom from "./pages/MeetingRoom";
import {
  Video,
  Users,
  Calendar,
  FileText,
  LogOut,
} from "lucide-react";

function App() {
  const [page, setPage] = useState("home");
const [meetingId, setMeetingId] = useState("");

  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("token")
  );

  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  // =========================
  // LOGIN SUCCESS
  // =========================
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setPage("dashboard");
  };

  // =========================
  // SIGNUP SUCCESS
  // =========================
  const handleSignupSuccess = () => {
    setPage("login");
  };

  // =========================
  // LOGOUT
  // =========================
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setIsLoggedIn(false);
    setPage("home");
  };

  // =========================
  // HOME PAGE
  // =========================
  if (page === "home" && !isLoggedIn) {
    return (
      <Home
        onLogin={() => setPage("login")}
        onSignup={() => setPage("signup")}
      />
    );
  }

  // =========================
  // SIGNUP PAGE
  // =========================
  if (page === "signup" && !isLoggedIn) {
    return (
      <Signup
        onSignupSuccess={handleSignupSuccess}
        onLogin={() => setPage("login")}
      />
    );
  }

  // =========================
  // LOGIN PAGE
  // =========================
  if (page === "login" && !isLoggedIn) {
    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onSignup={() => setPage("signup")}
      />
    );
  }

  // =========================
  // CREATE MEETING PAGE
  // IMPORTANT: BEFORE DASHBOARD
  // =========================

  
  if (page === "create-meeting" && isLoggedIn) {
    return (
      <CreateMeeting
        onBack={() => setPage("dashboard")}
      
       onMeetingCreated={(meetingId) => {
  setMeetingId(meetingId);
  setPage("meeting-room");

        }}
      />
    );
  }


  // =========================
// MEETING ROOM
// =========================
if (page === "meeting-room" && isLoggedIn) {
  return (
    <MeetingRoom
      meetingId={meetingId}
      onLeave={() => setPage("dashboard")}
    />
  );
}
  // =========================
// JOIN MEETING PAGE
// =========================
if (page === "join-meeting" && isLoggedIn) {
  return (
    <JoinMeeting
      onBack={() => setPage("dashboard")}
     onJoinMeeting={(id) => {
  setMeetingId(id);
  setPage("meeting-room");
}}
    />
  );
}

  // =========================
  // DASHBOARD
  // =========================
  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-100">

        {/* Navbar */}
        <nav className="border-b bg-white px-6 py-4">
          <div className="mx-auto flex max-w-7xl items-center justify-between">

            <h1 className="text-2xl font-bold text-indigo-600">
              CollabMeet
            </h1>

            <div className="flex items-center gap-4">

              <span className="text-sm text-gray-600">
                Welcome, {user?.name || "User"}
              </span>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 font-bold text-white">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
              >
                <LogOut size={17} />
                Logout
              </button>

            </div>

          </div>
        </nav>

        {/* Main */}
        <main className="mx-auto max-w-7xl px-6 py-10">

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Dashboard
            </h2>

            <p className="mt-2 text-gray-500">
              Manage your meetings and collaboration sessions.
            </p>
          </div>

          {/* Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

            {/* Start Meeting */}
            <div className="rounded-xl bg-white p-6 shadow-sm">

              <Video
                className="mb-4 text-indigo-600"
                size={32}
              />

              <h3 className="text-lg font-semibold">
                Start Meeting
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Start a new video meeting.
              </p>

              <button
                onClick={() => setPage("create-meeting")}
                className="mt-5 w-full rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
              >
                Start Meeting
              </button>

            </div>

            {/* Join Meeting */}
            <div className="rounded-xl bg-white p-6 shadow-sm">

              <Users
                className="mb-4 text-green-600"
                size={32}
              />

              <h3 className="text-lg font-semibold">
                Join Meeting
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Join an existing meeting.
              </p>

              <button
  onClick={() => setPage("join-meeting")}
  className="mt-5 w-full rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
>
  Join Meeting
</button>

            </div>

            {/* Meetings */}
            <div className="rounded-xl bg-white p-6 shadow-sm">

              <Calendar
                className="mb-4 text-orange-600"
                size={32}
              />

              <h3 className="text-lg font-semibold">
                Meetings
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                View your meetings.
              </p>

              <button
                className="mt-5 w-full rounded-lg bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
              >
                View Meetings
              </button>

            </div>

            {/* Shared Files */}
            <div className="rounded-xl bg-white p-6 shadow-sm">

              <FileText
                className="mb-4 text-purple-600"
                size={32}
              />

              <h3 className="text-lg font-semibold">
                Shared Files
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Access shared documents.
              </p>

              <button
                className="mt-5 w-full rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
              >
                View Files
              </button>

            </div>

          </div>

          {/* Recent Meetings */}
          <div className="mt-10 rounded-xl bg-white p-6 shadow-sm">

            <div className="flex items-center justify-between">

              <h3 className="text-xl font-bold">
                Recent Meetings
              </h3>

              <button className="text-sm font-medium text-indigo-600">
                View All
              </button>

            </div>

            <div className="mt-6 rounded-lg border border-dashed p-10 text-center">

              <Video
                className="mx-auto mb-3 text-gray-400"
                size={40}
              />

              <p className="text-gray-500">
                No meetings yet
              </p>

              <p className="mt-1 text-sm text-gray-400">
                Start your first meeting to see it here.
              </p>

            </div>

          </div>

        </main>

      </div>
    );
  }

  // =========================
  // FALLBACK
  // =========================
  return (
    <Home
      onLogin={() => setPage("login")}
      onSignup={() => setPage("signup")}
    />
  );
}

export default App;

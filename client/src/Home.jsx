import { Video, Users, Shield, Monitor } from "lucide-react";

function Home({ onLogin, onSignup }) {
  return (
    <div className="min-h-screen bg-slate-50">

      {/* Navbar */}
      <nav className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">

          <h1 className="text-2xl font-bold text-indigo-600">
            CollabMeet
          </h1>

         <button
  onClick={onLogin}
  className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-100"
>
  Login
</button>

        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 py-20 text-center">

        <div className="mx-auto max-w-3xl">

          <h2 className="text-5xl font-bold leading-tight text-gray-900">
            Connect, Collaborate &
            <span className="text-indigo-600">
              {" "}Meet Together
            </span>
          </h2>

          <p className="mt-6 text-lg text-gray-600">
            CollabMeet is a real-time collaboration platform for
            video meetings, screen sharing, file sharing and
            collaborative teamwork.
          </p>

          {/* Hero Buttons */}
          <div className="mt-8 flex justify-center gap-4">

            <button
              onClick={onSignup}
              className="rounded-lg bg-indigo-600 px-8 py-3 font-semibold text-white shadow transition hover:bg-indigo-700"
            >
              Get Started
            </button>

            <button
              onClick={onLogin}
              className="rounded-lg border border-gray-300 bg-white px-8 py-3 font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100"
            >
              Login
            </button>

          </div>

        </div>

      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-6 pb-20">

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

          {/* Video Meetings */}
          <div className="rounded-xl bg-white p-6 shadow-sm">

            <Video
              className="mb-4 text-indigo-600"
              size={35}
            />

            <h3 className="text-lg font-semibold">
              Video Meetings
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Connect with multiple users using real-time video
              communication.
            </p>

          </div>

          {/* Collaboration */}
          <div className="rounded-xl bg-white p-6 shadow-sm">

            <Users
              className="mb-4 text-green-600"
              size={35}
            />

            <h3 className="text-lg font-semibold">
              Multi-User Collaboration
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Collaborate with your team in real-time meetings.
            </p>

          </div>

          {/* Screen Sharing */}
          <div className="rounded-xl bg-white p-6 shadow-sm">

            <Monitor
              className="mb-4 text-orange-500"
              size={35}
            />

            <h3 className="text-lg font-semibold">
              Screen Sharing
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Share your screen during meetings for better
              collaboration.
            </p>

          </div>

          {/* Security */}
          <div className="rounded-xl bg-white p-6 shadow-sm">

            <Shield
              className="mb-4 text-purple-600"
              size={35}
            />

            <h3 className="text-lg font-semibold">
              Secure Communication
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Authentication and secure communication protect
              your collaboration sessions.
            </p>

          </div>

        </div>

      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-6 text-center text-sm text-gray-500">
        © 2026 CollabMeet. All rights reserved.
      </footer>

    </div>
  );
}

export default Home;
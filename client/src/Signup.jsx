import { useState } from "react";
import axios from "axios";

function Signup({ onSignupSuccess, onLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        {
          name,
          email,
          password,
        }
      );

      alert(response.data.message);

      onSignupSuccess();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Registration failed"
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">

      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">

        <h1 className="text-center text-3xl font-bold text-indigo-600">
          CollabMeet
        </h1>

        <p className="mt-2 text-center text-gray-500">
          Create your account
        </p>

        <form onSubmit={handleSignup} className="mt-8">

          {/* Name */}
          <label className="text-sm font-medium text-gray-700">
            Full Name
          </label>

          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full rounded-lg border px-4 py-3 outline-none focus:border-indigo-500"
            required
          />

          {/* Email */}
          <label className="mt-5 block text-sm font-medium text-gray-700">
            Email
          </label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-lg border px-4 py-3 outline-none focus:border-indigo-500"
            required
          />

          {/* Password */}
          <label className="mt-5 block text-sm font-medium text-gray-700">
            Password
          </label>

          <input
            type="password"
            placeholder="Minimum 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-lg border px-4 py-3 outline-none focus:border-indigo-500"
            minLength={6}
            required
          />

          {/* Signup */}
          <button
            type="submit"
            className="mt-6 w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700"
          >
            Sign Up
          </button>

        </form>

        {/* Login */}
        <p className="mt-6 text-center text-sm text-gray-500">

          Already have an account?{" "}

          <button
            onClick={onLogin}
            className="font-semibold text-indigo-600 hover:underline"
          >
            Login
          </button>

        </p>

      </div>

    </div>
  );
}

export default Signup;
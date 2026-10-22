
import { useState } from "react";

import axios from "axios";

function Login({ onLoginSuccess, onSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email,
          password,
        }
      );

      localStorage.setItem("token", response.data.token);
      localStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
      );

      alert("Login successful!");
      onLoginSuccess();

      console.log(response.data);
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Login failed"
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
          Sign in to your account
        </p>

        <form onSubmit={handleLogin} className="mt-8">

          <label className="text-sm font-medium text-gray-700">
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

          <label className="mt-5 block text-sm font-medium text-gray-700">
            Password
          </label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-lg border px-4 py-3 outline-none focus:border-indigo-500"
            required
          />

          <button
            type="submit"
            className="mt-6 w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700"
          >
            Login
          </button>

 

<p className="mt-6 text-center text-sm text-gray-500">
  Don't have an account?{" "}
  <button
    type="button"
    onClick={onSignup}
    className="font-semibold text-indigo-600 hover:underline"
  >
    Register
  </button>
</p>
        </form>

      </div>
    </div>
  );
}

export default Login;
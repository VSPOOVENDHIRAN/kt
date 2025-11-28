import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Login API call with proper error handling
const loginUser = async (email, password) => {
  try {
    const response = await fetch("http://localhost:5001/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    // If backend responds with error (e.g., invalid credentials)
    if (!response.ok) {
      const errorData = await response.json();
      return { message: errorData.message || "Invalid email or password" };
    }

    // Success
    return await response.json();
  } catch (err) {
    console.error("Network error:", err);
    // Network/server unreachable
    return { networkError: true, message: "Cannot reach server. Try again later." };
  }
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");

    if (!email) {
      setError("Please enter your email.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    const data = await loginUser(email, password);
    setLoading(false);

    if (data.token) {
      localStorage.setItem("token", data.token);
      navigate("/profile");
    } else if (data.networkError) {
      setError(data.message); // "Cannot reach server..."
    } else {
      setError(data.message); // Invalid credentials
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-md w-full sm:max-w-md md:max-w-lg">
        <h1 className="text-3xl font-bold text-center mb-6">Login</h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center text-sm sm:text-base">
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          className="border p-4 w-full mb-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-base sm:text-lg"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        <div className="relative mb-4">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="border p-4 w-full rounded pr-12 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base sm:text-lg"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <button
            type="button"
            className="absolute right-3 top-3 text-gray-600"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.17.203-2.293.575-3.345M6.6 6.6a9.953 9.953 0 0110.8 10.8M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        </div>

        <button
          onClick={handleLogin}
          className={`bg-blue-600 text-white w-full p-4 rounded hover:bg-blue-700 transition-colors text-base sm:text-lg ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="mt-5 text-center text-gray-600 text-base sm:text-lg">
          New user?{" "}
          <a href="/register" className="text-blue-600 hover:underline">
            Register
          </a>
        </p>
      </div>
    </div>
  );
}

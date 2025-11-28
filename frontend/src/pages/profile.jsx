import React, { useEffect, useState } from "react";
import {
  WalletIcon,
  CubeIcon,
  BoltIcon,
  UserIcon,
  CogIcon,
  KeyIcon,
  ArrowRightOnRectangleIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";

// ✅ Use common navigation bar
import NavigationBar from "../components/navbar.jsx";

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Password section states
  const [passwordMsg, setPasswordMsg] = useState("");
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Password visibility state
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const token = localStorage.getItem("token");

  const fetchProfile = async () => {
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5001/api/auth/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUserData(data.data);
      } else {
        setUserData(null);
        console.error("Profile fetch error:", data.message);
      }
    } catch (err) {
      console.error("Unable to fetch profile:", err);
      setUserData(null);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (token) fetchProfile();
  }, [token]);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      setPasswordMsg("Please fill both fields.");
      return;
    }

    setPasswordMsg("Processing...");

    try {
      const res = await fetch("http://localhost:5001/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (data.success) {
        setPasswordMsg("Secure Key Updated Successfully!");
        setCurrentPassword("");
        setNewPassword("");
      } else {
        setPasswordMsg(data.message || "Something went wrong.");
      }
    } catch {
      setPasswordMsg("Network error. Try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  // Unauthorized
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-2xl shadow-2xl border-t-8 border-red-500 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Not Authenticated</h2>
          <p className="text-gray-600 mb-6">You need to log in to view your profile.</p>
        </div>
      </div>
    );
  }

  // Loading
  if (loading)
    return (
      <div className="p-6 text-center text-xl font-semibold text-gray-700 min-h-screen bg-gray-50 flex items-center justify-center">
        Loading Profile...
      </div>
    );

  // No user data
  if (!userData)
    return (
      <div className="p-6 text-center text-red-600 min-h-screen flex items-center justify-center">
        Unable to fetch profile. Please try again later.
      </div>
    );

  return (
    <div className="p-6 pb-24 max-w-4xl mx-auto space-y-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-gray-800 border-b pb-2">Profile</h1>

        <button
          onClick={handleLogout}
          className="flex items-center space-x-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition shadow-md"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>

      {/* Personal Info */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-700 text-white p-6 rounded-xl shadow-lg space-y-2">
        <h2 className="text-xl font-bold flex items-center space-x-2">
          <UserIcon className="w-6 h-6" />
          <span>Personal & Identity</span>
        </h2>
        <p>
          <strong>Name:</strong> {userData.name}
        </p>
        <p>
          <strong>Email:</strong> {userData.email}
        </p>
        <p>
          <strong>User ID:</strong> {userData.user_id}
        </p>
      </div>

      {/* Balances */}
      <h2 className="text-xl font-bold text-gray-800 pt-2">Current Balances</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow border-l-4 border-indigo-500">
          <div className="flex items-center space-x-2 mb-2">
            <WalletIcon className="w-6 h-6 text-indigo-500" />
            <h3 className="font-semibold text-lg text-gray-700">Wallet Balance</h3>
          </div>
          <p className="text-2xl font-extrabold text-indigo-700">{userData.wallet_balance}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border-l-4 border-teal-500">
          <div className="flex items-center space-x-2 mb-2">
            <CubeIcon className="w-6 h-6 text-teal-500" />
            <h3 className="font-semibold text-lg text-gray-700">Token Balance</h3>
          </div>
          <p className="text-2xl font-extrabold text-teal-700">{userData.token_balance}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border-l-4 border-amber-500">
          <div className="flex items-center space-x-2 mb-2">
            <BoltIcon className="w-6 h-6 text-amber-500" />
            <h3 className="font-semibold text-lg text-gray-700">Energy Balance</h3>
          </div>
          <p className="text-2xl font-extrabold text-amber-700">{userData.energy_balance}</p>
        </div>
      </div>

      {/* Reserved Balances */}
      <h2 className="text-xl font-bold text-gray-800 pt-2">Reserved Balances</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-xl shadow border-l-4 border-teal-400">
          <p className="font-semibold text-gray-700 mb-1">Reserved Token Balance</p>
          <p className="text-2xl font-bold text-teal-600">{userData.reserved_tokens}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border-l-4 border-amber-400">
          <p className="font-semibold text-gray-700 mb-1">Reserved Energy Balance</p>
          <p className="text-2xl font-bold text-amber-600">{userData.reserved_energy} kWh</p>
        </div>
      </div>

      {/* Technical Info */}
      <div className="bg-white p-6 rounded-xl shadow mt-4">
        <div className="flex items-center space-x-2 mb-4 border-b pb-2">
          <CogIcon className="w-6 h-6 text-gray-700" />
          <h3 className="font-semibold text-xl text-gray-800">Technical Info & History</h3>
        </div>

        <div className="grid grid-cols-2 gap-4 text-gray-700">
          <div className="space-y-2">
            <p><strong>Meter ID:</strong> {userData.meter_id}</p>
            <p><strong>Transformer ID:</strong> {userData.transformer_id}</p>
          </div>

          <div className="space-y-2">
            <p><strong>Total Energy Sold:</strong> {userData.total_energy_sold}</p>
            <p><strong>Total Energy Bought:</strong> {userData.total_energy_bought}</p>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white p-6 rounded-xl shadow">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <div className="flex items-center space-x-2">
            <KeyIcon className="w-6 h-6 text-red-500" />
            <h3 className="font-semibold text-xl text-gray-800">Change Secure Key</h3>
          </div>

          <button
            onClick={() => setShowPasswordFields(!showPasswordFields)}
            className="text-emerald-600 hover:text-emerald-800 font-semibold transition p-1 rounded-lg"
          >
            {showPasswordFields ? "Cancel" : "Update"}
          </button>
        </div>

        {showPasswordFields && (
          <>
            {passwordMsg && (
              <div
                className={`p-2 mb-3 rounded-lg text-sm ${
                  passwordMsg.includes("Success")
                    ? "bg-green-100 text-green-700 border border-green-300"
                    : "bg-red-100 text-red-700 border border-red-300"
                }`}
              >
                {passwordMsg}
              </div>
            )}

            {/* Current Password */}
            <div className="relative mb-3">
              <input
                type={showCurrentPass ? "text" : "password"}
                placeholder="Current Secure Key"
                className="border p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-3 text-gray-600"
                onClick={() => setShowCurrentPass(!showCurrentPass)}
              >
                {showCurrentPass ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* New Password */}
            <div className="relative mb-4">
              <input
                type={showNewPass ? "text" : "password"}
                placeholder="New Secure Key"
                className="border p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-3 text-gray-600"
                onClick={() => setShowNewPass(!showNewPass)}
              >
                {showNewPass ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>

            <button
              className="bg-emerald-600 text-white p-3 rounded-lg w-full hover:bg-emerald-700 transition font-semibold shadow-md"
              onClick={handleChangePassword}
            >
              {passwordMsg === "Processing..." ? "Updating..." : "Change Secure Key"}
            </button>
          </>
        )}
      </div>

      {/* ⭐ Common Navbar */}
      <NavigationBar active="Profile" />
    </div>
  );
}

import React, { useEffect, useState } from "react";
import NavigationBar from "../components/navbar.jsx";
import { BoltIcon, ClockIcon } from "@heroicons/react/24/outline";

export default function History() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState(false);

  const fetchOffers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5001/api/offers/closed/30days", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        setServerError(true);
        setLoading(false);
        return;
      }

      const data = await res.json();
      setOffers(data.data || []);
      setServerError(false);
    } catch (err) {
      setServerError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const statusColors = {
    completed: "bg-emerald-600",
    cancelled: "bg-red-600",
    pending: "bg-yellow-500",
  };

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-b from-green-700 via-emerald-600 to-slate-900 text-white px-4 py-6">
      <h1 className="text-3xl md:text-4xl font-extrabold text-center mb-8 flex items-center justify-center gap-2">
        ⚡ Energy Trading History
      </h1>

      {/* Server error */}
      {serverError && (
        <div className="text-center text-lg font-semibold text-red-300 bg-red-800/40 py-3 rounded-xl mb-4">
          ⚠️ Connecting to server...
        </div>
      )}

      {/* Loading */}
      {loading && !serverError && (
        <div className="text-center text-lg font-semibold text-yellow-200 mb-4">
          ⏳ Loading history...
        </div>
      )}

      {/* No offers */}
      {!loading && !serverError && offers.length === 0 && (
        <div className="text-center text-xl text-gray-200 bg-white/10 py-5 rounded-xl border border-white/20 mb-4">
          No closed offers in the last 30 days.
        </div>
      )}

      {/* Offer cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {!loading &&
          !serverError &&
          offers.map((offer) => (
            <div
              key={offer._id}
              className="rounded-3xl p-6 bg-white/10 backdrop-blur-lg shadow-xl border border-emerald-300/40 hover:shadow-green-400/40 transition hover:scale-[1.03] relative overflow-hidden text-white"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-yellow-300 to-green-400"></div>

              <div className="flex justify-between items-center mb-3">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <BoltIcon className="w-6 h-6 text-yellow-300" />
                  {offer.offer_id}
                </h2>

                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${
                    statusColors[offer.status] || "bg-gray-700"
                  }`}
                >
                  {offer.status}
                </span>
              </div>

              <div className="space-y-1">
                <p>
                  <strong className="text-emerald-300">Type:</strong> {offer.offer_type}
                </p>
                <p>
                  <strong className="text-emerald-300">Units:</strong> {offer.units} kWh
                </p>
                <p>
                  <strong className="text-emerald-300">Rate/Unit:</strong> {offer.token_per_unit} Tokens
                </p>
                <p>
                  <strong className="text-emerald-300">Total Tokens:</strong> {offer.total_tokens}
                </p>
              </div>

              <div className="mt-4 text-sm p-3 bg-white/10 rounded-xl">
                <p>
                  <strong>Created By:</strong> {offer.creator_id}
                </p>
                {offer.negotiated_by && (
                  <p>
                    <strong>Accepted By:</strong> {offer.negotiated_by}
                  </p>
                )}
              </div>

              <div className="mt-4 space-y-1 text-sm opacity-80 flex flex-col gap-1">
                <p className="flex items-center gap-1">
                  <ClockIcon className="w-5 h-5 text-green-300" /> Created: {formatDate(offer.created_at)}
                </p>
                {offer.completed_at && (
                  <p className="flex items-center gap-1">
                    <ClockIcon className="w-5 h-5 text-yellow-300" /> Completed: {formatDate(offer.completed_at)}
                  </p>
                )}
              </div>
            </div>
          ))}
      </div>

      <NavigationBar active="History" />
    </div>
  );
}

import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import socket from "../socket";

import {
  BoltIcon,
  ClockIcon,
  UserIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

import NavigationBar from "../components/navbar.jsx";

export default function TradePage() {
  const [myOffers, setMyOffers] = useState([]);
  const [marketOffers, setMarketOffers] = useState([]);
  const [newOffer, setNewOffer] = useState({
    offer_type: "sell",
    units: "",
    token_per_unit: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API = "http://localhost:5001";

  // -------------------------------
  // AUTH HEADER
  // -------------------------------
  const authHeader = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  // -------------------------------
  // FETCH BOTH: OWN + MARKET OFFERS
  // -------------------------------
  const fetchOffers = useCallback(async () => {
    try {
      setLoading(true);

      // My offers
      const own = await axios.get(`${API}/api/offers/current`, {
        headers: authHeader(),
      });
      setMyOffers(own.data.data || []);

      // Market offers
      const all = await axios.get(`${API}/api/offers/current`, {
        headers: authHeader(),
      });
      setMarketOffers(all.data.data || []);

      setError("");
    } catch (err) {
      console.error("Fetch Offers Error:", err);
      const backendMessage =
        err.response?.data?.msg ||
        err.response?.data?.message ||
        "Server connection issue.";
      setError(`Failed to load offers: ${backendMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // -------------------------------
  // SOCKET + INITIAL FETCH
  // -------------------------------
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      socket.auth = { token: token };
      socket.connect();
    } else {
      setError("Please log in to view and create offers.");
      setLoading(false);
    }

    fetchOffers();
    socket.on("offersUpdated", fetchOffers);

    return () => {
      socket.off("offersUpdated", fetchOffers);
      if (socket.connected) socket.disconnect();
    };
  }, [fetchOffers]);

  // -------------------------------
  // CREATE OFFER
  // -------------------------------
  const handleCreateOffer = async (e) => {
    e.preventDefault();

    const creator_id = localStorage.getItem("user_id");
    if (!creator_id) {
      setError("User ID missing. Please log in again.");
      return;
    }

    if (!newOffer.units || !newOffer.token_per_unit) {
      setError("Please enter valid units and token rate.");
      return;
    }

    const unitsNum = Number(newOffer.units);
    const tokenRateNum = Number(newOffer.token_per_unit);

    if (
      isNaN(unitsNum) ||
      unitsNum <= 0 ||
      isNaN(tokenRateNum) ||
      tokenRateNum <= 0
    ) {
      setError("Units and Token / Unit must be positive numbers.");
      return;
    }

    const offerBody = {
      creator_id,
      offer_type: newOffer.offer_type,
      units: unitsNum,
      token_per_unit: tokenRateNum,
    };

    try {
      const res = await axios.post(`${API}/api/offers/create`, offerBody, {
        headers: authHeader(),
      });

      if (res.data && (res.data.offer || res.data.success)) {
        setNewOffer({ offer_type: "sell", units: "", token_per_unit: "" });
        setError("");
        socket.emit("offerCreated");
        fetchOffers();
      } else {
        setError(res.data?.message || "Offer created, but update failed.");
      }
    } catch (err) {
      console.error("Create Offer Error:", err);
      const backendMessage = err.response?.data?.msg || err.response?.data?.message;
      setError(`Failed to create offer: ${backendMessage || "Unknown error"}`);
    }
  };

  const totalTokens =
    (Number(newOffer.units) || 0) * (Number(newOffer.token_per_unit) || 0);

  const acceptNegotiation = async (offerId) => {
    const loggedUserId = localStorage.getItem("user_id");
    if (!loggedUserId) {
      alert("User not logged in.");
      return;
    }

    try {
      const res = await axios.post(
        `${API}/api/offers/accept`,
        { offer_id: offerId, user_id: loggedUserId },
        { headers: authHeader() }
      );

      if (res.data.success) {
        socket.emit("offersUpdated");
        fetchOffers();
      } else {
        alert(res.data.message || "Failed to accept negotiation.");
      }
    } catch (error) {
      console.error(
        "Accept Negotiation Error:",
        error.response?.data || error.message || error
      );
      alert("Server error while accepting negotiation.");
    }
  };

  const cancelNegotiation = async (offerId) => {
    const loggedUserId = localStorage.getItem("user_id");
    if (!loggedUserId) return;

    try {
      const res = await axios.post(
        `${API}/api/offers/cancelnegotiation`,
        {
          offer_id: offerId,
          user_id: loggedUserId,
        }
      );

      if (res.data.success) {
        fetchOffers();
      } else {
        alert(res.data.message || "Failed to cancel negotiation.");
      }
    } catch (error) {
      console.error(error);
      alert("Server error while cancelling negotiation.");
    }
  };

  // -------------------------------
  // CANCEL OFFER
  // -------------------------------
  const handleCancelOffer = async (offerId) => {
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this offer?"
    );
    if (!confirmCancel) return;

    try {
      const user_id = localStorage.getItem("user_id");
      if (!user_id) {
        alert("User not logged in. Please log in again.");
        return;
      }

      const res = await axios.post(
        `${API}/api/offers/cancel`,
        { user_id, offer_id: offerId },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        }
      );

      if (res.status === 200 || (res.data && res.data.success)) {
        socket.emit("offerCanceled");
        fetchOffers();
        return;
      }

      alert(res.data?.msg || res.data?.message || "Failed to cancel offer.");
    } catch (err) {
      console.error(
        "Cancel Offer Error:",
        err.response?.data || err.message || err
      );
      alert("Failed to cancel offer. Please check console for details.");
    }
  };

  // -------------------------------
  // OFFER CARD COMPONENT
  // -------------------------------
  const OfferCard = ({
    offer,
    isOwnOffer,
    handleCancelOffer,
    acceptNegotiation,
    cancelNegotiation,
  }) => {
    const created = offer.created_at ? new Date(offer.created_at) : null;
    const [negotiatedPrice, setNegotiatedPrice] = useState("");

    const handleNegotiate = async () => {
      const loggedUserId = localStorage.getItem("user_id");
      if (!loggedUserId) {
        alert("User not logged in.");
        return;
      }

      const priceNum = Number(negotiatedPrice);
      if (isNaN(priceNum) || priceNum <= 0) {
        alert("Enter a valid positive token/unit price.");
        return;
      }

      try {
        const res = await axios.post(
          `${API}/api/offers/negotiate`,
          {  user_id: loggedUserId,
            
            offer_id: offer.offer_id || offer._id,
            negotiated_tokens: priceNum,
          },
          { headers: authHeader() }
        );

        if (res.data.success) {
          alert("Negotiation submitted successfully!");
          setNegotiatedPrice("");
          socket.emit("offersUpdated");
          fetchOffers();
        } else {
          alert(res.data.message || "Failed to negotiate.");
        }
      } catch (err) {
        console.error("Negotiate Error:", err.response?.data || err.message || err);
        alert("Server error while submitting negotiation.");
      }
    };

    return (
      <div
        className={`p-5 rounded-xl shadow-xl transition-all duration-300 transform hover:scale-[1.02]
      ${offer.offer_type === "sell"
            ? "bg-blue-800/70 border-l-4 border-blue-300"
            : "bg-red-800/70 border-l-4 border-red-300"
          }`}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-3 border-b border-white/20 pb-2">
          <h3 className="font-extrabold text-lg flex items-center gap-2">
            <ArrowRightIcon className="w-5 h-5 text-yellow-400" />
            {String(offer.offer_type || "").toUpperCase()} OFFER
          </h3>

          <span
            className={`px-3 py-1 text-xs rounded-full font-bold shadow-md ${
              offer.status === "open"
                ? "bg-green-500"
                : offer.status === "negotiation"
                  ? "bg-yellow-500"
                  : "bg-gray-500"
            }`}
          >
            {String(offer.status || "").toUpperCase()}
          </span>
        </div>

        {/* Info */}
        <div className="space-y-1 text-sm">
          <p>
            <b>ID:</b> {offer.offer_id || offer._id}
          </p>
          <p>
            <b>Units:</b>{" "}
            <span className="font-semibold text-lg">{offer.units}</span> kWh
          </p>
          <p>
            <b>Rate:</b> {offer.token_per_unit} Tokens/unit
          </p>

          {offer.status === "negotiation" && offer.negotiated_tokens && (
            <p className="text-yellow-300">
              <b>Negotiated Rate:</b> {offer.negotiated_tokens}
            </p>
          )}

          <p className="pt-2 font-bold text-yellow-300">
            Total Value: {offer.total_tokens}
          </p>

          <p className="flex items-center gap-1 text-xs text-white/70 pt-2">
            <UserIcon className="w-4 h-4" /> Creator: {offer.creator_id}
          </p>

          <p className="flex items-center gap-1 text-xs text-white/70">
            <ClockIcon className="w-4 h-4" /> Created:{" "}
            {created ? created.toLocaleString() : "—"}
          </p>
        </div>

        {/* Own Offer Buttons */}
        {isOwnOffer && offer.status === "open" && (
          <button
            onClick={() => handleCancelOffer(offer.offer_id || offer._id)}
            className="mt-3 bg-red-500 hover:bg-red-600 text-white font-bold px-3 py-2 rounded-lg shadow-md"
          >
            Cancel Offer
          </button>
        )}

        {isOwnOffer && offer.status === "negotiation" && (
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => acceptNegotiation(offer.offer_id)}
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-2 rounded-lg shadow-md"
            >
              Accept Negotiation
            </button>

            <button
              onClick={() => cancelNegotiation(offer.offer_id)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-2 rounded-lg shadow-md"
            >
              Cancel Negotiation
            </button>
          </div>
        )}

        {/* Market Offer Buttons */}
        {!isOwnOffer && offer.status === "open" && (
          <div className="mt-4 flex flex-col gap-2">
            <button
              onClick={() => acceptNegotiation(offer.offer_id)}
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-2 rounded-lg shadow-md"
            >
              Accept Offer
            </button>

            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Enter token/unit"
                value={negotiatedPrice}
                onChange={(e) =>
                  setNegotiatedPrice(e.target.value.replace(/[^0-9.]/g, ""))
                }
                className="text-gray-800 px-2 py-1 w-full rounded-lg border border-gray-300"
              />
              <button
                onClick={handleNegotiate}
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-3 py-1 rounded-lg shadow-md"
              >
                Negotiate
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // -------------------------------
  // CLIENT-SIDE FILTERS / SORTS
  // -------------------------------
  const loggedUserId = localStorage.getItem("user_id");
  const loggedTransformer = localStorage.getItem("transformer_id");

  const myOnlyOffers = useMemo(() => {
    if (!loggedUserId) return [];
    return (myOffers || [])
      .filter((o) => String(o.creator_id) === String(loggedUserId))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [myOffers, loggedUserId]);

  const filteredMarketOffers = useMemo(() => {
    return (marketOffers || [])
      .filter((o) => {
        if (loggedUserId && String(o.creator_id) === String(loggedUserId))
          return false;
        if (o.status && o.status !== "open") return false;
        if (
          loggedTransformer &&
          o.transformer_id &&
          String(o.transformer_id) !== String(loggedTransformer)
        )
          return false;
        return true;
      })
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [marketOffers, loggedUserId, loggedTransformer]);

  // -------------------------------
  // RENDER UI
  // -------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-600 to-green-800 text-white p-6 pb-24 font-inter">
      <h1 className="text-3xl font-bold text-center mb-6 flex items-center justify-center gap-2">
        <BoltIcon className="w-8 h-8 text-yellow-300" />
        Energy Trading
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-800/80 rounded-lg text-red-100 font-semibold shadow-inner">
          ⚠ {error}
        </div>
      )}

      {/* CREATE OFFER */}
      <div className="bg-green-700/70 backdrop-blur-sm rounded-xl p-5 mb-8 shadow-2xl border-2 border-green-400/50">
        <h2 className="font-bold text-xl mb-3 border-b border-green-500 pb-2">
          Create New Offer
        </h2>

        <form
          className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end"
          onSubmit={handleCreateOffer}
        >
          <div>
            <label className="block mb-1 text-sm font-medium">Type</label>
            <select
              value={newOffer.offer_type}
              onChange={(e) =>
                setNewOffer({ ...newOffer, offer_type: e.target.value })
              }
              className="text-gray-800 px-3 py-2 w-full rounded-lg bg-white/90 border border-gray-300"
            >
              <option value="sell">Sell (Energy)</option>
              <option value="buy">Buy (Energy)</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">Units (kWh)</label>
            <input
              type="number"
              value={newOffer.units}
              onChange={(e) =>
                setNewOffer({
                  ...newOffer,
                  units: e.target.value.replace(/[^0-9.]/g, ""),
                })
              }
              className="text-gray-800 px-3 py-2 w-full rounded-lg bg-white/90 border border-gray-300"
              min="1"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">Token / Unit</label>
            <input
              type="number"
              value={newOffer.token_per_unit}
              onChange={(e) =>
                setNewOffer({
                  ...newOffer,
                  token_per_unit: e.target.value.replace(/[^0-9.]/g, ""),
                })
              }
              className="text-gray-800 px-3 py-2 w-full rounded-lg bg-white/90 border border-gray-300"
              min="1"
            />
          </div>

          <div className="text-center bg-green-800/50 p-2 rounded-lg">
            <p className="text-xs text-green-200">
              Total {newOffer.offer_type === "buy" ? "Cost" : "Earning"}
            </p>
            <p className="font-bold text-lg text-yellow-300">
              {totalTokens.toFixed(2)} Tokens
            </p>
          </div>

          <button
            type="submit"
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-4 py-2 rounded-lg shadow-md"
          >
            Create Offer
          </button>
        </form>
      </div>

      {/* YOUR OFFERS */}
      <h2 className="font-bold text-2xl mb-3 text-yellow-300 text-center">
        Your Active Offers
      </h2>

      {loading ? (
        <p className="text-center text-xl p-8 bg-green-700/50 rounded-lg">
          <ClockIcon className="w-6 h-6 inline-block animate-spin mr-2" />
          Loading...
        </p>
      ) : myOnlyOffers.length === 0 ? (
        <p className="text-center text-lg p-5 bg-green-700/50 rounded-lg">
          You have no active offers.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {myOnlyOffers.map((offer) => (
            <OfferCard
              key={offer.offer_id || offer._id}
              offer={offer}
              isOwnOffer={true}
              handleCancelOffer={handleCancelOffer}
              acceptNegotiation={acceptNegotiation}
              cancelNegotiation={cancelNegotiation}
            />
          ))}
        </div>
      )}

      {/* MARKET OFFERS */}
      <h2 className="font-bold text-2xl mb-3 text-white/90 text-center">
        Market Offers Near You
      </h2>

      {loading ? (
        <p className="text-center text-xl p-8 bg-green-700/50 rounded-lg">
          <ClockIcon className="w-6 h-6 inline-block animate-spin mr-2" />
          Loading...
        </p>
      ) : filteredMarketOffers.length === 0 ? (
        <p className="text-center text-lg p-5 bg-green-700/50 rounded-lg">
          No available offers in your transformer area.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMarketOffers.map((offer) => (
            <OfferCard
              key={offer.offer_id || offer._id}
              offer={offer}
              isOwnOffer={false}
              handleCancelOffer={handleCancelOffer}
              acceptNegotiation={acceptNegotiation}
              cancelNegotiation={cancelNegotiation}
            />
          ))}
        </div>
      )}

      <NavigationBar active="Trade" />
    </div>
  );
}

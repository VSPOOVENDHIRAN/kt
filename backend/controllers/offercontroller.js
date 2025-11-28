const Offer = require("../models/offers");
const User = require("../models/user");
const mongoose = require("mongoose");


//generate unique offer_id
async function generateOfferId() {
  const count = await Offer.countDocuments();
  return "OFF" + String(1000 + count + 1);
}


const N = v => (typeof v === "number" ? v : Number(v || 0));

// -----------------------------
// CREATE OFFER.
// ------------------------------
exports.createoffer = async (req, res) => {
   const io = req.app.get("io");
   const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { creator_id, offer_type, units, token_per_unit } = req.body;
    if (!creator_id || !offer_type || !units || !token_per_unit) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ msg: "Missing fields" });
    }

    const creator = await User.findOne({ user_id: creator_id }).session(session);
    if (!creator) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ msg: "Creator not found" });
    }

    const unitsNum = N(units);
    const tokenPerUnit = N(token_per_unit);
    const totalTokens = unitsNum * tokenPerUnit;

    if (offer_type === "sell") {
      // must have free energy
      if (N(creator.energy_balance) < unitsNum) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ msg: "Not enough energy to create sell offer" });
      }

      console.log("Creating sell offer, deducting energy from creator");
      creator.energy_balance = N(creator.energy_balance) - unitsNum;
      creator.reserved_energy = N(creator.reserved_energy) + unitsNum;

    } 
    
    else if (offer_type === "buy") {
      // must have free tokens
      if (N(creator.token_balance) < totalTokens) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).
        json({ msg: "Not enough tokens to create buy offer" });
      }

      console.log("Creating buy offer, deducting tokens from creator");
      creator.token_balance = N(creator.token_balance) - totalTokens;
      creator.reserved_tokens = N(creator.reserved_tokens) + totalTokens;
    } 
    
    else {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ msg: "Invalid offer_type" });
    }

    const offer = new Offer({
      offer_id: await generateOfferId(),
      offer_type,
      creator_id: creator.user_id,
      creator_meter: creator.meter_id,
      transformer_id: creator.transformer_id,
      units: unitsNum,
      token_per_unit: tokenPerUnit,
      total_tokens: totalTokens,
      status: "open",
      negotiated_tokens: null,
      negotiated_by: null
    });
    console.log("New offer created:", offer.offer_id);
    await creator.save({ session });
    await offer.save({ session });

    await session.commitTransaction();
    session.endSession();

    //  REALTIME EVENT (only to creator)
    // ----------------------------------
   const sameTransformerUsers = await User.find({
      transformer_id: creator.transformer_id
    }).select("user_id");

    sameTransformerUsers.forEach(u => {
      io.to(u.user_id.toString()).emit("offer_created", {
        msg: "A new offer is available near your transformer",
        offer
      });
    });


    return res.json({ msg: "Offer created", offer });
  } catch (err) {
    try { await session.abortTransaction(); } catch(_) {}
    session.endSession();
    console.error("createOffer error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

///---negotiate offer function can be added here---

exports.negotiateoffer = async (req, res) => {
  const io = req.app.get("io");
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { user_id, offer_id, new_token_per_unit } = req.body;
    if (!user_id || !offer_id || new_token_per_unit == null) {
      return res.status(400).json({ msg: "Missing fields" });
    }

    const offer = await Offer.findOne({ offer_id }).session(session);
    if (!offer) return res.status(404).json({ msg: "Offer not found" });

    // Creators cannot negotiate
    if (offer.creator_id === user_id) {
      return res.status(400).json({ msg: "Creator cannot negotiate own offer" });
    }

    if (offer.status !== "negotiation" && offer.status !== "open") {
      return res.status(400).json({ msg: "offer already completed" });
    }

    // Strict — Only ONE negotiator allowed
    if (offer.status === "negotiation" && offer.negotiated_by !== user_id) {
      return res.status(400).json({ msg: "Offer already in negotiation by another user" });
    }

    const negotiator = await User.findOne({ user_id }).session(session);
    if (!negotiator) return res.status(404).json({ msg: "User not found" });

    const creator = await User.findOne({ user_id: offer.creator_id }).session(session);
    if (!creator) return res.status(404).json({ msg: "Creator not found" });

    const units = N(offer.units);
    const newTPU = N(new_token_per_unit);
    const newTotalTokens = units * newTPU;

    // ==============
    // START NEGOTIATION LOGIC
    // ==============

    // If the negotiator already negotiated before, refund old reservation
    if (offer.negotiated_by === user_id) {
      const oldTokens = N(offer.negotiated_tokens || 0);

      if (offer.offer_type === "sell") {
        negotiator.reserved_tokens -= oldTokens;
        negotiator.token_balance += oldTokens;
      } else {
        negotiator.reserved_energy -= units;
        negotiator.energy_balance += units;
      }
    }

    // Now apply new reservation
    if (offer.offer_type === "sell") {
      // BUYER must reserve tokens
      if (negotiator.token_balance < newTotalTokens) {
        return res.status(400).json({ msg: "Not enough tokens to negotiate" });
      }
      negotiator.token_balance -= newTotalTokens;
      negotiator.reserved_tokens += newTotalTokens;
    } else {
      // SELLER must reserve energy
      if (negotiator.energy_balance < units) {
        return res.status(400).json({ msg: "Not enough energy to negotiate" });
      }
      negotiator.energy_balance -= units;
      negotiator.reserved_energy += units;

      // Creator MUST BE REFUNDED if price goes down
      const oldTotal = N(offer.total_tokens);
      if (newTotalTokens < oldTotal) {
        const diff = oldTotal - newTotalTokens;
        creator.reserved_tokens -= diff;
        creator.wallet_balance += diff;
      }
    }

    // Update offer state
    offer.status = "negotiation";
    offer.negotiated_by = user_id;
    offer.negotiated_tokens = newTotalTokens;

    await negotiator.save({ session });
    await creator.save({ session });
    await offer.save({ session });

    await session.commitTransaction();

    // Notify creator
   const users = await User.find({ transformerid: offer.transformerid }).select("user_id");
    users.forEach(u => {
      io.to(u.user_id.toString()).emit("offer_negotiated", {
        msg: "Offer negotiated",
        offer
      });
    });



    return res.json({ msg: "Negotiation updated", offer });

  } catch (err) {
    await session.abortTransaction();
    console.error("negotiation error:", err);
    return res.status(500).json({ msg: "Server error" });
  } finally {
    session.endSession();
  }
};


//--cancel negotiation function can be added here--

exports.cancelnegotiation = async (req, res) => {
  const io = req.app.get("io");
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { user_id, offer_id } = req.body;
    if (!user_id || !offer_id) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ msg: "Missing fields" });
    }

    const offer = await Offer.findOne({ offer_id }).session(session);
    if (!offer) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ msg: "Offer not found" });
    }

    // If no negotiation is active
    if (offer.status !== "negotiation" || !offer.negotiated_by) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ msg: "No active negotiation to cancel" });
    }

    const negotiator = await User.findOne({ user_id: offer.negotiated_by }).session(session);
    if (!negotiator) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ msg: "Negotiator not found" });
    }

    // Only creator or negotiator can cancel negotiation
    if (user_id !== offer.creator_id && user_id !== offer.negotiated_by) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ msg: "You are not allowed to cancel this negotiation" });
    }

    // ============================
    // RELEASE NEGOTIATOR RESERVATION
    // ============================

    if (offer.offer_type === "sell") {
      // Negotiator was buyer → reserved tokens
      const reserved = Number(offer.negotiated_tokens || 0);

      negotiator.reserved_tokens = Math.max(0, negotiator.reserved_tokens - reserved);
      negotiator.token_balance += reserved;

    } else if (offer.offer_type === "buy") {
      // Negotiator was seller → reserved energy
      const reservedEnergy = Number(offer.units);

      negotiator.reserved_energy = Math.max(0, negotiator.reserved_energy - reservedEnergy);
      negotiator.energy_balance += reservedEnergy;
    }

    await negotiator.save({ session });

    // =====================================
    // RESET OFFER BACK TO OPEN STATE
    // =====================================
    offer.status = "open";
    offer.negotiated_by = null;
    offer.negotiated_tokens = null;

    await offer.save({ session });

    await session.commitTransaction();
    session.endSession();

     const users = await User.find({ transformerid: offer.transformerid }).select("user_id");
    users.forEach(u => {
      io.to(u.user_id.toString()).emit("negotiation_cancelled", {
        msg: "Negotiation cancelled",
        offer
      });
    });

    return res.json({
      msg: "Negotiation cancelled successfully",
      offer
    });

  } catch (err) {
    console.error("Cancel negotiation error:", err);
    try { await session.abortTransaction(); } catch (e) {}
    session.endSession();
    return res.status(500).json({ msg: "Server error" });
  }
};



//--cancel offer function can be added here--

exports.canceloffer = async (req, res) => {
  const io = req.app.get("io");
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { user_id, offer_id } = req.body;
    if (!user_id || !offer_id) { await session.abortTransaction(); session.endSession(); return res.status(400).json({ msg: "Missing fields" }); }

    const offer = await Offer.findOne({ offer_id }).session(session);
    if (!offer) { await session.abortTransaction(); session.endSession(); return res.status(404).json({ msg: "Offer not found" }); }

    if (offer.creator_id !== user_id) { await session.abortTransaction(); session.endSession(); return res.status(403).json({ msg: "Only creator can cancel" }); }

    if (!["open", "negotiation"].includes(offer.status)) { await session.abortTransaction(); session.endSession(); return res.status(400).json({ msg: "Cannot cancel in current status" }); }

    const creator = await User.findOne({ user_id: offer.creator_id }).session(session);
    if (!creator) { await session.abortTransaction(); session.endSession(); return res.status(404).json({ msg: "Creator not found" }); }

    // Release creator reserved portion
    if (offer.offer_type === "sell") {
      // restore seller reserved energy
      creator.reserved_energy = Math.max(0, N(creator.reserved_energy) - N(offer.units));
      creator.energy_balance = N(creator.energy_balance) + N(offer.units);
    } else if (offer.offer_type === "buy") {
      // restore tokens reserved by creator
      creator.reserved_tokens = Math.max(0, N(creator.reserved_tokens) - N(offer.total_tokens));
      creator.wallet_balance = N(creator.wallet_balance) + N(offer.total_tokens);
    }

    // If negotiator exists, refund their reservation
    if (offer.negotiated_by) {
      const negotiator = await User.findOne({ user_id: offer.negotiated_by }).session(session);
      if (negotiator) {
        if (offer.offer_type === "sell") {
          // negotiator was buyer, refund negotiated tokens reserved by them
          const prevReserved = N(offer.negotiated_tokens || 0);
          negotiator.reserved_tokens = Math.max(0, N(negotiator.reserved_tokens) - prevReserved);
          negotiator.wallet_balance = N(negotiator.wallet_balance) + prevReserved;
        } else {
          // negotiator was seller, refund reserved energy
          negotiator.reserved_energy = Math.max(0, N(negotiator.reserved_energy) - N(offer.units));
          negotiator.energy_balance = N(negotiator.energy_balance) + N(offer.units);
        }
        await negotiator.save({ session });
      }
    }

    offer.status = "cancelled";
    offer.negotiated_by = null;
    offer.negotiated_tokens = null;
    offer.completed_at = new Date();
    await creator.save({ session });
    await offer.save({ session });

    await session.commitTransaction(); session.endSession();

     //  REAL-TIME SOCKET UPDATES
    const users = await User.find({ transformerid: offer.transformerid }).select("user_id");
    users.forEach(u => {
      io.to(u.user_id.toString()).emit("offer_cancelled", {
        msg: "Offer cancelled",
        offer
      });
    });

    return res.json({ msg: "Offer cancelled and reservations released", offer });

  } catch (err) {
    try { await session.abortTransaction(); } catch(_) {}
    session.endSession();
    console.error("cancelOffer error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.acceptoffer = async (req, res) => {
  const io = req.app.get("io");
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { offer_id ,user_id } = req.body;

    //const user_id = req.user.user_id;

    // -------------------------------
    // 1. Find Offer
    // -------------------------------
    const offer = await Offer.findOne({ offer_id }).session(session);
    if (!offer) {
      await session.abortTransaction(); session.endSession();
      return res.status(404).json({ msg: "Offer not found" });
    }

    // -------------------------------
    // 2. Creator of Offer
    // -------------------------------
    const creator = await User.findOne({ user_id: offer.creator_id }).session(session);
    if (!creator) {
      await session.abortTransaction(); session.endSession();
      return res.status(404).json({ msg: "Creator not found" });
    }

    // --------------------------------------------------------
    // 3. Determine if this is direct accept or negotiation accept
    // --------------------------------------------------------
    let counterpartyId = null;
    let tokensToTrade = offer.total_tokens;

    if (offer.status === "open") {
      // Direct accept
      if (offer.creator_id === user_id) {
        await session.abortTransaction(); session.endSession();
        return res.status(400).json({ msg: "Creator cannot accept own offer" });
      }

      counterpartyId = user_id;
      tokensToTrade = offer.total_tokens;
    }

    else if (offer.status === "negotiation") {
      // Accepting negotiation → only creator can accept
      if (offer.creator_id !== user_id) {
        await session.abortTransaction(); session.endSession();
        return res.status(403).json({ msg: "Only creator can accept this negotiation" });
      }

      if (!offer.negotiated_by || !offer.negotiated_tokens) {
        await session.abortTransaction(); session.endSession();
        return res.status(400).json({ msg: "No negotiation exists to accept" });
      }

      counterpartyId = offer.negotiated_by;
      tokensToTrade = offer.negotiated_tokens;
    }

    else {
      await session.abortTransaction(); session.endSession();
      return res.status(400).json({ msg: "Offer already completed or cancelled" });
    }

    // -------------------------------
    // 4. Fetch counterparty user
    // -------------------------------
    const counter = await User.findOne({ user_id: counterpartyId }).session(session);
    if (!counter) {
      await session.abortTransaction(); session.endSession();
      return res.status(404).json({ msg: "Counterparty not found" });
    }

    // -------------------------------------------------------
    // 5. Process trade depending on SELL or BUY offer
    // -------------------------------------------------------

    const units = offer.units;
    const originalTokens = offer.total_tokens; // The ORIGINAL price before negotiation

    // =======================================================
    //                SELL OFFER ACCEPT
    // =======================================================
   // =======================================================
// FIXED — SELL OFFER ACCEPT (WRONG DEDUCTION FIXED)
// =======================================================
if (offer.offer_type === "sell") {
    const seller = creator;
    const buyer = counter;

    if (offer.status === "negotiation") {
        // Negotiation accept → buyer must have reserved tokens
        if (buyer.reserved_tokens < tokensToTrade) {
            return res.status(400).json({ msg: "Buyer has not reserved enough tokens" });
        }
        buyer.reserved_tokens -= tokensToTrade;
    } else {
        // Direct accept → deduct directly from buyer's token_balance
        if (buyer.token_balance < tokensToTrade) {
            return res.status(400).json({ msg: "Buyer does not have enough tokens" });
        }
        buyer.token_balance -= tokensToTrade;
    }

    // Seller receives tokens
    seller.token_balance += tokensToTrade;

    // Seller gives energy
    if (seller.reserved_energy < offer.units) {
        return res.status(400).json({ msg: "Seller does not have enough reserved energy" });
    }
    seller.reserved_energy -= offer.units;
    buyer.energy_balance += offer.units;
}



    // =======================================================
    //                BUY OFFER ACCEPT
    // =======================================================
   // =======================================================
// FIXED — BUY OFFER ACCEPT (correct deduction)
// =======================================================
if (offer.offer_type === "buy") {
    const buyer = creator;   // offer creator
    const seller = counter;  // counterparty

    if (offer.status === "negotiation") {
        // Negotiation accept → buyer must have reserved tokens
        if (buyer.reserved_tokens < tokensToTrade) {
            return res.status(400).json({ msg: "Buyer has not reserved enough tokens" });
        }
        buyer.reserved_tokens -= tokensToTrade;
    } else {
        // Direct accept → buyer pays directly from token_balance
        if (buyer.token_balance < tokensToTrade) {
            return res.status(400).json({ msg: "Buyer does not have enough tokens" });
        }
        buyer.token_balance -= tokensToTrade;
    }

    // Pay seller
    seller.token_balance += tokensToTrade;

    // Seller gives energy
    if (seller.reserved_energy < offer.units) {
        return res.status(400).json({ msg: "Seller does not have enough reserved energy" });
    }
    seller.reserved_energy -= offer.units;
    buyer.energy_balance += offer.units;
}


    // =======================================================
    // 6. Finalize Offer
    // =======================================================
    offer.status = "completed";
    offer.completed_at = new Date();
    offer.negotiated_by = counterpartyId;
    offer.negotiated_tokens = tokensToTrade;

    // =======================================================
    // 7. Save and Commit
    // =======================================================
    await creator.save({ session });
    await counter.save({ session });
    await offer.save({ session });

    await session.commitTransaction();
    session.endSession();

    
//  Real-time notification for both parties
 const users = await User.find({ transformerid: offer.transformerid }).select("user_id");
    users.forEach(u => {
      io.to(u.user_id.toString()).emit("offer_completed", {
        msg: "Trade completed",
        offer
      });
    });

    return res.status(200).json({
      msg: "Offer accepted successfully",
      traded_tokens: tokensToTrade,
      offer
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Accept Offer Error:", err);
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};


// Fetch closed offers from last 20 days for the same transformer as the requester

exports.getClosedOffersLast30Days = async (req, res) => {
  try {
    const userTransformer = req.user.transformer_id;
    if (!userTransformer) {
      return res.status(400).json({
        success: false,
        message: "Transformer ID missing for this user"
      });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const closedOffers = await Offer.find({
      transformer_id: userTransformer,
      status: { $in: ["completed", "cancelled"] },
      completed_at: { $gte: thirtyDaysAgo }  // works for both completed & cancelled
    }).sort({ completed_at: -1 });

    return res.status(200).json({
      success: true,
      data: closedOffers
    });

  } catch (err) {
    console.error("Error fetching closed offers:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching closed offers"
    });
  }
};


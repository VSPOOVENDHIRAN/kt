const Offer = require("../models/offers");
const User = require("../models/user");
const mongoose = require("mongoose");
const { get_balance, send_transaction } = require("./ganachecontroller");

//generate unique offer_id
async function generateOfferId() {
  const count = await Offer.countDocuments();
  return "OFF" + String(1000 + count + 1);
}


const N = v => (typeof v === "number" ? v : Number(v || 0));

// -----------------------------
// CREATE OFFER
// ------------------------------
exports.createoffer = async (req, res) => {
  const io = req.app.get("io");
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Destructure request body
    const { creator_id, units, token_per_unit } = req.body;

    // Validate required fields
    if (!creator_id || !units || !token_per_unit) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ msg: "Missing fields: creator_id, units, token_per_unit are required" });
    }

    // Find creator in DB
    const creator = await User.findOne({ user_id: creator_id }).session(session);
    if (!creator) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ msg: "Creator not found" });
    }

    const unitsNum = Number(units);
    const tokenPerUnit = Number(token_per_unit);
    const totalTokens = unitsNum * tokenPerUnit;

    // -----------------------------
    // SELL OFFER: check energy balance
    // -----------------------------

    if (Number(creator.energy_balance) < unitsNum) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ msg: "Not enough energy to create sell offer" });
    }

    creator.energy_balance -= unitsNum;
    creator.reserved_energy += unitsNum;

    // -----------------------------
    // Create new offer
    // -----------------------------
    const offer = new Offer({
      offer_id: await generateOfferId(),
      creator_id: creator.user_id,
      transformer_id: creator.transformer_id,
      units: unitsNum,
      token_per_unit: tokenPerUnit,
      total_tokens: totalTokens,
      remaining_units: unitsNum,
      created_at: new Date(),
      status: "open"
    });

    // Save to DB
    await creator.save({ session });
    await offer.save({ session });
    await session.commitTransaction();
    session.endSession();

    // -----------------------------
    // Notify nearby users in real-time
    // -----------------------------
    const sameTransformerUsers = await User.find({
      transformer_id: creator.transformer_id
    }).select("user_id");

    sameTransformerUsers.forEach(u => {
      io.to(u.user_id.toString()).emit("offer_created", {
        msg: "A new offer is available near your transformer",
        offer
      });
    });

    return res.json({ success: true, msg: "Offer created", offer });
  } catch (err) {
    try { await session.abortTransaction(); } catch (_) { }
    session.endSession();
    console.error("createOffer error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};


//--cancel offer function--
exports.canceloffer = async (req, res) => {
  const io = req.app.get("io");
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { user_id, offer_id } = req.body;

    console.log("Cancel offer request:", user_id, offer_id);

    if (!user_id)
      console.log("user_id missing");
    if (!offer_id)
      console.log("offer_id missing");

    if (!user_id || !offer_id) {
      console.log("Cancel offer request:", user_id, offer_id);
      await session.abortTransaction(); session.endSession(); return res.status(400).json({ msg: "Missing fields" });
    }


    const offer = await Offer.findOne({ offer_id }).session(session);

    if (!offer) {
      console.log("Offer not found for ID:", offer_id);
      await session.abortTransaction(); session.endSession();
      return res.status(404).json({ msg: "Offer not found" });
    }

    if (offer.creator_id !== user_id) {
      console.log("User is not creator:", user_id, "Creator:", offer.creator_id);
      await session.abortTransaction(); session.endSession();
      return res.status(403).json({ msg: "Only creator can cancel" });
    }

    if (offer.status !== "open") {
      await session.abortTransaction(); session.endSession();
      return res.status(400).json({ msg: "Cannot cancel in current status" });
    }

    const creator = await User.findOne({ user_id: offer.creator_id }).session(session);

    if (!creator) {
      console.log("Creator not found");
      await session.abortTransaction(); session.endSession(); return res.status(404).json({ msg: "Creator not found" });
    }

    // Release creator reserved portion
    // restore seller reserved energy
    console.log("Restoring reserved energy to creator");
    creator.reserved_energy = Math.max(0, N(creator.reserved_energy) - N(offer.remaining_units));

    creator.energy_balance = N(creator.energy_balance) + N(offer.units);
    console.log("Creator energy balance after restore:", creator.energy_balance);

    offer.status = "cancelled";
    offer.completed_at = new Date();
    await creator.save({ session });
    await offer.save({ session });

    await session.commitTransaction(); session.endSession();

    //  REAL-TIME SOCKET UPDATES
    const users = await User.find({ transformer_id: offer.transformer_id }).select("user_id");
    users.forEach(u => {
      io.to(u.user_id.toString()).emit("offer_cancelled", {
        msg: "Offer cancelled",
        offer
      });
    });

    return res.json({ success: true, msg: "Offer cancelled and reservations released", offer });

  } catch (err) {
    try { await session.abortTransaction(); } catch (_) { }
    session.endSession();
    console.error("cancelOffer error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

//--accept offer function--
exports.acceptoffer = async (req, res) => {
  const io = req.app.get("io");
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { offer_id, user_id, unit } = req.body;

    // -------------------------------
    // 1. Find Offer
    // -------------------------------
    const offer = await Offer.findOne({ offer_id }).session(session);

    if (!offer) {
      await session.abortTransaction(); session.endSession();
      return res.status(404).json({ msg: "Offer not found" });
    }
    console.log("Offer found:", offer.offer_id, "Status:", offer.status);

    if (offer.status !== "open") {
      await session.abortTransaction(); session.endSession();
      return res.status(400).json({ msg: "Offer already closed" });
    }

    console.log("Offer is open for acceptance");

    // -------------------------------
    // 2. Creator of Offer
    // -------------------------------
    const creator = await User.findOne({ user_id: offer.creator_id }).session(session);

    if (!creator) {
      await session.abortTransaction(); session.endSession();
      return res.status(404).json({ msg: "Creator not found" });
    }

    console.log("Creator found:", creator.user_id);

    if (offer.creator_id === user_id) {
      await session.abortTransaction(); session.endSession();
      return res.status(400).json({ msg: "Creator cannot accept own offer" });
    }

    // -------------------------------
    // 3. Fetch buyer user
    // -------------------------------
    const buyer = await User.findOne({ user_id }).session(session);

    console.log("Buyer found:", buyer.user_id);
    console.log("Buyer wallet address:", buyer.wallet_address);

    if (!buyer) {
      console.log("Counterparty not found:", user_id);
      await session.abortTransaction(); session.endSession();
      return res.status(404).json({ msg: "Counterparty not found" });
    }

    // -------------------------------------------------------
    // 4. Process trade
    // -------------------------------------------------------
    console.log("Processing trade for units:", unit);

    const remaining_units = offer.remaining_units;

    if (unit > remaining_units) {
      await session.abortTransaction(); session.endSession();
      return res.status(400).json({ msg: "Requested units exceed remaining units in offer" });
    }

    const needed_token = unit * offer.token_per_unit;
    console.log("Tokens needed for trade:", needed_token);

    console.log("Processing SELL offer acceptance");

    // Seller gives energy
    if (creator.reserved_energy < unit) {
      await session.abortTransaction(); session.endSession();
      console.log("Seller does not have enough reserved energy:", creator.reserved_energy, "required:", unit);
      return res.status(400).json({ msg: "Seller does not have enough reserved energy" });
    }

    creator.reserved_energy -= unit;
    buyer.energy_balance += unit;

    console.log("Energy balances updated. Seller reserved energy:", creator.reserved_energy, "Buyer energy balance:", buyer.energy_balance);

    const balance_buyer = await get_balance(buyer.wallet_address);
    console.log("Buyer token balance:", balance_buyer, "Needed tokens for trade:", needed_token);

    if (balance_buyer < needed_token) {
      await session.abortTransaction(); session.endSession();
      console.log("Buyer does not have enough token balance:", balance_buyer, "required:", needed_token);
      return res.status(400).json({ msg: "Buyer does not have enough token balance" });
    }

    console.log("Buyer has sufficient token balance:", balance_buyer);

    const tx = await send_transaction({
      from: buyer.wallet_address,
      to: creator.wallet_address,
      amount: needed_token,
      unit: unit
    });

    console.log("Transaction check");

    if (tx.message !== "Transaction successful") {
      await session.abortTransaction(); session.endSession();
      console.log("Token transfer failed:", tx.error);
      return res.status(500).json({ msg: "Token transfer failed", error: tx.error });
    }

    offer.remaining_units -= unit;

    offer.buyers.push({
      buyer_id: buyer.user_id,
      buying_units: unit,
      created_at: new Date()
    });

    console.log("Trade processed: Units traded:", unit, "Tokens transferred:", needed_token);

    if (offer.remaining_units === 0) {
      offer.status = "completed";
      offer.completed_at = new Date();
    }

    // Save and Commit
    await creator.save({ session });
    await buyer.save({ session });
    await offer.save({ session });
    console.log("Transaction committed");

    await session.commitTransaction();
    session.endSession();

    // Real-time notification for both parties
    const users = await User.find({ transformer_id: offer.transformer_id }).select("user_id");
    users.forEach(u => {
      io.to(u.user_id.toString()).emit("offer_completed", {
        msg: "Trade completed",
        offer
      });
    });

    return res.status(200).json({
      success: true,
      msg: "Offer accepted successfully",
      traded_tokens: needed_token,
      offer
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Accept Offer Error:", err);
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// Fetch closed offers from last 30 days for the same transformer as the requester
exports.getClosedOffersLast30Days = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const user = await User.findOne({ user_id });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const closedOffers = await Offer.find({
      transformer_id: user.transformer_id,
      status: { $in: ["completed", "cancelled"] },
      completed_at: { $gte: thirtyDaysAgo }
    }).sort({ completed_at: -1 });

    return res.json({ success: true, offers: closedOffers });
  } catch (err) {
    console.error("getClosedOffersLast30Days error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

// Get own trade offers
exports.getOwnTradeOffers = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const offers = await Offer.find({ creator_id: user_id }).sort({ created_at: -1 });

    return res.json({ success: true, offers });
  } catch (err) {
    console.error("getOwnTradeOffers error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

// Get current trade offers (open offers in same transformer)
exports.getCurrentTradeOffers = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const user = await User.findOne({ user_id });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const currentOffers = await Offer.find({
      transformer_id: user.transformer_id,
      status: "open",
      creator_id: { $ne: user_id } // Exclude own offers
    }).sort({ created_at: -1 });

    return res.json({ success: true, offers: currentOffers });
  } catch (err) {
    console.error("getCurrentTradeOffers error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

// Purchase partial offer
exports.purchasePartialOffer = async (req, res) => {
  const io = req.app.get("io");
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { offer_id, units } = req.body;
    const buyer_id = req.user.user_id;

    // Validation
    if (!offer_id || !units || units <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ msg: "Invalid offer_id or units" });
    }

    // Find offer
    const offer = await Offer.findOne({ offer_id }).session(session);
    if (!offer) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ msg: "Offer not found" });
    }

    // Check offer status
    if (offer.status !== "open") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ msg: "Offer is not available for purchase" });
    }

    // Check if buyer is not the creator
    if (offer.creator_id === buyer_id) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ msg: "Cannot purchase your own offer" });
    }

    // Check if enough units available
    const requestedUnits = N(units);
    const availableUnits = N(offer.remaining_units);

    if (requestedUnits > availableUnits) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ msg: "Not enough units available" });
    }

    // Get creator and buyer
    const creator = await User.findOne({ user_id: offer.creator_id }).session(session);
    const buyer = await User.findOne({ user_id: buyer_id }).session(session);

    if (!creator || !buyer) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ msg: "User not found" });
    }

    const tokensNeeded = requestedUnits * offer.token_per_unit;

    // Check buyer has enough tokens
    const buyerBalance = await get_balance(buyer.wallet_address);
    if (buyerBalance < tokensNeeded) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ msg: "Insufficient token balance" });
    }

    // Check seller has enough reserved energy
    if (creator.reserved_energy < requestedUnits) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ msg: "Seller does not have enough reserved energy" });
    }

    // Execute transaction
    const tx = await send_transaction({
      from: buyer.wallet_address,
      to: creator.wallet_address,
      amount: tokensNeeded,
      unit: requestedUnits
    });

    if (tx.message !== "Transaction successful") {
      await session.abortTransaction();
      session.endSession();
      return res.status(500).json({ msg: "Token transfer failed", error: tx.error });
    }

    // Update balances
    creator.reserved_energy -= requestedUnits;
    buyer.energy_balance += requestedUnits;

    // Update offer
    offer.remaining_units -= requestedUnits;
    offer.buyers.push({
      buyer_id: buyer.user_id,
      buying_units: requestedUnits,
      created_at: new Date()
    });

    if (offer.remaining_units === 0) {
      offer.status = "completed";
      offer.completed_at = new Date();
    }

    // Save all changes
    await creator.save({ session });
    await buyer.save({ session });
    await offer.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Notify users
    const users = await User.find({ transformer_id: offer.transformer_id }).select("user_id");
    users.forEach(u => {
      io.to(u.user_id.toString()).emit("offer_updated", {
        msg: "Offer partially purchased",
        offer
      });
    });

    return res.json({
      success: true,
      msg: "Partial purchase successful",
      units_purchased: requestedUnits,
      tokens_paid: tokensNeeded,
      offer
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("purchasePartialOffer error:", err);
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

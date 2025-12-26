const Offer = require("../models/offers");
const User = require("../models/user");
const mongoose = require("mongoose");
const {get_balance, send_transaction } = require("./ganachecontroller");

//generate unique offer_id
async function generateOfferId() {
  const count = await Offer.countDocuments();
  return "OFF" + String(1000 + count + 1);
}


const N = v => (typeof v === "number" ? v : Number(v || 0));

// -----------------------------
// CREATE OFFER.
// ------------------------------
/*
const Web3 = require("web3");
const User = require("../models/user");
const Offer = require("../models/Offer");
const { generateOfferId } = require("../utils/helpers");
const ERC20_ABI = require("../abi/ERC20.json"); // Your ERC-20 ABI
const TOKEN_ADDRESS = "0xYourTokenContractAddress"; // Replace with your token contract address

// Initialize Web3 (Ganache or any testnet)
const web3 = new Web3("http://127.0.0.1:8545"); // Replace with your provider
*/
// Internal helper: get ERC-20 token balance

const getTokenBalance = async (wallet_address) => {
  if (!wallet_address) throw new Error("Wallet address required");
  const tokenContract = new web3.eth.Contract(ERC20_ABI, TOKEN_ADDRESS);
  const balance = await tokenContract.methods.balanceOf(wallet_address).call();
  return Number(web3.utils.fromWei(balance, "ether")); // assuming token has 18 decimals
};

// Create offer
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

    // Save wallet address if missing
    if (!creator.wallet_address) {
      console.log("Fetching wallet address for creator:", creator.user_id);
      creator.wallet_address = wallet_address;
      await creator.save({ session });
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

<<<<<<< HEAD
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

=======
      creator.energy_balance -= unitsNum;
      creator.reserved_energy += unitsNum;
    
    // -----------------------------
    // Create new offer
    // -----------------------------
>>>>>>> 972f4a3dc4952ab6cb7ba289b595ad5352207874
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

<<<<<<< HEAD
    //  REALTIME EVENT (only to creator)
    // ----------------------------------
=======
    // -----------------------------
    // Notify nearby users in real-time
    // -----------------------------
>>>>>>> 972f4a3dc4952ab6cb7ba289b595ad5352207874
    const sameTransformerUsers = await User.find({
      transformer_id: creator.transformer_id
    }).select("user_id");

    sameTransformerUsers.forEach(u => {
      io.to(u.user_id.toString()).emit("offer_created", {
        msg: "A new offer is available near your transformer",
        offer
      });
    });

<<<<<<< HEAD

    return res.json({ success: true, msg: "Offer created", offer });
  } catch (err) {
    try { await session.abortTransaction(); } catch (_) { }
=======
    return res.json({ success: true, msg: "Offer created", offer });
  } catch (err) {
    try { await session.abortTransaction(); } catch (_) {}
>>>>>>> 972f4a3dc4952ab6cb7ba289b595ad5352207874
    session.endSession();
    console.error("createOffer error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};


///---negotiate offer function can be added here---

<<<<<<< HEAD
exports.negotiateoffer = async (req, res) => {
  const io = req.app.get("io");
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { user_id, offer_id, new_token_per_unit } = req.body;
    //if (!user_id || !offer_id || new_token_per_unit == null) {
    //  console.log("Negotiate offer request missing fields:", req.body);
    //  return res.status(400).json({ msg: "Missing fields" });
    //}

    const offer = await Offer.findOne({ offer_id }).session(session);
    if (!offer) return res.status(404).json({ msg: "Offer not found" });

    // Creators cannot negotiate
    if (offer.creator_id === user_id) {
      console.log("Creator attempted to negotiate own offer:", offer.offer_id);
      return res.status(400).json({ msg: "Creator cannot negotiate own offer" });
    }

    if (offer.status !== "negotiation" && offer.status !== "open") {
      console.log("Offer not open for negotiation:", offer.offer_id, "Status:", offer.status);
      return res.status(400).json({ msg: "offer already completed" });
    }

    // Strict — Only ONE negotiator allowed
    if (offer.status === "negotiation" && offer.negotiated_by !== user_id) {
      console.log("Offer already in negotiation by another user:", offer.offer_id);
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
        console.log("Refunding old token reservation:", oldTokens);
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
        console.log("Not enough tokens to negotiate:", negotiator.token_balance, "required:", newTotalTokens);
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


    console.log("Negotiation updated for offer:", offer.offer_id);
    return res.json({ success: true, msg: "Negotiation updated", offer });

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
      success: true,
      msg: "Negotiation cancelled successfully",
      offer
    });

  } catch (err) {
    console.error("Cancel negotiation error:", err);
    try { await session.abortTransaction(); } catch (e) { }
    session.endSession();
    return res.status(500).json({ msg: "Server error" });
  }
};


=======

//--cancel negotiation function can be added here--

>>>>>>> 972f4a3dc4952ab6cb7ba289b595ad5352207874

//--cancel offer function can be added here--

exports.canceloffer = async (req, res) => {
  const io = req.app.get("io");
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { user_id, offer_id } = req.body;
<<<<<<< HEAD
    if (!user_id)
=======

    console.log("Cancel offer request:", user_id, offer_id);


    if(!user_id )
>>>>>>> 972f4a3dc4952ab6cb7ba289b595ad5352207874
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
    // console.log("Offer found:", offer.offer_id, "Status:", offer.status);
    if (offer.creator_id !== user_id) {
      console.log("User is not creator:", user_id, "Creator:", offer.creator_id);
      await session.abortTransaction(); session.endSession();
      return res.status(403).json({ msg: "Only creator can cancel" });
    }
    // console.log("User is creator");

    if (offer.status !== "open")
       { await session.abortTransaction(); session.endSession(); 
         return res.status(400).json({ msg: "Cannot cancel in current status" });
       }

    const creator = await User.findOne({ user_id: offer.creator_id }).session(session);
<<<<<<< HEAD
    if (!creator) {
      console.log("Creator not found");
      await session.abortTransaction(); session.endSession(); return res.status(404).json({ msg: "Creator not found" });
    }

=======

    if (!creator) { 
       console.log("Creator not found");
      await session.abortTransaction(); session.endSession(); return res.status(404).json({ msg: "Creator not found" }); }
    
>>>>>>> 972f4a3dc4952ab6cb7ba289b595ad5352207874
    // Release creator reserved portion
   
      // restore seller reserved energy
      console.log("Restoring reserved energy to creator");
      creator.reserved_energy = Math.max(0, N(creator.reserved_energy) - N(offer.remaining_units));
      
      creator.energy_balance = N(creator.energy_balance) + N(offer.units);
      console.log("Creator energy balance after restore:", creator.energy_balance);
    
    // If negotiator exists, refund their reservation
   

    offer.status = "cancelled";
   
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

    return res.json({ success: true, msg: "Offer cancelled and reservations released", offer });


  } catch (err) {
    try { await session.abortTransaction(); } catch (_) { }
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
<<<<<<< HEAD
    const { offer_id, user_id } = req.body;
=======
    const { offer_id ,user_id ,unit } = req.body;
>>>>>>> 972f4a3dc4952ab6cb7ba289b595ad5352207874

    //const user_id = req.user.user_id;

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
    // 4. Fetch counterparty user
    // -------------------------------
    const buyer = await User.findOne({ user_id}).session(session);

    console.log("Buyer found:", buyer.user_id);
    console.log("Buyer wallet address:", buyer.wallet_address);

    if (!buyer) {
      console.log("Counterparty not found:", user_id);
      await session.abortTransaction(); session.endSession();
      return res.status(404).json({ msg: "Counterparty not found" });
    }

    // -------------------------------------------------------
    // 5. Process trade depending on SELL or BUY offer
    // -------------------------------------------------------
    console.log("Processing trade for units:", unit);

    const remaining_units = offer.remaining_units;

<<<<<<< HEAD
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
        console.log("Direct accept processing for SELL offer");
        // Direct accept → deduct directly from buyer's token_balance
        if (buyer.token_balance < tokensToTrade) {
          console.log("Buyer does not have enough tokens:", buyer.token_balance, "required:", tokensToTrade);
          return res.status(400).json({ msg: "Buyer does not have enough tokens" });
        }
        buyer.token_balance -= tokensToTrade;
      }

      // Seller receives tokens
      seller.token_balance += tokensToTrade;

      // Seller gives energy
      if (seller.reserved_energy < offer.units) {
        console.log("Seller does not have enough reserved energy:", seller.reserved_energy, "required:", offer.units);
=======
    if(unit > remaining_units){
        await session.abortTransaction(); session.endSession();
        return res.status(400).json({ msg: "Requested units exceed remaining units in offer" });
    }



    const needed_token =unit*offer.token_per_unit; // The ORIGINAL price before negotiation
   console.log("Tokens needed for trade:", needed_token);

    // Seller receives tokens
    
        console.log("Processing SELL offer acceptance");
    // Seller gives energy

    if (creator.reserved_energy < unit) {
       await session.abortTransaction(); session.endSession();
        console.log("Seller does not have enough reserved energy:", creator.reserved_energy, "required:", offer.units);
>>>>>>> 972f4a3dc4952ab6cb7ba289b595ad5352207874
        return res.status(400).json({ msg: "Seller does not have enough reserved energy" });
      }
      seller.reserved_energy -= offer.units;
      buyer.energy_balance += offer.units;
    }

    creator.reserved_energy -= unit;
    buyer.energy_balance += unit;

<<<<<<< HEAD

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
=======
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
  unit:unit
});  

   console.log("check");

   if(tx.message !== "Transaction successful"){
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

    if(offer.remaining_units === 0){
      offer.status = "completed";
      offer.completed_at = new Date();
    }
>>>>>>> 972f4a3dc4952ab6cb7ba289b595ad5352207874

    // =======================================================
    // 7. Save and Commit
    // =======================================================
    await creator.save({ session });
    //await counter.save({ session });
    await offer.save({ session });
   console.log("newn");
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

// =======================================================
// PURCHASE PARTIAL OFFER (NEW ENDPOINT)
// =======================================================
exports.purchasePartialOffer = async (req, res) => {
  const io = req.app.get("io");
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { offer_id, units } = req.body;
    const buyer_id = req.user.user_id; // From auth middleware

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
    const availableUnits = N(offer.units);
    if (requestedUnits > availableUnits) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ msg: `Only ${availableUnits} kWh available` });
    }

    // Calculate cost
    const tokenPerUnit = N(offer.token_per_unit);
    const totalCost = requestedUnits * tokenPerUnit;

    // Find buyer and seller
    const buyer = await User.findOne({ user_id: buyer_id }).session(session);
    const seller = await User.findOne({ user_id: offer.creator_id }).session(session);

    if (!buyer || !seller) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ msg: "User not found" });
    }

    // Check buyer has enough tokens
    if (N(buyer.token_balance) < totalCost) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ msg: `Insufficient tokens. Need ${totalCost}, have ${buyer.token_balance}` });
    }

    // Check seller has enough reserved energy
    if (N(seller.reserved_energy) < requestedUnits) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ msg: "Seller does not have enough reserved energy" });
    }

    // Execute transaction
    buyer.token_balance = N(buyer.token_balance) - totalCost;
    buyer.energy_balance = N(buyer.energy_balance) + requestedUnits;
    buyer.total_energy_bought = N(buyer.total_energy_bought) + requestedUnits;

    seller.token_balance = N(seller.token_balance) + totalCost;
    seller.reserved_energy = N(seller.reserved_energy) - requestedUnits;
    seller.total_energy_sold = N(seller.total_energy_sold) + requestedUnits;

    // Update or complete offer
    const remainingUnits = availableUnits - requestedUnits;
    if (remainingUnits <= 0) {
      // Offer fully purchased
      offer.status = "completed";
      offer.completed_at = new Date();
      offer.units = 0;
    } else {
      // Partial purchase - update remaining units
      offer.units = remainingUnits;
      offer.total_tokens = remainingUnits * tokenPerUnit;
    }

    // Save all changes
    await buyer.save({ session });
    await seller.save({ session });
    await offer.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Real-time notifications
    const users = await User.find({ transformer_id: offer.transformer_id }).select("user_id");
    users.forEach(u => {
      io.to(u.user_id.toString()).emit("offer_updated", {
        msg: "Offer purchased",
        offer
      });
    });

    return res.status(200).json({
      success: true,
      msg: `Successfully purchased ${requestedUnits} kWh for ${totalCost} tokens`,
      purchased_units: requestedUnits,
      cost: totalCost,
      remaining_units: remainingUnits,
      offer
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Purchase Partial Offer Error:", err);
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};


// Fetch closed offers from last 20 days for the same transformer as the requester
<<<<<<< HEAD

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
};// File: trade-offers-controller.js
exports.getCurrentTradeOffers = async (req, res) => {
  try {
    // FIX: Ensure consistent destructuring from req.user
    // Use the consistent naming from the auth middleware/req.user object:
    const { transformer_id: transformer, user_id: loggedInUser } = req.user || {};

    // Check for missing Transformer ID (400 Bad Request)
    if (!transformer) {
      return res.status(400).json({
        success: false,
        message: "Transformer ID missing for this user. Cannot fetch market offers."
      });
    }

    // Check for missing User ID (401 Unauthorized - relies on auth)
    if (!loggedInUser) {
      // This check is mainly for defense, as the auth middleware should catch it first
      return res.status(401).json({
        success: false,
        message: "User ID is missing on the request object. Authentication failed."
      });
    }

    console.log("Fetching market offers for user:", loggedInUser, "Transformer:", transformer);

    const ACTIVE_STATUSES = ["open", "negotiation"];

    //  Database Query (now correctly uses the consistent loggedInUser/user_id)
    const marketOffers = await Offer.find({
      transformer_id: transformer,
      creator_id: { $ne: loggedInUser },  // exclude MY offers using user_id
      status: { $in: ACTIVE_STATUSES } // only active offers
    }).sort({ created_at: -1 });

    return res.status(200).json({
      success: true,
      data: marketOffers
    });

  } catch (err) {
    console.error("Error fetching current trade offers:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching current trade offers"
    });
  }
};



exports.getOwnTradeOffers = async (req, res) => {
  try {
    // FIX: Access user information consistently from req.user
    const { transformer_id: userTransformer, user_id: loggedInUser } = req.user || {};

    if (!userTransformer) {
      return res.status(400).json({
        success: false,
        message: "Transformer ID missing for this user"
      });
    }

    // Defensive check for loggedInUser, matching getCurrentTradeOffers
    if (!loggedInUser) {
      return res.status(401).json({
        success: false,
        message: "User ID is missing on the request object. Authentication failed."
      });
    }

    console.log("Fetching own offers for user:", loggedInUser, "at transformer:", userTransformer);

    // Fetch ONLY *MY OWN* offers
    const myOffers = await Offer.find({
      transformer_id: userTransformer,
      creator_id: loggedInUser,
      status: { $in: ["open", "negotiation"] }
    });



    return res.status(200).json({
      success: true,
      data: myOffers
    });

  } catch (err) {
    console.error("Error fetching current trade offers:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching own trade offers" // Changed message for clarity
    });
  }
};
=======
>>>>>>> 972f4a3dc4952ab6cb7ba289b595ad5352207874

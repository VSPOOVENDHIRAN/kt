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
    console.log("Create offer request body:", req.body);
    session.startTransaction();

    // Destructure request body
    const { user_id, units, token_per_unit } = req.body;
    console.log("Creating offer for user:", user_id, "Units:", units, "Token/Unit:", token_per_unit);
    // Validate required fields
    if (!user_id || !units || !token_per_unit) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ msg: "Missing fields: user, units, token_per_unit are required" });
    }
    const user = await User.findOne({ user_id }).session(session);
    if (!user) {
      console.log("User not found:", user_id);  
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ msg: "User not found" });
    }
      const wallet_address = user.wallet_address;
    // Fetch user from DB
   
    if (wallet_address) {
      console.log("Fetching wallet address for creator:", user.user_id);
      user.wallet_address = wallet_address;
      await user.save({ session });
    }

    const unitsNum = Number(units);
    const tokenPerUnit = Number(token_per_unit);
    const totalTokens = unitsNum * tokenPerUnit;

    // SELL OFFER: check energy balance
    
      if (Number(user.energy_balance) < unitsNum) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ msg: "Not enough energy to create sell offer" });
      }

      user.energy_balance -= unitsNum;
      user.reserved_energy += unitsNum;

    // Create offer object
    
    const offer = new Offer({
      offer_id: await generateOfferId(),
      creator_id: user.user_id,
      transformer_id: user.transformer_id,
      units: unitsNum,
      token_per_unit: tokenPerUnit,
      total_tokens: totalTokens,
      remaining_units: unitsNum,
      created_at: new Date(),
      status: "open"
    });

    // Save to DB
    await user.save({ session });
    await offer.save({ session });
    await session.commitTransaction();
    session.endSession();

 
    // Notify nearby users in real-time
   
    const sameTransformerUsers = await User.find({
      transformer_id: user.transformer_id
    }).select("user_id");

    sameTransformerUsers.forEach(u => {
      io.to(u.user_id.toString()).emit("offer_created", {
        msg: "A new offer is available near your transformer",
        offer
      });
    });

    return res.json({ success: true, msg: "Offer created", offer });
  } catch (err) {
    try { await session.abortTransaction(); } catch (_) {}
    session.endSession();
    console.error("createOffer error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};


exports.canceloffer = async (req, res) => {
  const io = req.app.get("io");
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { user, offer_id } = req.body;

    console.log("Cancel offer request:", user.u, offer_id);


    if(!user_id )
      console.log("user_id missing");
    if(!offer_id )
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

    if (!creator) { 
       console.log("Creator not found");
      await session.abortTransaction(); session.endSession(); return res.status(404).json({ msg: "Creator not found" }); }
    
  
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

//--accept offer function--
exports.acceptoffer = async (req, res) => {
  const io = req.app.get("io");
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { offer_id ,user ,unit } = req.body;

    // 1. Find Offer
   
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
  
    // 2. Creator of Offer
   
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
      

    // 3. Fetch buyer user

    console.log("Buyer found:", user.user_id);
    console.log("Buyer wallet address:", user.wallet_address);

    if (!user) {
      console.log("Counterparty not found:", user_id);
      await session.abortTransaction(); session.endSession();
      return res.status(404).json({ msg: "Counterparty not found" });
    }

    // 4. Process trade
  
    console.log("Processing trade for units:", unit);

    const remaining_units = offer.remaining_units;

    if(unit > remaining_units){
        await session.abortTransaction(); session.endSession();
        return res.status(400).json({ msg: "Requested units exceed remaining units in offer" });
    }



    const needed_token =unit*offer.token_per_unit; 
   console.log("Tokens needed for trade:", needed_token);

    
        console.log("Processing SELL offer acceptance");
    // Seller gives energy

    if (creator.reserved_energy < unit) {
       await session.abortTransaction(); session.endSession();
        console.log("Seller does not have enough reserved energy:", creator.reserved_energy, "required:", offer.units);
        return res.status(400).json({ msg: "Seller does not have enough reserved energy" });
    }

    creator.reserved_energy -= unit;
    user.energy_balance += unit;

    console.log("Energy balances updated. Seller reserved energy:", creator.reserved_energy, "Buyer energy balance:", user.energy_balance);
     
    const balance_buyer = await get_balance(user.wallet_address);
    console.log("Buyer token balance:", balance_buyer, "Needed tokens for trade:", needed_token);
    if (balance_buyer < needed_token) {
       await session.abortTransaction(); session.endSession();
        console.log("Buyer does not have enough token balance:", balance_buyer, "required:", needed_token);
        return res.status(400).json({ msg: "Buyer does not have enough token balance" });
    }
    console.log("Buyer has sufficient token balance:", balance_buyer);

     const tx = await send_transaction({
     from: user.wallet_address,
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

    // 7. Save and Commit

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

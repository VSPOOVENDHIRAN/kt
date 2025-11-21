const Offer = require("../models/offers");
const User = require("../models/user");

// Generate OFFER ID
async function generateOfferId() {
  const count = await Offer.countDocuments();
  return "OFF" + String(1000 + count + 1);
}

// ------------------------------
// CREATE OFFER.
// ------------------------------
exports.createOffer = async (req, res) => {
  try {
    const { creator_id, offer_type, units, price_per_unit } = req.body;

    if (!creator_id || !offer_type || !units || !price_per_unit) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const user = await User.findOne({ user_id: creator_id });
    if (!user) return res.status(404).json({ error: "Creator not found" });

    const total_price = units * price_per_unit;

    // ============= SELL OFFER CHECK =============
    if (offer_type === "sell") {
      if (user.energy_balance < units) {
        return res.status(400).json({
          error: "Not enough energy to sell"
        });
      }
    }

    // ============= BUY OFFER CHECK =============
    if (offer_type === "buy") {
      if (user.wallet_balance < total_price) {
        return res.status(400).json({
          error: "Insufficient wallet balance"
        });
      }
    }

    // Create offer entry
    const newOffer = new Offer({
      offer_id: await generateOfferId(),
      offer_type,
      creator_id,
      creator_meter: user.meter_id,
      transformerid: user.transformerid,
      units,
      price_per_unit,
      total_price
    });

    await newOffer.save();

    res.status(201).json({
      message: "Offer created successfully",
      offer: newOffer
    });

  } catch (err) {
    console.error("Create Offer Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};


// ------------------------------
// ACCEPT OFFER
// ------------------------------
exports.acceptOffer = async (req, res) => {
  try {
    const { offer_id, accepter_id } = req.body;

    const offer = await Offer.findOne({ offer_id });
    if (!offer)
      return res.status(404).json({ error: "Offer not found" });

    if (offer.status !== "open")
      return res.status(400).json({ error: "Offer not available" });

    const accepter = await User.findOne({ user_id: accepter_id });
    if (!accepter)
      return res.status(404).json({ error: "User not found" });

    const creator = await User.findOne({ user_id: offer.creator_id });

    const final_price =
      offer.negotiated_price !== null ? offer.negotiated_price : offer.total_price;

    // ---------------------------
    // Case 1: Creator is SELLER
    // ---------------------------
    if (offer.offer_type === "sell") {

      // Buyer must have money
      if (accepter.wallet_balance < final_price)
        return res.status(400).json({ error: "Buyer has insufficient funds" });

      // Perform transaction
      accepter.wallet_balance -= final_price;
      creator.wallet_balance += final_price;

      // Reduce seller energy
      creator.energy_balance -= offer.units;

      await accepter.save();
      await creator.save();
    }

    // ---------------------------
    // Case 2: Creator is BUYER
    // ---------------------------
    else if (offer.offer_type === "buy") {

      // Seller must have energy
      if (accepter.energy_balance < offer.units)
        return res.status(400).json({ error: "Seller doesn't have enough energy" });

      // Buyer must have money already blocked earlier
      if (creator.wallet_balance < final_price)
        return res.status(400).json({ error: "Buyer doesn't have funds now" });

      // Transfer money
      creator.wallet_balance -= final_price;
      accepter.wallet_balance += final_price;

      // Transfer energy
      accepter.energy_balance -= offer.units;
      creator.energy_balance += offer.units;

      await accepter.save();
      await creator.save();
    }

    // Update offer
    offer.status = "completed";
    await offer.save();

    res.json({
      message: "Offer accepted",
      offer
    });

  } catch (err) {
    console.error("Accept Offer Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

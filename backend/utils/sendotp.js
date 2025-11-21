async function sendOTP(phone, otp) {
  console.log(`Sending OTP ${otp} to phone ${phone}`);
  // Integrate your SMS provider here
  return true;
}

module.exports = { sendOTP };

const twilio = require('twilio');

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

let client = null;

// Initialize Twilio Verify only if credentials are provided
if (accountSid && authToken && verifyServiceSid) {
  client = twilio(accountSid, authToken);
  console.log('✓ Twilio Verify API initialized');
  console.log(`✓ Service SID: ${verifyServiceSid}`);
} else {
  console.warn('⚠ Twilio Verify credentials not found. OTP will be simulated (check console)');
}

/**
 * Send OTP via Twilio Verify API
 * @param {string} phone - Phone number with country code (e.g., +919876543210)
 * @returns {Promise<object>} - { success: boolean, message: string }
 */
async function sendOTP(phone) {
  try {
    // Validate phone number format
    if (!phone || !phone.startsWith('+')) {
      throw new Error('Phone number must include country code (e.g., +1234567890)');
    }

    // If Twilio Verify is configured, send real OTP
    if (client && verifyServiceSid) {
      const verification = await client.verify.v2
        .services(verifyServiceSid)
        .verifications
        .create({
          to: phone,
          channel: 'sms'
        });

      console.log(`✓ OTP sent successfully to ${phone}`);
      console.log(`✓ Status: ${verification.status}`);
      console.log(`✓ Valid: ${verification.valid}`);

      return {
        success: true,
        message: 'OTP sent successfully',
        status: verification.status
      };
    } else {
      // Development mode - simulate OTP
      const mockOtp = Math.floor(100000 + Math.random() * 900000);
      console.log('═══════════════════════════════════════');
      console.log(`📱 DEVELOPMENT MODE - OTP for ${phone}`);
      console.log(`🔐 OTP: ${mockOtp}`);
      console.log(`⏰ Valid for 10 minutes`);
      console.log('═══════════════════════════════════════');

      return {
        success: true,
        message: 'OTP sent (development mode)',
        status: 'pending'
      };
    }
  } catch (error) {
    console.error('❌ Failed to send OTP:', error.message);

    // Log specific Twilio errors
    if (error.code) {
      console.error(`Twilio Error Code: ${error.code}`);
      console.error(`Error Details: ${error.moreInfo}`);
    }

    throw new Error(error.message || 'Failed to send OTP. Please try again.');
  }
}

/**
 * Verify OTP via Twilio Verify API
 * @param {string} phone - Phone number with country code
 * @param {string} code - OTP code entered by user
 * @returns {Promise<object>} - { success: boolean, message: string, status: string }
 */
async function verifyOTP(phone, code) {
  try {
    // Validate inputs
    if (!phone || !phone.startsWith('+')) {
      throw new Error('Phone number must include country code (e.g., +1234567890)');
    }

    if (!code || code.length !== 6) {
      throw new Error('OTP must be 6 digits');
    }

    // If Twilio Verify is configured, verify real OTP
    if (client && verifyServiceSid) {
      const verificationCheck = await client.verify.v2
        .services(verifyServiceSid)
        .verificationChecks
        .create({
          to: phone,
          code: code
        });

      console.log(`✓ OTP verification for ${phone}`);
      console.log(`✓ Status: ${verificationCheck.status}`);
      console.log(`✓ Valid: ${verificationCheck.valid}`);

      if (verificationCheck.status === 'approved') {
        return {
          success: true,
          message: 'OTP verified successfully',
          status: verificationCheck.status,
          valid: verificationCheck.valid
        };
      } else {
        return {
          success: false,
          message: 'Invalid or expired OTP',
          status: verificationCheck.status,
          valid: verificationCheck.valid
        };
      }
    } else {
      // Development mode - accept any 6-digit code
      console.log('═══════════════════════════════════════');
      console.log(`📱 DEVELOPMENT MODE - Verifying OTP`);
      console.log(`Phone: ${phone}`);
      console.log(`Code: ${code}`);
      console.log(`✓ Accepted (development mode)`);
      console.log('═══════════════════════════════════════');

      return {
        success: true,
        message: 'OTP verified (development mode)',
        status: 'approved',
        valid: true
      };
    }
  } catch (error) {
    console.error('❌ Failed to verify OTP:', error.message);

    // Log specific Twilio errors
    if (error.code) {
      console.error(`Twilio Error Code: ${error.code}`);
    }

    // Return failure instead of throwing
    return {
      success: false,
      message: error.message || 'Invalid or expired OTP',
      status: 'failed',
      valid: false
    };
  }
}

module.exports = { sendOTP, verifyOTP };

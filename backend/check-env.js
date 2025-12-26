require('dotenv').config();

console.log('='.repeat(50));
console.log('ENVIRONMENT VARIABLES CHECK');
console.log('='.repeat(50));
console.log('');

const vars = [
    'MONGO_URI',
    'MONGODB_URI',
    'PORT',
    'JWT_SECRET',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_VERIFY_SERVICE_SID'
];

vars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
        // Mask sensitive values
        if (varName.includes('SECRET') || varName.includes('TOKEN') || varName.includes('SID')) {
            console.log(`✅ ${varName}: ${value.substring(0, 10)}...`);
        } else {
            console.log(`✅ ${varName}: ${value}`);
        }
    } else {
        console.log(`❌ ${varName}: NOT SET`);
    }
});

console.log('');
console.log('='.repeat(50));

// Check which MongoDB URI to use
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
if (MONGO_URI) {
    console.log('✅ MongoDB URI is available');
    console.log(`   Using: ${MONGO_URI.includes('@') ? MONGO_URI.split('@')[1] : MONGO_URI}`);
} else {
    console.log('❌ No MongoDB URI found!');
    console.log('');
    console.log('Add one of these to backend/.env:');
    console.log('  MONGODB_URI=mongodb://localhost:27017/smart_meter_db');
    console.log('  or');
    console.log('  MONGO_URI=mongodb://localhost:27017/smart_meter_db');
}

console.log('='.repeat(50));

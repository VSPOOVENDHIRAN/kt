// Test if govcontroller can be loaded
try {
    const govController = require('./controllers/govcontroller');
    console.log('✓ govcontroller.js loaded successfully');
    console.log('Available methods:', Object.keys(govController));
} catch (err) {
    console.error('❌ Error loading govcontroller.js:');
    console.error(err.message);
    console.error(err.stack);
}

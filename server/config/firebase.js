const admin = require('firebase-admin');
require('dotenv').config();

const firebaseConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // Baris di bawah biasanya membutuhkan format private key yang benar (\n)
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

try {
    if (firebaseConfig.projectId && firebaseConfig.clientEmail && firebaseConfig.privateKey) {
        admin.initializeApp({
            credential: admin.credential.cert(firebaseConfig),
            databaseURL: `https://${firebaseConfig.projectId}-default-rtdb.firebaseio.com`
        });
        console.log('✅ Firebase Admin SDK Initialized!');
    } else {
        console.warn('⚠️ Firebase credentials missing in .env. Realtime features might be disabled.');
    }
} catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
}

module.exports = admin;

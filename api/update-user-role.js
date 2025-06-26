const admin = require('firebase-admin');

// Initialize the Firebase Admin SDK
// This uses the secure credentials you will set up in Vercel
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
    });
  }
} catch (e) {
  console.error('Firebase admin initialization error', e);
}

export default async function handler(request, response) {
  // 1. Check for the secret token to ensure the request is from Wix
  const providedToken = request.headers['authorization'];
  if (providedToken !== `Bearer ${process.env.WIX_WEBHOOK_TOKEN}`) {
    return response.status(401).send('Unauthorized');
  }

  // 2. Get the user data from the Wix webhook message
  const { data } = request.body;
  const userId = data.memberId; // Or whatever ID Wix provides for the user

  if (!userId) {
    return response.status(400).send('Missing user ID in webhook data');
  }

  try {
    // 3. Set the "VIP Stamp" (Custom Claim) on the Firebase user
    await admin.auth().setCustomUserClaims(userId, { tier: 'pro' });
    console.log(`Successfully set 'pro' tier for user: ${userId}`);
    
    // 4. Send a success message back
    return response.status(200).json({ success: true, message: `Pro tier set for ${userId}` });
  } catch (error) {
    console.error('Error setting custom claim:', error);
    return response.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

import admin from 'firebase-admin'

// ініціалізація Firebase Admin SDK
if (!admin.apps.length) {
	admin.initializeApp({
		credential: admin.credential.cert({
			projectId: process.env.FIREBASE_PROJECT_ID,
			clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
			privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
		})
	})
}

export const setAdmin = async (uid: string) => {
	await admin.auth().setCustomUserClaims(uid, { admin: true })
	console.log(`User ${uid} is now admin!`)
}

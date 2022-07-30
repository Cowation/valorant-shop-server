import { firestore } from "firebase-admin";
import { initializeApp, getApps, cert } from "firebase-admin/app";

if (!process.env.FIREBASE_KEY) {
  throw new Error("No Firebase key.");
}

const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

const apps = getApps();

if (!apps.length) {
  try {
    initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (error) {
    console.log("Firebase admin initialization error", error);
  }
}

export default firestore();

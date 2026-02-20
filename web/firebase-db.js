import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAXiLOuEr5OvhaLhu6q2xO1Tru7KIDDF4c",
  authDomain: "history-clicker.firebaseapp.com",
  projectId: "history-clicker",
  storageBucket: "history-clicker.firebasestorage.app",
  messagingSenderId: "608395890047",
  appId: "1:608395890047:web:744f343a3ccc9e118c1e4a",
  measurementId: "G-5MDQ8YJJX4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export async function login() {
    try {
        const result = await signInWithPopup(auth, provider);
        return result.user;
    } catch (error) {
        console.error("Login failed", error);
        throw error;
    }
}

export async function logout() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout failed", error);
        throw error;
    }
}

export async function saveToCloud(uid, gameState) {
    try {
        // Simple serialization to ensure clean data for Firestore
        const cleanState = JSON.parse(JSON.stringify(gameState));
        await setDoc(doc(db, "saves", uid), cleanState);
        console.log("Saved to cloud for", uid);
    } catch (error) {
        console.error("Cloud save failed", error);
    }
}

export async function loadFromCloud(uid) {
    try {
        const docRef = doc(db, "saves", uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            return null;
        }
    } catch (error) {
        console.error("Cloud load failed", error);
        return null;
    }
}

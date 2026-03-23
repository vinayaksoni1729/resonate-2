const { initializeApp } = require("firebase/app");
const { getFirestore } = require("firebase/firestore");
const { getStorage } = require("firebase/storage");

const firebaseConfig = {

  apiKey: "AIzaSyB2hCxFiapbCFN2JtB2Qfc9ScdLHw4D48k",

  authDomain: "resonate-hackathon.firebaseapp.com",

  projectId: "resonate-hackathon",

  storageBucket: "resonate-hackathon.firebasestorage.app",

  messagingSenderId: "816217422154",

  appId: "1:816217422154:web:dd95af6f5f1193b2ca69b3"

};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const storage = getStorage(app);

module.exports = { db, storage };
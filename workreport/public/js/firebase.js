// ========================================
// FIREBASE CONFIGURATION
// ========================================

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
    getAuth
} from
    "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    getFirestore
} from
    "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ========================================
// GANTI DENGAN CONFIG FIREBASE KAMU
// ========================================

const firebaseConfig = {

    apiKey: "AIzaSyBrJ_56ozZ2_vxA7G-i6V5EZHkaSXsVfWM",
    authDomain: "laporan-3abe9.firebaseapp.com",
    projectId: "laporan-3abe9",
    storageBucket: "laporan-3abe9.firebasestorage.app",
    messagingSenderId: "502762697919",
    appId: "1:502762697919:web:205ef2f53186c73638c20a",
    measurementId: "G-Q9JQYF1NF4"
};


// ========================================
// INITIALIZE FIREBASE
// ========================================

const app =
    initializeApp(firebaseConfig);


// ========================================
// AUTH
// ========================================

const auth =
    getAuth(app);


// ========================================
// FIRESTORE
// ========================================

const db =
    getFirestore(app);


// ========================================
// EXPORT
// ========================================

export {
    app,
    auth,
    db
};
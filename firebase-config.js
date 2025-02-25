// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAjVxkWUhsP6MaKNY2OktFf9q8lWxK76Qg",
    projectId: "library-manager-fc473",
    authDomain: "library-manager-fc473.firebaseapp.com",
    databaseURL: "https://library-manager-fc473-default-rtdb.firebaseio.com",
    storageBucket: "library-manager-fc473.appspot.com",
    messagingSenderId: "217680401063",
    appId: "1:217680401063:web:5bb8d7665a121307ac0182"
};

// Initialize Firebase
if (!firebase.apps?.length) {
    firebase.initializeApp(firebaseConfig);
}

// Initialize services
const auth = firebase.auth();
const db = firebase.database();

// Make services available globally
window.db = db;
window.auth = auth;

import { initializeApp } from 'firebase/app';
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getReactNativePersistence, ReactNativeAsyncStorage } from "firebase/auth";


// Optionally import the services that you want to use
// import {...} from "firebase/auth";
// import {...} from "firebase/database";
// import {...} from "firebase/firestore";
// import {...} from "firebase/functions";
// import {...} from "firebase/storage";

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD9SdPE2u3vQyDmBGGf0Jr3fnEwCDtvtTI",
  authDomain: "flash-b9950.firebaseapp.com",
  projectId: "flash-b9950",
  storageBucket: "flash-b9950.appspot.com",
  messagingSenderId: "346499251854",
  appId: "1:346499251854:web:889ba45df565bd4e46d3df",
  measurementId: "G-LNLD64P3CF",
  databaseURL: 'https://project-id.firebaseio.com',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// For more information on how to access Firebase in your project,
// see the Firebase documentation: https://firebase.google.com/docs/web/setup#access-firebase

export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export default db;
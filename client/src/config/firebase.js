import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBXat34FIifv0JOIfL1-T8Yc2dvdX01Aro",
  authDomain: "nutritrack-9c24d.firebaseapp.com",
  projectId: "nutritrack-9c24d",
  storageBucket: "nutritrack-9c24d.firebasestorage.app",
  messagingSenderId: "547322787067",
  appId: "1:547322787067:web:9acfdaabfadff6099eec5e"
};

const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const auth = getAuth(app);

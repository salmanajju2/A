// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, User } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "studio-6532201573-aedb1",
  "appId": "1:1084039314697:web:d7e845554bf8e7c133a7d8",
  "storageBucket": "studio-6532201573-aedb1.appspot.com",
  "apiKey": "AIzaSyBdNQlzrKMtICXUfGgYsGsNCpUtaUYD6ik",
  "authDomain": "studio-6532201573-aedb1.firebaseapp.com",
  "messagingSenderId": "1084039314697"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
}

export const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export const signInWithGoogle = (): Promise<User> => {
    return new Promise((resolve, reject) => {
        signInWithPopup(auth, provider)
            .then((result) => {
                resolve(result.user);
            })
            .catch((error) => {
                reject(error);
            });
    });
};

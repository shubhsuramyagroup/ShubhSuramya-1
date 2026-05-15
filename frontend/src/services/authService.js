import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

import { auth } from "../firebase";

export const loginAdmin = async (
  email,
  password
) => {
  return await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
};

export const logoutAdmin = async () => {
  return await signOut(auth);
};

export const checkAuth = (callback) => {
  return onAuthStateChanged(auth, callback);
};
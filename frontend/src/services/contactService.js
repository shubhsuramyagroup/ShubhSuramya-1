import { collection, addDoc, getDocs } from "firebase/firestore";

import { db } from "../firebase";

const contactRef = collection(db, "contacts");

export const addContact = async (data) => {
  return await addDoc(contactRef, data);
};

export const getContacts = async () => {
  const snapshot = await getDocs(contactRef);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

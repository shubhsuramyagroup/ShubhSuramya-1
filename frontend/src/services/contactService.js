import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";

import { db } from "../firebase";

const contactRef = collection(db, "contacts");

export const addContact = async (data) => {
  return await addDoc(contactRef, {
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    dob: Timestamp.fromDate(new Date(data.dob)),
    subject: data.subject,
    message: data.message,
    createdAt: serverTimestamp(),
  });
};

export const getContacts = async () => {
  const q = query(contactRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null,
      dob: data.dob?.toDate ? data.dob.toDate() : data.dob,
    };
  });
};

export const updateContact = async (id, data) => {
  const docRef = doc(db, "contacts", id);
  return await updateDoc(docRef, {
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    dob: Timestamp.fromDate(new Date(data.dob)),
    subject: data.subject,
    message: data.message,
  });
};

export const deleteContact = async (id) => {
  const docRef = doc(db, "contacts", id);
  return await deleteDoc(docRef);
};
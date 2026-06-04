import {
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  collection,
} from "firebase/firestore";

import { db } from "../firebase/firebaseConfig";

const companyRef = collection(db, "companies");

export const addCompany = async (data) => {
  return await addDoc(companyRef, {
    ...data,
    totalBill: 0,
    totalPaid: 0,
    pending: 0,
    createdAt: new Date(),
  });
};

export const getCompanies = async () => {
  const snapshot = await getDocs(companyRef);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const updateCompany = async (id, data) => {
  const companyDoc = doc(db, "companies", id);

  await updateDoc(companyDoc, data);
};

export const deleteCompany = async (id) => {
  const companyDoc = doc(db, "companies", id);

  await deleteDoc(companyDoc);
};

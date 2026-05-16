import {
  addDoc,
  getDocs,
  collection,
  query,
  where,
  deleteDoc,
  doc,
} from "firebase/firestore";

import { db } from "../firebase";

export const addVendor = async (data) => {
  await addDoc(collection(db, "vendors"), {
    ...data,
    createdAt: new Date(),
  });
};

export const getVendors = async (companyId) => {
  const q = query(
    collection(db, "vendors"),
    where("companyId", "==", companyId),
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const getAllVendors = async () => {
  const snapshot = await getDocs(collection(db, "vendors"));
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const deleteVendor = async (id) => {
  await deleteDoc(doc(db, "vendors", id));
};

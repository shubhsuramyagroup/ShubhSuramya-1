import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

import { db } from "../firebase";

const articleRef = collection(db, "articles");

// Add article
export const addArticle = async (data) => {
  try {
    const response = await addDoc(articleRef, data);

    return response.id;
  } catch (error) {
    console.log("Add Article Error:", error);

    throw error;
  }
};

// Get articles
export const getArticles = async () => {
  try {
    const snapshot = await getDocs(articleRef);

    return snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }));
  } catch (error) {
    console.log("Get Articles Error:", error);

    return [];
  }
};

// Update article
export const updateArticle = async (id, data) => {
  try {
    const articleDoc = doc(db, "articles", id);

    await updateDoc(articleDoc, data);
  } catch (error) {
    console.log("Update Error:", error);
  }
};

// Delete article
export const deleteArticle = async (id) => {
  try {
    const articleDoc = doc(db, "articles", id);

    await deleteDoc(articleDoc);
  } catch (error) {
    console.log("Delete Error:", error);
  }
};

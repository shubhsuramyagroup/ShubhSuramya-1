import {
  addDoc,
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";

import { db } from "../firebase";


// Add Project
export const addProject = async (data) => {
  return await addDoc(
    collection(db, "projects"),
    data
  );
};

// Get All Projects
export const getProjects = async () => {
  const querySnapshot = await getDocs(
    collection(db, "projects")
  );

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// Delete Project
export const deleteProject = async (id) => {
  return await deleteDoc(doc(db, "projects", id));
};

// Get Single Project
export const getSingleProject = async (id) => {
  const projectRef = doc(db, "projects", id);

  const snapshot = await getDoc(projectRef);

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
};

// Update Project
export const updateProject = async (
  id,
  data
) => {
  const projectRef = doc(db, "projects", id);

  return await updateDoc(projectRef, data);
};

export async function getProjectById(id) {
  const snap = await getDoc(doc(db, "projects", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}
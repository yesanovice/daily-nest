import { create } from "zustand";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  limit,
} from "firebase/firestore";
import { db, auth } from "../services/firebase/config";
import { handleFirestoreError, OperationType } from "../utils/firebaseErrors";

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

interface JournalState {
  entries: JournalEntry[];
  isLoading: boolean;
  error: string | null;
  subscribeToEntries: () => () => void;
  addEntry: (
    title: string,
    content: string,
    mood: string,
    date: string,
  ) => Promise<void>;
  updateEntry: (
    entryId: string,
    updates: Partial<JournalEntry>,
  ) => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;
}

export const useJournalStore = create<JournalState>((set) => ({
  entries: [],
  isLoading: true,
  error: null,

  subscribeToEntries: () => {
    const user = auth.currentUser;
    if (!user) {
      set({ entries: [], isLoading: false });
      return () => {};
    }

    set({ isLoading: true });
    const q = query(
      collection(db, "journals"),
      where("userId", "==", user.uid),
      orderBy("date", "desc"),
      limit(50),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const entriesData: JournalEntry[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          entriesData.push({
            id: doc.id,
            userId: data.userId,
            title: data.title,
            content: data.content,
            mood: data.mood,
            date: data.date,
            createdAt:
              data.createdAt?.toDate?.()?.toISOString() ||
              new Date().toISOString(),
            updatedAt:
              data.updatedAt?.toDate?.()?.toISOString() ||
              new Date().toISOString(),
          } as JournalEntry);
        });

        entriesData.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );

        set({ entries: entriesData, isLoading: false, error: null });
      },
      (error) => {
        set({ isLoading: false });
        handleFirestoreError(error, OperationType.LIST, "journals");
      },
    );

    return unsubscribe;
  },

  addEntry: async (title, content, mood, date) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");

    try {
      const newRef = doc(collection(db, "journals"));
      const entryData = {
        userId: user.uid,
        title,
        content,
        mood,
        date,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(newRef, entryData);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "journals");
    }
  },

  updateEntry: async (entryId, updates) => {
    try {
      const entryRef = doc(db, "journals", entryId);
      const firestoreUpdates = { ...updates, updatedAt: serverTimestamp() };
      await updateDoc(entryRef, firestoreUpdates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `journals/${entryId}`);
    }
  },

  deleteEntry: async (entryId) => {
    try {
      await deleteDoc(doc(db, "journals", entryId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `journals/${entryId}`);
    }
  },
}));

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
  writeBatch,
  serverTimestamp,
  Timestamp,
  orderBy,
  limit,
} from "firebase/firestore";
import { db, auth } from "../services/firebase/config";
import { Habit, HabitFrequency } from "../types";
import { handleFirestoreError, OperationType } from "../utils/firebaseErrors";
import { format } from "date-fns";

export interface HabitLog {
  id: string;
  userId: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completedAt: string;
}

interface HabitState {
  habits: Habit[];
  logs: HabitLog[];
  isLoading: boolean;
  error: string | null;
  subscribeToHabits: () => () => void;
  subscribeToLogs: () => () => void;
  addHabit: (
    title: string,
    frequency: HabitFrequency,
    color?: string,
  ) => Promise<void>;
  updateHabit: (habitId: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  toggleHabitLog: (habitId: string, date: string) => Promise<void>;
  getStreak: (habitId: string) => number;
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  logs: [],
  isLoading: true,
  error: null,

  subscribeToHabits: () => {
    const user = auth.currentUser;
    if (!user) {
      set({ habits: [], isLoading: false });
      return () => {};
    }

    set({ isLoading: true });
    const q = query(
      collection(db, "habits"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(50),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const habitsData: Habit[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          habitsData.push({
            id: doc.id,
            userId: data.userId,
            title: data.title,
            frequency: data.frequency,
            color: data.color,
            icon: data.icon,
            createdAt:
              data.createdAt?.toDate?.()?.toISOString() ||
              new Date().toISOString(),
            updatedAt:
              data.updatedAt?.toDate?.()?.toISOString() ||
              new Date().toISOString(),
          } as Habit);
        });

        habitsData.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        set({ habits: habitsData, isLoading: false, error: null });
      },
      (error) => {
        set({ isLoading: false });
        handleFirestoreError(error, OperationType.LIST, "habits");
      },
    );

    return unsubscribe;
  },

  subscribeToLogs: () => {
    const user = auth.currentUser;
    if (!user) {
      set({ logs: [] });
      return () => {};
    }

    const q = query(
      collection(db, "habit_logs"),
      where("userId", "==", user.uid),
      orderBy("date", "desc"),
      limit(500),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const logsData: HabitLog[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          logsData.push({
            id: doc.id,
            userId: data.userId,
            habitId: data.habitId,
            date: data.date,
            completedAt:
              data.completedAt?.toDate?.()?.toISOString() ||
              new Date().toISOString(),
          });
        });
        set({ logs: logsData });
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "habit_logs");
      },
    );

    return unsubscribe;
  },

  addHabit: async (title, frequency, color = "bg-indigo-500") => {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");

    try {
      const newRef = doc(collection(db, "habits"));
      const habitData = {
        userId: user.uid,
        title,
        frequency,
        color,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(newRef, habitData);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "habits");
    }
  },

  updateHabit: async (habitId, updates) => {
    try {
      const habitRef = doc(db, "habits", habitId);
      const firestoreUpdates = { ...updates, updatedAt: serverTimestamp() };
      await updateDoc(habitRef, firestoreUpdates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `habits/${habitId}`);
    }
  },

  deleteHabit: async (habitId) => {
    try {
      const store = get();
      const logsToDelete = store.logs.filter((l) => l.habitId === habitId);

      const batch = writeBatch(db);
      batch.delete(doc(db, "habits", habitId));

      logsToDelete.forEach((log) => {
        batch.delete(doc(db, "habit_logs", log.id));
      });

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `habits/${habitId}`);
    }
  },

  toggleHabitLog: async (habitId, date) => {
    const user = auth.currentUser;
    if (!user) return;

    const store = get();
    const existingLog = store.logs.find(
      (l) => l.habitId === habitId && l.date === date,
    );

    try {
      if (existingLog) {
        await deleteDoc(doc(db, "habit_logs", existingLog.id));
      } else {
        const newRef = doc(collection(db, "habit_logs"));
        await setDoc(newRef, {
          userId: user.uid,
          habitId,
          date,
          completedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "habit_logs");
    }
  },

  getStreak: (habitId: string) => {
    const store = get();
    const habitLogs = store.logs
      .filter((l) => l.habitId === habitId)
      .map((l) => l.date)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (habitLogs.length === 0) return 0;

    // Simple current streak calculation
    let streak = 0;
    const today = format(new Date(), "yyyy-MM-dd");
    let currentDate = new Date(today);

    // Check if missed today, if missed wait to see if we did yesterday
    const didToday = habitLogs.includes(today);
    if (!didToday) {
      currentDate.setDate(currentDate.getDate() - 1);
    }

    const maxIterations = 365; // prevent infinite loops
    for (let i = 0; i < maxIterations; i++) {
      const dateStr = format(currentDate, "yyyy-MM-dd");
      if (habitLogs.includes(dateStr)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  },
}));

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
  Timestamp,
  orderBy,
  limit,
} from "firebase/firestore";
import { db, auth } from "../services/firebase/config";
import { Task, TaskStatus, TaskPriority } from "../types";
import { handleFirestoreError, OperationType } from "../utils/firebaseErrors";

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  subscribeToTasks: () => () => void;
  addTask: (
    title: string,
    priority?: TaskPriority,
    dueDate?: string | null,
    description?: string,
  ) => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: true,
  error: null,

  subscribeToTasks: () => {
    const user = auth.currentUser;
    if (!user) {
      set({ tasks: [], isLoading: false });
      return () => {};
    }

    set({ isLoading: true });
    // Refactored to limit to 100 recent tasks for scalability
    const q = query(
      collection(db, "tasks"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(100),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const tasksData: Task[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          tasksData.push({
            id: doc.id,
            userId: data.userId,
            title: data.title,
            description: data.description,
            status: data.status,
            priority: data.priority,
            dueDate: data.dueDate
              ? data.dueDate instanceof Timestamp
                ? data.dueDate.toDate().toISOString()
                : data.dueDate
              : null,
            createdAt:
              data.createdAt?.toDate?.()?.toISOString() ||
              new Date().toISOString(),
            updatedAt:
              data.updatedAt?.toDate?.()?.toISOString() ||
              new Date().toISOString(),
          } as Task);
        });
        // Sort tasks: incomplete first, then by priority, then date
        tasksData.sort((a, b) => {
          if (a.status === "completed" && b.status !== "completed") return 1;
          if (a.status !== "completed" && b.status === "completed") return -1;
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });

        set({ tasks: tasksData, isLoading: false, error: null });
      },
      (error) => {
        set({ isLoading: false });
        handleFirestoreError(error, OperationType.LIST, "tasks");
      },
    );

    return unsubscribe;
  },

  addTask: async (
    title,
    priority = "medium",
    dueDate = null,
    description = "",
  ) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");

    try {
      const newRef = doc(collection(db, "tasks"));
      const taskData = {
        userId: user.uid,
        title,
        description,
        status: "todo",
        priority,
        dueDate: dueDate ? Timestamp.fromDate(new Date(dueDate)) : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(newRef, taskData);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "tasks");
    }
  },

  updateTaskStatus: async (taskId, status) => {
    try {
      const taskRef = doc(db, "tasks", taskId);
      await updateDoc(taskRef, {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${taskId}`);
    }
  },

  updateTask: async (taskId, updates) => {
    try {
      const taskRef = doc(db, "tasks", taskId);
      const firestoreUpdates: any = {
        ...updates,
        updatedAt: serverTimestamp(),
      };
      if (updates.dueDate !== undefined) {
        firestoreUpdates.dueDate = updates.dueDate
          ? Timestamp.fromDate(new Date(updates.dueDate))
          : null;
      }
      await updateDoc(taskRef, firestoreUpdates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${taskId}`);
    }
  },

  deleteTask: async (taskId) => {
    try {
      await deleteDoc(doc(db, "tasks", taskId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tasks/${taskId}`);
    }
  },
}));

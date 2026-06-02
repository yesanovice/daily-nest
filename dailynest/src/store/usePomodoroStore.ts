import { create } from 'zustand';

export interface PomodoroSession {
  id: string;
  duration: number; // in seconds
  completedAt: string;
  mode: 'focus' | 'short_break' | 'long_break';
}

interface PomodoroState {
  history: PomodoroSession[];
  customTimes: {
    focus: number;
    short_break: number;
    long_break: number;
  };
  addSession: (session: Omit<PomodoroSession, 'id'>) => void;
  setCustomTime: (mode: 'focus' | 'short_break' | 'long_break', time: number) => void;
}

export const usePomodoroStore = create<PomodoroState>((set) => {
  // Load from local storage
  const storedHistory = localStorage.getItem('pomodoro_history');
  const storedTimes = localStorage.getItem('pomodoro_times');
  
  const defaultTimes = {
    focus: 25 * 60,
    short_break: 5 * 60,
    long_break: 15 * 60,
  };

  return {
    history: storedHistory ? JSON.parse(storedHistory) : [],
    customTimes: storedTimes ? JSON.parse(storedTimes) : defaultTimes,
    addSession: (session) => {
      set((state) => {
        const newHistory = [...state.history, { ...session, id: Date.now().toString() }];
        localStorage.setItem('pomodoro_history', JSON.stringify(newHistory));
        return { history: newHistory };
      });
    },
    setCustomTime: (mode, time) => {
      set((state) => {
        const newTimes = { ...state.customTimes, [mode]: time };
        localStorage.setItem('pomodoro_times', JSON.stringify(newTimes));
        return { customTimes: newTimes };
      });
    }
  };
});

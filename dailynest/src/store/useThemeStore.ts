import { create } from 'zustand';

type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => {
  // Check local storage for saved theme, default to dark
  const savedTheme = (localStorage.getItem('theme') as Theme) || 'dark';
  
  // Set initial theme on document
  if (savedTheme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }

  return {
    theme: savedTheme,
    setTheme: (newTheme: Theme) => {
      localStorage.setItem('theme', newTheme);
      if (newTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
      set({ theme: newTheme });
    },
    toggleTheme: () => {
      set((state) => {
        const newTheme = state.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        if (newTheme === 'light') {
          document.documentElement.setAttribute('data-theme', 'light');
        } else {
          document.documentElement.removeAttribute('data-theme');
        }
        return { theme: newTheme };
      });
    }
  };
});

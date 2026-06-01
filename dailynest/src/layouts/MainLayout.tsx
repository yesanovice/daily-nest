import { useState, useEffect } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { Sidebar } from "../components/navigation/Sidebar";
import { BottomNav } from "../components/navigation/BottomNav";
import {
  CheckSquare,
  Menu,
  X,
  LayoutDashboard,
  Repeat,
  BarChart2,
  Calendar as CalendarIcon,
  Clock,
  Book,
  LogOut,
  User,
  Sun,
  Moon,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import { useTaskStore } from "../store/useTaskStore";
import clsx from "clsx";
import { motion, AnimatePresence } from "motion/react";

const NAV_ITEMS = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Tasks", path: "/tasks", icon: CheckSquare },
  { name: "Habits", path: "/habits", icon: Repeat },
  { name: "Pomodoro", path: "/pomodoro", icon: Clock },
  { name: "Calendar", path: "/calendar", icon: CalendarIcon },
  { name: "Analytics", path: "/analytics", icon: BarChart2 },
  { name: "Journal", path: "/journal", icon: Book },
];

export default function MainLayout() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const checkReminders = () => {
      if ('Notification' in window && Notification.permission === 'granted') {
        // Fetch fresh state to avoid closure staleness
        const { tasks } = useTaskStore.getState();
        const pendingTasks = tasks.filter((t) => t.status === 'todo');
        
        if (pendingTasks.length > 0) {
          const lastNotified = localStorage.getItem('last_task_reminder');
          const now = Date.now();
          // Remind at most once every 8 hours (28800000 ms), so roughly 3 times a day
          if (!lastNotified || now - parseInt(lastNotified) > 28800000) {
            new Notification('Task Reminder', {
              body: `You have ${pendingTasks.length} pending task(s) waiting. Keep up the momentum!`,
            });
            localStorage.setItem('last_task_reminder', now.toString());
          }
        }
      }
    };

    // Check periodically in the background (every 5 minutes)
    const interval = setInterval(checkReminders, 5 * 60 * 1000);
    
    // Initial check shortly after load
    const timeout = setTimeout(checkReminders, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] md:flex">
      <Sidebar />

      {/* Mobile Top Header */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="absolute inset-0 bg-[var(--color-base)]/80 backdrop-blur-xl border-b border-[var(--color-divider)]" />
        <div className="h-14 px-4 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="w-10 h-10 flex items-center justify-center text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors"
            >
              <Menu size={20} strokeWidth={2} />
            </button>
            <h1 className="text-[15px] font-semibold tracking-tight text-[var(--color-primary)]">
              DailyNest
            </h1>
          </div>

          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="focus:outline-none"
            >
              <img
                src={
                  user?.photoURL ||
                  `https://ui-avatars.com/api/?name=${user?.email || "User"}&background=1E1E1E&color=F0EFE9`
                }
                alt="User avatar"
                className="w-8 h-8 rounded-full border border-[var(--color-divider)] object-cover"
              />
            </button>

            <AnimatePresence>
              {isProfileMenuOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
                    onClick={() => setIsProfileMenuOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-lg shadow-xl z-50 overflow-hidden"
                  >
                    <div className="p-3 border-b border-[var(--color-divider)]">
                      <p className="text-[13px] font-medium text-[var(--color-primary)] truncate">
                        {user?.displayName || "User"}
                      </p>
                      <p className="text-[11px] text-[var(--color-secondary)] truncate mt-0.5">
                        {user?.email}
                      </p>
                    </div>
                    <div className="p-1.5 space-y-0.5">
                      <button
                        onClick={() => {
                          toggleTheme();
                          setIsProfileMenuOpen(false);
                        }}
                        className="flex w-full items-center justify-between px-2.5 py-2 rounded text-[13px] text-[var(--color-tertiary)] hover:text-[var(--color-secondary)] hover:bg-[var(--color-elevated)] transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                          Theme
                        </div>
                        <span className="text-[10px] uppercase font-medium bg-[var(--color-base)] px-1.5 py-0.5 rounded border border-[var(--color-divider)]">{theme}</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          logout();
                        }}
                        className="flex w-full items-center gap-2 px-2.5 py-2 rounded text-[13px] text-[var(--color-tertiary)] hover:text-[var(--color-danger)] hover:bg-[var(--color-elevated)] transition-colors"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-[60] flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="relative flex-1 flex flex-col max-w-[280px] w-full bg-[var(--color-base)] border-r border-[var(--color-divider)] shadow-2xl h-full"
            >
              <div
                className="h-14 px-4 flex items-center justify-between border-b border-[var(--color-divider)]"
                style={{ paddingTop: "max(0px, env(safe-area-inset-top))" }}
              >
                <div className="flex items-center gap-2 px-2">
                  <h2 className="text-[15px] font-semibold tracking-tight text-[var(--color-primary)]">
                    Menu
                  </h2>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-8 h-8 flex items-center justify-center text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors"
                >
                  <X size={18} strokeWidth={2} />
                </button>
              </div>

              <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      clsx(
                        "flex items-center gap-3 px-3 h-10 rounded-md text-[14px] font-normal transition-colors",
                        isActive
                          ? "bg-[var(--color-elevated)] text-[var(--color-primary)]"
                          : "text-[var(--color-tertiary)] hover:bg-[var(--color-divider)] hover:text-[var(--color-secondary)]",
                      )
                    }
                  >
                    <item.icon size={18} strokeWidth={2} />
                    {item.name}
                  </NavLink>
                ))}
              </nav>

              <div
                className="px-4 pb-6 space-y-1"
                style={{
                  paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
                }}
              >
                <button
                  onClick={() => toggleTheme()}
                  className="flex w-full items-center justify-between px-3 h-10 rounded-md text-[14px] text-[var(--color-tertiary)] hover:bg-[var(--color-divider)] hover:text-[var(--color-secondary)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {theme === 'dark' ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
                    {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                  </div>
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-3 px-3 h-10 rounded-md text-[14px] text-[var(--color-tertiary)] hover:bg-[var(--color-divider)] hover:text-[var(--color-danger)] transition-colors"
                >
                  <LogOut size={18} strokeWidth={2} />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="flex-1 md:ml-[220px] pt-14 md:pt-0 pb-24 md:pb-0 min-h-screen overflow-x-hidden relative">
        <div className="max-w-[900px] w-full mx-auto px-4 md:pl-10 md:pr-4 pt-6 md:pt-12 animate-in fade-in duration-500 relative z-10 block">
          <Outlet />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

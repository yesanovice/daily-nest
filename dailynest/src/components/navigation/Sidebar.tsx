import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Repeat, 
  BarChart2, 
  Calendar as CalendarIcon,
  Clock,
  Book,
  LogOut,
  Moon,
  Sun
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import clsx from 'clsx';
import { motion } from 'motion/react';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Tasks', path: '/tasks', icon: CheckSquare },
  { name: 'Habits', path: '/habits', icon: Repeat },
  { name: 'Pomodoro', path: '/pomodoro', icon: Clock },
  { name: 'Calendar', path: '/calendar', icon: CalendarIcon },
  { name: 'Analytics', path: '/analytics', icon: BarChart2 },
  { name: 'Journal', path: '/journal', icon: Book },
];

export function Sidebar() {
  const { logout, user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  return (
    <div className="hidden md:flex flex-col w-[220px] h-screen bg-[var(--color-base)] fixed left-0 top-0 z-20">
      <div className="h-12 flex items-center px-6 mt-2">
        <h1 className="text-[15px] font-semibold tracking-tight text-[var(--color-primary)] flex items-center gap-2">
          DailyNest
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-0.5 overflow-y-auto mt-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-2 h-9 rounded text-[13px] font-normal transition-colors relative',
                isActive 
                  ? 'bg-[var(--color-elevated)] text-[var(--color-primary)]' 
                  : 'text-[var(--color-tertiary)] hover:bg-[var(--color-divider)] hover:text-[var(--color-secondary)]'
              )
            }
          >
            {({ isActive }) => (
               <>
                 {isActive && (
                   <motion.div
                     layoutId="sidebar-active"
                     className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-[var(--color-accent)] rounded-r-md"
                     initial={false}
                     transition={{ type: "spring", stiffness: 300, damping: 30 }}
                   />
                 )}
                 <item.icon size={16} className="shrink-0" />
                 {item.name}
               </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 space-y-1">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center justify-between px-2 h-9 rounded text-[13px] text-[var(--color-tertiary)] hover:bg-[var(--color-divider)] hover:text-[var(--color-secondary)] transition-colors"
        >
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Sun size={16} className="shrink-0" /> : <Moon size={16} className="shrink-0" />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </div>
        </button>
        
        <button
          onClick={() => logout()}
          className="flex w-full items-center gap-3 px-2 h-9 rounded text-[13px] text-[var(--color-tertiary)] hover:bg-[var(--color-divider)] hover:text-[var(--color-danger)] transition-colors"
        >
          <LogOut size={16} className="shrink-0" />
          Log out
        </button>
        
        <div className="mt-4 pt-4 border-t border-[var(--color-divider)] flex items-center gap-3 px-2">
          <img 
            src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.email || 'User'}&background=1E1E1E&color=F0EFE9`} 
            alt="User avatar" 
            className="w-7 h-7 rounded-full border border-[var(--color-divider)] object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-[var(--color-secondary)] truncate">
              {user?.displayName || 'User'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Repeat, 
  PlusCircle,
  BarChart2
} from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'motion/react';

const BOTTOM_NAV_ITEMS = [
  { name: 'Home', path: '/', icon: LayoutDashboard },
  { name: 'Tasks', path: '/tasks', icon: CheckSquare },
  { name: 'Add', path: '/add', icon: PlusCircle, isMain: true },
  { name: 'Habits', path: '/habits', icon: Repeat },
  { name: 'Data', path: '/analytics', icon: BarChart2 },
];

export function BottomNav() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      <div className="absolute inset-0 bg-[var(--color-surface)]/80 backdrop-blur-xl border-t border-[var(--color-divider)]" />
      <nav className="flex items-center justify-around px-2 h-16 relative" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {BOTTOM_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center w-16 h-full transition-colors relative z-10',
                isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-tertiary)] hover:text-[var(--color-secondary)]'
              )
            }
          >
            {({ isActive }) => (
              <>
                {item.isMain ? (
                   <div className="bg-[var(--color-accent)] text-white rounded-full p-3.5 -mt-6 flex items-center justify-center active:scale-95 transition-transform shadow-lg shadow-black/20">
                     <item.icon size={24} strokeWidth={2} />
                   </div>
                ) : (
                   <>
                     <motion.div
                        animate={{ y: isActive ? -2 : 0, scale: isActive ? 1.1 : 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                     >
                       <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className="mb-1" />
                     </motion.div>
                     <span className={clsx("text-[10px] font-medium tracking-wide transition-opacity duration-200", isActive ? "opacity-100" : "opacity-80")}>{item.name}</span>
                   </>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

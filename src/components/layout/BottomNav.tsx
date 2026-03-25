
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Home, Users, FileText, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

const navItems = [
  { icon: LayoutDashboard, label: 'Home', path: '/' },
  { icon: Home, label: 'Rooms', path: '/rooms' },
  { icon: Users, label: 'Tenants', path: '/tenants' },
  { icon: FileText, label: 'Reports', path: '/reports' },
  { icon: Settings, label: 'Settings', path: '/profile' },
];

export const BottomNav = () => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 pb-safe z-50 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] pt-1">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "relative flex flex-col items-center justify-center w-full h-full gap-1 text-slate-500 dark:text-slate-400 transition-colors",
              isActive && "text-indigo-600 dark:text-indigo-400"
            )}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-active-bg"
                    className="absolute inset-0 top-1 bottom-1 mx-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className={cn("w-5 h-5 relative z-10 transition-transform", isActive && "scale-110 mb-0.5")} />
                <span className={cn("text-[10px] relative z-10 font-medium", isActive && "opacity-100", !isActive && "opacity-70")}>{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-active"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-b-full z-10"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

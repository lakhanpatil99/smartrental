
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Home, Users, FileText, Settings, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Home, label: 'Rooms', path: '/rooms' },
  { icon: Users, label: 'Tenants', path: '/tenants' },
  { icon: FileText, label: 'Reports', path: '/reports' },
  { icon: Settings, label: 'Profile', path: '/profile' },
];

export const Sidebar = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error: any) {
      toast.error('Failed to log out');
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen border-r border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl fixed left-0 top-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gradient">SmartRental</h1>
        <p className="text-xs text-slate-500 mt-1 font-medium tracking-wide uppercase">Pro Manager</p>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
              isActive && "text-indigo-600 dark:text-indigo-400"
            )}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className={cn("w-5 h-5 relative z-10", isActive && "text-indigo-600 dark:text-indigo-400")} />
                <span className="relative z-10">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute left-0 w-1 h-8 bg-indigo-600 dark:bg-indigo-400 rounded-r-full z-10"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mt-auto">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors font-medium"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
};

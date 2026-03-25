
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { useAuth } from '../../context/AuthContext';

export const AppLayout = () => {
  const { user } = useAuth();
  const initials = user?.email ? user.email.substring(0, 2).toUpperCase() : 'U';

  return (
    <div className="min-h-screen relative flex">
      {/* Background gradients for aesthetics */}
      <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-blue-500/10 dark:bg-blue-500/5 blur-[100px]" />
      </div>

      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen md:pl-64">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 glass sticky top-0 z-40 border-b border-white/20">
          <h1 className="text-xl font-bold text-gradient">Patil House</h1>
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
            {initials}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 w-full max-w-7xl auto pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
};

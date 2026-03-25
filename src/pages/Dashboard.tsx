import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, Users, IndianRupee, AlertCircle, 
  TrendingUp, Zap, Clock 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { Card } from '../components/ui/Card';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

const StatCard = ({ title, value, icon: Icon, color, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
  >
    <Card hoverable className="h-full">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div>
        <h3 className="text-slate-500 dark:text-slate-400 font-medium mb-1">{title}</h3>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
      </div>
    </Card>
  </motion.div>
);

export const Dashboard = () => {
  const [stats, setStats] = useState({
    totalRooms: 0,
    occupied: 0,
    vacant: 0,
    monthlyIncome: 0,
    pending: 0,
  });
  const [earningsData, setEarningsData] = useState<{ name: string; amount: number }[]>([]);
  const [electricityData, setElectricityData] = useState<{ name: string; units: number }[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [statsData, revenue, electricity, activity] = await Promise.all([
          api.getDashboardStats(),
          api.getRevenueChartData(),
          api.getElectricityChartData(),
          api.getRecentActivity(),
        ]);
        setStats(statsData);
        setEarningsData(revenue.length > 0 ? revenue : [{ name: 'No data', amount: 0 }]);
        setElectricityData(electricity.length > 0 ? electricity : [{ name: 'No data', units: 0 }]);
        setRecentActivity(activity);
      } catch (err: any) {
        toast.error('Failed to load dashboard');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadAll();

    const channel = supabase.channel('dashboard-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'readings' }, () => loadAll())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Welcome back, here's your property overview.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="h-48 flex items-center justify-center">
           <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <StatCard title="Total Rooms" value={stats.totalRooms} icon={Building2} color="bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400" delay={0.1} />
          <StatCard title="Occupied" value={stats.occupied} icon={Users} color="bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400" delay={0.2} />
          <StatCard title="Vacant" value={stats.vacant} icon={Building2} color="bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400" delay={0.3} />
          <StatCard title="Monthly Income" value={`₹${stats.monthlyIncome.toLocaleString()}`} icon={IndianRupee} color="bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400" delay={0.4} />
          <StatCard title="Pending" value={`₹${stats.pending.toLocaleString()}`} icon={AlertCircle} color="bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400" delay={0.5} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2">
          <Card className="h-[400px] flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Revenue Overview</h2>
            </div>
            <div className="flex-1 w-full relative -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={earningsData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" fillOpacity={0.1} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `₹${val/1000}k`} dx={-10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    formatter={(value: any) => [`₹${value}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="flex flex-col gap-6">
          <Card className="flex-1">
            <div className="flex items-center gap-2 mb-6">
              <Zap className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Electricity Usage</h2>
            </div>
            <div className="h-[140px] w-full -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={electricityData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" fillOpacity={0.1} />
                  <XAxis dataKey="name" hide />
                  <YAxis hide />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none' }} formatter={(val: any) => [`${val} Units`, 'Usage']} />
                  <Bar dataKey="units" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-rose-500" />
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Recent Activity</h2>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {recentActivity.length > 0 ? recentActivity.map((activity: any) => (
                <div key={activity.id} className="flex gap-3">
                  <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                    activity.type === 'payment' ? 'bg-green-500' :
                    activity.type === 'utility' ? 'bg-amber-500' : 
                    activity.type === 'alert' ? 'bg-rose-500' : 'bg-slate-500'
                  }`} />
                  <div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-tight">{activity.text}</p>
                    <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-slate-400 italic">No recent activity yet.</p>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

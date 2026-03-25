import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Download, FileText, CheckCircle2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface ReportRow {
  id: string;
  payment_date: string;
  rent_amount: number;
  electricity_bill: number;
  total_amount: number;
  payment_status: string;
  rooms: { room_number: string } | null;
  tenants: { name: string } | null;
}

export const Reports = () => {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await api.getReports();
        setReports(data || []);
      } catch (err: any) {
        toast.error(err.message || 'Failed to load reports');
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();

    const channel = supabase.channel('reports-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => fetchReports())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredReports = reports.filter(report => {
    const roomNum = report.rooms?.room_number || '';
    const tenant = report.tenants?.name || '';
    const month = report.payment_date ? new Date(report.payment_date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '';
    
    return roomNum.toLowerCase().includes(searchTerm.toLowerCase()) || 
           tenant.toLowerCase().includes(searchTerm.toLowerCase()) ||
           month.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleExportCSV = () => {
    if (filteredReports.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['Date', 'Room', 'Tenant', 'Rent', 'Electricity', 'Total', 'Status'];
    const rows = filteredReports.map(r => [
      r.payment_date,
      r.rooms?.room_number || '',
      r.tenants?.name || '',
      r.rent_amount,
      r.electricity_bill,
      r.total_amount,
      r.payment_status,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payment_history.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Payment History</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">View and download past transactions.</p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 font-medium rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input 
              icon={<Search className="w-5 h-5" />} 
              placeholder="Search by Room, Tenant or Month..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 font-medium">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Room / Tenant</th>
                  <th className="px-4 py-3">Rent</th>
                  <th className="px-4 py-3">Electricity</th>
                  <th className="px-4 py-3">Total Paid</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white/50 dark:bg-slate-900/50">
                {filteredReports.map((report, idx) => (
                  <motion.tr 
                    key={report.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-4 whitespace-nowrap font-medium text-slate-900 dark:text-slate-100">
                      {report.payment_date ? new Date(report.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">Room {report.rooms?.room_number || '?'}</p>
                        <p className="text-xs">{report.tenants?.name || 'Unknown'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">₹{report.rent_amount || 0}</td>
                    <td className="px-4 py-4 whitespace-nowrap">₹{report.electricity_bill || 0}</td>
                    <td className="px-4 py-4 whitespace-nowrap font-bold text-indigo-600 dark:text-indigo-400">
                      ₹{report.total_amount || 0}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {report.payment_status === 'paid' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                          Pending
                        </span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            
            {filteredReports.length === 0 && (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center">
                <FileText className="w-8 h-8 mb-2 opacity-50" />
                <p>No records found.</p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

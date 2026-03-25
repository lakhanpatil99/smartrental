import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, X, Building2, Trash2 } from 'lucide-react';

export interface RoomSummaryData {
  id: string;
  roomNumber: string;
  status: 'occupied' | 'vacant';
  tenantName: string;
  rentAmount: number;
  dueAmount: number;
  previousReading: number;
  currentReading: number;
  unitsUsed: number;
  electricityBill: number;
  totalPayable: number;
  paidAmount: number;
}
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

export const Rooms = () => {
  const [rooms, setRooms] = useState<RoomSummaryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'occupied' | 'vacant' | 'due'>('all');
  
  // Add Room Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const fetchRooms = useCallback(async () => {
    try {
      const data = await api.getRooms();
      const mappedRooms = data.map((r: any) => {
        const activeTenant = r.tenants?.find((t: any) => t.is_active !== false);
        
        let latestReading = null;
        let latestPayment = null;
        
        if (activeTenant) {
          const readings = activeTenant.readings || [];
          latestReading = readings.sort((a: any, b: any) => new Date(b.reading_date).getTime() - new Date(a.reading_date).getTime())[0];
          
          const payments = activeTenant.payments || [];
          latestPayment = payments.sort((a: any, b: any) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())[0];
        }

        return {
          id: r.id,
          roomNumber: r.room_number || r.id.substring(0, 3),
          status: r.status,
          tenantName: activeTenant?.name || '-',
          rentAmount: activeTenant?.rent_amount || 0,
          dueAmount: latestPayment?.due_amount || 0,
          previousReading: latestReading?.previous_reading || 0,
          currentReading: latestReading?.current_reading || 0,
          unitsUsed: latestReading?.units_used || 0,
          electricityBill: latestReading?.total_bill || 0,
          totalPayable: latestPayment?.total_amount || 0,
          paidAmount: latestPayment?.amount_paid || 0,
        };
      });
      setRooms(mappedRooms);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load rooms');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();

    const channel = supabase.channel('rooms-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => fetchRooms())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tenants' }, () => fetchRooms())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'readings' }, () => fetchRooms())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => fetchRooms())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRooms]);

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomNumber.trim()) return;
    setIsAdding(true);
    try {
      await api.addRoom(newRoomNumber);
      toast.success(`Room ${newRoomNumber} added successfully`);
      setNewRoomNumber('');
      setShowAddModal(false);
      await fetchRooms();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add room');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteRoom = async (roomId: string, roomNumber: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete Room "${roomNumber}"? This will permanently delete ALL tenants, readings, and payments for this room.`);
    if (!confirmed) return;
    try {
      await api.deleteRoom(roomId);
      toast.success(`Room ${roomNumber} deleted successfully`);
      await fetchRooms();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete room');
    }
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.roomNumber.includes(searchTerm) || 
                          (room.tenantName && room.tenantName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchesSearch) return false;
    
    switch (filter) {
      case 'occupied': return room.status === 'occupied';
      case 'vacant': return room.status === 'vacant';
      case 'due': return room.dueAmount > 0;
      default: return true;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Rooms</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage your properties and tenants.</p>
        </div>
        <Button className="shrink-0" onClick={() => setShowAddModal(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Add New Room
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input 
            placeholder="Search by room number or tenant name..."
            icon={<Search className="w-5 h-5" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          <Button 
            variant={filter === 'all' ? 'primary' : 'secondary'} 
            onClick={() => setFilter('all')}
            className="whitespace-nowrap rounded-full h-10 px-4"
          >
            All Rooms
          </Button>
          <Button 
            variant={filter === 'occupied' ? 'primary' : 'secondary'} 
            onClick={() => setFilter('occupied')}
            className="whitespace-nowrap rounded-full h-10 px-4"
          >
            Occupied
          </Button>
          <Button 
            variant={filter === 'vacant' ? 'primary' : 'secondary'} 
            onClick={() => setFilter('vacant')}
            className="whitespace-nowrap rounded-full h-10 px-4"
          >
            Vacant
          </Button>
          <Button 
            variant={filter === 'due' ? 'primary' : 'secondary'} 
            onClick={() => setFilter('due')}
            className="whitespace-nowrap rounded-full h-10 px-4"
          >
            Payment Due
          </Button>
        </div>
      </div>

      {/* Room Grid */}
      {isLoading ? (
        <div className="h-48 flex items-center justify-center">
           <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
        </div>
      ) : (
        <>
          {filteredRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Building2 className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No rooms found</h3>
              <p className="text-slate-500 text-center max-w-md mb-6">
                You haven't added any rooms yet, or no rooms match your current search constraints.
              </p>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add Your First Room
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 shadow-sm backdrop-blur-xl">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-4 whitespace-nowrap">Room No</th>
                    <th className="px-4 py-4 whitespace-nowrap">Tenant</th>
                    <th className="px-4 py-4 whitespace-nowrap hidden md:table-cell">Prev Read</th>
                    <th className="px-4 py-4 whitespace-nowrap hidden md:table-cell">Curr Read</th>
                    <th className="px-4 py-4 whitespace-nowrap hidden lg:table-cell">Units</th>
                    <th className="px-4 py-4 whitespace-nowrap hidden sm:table-cell">Usage Bill</th>
                    <th className="px-4 py-4 whitespace-nowrap">Rent</th>
                    <th className="px-4 py-4 whitespace-nowrap font-bold text-slate-900 dark:text-gray-100">Total Payable</th>
                    <th className="px-4 py-4 whitespace-nowrap">Paid</th>
                    <th className="px-4 py-4 whitespace-nowrap text-red-600 dark:text-red-400">Due</th>
                    <th className="px-4 py-4 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {filteredRooms.map((room, idx) => (
                    <motion.tr
                      key={room.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap font-bold text-slate-900 dark:text-white">
                        {room.roomNumber}
                        <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${room.status === 'occupied' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'}`}>
                          {room.status === 'occupied' ? 'Occ' : 'Vac'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-indigo-900 dark:text-indigo-300">
                        {room.tenantName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">{room.previousReading || 0}</td>
                      <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">{room.currentReading || 0}</td>
                      <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell">{room.unitsUsed || 0} u</td>
                      <td className="px-4 py-3 whitespace-nowrap hidden sm:table-cell">₹{room.electricityBill || 0}</td>
                      <td className="px-4 py-3 whitespace-nowrap">₹{room.rentAmount || 0}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-bold text-slate-800 dark:text-slate-200">
                        ₹{room.totalPayable || 0}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-green-600 dark:text-green-400">
                        ₹{room.paidAmount || 0}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-bold text-red-600 dark:text-red-400">
                        ₹{room.dueAmount || 0}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            className="h-8 px-3 text-xs"
                            onClick={() => {
                              if (room.status === 'occupied') {
                                window.location.href = `/rooms/${room.id}`;
                              } else {
                                window.location.href = `/rooms/${room.id}/edit`;
                              }
                            }}
                          >
                            {room.status === 'occupied' ? 'Manage' : 'Add Tenant'}
                          </Button>
                          <button
                            className="h-8 w-8 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                            onClick={() => handleDeleteRoom(room.id, room.roomNumber)}
                            title="Delete Room"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>



      )}

      {/* Add Room Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add New Room</h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleAddRoom} className="p-6 space-y-4">
                <Input
                  label="Room Number / Name"
                  placeholder="e.g. 101 or A-1"
                  value={newRoomNumber}
                  onChange={(e) => setNewRoomNumber(e.target.value)}
                  icon={<Building2 className="w-5 h-5" />}
                  required
                  autoFocus
                />
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" type="button" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={isAdding}>
                    Add Room
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, User, Phone, IndianRupee, 
  Calendar, Zap, LogOut, AlertTriangle 
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export const EditRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState<any>(null);
  const [activeTenant, setActiveTenant] = useState<any>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showVacateModal, setShowVacateModal] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    rentAmount: 0,
    deposit: 0,
    joinDate: '',
    previousReading: 0,
  });

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const roomData = await api.getRoomById(id);
        setRoom(roomData);

        const tenant = roomData.tenants?.find((t: any) => t.is_active !== false);
        setActiveTenant(tenant || null);

        if (tenant) {
          setFormData({
            name: tenant.name || '',
            phone: tenant.phone || '',
            rentAmount: tenant.rent_amount || 0,
            deposit: tenant.deposit || 0,
            joinDate: tenant.join_date || '',
            previousReading: 0,
          });
        }

        // Load latest reading for pre-fill
        try {
          const latestRead = await api.getLatestReading(id);
          if (latestRead) {
            setFormData(prev => ({ ...prev, previousReading: latestRead.current_reading || 0 }));
          }
        } catch (_e) { /* no readings yet */ }

      } catch (err: any) {
        toast.error(err.message || 'Failed to load room details');
      } finally {
        setIsPageLoading(false);
      }
    };
    load();
  }, [id]);

  const isOccupied = room?.status === 'occupied' && !!activeTenant;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsLoading(true);
    try {
      if (isOccupied && activeTenant) {
        // Update existing tenant
        await api.updateTenant(activeTenant.id, {
          name: formData.name,
          phone: formData.phone,
          rent_amount: formData.rentAmount,
          deposit: formData.deposit,
          join_date: formData.joinDate,
        });
        toast.success('Tenant details updated');
      } else {
        // Add new tenant
        await api.addTenant({
          name: formData.name,
          phone: formData.phone,
          rent_amount: formData.rentAmount,
          deposit: formData.deposit,
          join_date: formData.joinDate,
        }, id);

        // If there's a starting meter reading, insert it
        if (formData.previousReading > 0) {
          try {
            // We need the new tenant ID
            const updatedRoom = await api.getRoomById(id);
            const newTenant = updatedRoom.tenants?.find((t: any) => t.is_active !== false);
            if (newTenant) {
              await api.addInitialReading(id, newTenant.id, formData.previousReading);
            }
          } catch (_e) { /* optional initial reading */ }
        }

        toast.success('Tenant assigned successfully');
      }
      navigate('/rooms');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setIsLoading(false);
    }
  };

  const [vacateDues, setVacateDues] = useState(0);
  const [isFetchingDues, setIsFetchingDues] = useState(false);

  const handleOpenVacateModal = async () => {
    setShowVacateModal(true);
    if (!activeTenant) return;
    setIsFetchingDues(true);
    try {
      const pendingDues = await api.getTenantPendingDues(activeTenant.id);
      setVacateDues(pendingDues);
    } catch {
      setVacateDues(0);
    } finally {
      setIsFetchingDues(false);
    }
  };

  const handleVacate = async () => {
    if (!id || !activeTenant) return;
    setIsLoading(true);
    try {
      await api.vacateRoom(activeTenant.id, id);
      toast.success('Room vacated successfully');
      setShowVacateModal(false);
      navigate('/rooms');
    } catch (err: any) {
      toast.error(err.message || 'Failed to vacate room');
    } finally {
      setIsLoading(false);
    }
  };

  if (isPageLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto pb-8"
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/rooms')}
            className="p-2 rounded-xl bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {isOccupied ? 'Edit Tenant Details' : 'Assign New Tenant'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Room {room?.room_number || ''}</p>
          </div>
        </div>
        
        {isOccupied && (
          <Button 
            variant="outline" 
            className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10 dark:text-red-400"
            onClick={handleOpenVacateModal}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Vacate Room
          </Button>
        )}
      </div>

      <Card className="p-8">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Tenant Name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              icon={<User className="w-5 h-5" />}
              required
            />
            <Input
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              icon={<Phone className="w-5 h-5" />}
              required
            />
            <Input
              label="Monthly Rent"
              type="number"
              value={formData.rentAmount}
              onChange={(e) => setFormData({...formData, rentAmount: Number(e.target.value)})}
              icon={<IndianRupee className="w-5 h-5" />}
              required
            />
            <Input
              label="Security Deposit"
              type="number"
              value={formData.deposit}
              onChange={(e) => setFormData({...formData, deposit: Number(e.target.value)})}
              icon={<IndianRupee className="w-5 h-5" />}
              required
            />
            <Input
              label="Join Date"
              type="date"
              value={formData.joinDate}
              onChange={(e) => setFormData({...formData, joinDate: e.target.value})}
              icon={<Calendar className="w-5 h-5" />}
              required
            />
            <Input
              label="Starting Meter Reading"
              type="number"
              value={formData.previousReading}
              onChange={(e) => setFormData({...formData, previousReading: Number(e.target.value)})}
              icon={<Zap className="w-5 h-5" />}
              required
            />
          </div>

          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-4">
            <Button variant="ghost" type="button" onClick={() => navigate('/rooms')}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading} className="w-32">
              Save Details
            </Button>
          </div>
        </form>
      </Card>

      {/* Vacate Confirmation Modal */}
      <AnimatePresence>
        {showVacateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md"
            >
              <Card className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Vacate Room {room?.room_number}?</h3>
                  
                  {isFetchingDues ? (
                    <div className="py-4 text-slate-500 text-sm">Calculating settlement...</div>
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-6 w-full text-left space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Security Deposit</span>
                        <span className="font-medium">₹{activeTenant?.deposit || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Pending Dues</span>
                        <span className="font-medium text-red-500">₹{vacateDues}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Refund Amount</span>
                        <span className={`font-bold ${(activeTenant?.deposit || 0) - vacateDues < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                          ₹{((activeTenant?.deposit || 0) - vacateDues)}
                        </span>
                      </div>
                    </div>
                  )}

                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-8 px-2">
                    {((activeTenant?.deposit || 0) - vacateDues) >= 0 
                      ? `You need to return ₹${(activeTenant?.deposit || 0) - vacateDues} to tenant.` 
                      : `Tenant owes you ₹${Math.abs((activeTenant?.deposit || 0) - vacateDues)}.`}
                    This action will mark the room vacant.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <Button variant="outline" onClick={() => setShowVacateModal(false)}>
                      Cancel
                    </Button>
                    <Button 
                      variant="primary" 
                      className="bg-red-600 hover:bg-red-700 shadow-red-600/25 from-red-600 to-red-500"
                      onClick={handleVacate}
                      isLoading={isLoading}
                    >
                      Confirm Vacate
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

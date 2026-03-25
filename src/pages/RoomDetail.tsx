import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, User, Phone, Calendar, 
  IndianRupee, Zap, FileText, CheckCircle2 
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export const RoomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState<any>(null);
  const [activeTenant, setActiveTenant] = useState<any>(null);
  const [previousReading, setPreviousReading] = useState(0);
  const [ratePerUnit] = useState(12); // Extracted as default configuration
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentReading, setCurrentReading] = useState<string>('');
  const [unitsUsed, setUnitsUsed] = useState(0);
  const [electricityBill, setElectricityBill] = useState(0);
  const [isReadingSaved, setIsReadingSaved] = useState(false);
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [isPaid, setIsPaid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const loadDetails = async () => {
      try {
        const roomData = await api.getRoomById(id);
        setRoom(roomData);
        
        const tenant = roomData.tenants?.find((t: any) => t.is_active !== false);
        setActiveTenant(tenant || null);

        try {
          const latestRead = await api.getLatestReading(id);
          setPreviousReading(latestRead?.current_reading || 0);
        } catch (e) {
          setPreviousReading(0); // Optional default fallback
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to load room details');
      } finally {
        setIsLoading(false);
      }
    };
    loadDetails();
  }, [id]);

  // Live calculation preview
  useEffect(() => {
    if (isReadingSaved) return; // DB provided the exact numbers now
    const current = parseFloat(currentReading);
    if (!isNaN(current) && current >= previousReading) {
      const units = current - previousReading;
      setUnitsUsed(Number(units.toFixed(2)));
      setElectricityBill(Number((units * ratePerUnit).toFixed(2)));
    } else {
      setUnitsUsed(0);
      setElectricityBill(0);
    }
  }, [currentReading, previousReading, ratePerUnit, isReadingSaved]);

  const rentAmount = activeTenant?.rent_amount || 0;
  const totalAmount = rentAmount + electricityBill;
  const dueAmount = totalAmount - (parseFloat(amountPaid) || 0);

  const handleSaveReading = async () => {
    if (!id || !activeTenant || isNaN(parseFloat(currentReading))) return;
    setIsSubmitting(true);
    try {
      const savedReading = await api.saveReading(id, activeTenant.id, parseFloat(currentReading));
      setUnitsUsed(savedReading.units_used);
      setElectricityBill(savedReading.total_bill);
      setIsReadingSaved(true);
      // Auto-fill amount paid for convenience to totalAmount
      setAmountPaid((rentAmount + savedReading.total_bill).toString());
      toast.success('Reading saved successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save reading');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSavePayment = async () => {
    if (!id || !activeTenant) return;
    setIsSubmitting(true);
    try {
      await api.savePayment(id, activeTenant.id, parseFloat(amountPaid) || 0);
      
      setIsPaid(true);
      toast.success('Payment successfully recorded!');
    } catch (err: any) {
      toast.error(err.message || 'Payment processing failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!room) {
    return <div className="text-center py-20">Room not found</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/rooms')}
          className="p-2 rounded-xl bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>
        <div className="flex-1 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              Room {room.room_number || room.id.substring(0, 3)}
              <span className={`px-2.5 py-1 text-xs font-medium rounded-md ${room.status === 'occupied' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'}`}>
                {room.status === 'occupied' ? 'Occupied' : 'Vacant'}
              </span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Manage details and monthly billing</p>
          </div>
          <Button variant="secondary" onClick={() => navigate(`/rooms/${id}/edit`)}>Edit</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Tenant & History */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-500" />
                Tenant Information
              </h2>
            </div>
            
            {activeTenant ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Full Name</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{activeTenant.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Phone</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{activeTenant.phone || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Join Date</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {activeTenant.join_date ? new Date(activeTenant.join_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><IndianRupee className="w-3.5 h-3.5" /> Deposit</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">₹{activeTenant.deposit || 0}</p>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 dark:text-slate-400 italic text-center py-4">No active tenant in this room.</div>
            )}
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-6">
              <Zap className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold">Electricity Calculation</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                  <p className="text-sm text-slate-500 mb-1">Previous Reading</p>
                  <p className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-100 dark:to-slate-300">
                    {previousReading} <span className="text-sm font-medium text-slate-400">units</span>
                  </p>
                </div>
                
                <div className="space-y-3">
                  <Input
                    label="Current Reading"
                    type="number"
                    placeholder="Enter meter reading"
                    value={currentReading}
                    onChange={(e) => setCurrentReading(e.target.value)}
                    icon={<Zap className="w-4 h-4" />}
                    disabled={!activeTenant || isReadingSaved || isPaid}
                  />
                  {!isReadingSaved && !isPaid && (
                    <Button 
                      onClick={handleSaveReading} 
                      disabled={currentReading === '' || isNaN(parseFloat(currentReading))}
                      isLoading={isSubmitting}
                      className="w-full shadow-indigo-500/10"
                    >
                      Save Reading
                    </Button>
                  )}
                  {isReadingSaved && (
                    <div className="flex items-center justify-center gap-2 p-3 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded-xl text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Reading Saved
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 border border-indigo-100 dark:border-indigo-500/20 flex flex-col justify-center h-full">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-slate-600 dark:text-slate-400">Units Used</span>
                  <span className="font-bold text-lg">{unitsUsed}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-slate-600 dark:text-slate-400">Rate / Unit</span>
                  <span className="font-medium">₹{ratePerUnit}</span>
                </div>
                <div className="pt-4 border-t border-indigo-200 dark:border-indigo-500/30 flex justify-between items-end">
                  <span className="font-semibold text-indigo-900 dark:text-indigo-300">Total Bill</span>
                  <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">₹{electricityBill}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Billing Summary */}
        <div className="space-y-6">
          <Card className="sticky top-24">
            <div className="flex items-center gap-2 mb-6">
              <FileText className="w-5 h-5 text-indigo-500" />
              <h2 className="text-lg font-semibold">Payment Summary</h2>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                <span className="text-slate-600 dark:text-slate-400">Room Rent</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">₹{rentAmount}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                <span className="text-slate-600 dark:text-slate-400">Electricity Bill</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">₹{electricityBill}</span>
              </div>
              
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Total Amount</span>
                  <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">₹{totalAmount}</span>
                </div>
                
                <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                  <Input 
                    label="Amount Paid"
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    disabled={!isReadingSaved || isPaid}
                    icon={<IndianRupee className="w-4 h-4" />}
                    placeholder="Enter amount"
                  />
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending Due</span>
                    <span className={`font-bold ${dueAmount > 0 ? 'text-red-500' : 'text-green-500'}`}>
                      ₹{dueAmount > 0 ? dueAmount : 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              {isPaid ? (
                <div className="flex items-center justify-center gap-2 p-4 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded-xl font-medium">
                  <CheckCircle2 className="w-5 h-5" />
                  Payment Received
                </div>
              ) : (
                <Button 
                  className="w-full h-12 text-lg shadow-indigo-500/25"
                  onClick={handleSavePayment}
                  disabled={!isReadingSaved || amountPaid === '' || isNaN(parseFloat(amountPaid))}
                  isLoading={isSubmitting}
                >
                  Submit Payment
                </Button>
              )}
            </div>
            
            {!isReadingSaved && !isPaid && (
              <p className="text-xs text-center text-slate-500 mt-4">
                Save meter reading first to enable payment
              </p>
            )}
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

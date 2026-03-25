import { useNavigate } from 'react-router-dom';
import { Edit2, Eye, User, IndianRupee, AlertCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export interface RoomData {
  id: string;
  roomNumber: string;
  status: 'occupied' | 'vacant';
  tenantName?: string;
  rentAmount: number;
  dueAmount: number;
}

export const RoomCard = ({ room }: { room: RoomData }) => {
  const navigate = useNavigate();
  const isOccupied = room.status === 'occupied';

  return (
    <Card hoverable className="relative overflow-hidden group">
      {/* Decorative gradient for occupied rooms */}
      {isOccupied && (
        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
      )}
      {!isOccupied && (
        <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />
      )}

      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Room {room.roomNumber}</h3>
          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium mt-1 ${
            isOccupied 
              ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' 
              : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
          }`}>
            {isOccupied ? 'Occupied' : 'Vacant'}
          </span>
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => navigate(`/rooms/${room.id}/edit`)}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isOccupied ? (
        <div className="space-y-3 mt-4">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <User className="w-4 h-4 text-slate-400" />
            <span className="font-medium">{room.tenantName}</span>
          </div>
          <div className="flex justify-between items-center text-sm border-t border-slate-100 dark:border-slate-800 pt-3">
            <div className="flex items-center text-slate-500 dark:text-slate-400">
              <IndianRupee className="w-4 h-4 mr-1" />
              Rent: ₹{room.rentAmount}
            </div>
            {room.dueAmount > 0 ? (
              <div className="flex items-center text-red-500 font-medium bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded">
                <AlertCircle className="w-3.5 h-3.5 mr-1" />
                Due: ₹{room.dueAmount}
              </div>
            ) : (
              <span className="text-green-600 dark:text-green-400 font-medium">Clear</span>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[92px] mt-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Available for rent</p>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">₹{room.rentAmount} / month</span>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
        <Button 
          variant={isOccupied ? "primary" : "secondary"} 
          className="flex-1 h-10 text-sm"
          onClick={() => navigate(`/rooms/${room.id}`)}
        >
          <Eye className="w-4 h-4 mr-2" />
          {isOccupied ? 'View Details' : 'Add Tenant'}
        </Button>
      </div>
    </Card>
  );
};

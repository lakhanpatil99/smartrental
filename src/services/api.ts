import { supabase } from '../lib/supabase';

const getUid = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized: No active user session.");
  return user.id;
};

export const api = {
  // --- Dashboard ---
  getDashboardStats: async () => {
    const uid = await getUid();

    const { data: rooms, error: roomsError } = await supabase.from('rooms').select('*').eq('user_id', uid);
    if (roomsError) throw roomsError;

    const { data: payments, error: paymentsError } = await supabase.from('payments').select('*').eq('user_id', uid);
    if (paymentsError) throw paymentsError;

    const totalRooms = rooms?.length || 0;
    const occupied = rooms?.filter(r => r.status === 'occupied').length || 0;
    const vacant = totalRooms - occupied;

    const monthlyIncome = payments
      ?.filter(p => p.payment_status === 'paid')
      .reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;
    const pending = payments
      ?.filter(p => (p.due_amount || 0) > 0 || p.payment_status === 'pending')
      .reduce((sum, p) => sum + (p.due_amount || p.total_amount || 0), 0) || 0;

    return { totalRooms, occupied, vacant, monthlyIncome, pending };
  },

  addRoom: async (roomNumber: string) => {
    const uid = await getUid();

    const { data, error } = await supabase
      .from('rooms')
      .insert([{ room_number: roomNumber, status: 'vacant', user_id: uid }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  getRevenueChartData: async () => {
    const uid = await getUid();

    const { data, error } = await supabase
      .from('payments')
      .select('payment_date, total_amount')
      .eq('user_id', uid)
      .eq('payment_status', 'paid')
      .order('payment_date', { ascending: true });
    if (error) throw error;

    const monthMap: Record<string, number> = {};
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    
    (data || []).forEach((p: any) => {
      const d = new Date(p.payment_date);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      monthMap[key] = (monthMap[key] || 0) + (p.total_amount || 0);
    });

    return Object.entries(monthMap).slice(-6).map(([name, amount]) => ({ name: name.split(' ')[0], amount }));
  },

  getElectricityChartData: async () => {
    const uid = await getUid();

    const { data, error } = await supabase
      .from('readings')
      .select('reading_date, units_used')
      .eq('user_id', uid)
      .order('reading_date', { ascending: true });
    if (error) throw error;

    const monthMap: Record<string, number> = {};
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    
    (data || []).forEach((r: any) => {
      const d = new Date(r.reading_date);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      monthMap[key] = (monthMap[key] || 0) + (r.units_used || 0);
    });

    return Object.entries(monthMap).slice(-6).map(([name, units]) => ({ name: name.split(' ')[0], units }));
  },

  getRecentActivity: async () => {
    const uid = await getUid();

    const { data, error } = await supabase
      .from('payments')
      .select('*, rooms(room_number), tenants(name)')
      .eq('user_id', uid)
      .order('payment_date', { ascending: false })
      .limit(5);
    if (error) throw error;

    return (data || []).map((p: any) => ({
      id: p.id,
      text: `Room ${p.rooms?.room_number || '?'} — ₹${p.total_amount} ${p.payment_status === 'paid' ? 'paid' : 'due'} by ${p.tenants?.name || 'Unknown'}`,
      time: new Date(p.payment_date).toLocaleDateString(),
      type: p.payment_status === 'paid' ? 'payment' : 'alert',
    }));
  },

  // --- Rooms ---
  getRooms: async (page: number = 0, pageSize: number = 20) => {
    const uid = await getUid();
    const start = page * pageSize;
    const end = start + pageSize - 1;

    const { data, error } = await supabase
      .from('rooms')
      .select(`
        *, 
        tenants (
          *,
          readings (*),
          payments (*)
        )
      `)
      .eq('user_id', uid)
      .order('room_number', { ascending: true })
      .range(start, end);
    if (error) throw error;
    return data;
  },

  getRoomById: async (id: string) => {
    const uid = await getUid();

    const { data, error } = await supabase
      .from('rooms')
      .select('*, tenants(*)')
      .eq('id', id)
      .eq('user_id', uid)
      .single();
    if (error) throw error;
    return data;
  },

  updateRoom: async (id: string, updates: any) => {
    const uid = await getUid();

    const { data, error } = await supabase
      .from('rooms')
      .update(updates)
      .eq('id', id)
      .eq('user_id', uid)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // --- Tenants ---
  addTenant: async (tenantData: any, roomId: string) => {
    const uid = await getUid();

    if (tenantData.rent_amount < 0) throw new Error("Rent amount cannot be negative.");
    if (tenantData.deposit < 0) throw new Error("Deposit cannot be negative.");

    const payload = { ...tenantData, room_id: roomId, is_active: true, user_id: uid };
    const { data, error } = await supabase.from('tenants').insert([payload]).select().single();
    if (error) throw error;
    
    const { error: roomError } = await supabase
      .from('rooms')
      .update({ status: 'occupied' })
      .eq('id', roomId)
      .eq('user_id', uid);
    if (roomError) throw roomError;

    return data;
  },

  updateTenant: async (tenantId: string, updates: any) => {
    const uid = await getUid();

    if (updates.rent_amount !== undefined && updates.rent_amount < 0) throw new Error("Rent amount cannot be negative.");
    if (updates.deposit !== undefined && updates.deposit < 0) throw new Error("Deposit cannot be negative.");

    const { data, error } = await supabase
      .from('tenants')
      .update(updates)
      .eq('id', tenantId)
      .eq('user_id', uid)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  vacateRoom: async (tenantId: string, roomId: string) => {
    const uid = await getUid();

    const { error: tenantError } = await supabase
      .from('tenants')
      .update({ is_active: false })
      .eq('id', tenantId)
      .eq('user_id', uid);
    if (tenantError) throw tenantError;

    const { error: roomError } = await supabase
      .from('rooms')
      .update({ status: 'vacant' })
      .eq('id', roomId)
      .eq('user_id', uid);
    if (roomError) throw roomError;
  },

  // --- Readings & Payments ---
  getLatestReading: async (roomId: string) => {
    const uid = await getUid();

    const { data, error } = await supabase
      .from('readings')
      .select('*')
      .eq('room_id', roomId)
      .eq('user_id', uid)
      .order('reading_date', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  addInitialReading: async (roomId: string, tenantId: string, startingReading: number) => {
    const uid = await getUid();

    if (startingReading < 0) throw new Error("Starting reading cannot be negative.");

    const { data, error } = await supabase.from('readings').insert([{
      room_id: roomId,
      tenant_id: tenantId,
      user_id: uid,
      previous_reading: 0,
      current_reading: startingReading,
      units_used: 0,
      price_per_unit: 12,
      total_bill: 0,
      reading_date: new Date().toISOString().split('T')[0]
    }]).select().single();

    if (error) throw error;
    return data;
  },

  saveReading: async (roomId: string, tenantId: string, currentReading: number) => {
    const uid = await getUid();

    if (currentReading < 0) throw new Error("Current reading cannot be negative.");

    const previous = await api.getLatestReading(roomId);
    const prevReading = previous?.current_reading || 0;
    
    if (currentReading < prevReading) {
      throw new Error(`Current reading (${currentReading}) cannot be less than previous reading (${prevReading}).`);
    }

    const unitsUsed = currentReading - prevReading;
    const pricePerUnit = 12;
    const totalBill = unitsUsed * pricePerUnit;

    const { data, error } = await supabase.from('readings').insert([{
      room_id: roomId,
      tenant_id: tenantId,
      user_id: uid,
      previous_reading: prevReading,
      current_reading: currentReading,
      units_used: unitsUsed,
      price_per_unit: pricePerUnit,
      total_bill: totalBill,
      reading_date: new Date().toISOString().split('T')[0]
    }]).select().single();

    if (error) throw error;
    return data;
  },

  savePayment: async (roomId: string, tenantId: string, amountPaid: number) => {
    const uid = await getUid();

    if (amountPaid < 0) throw new Error("Payment amount cannot be negative.");

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('rent_amount')
      .eq('id', tenantId)
      .eq('user_id', uid)
      .single();
    if (tenantError) throw tenantError;
    const rentAmount = tenant.rent_amount || 0;

    const latestReading = await api.getLatestReading(roomId);
    const electricityBill = latestReading?.total_bill || 0;

    const totalAmount = rentAmount + electricityBill;
    const dueAmount = totalAmount - amountPaid;
    const paymentStatus = dueAmount <= 0 ? 'paid' : 'pending';

    const { data, error } = await supabase.from('payments').insert([{
      room_id: roomId,
      tenant_id: tenantId,
      user_id: uid,
      rent_amount: rentAmount,
      electricity_bill: electricityBill,
      total_amount: totalAmount,
      amount_paid: amountPaid,
      due_amount: dueAmount >= 0 ? dueAmount : 0,
      payment_status: paymentStatus,
      payment_date: new Date().toISOString()
    }]).select().single();

    if (error) throw error;
    return data;
  },

  getTenantPendingDues: async (tenantId: string) => {
    const uid = await getUid();

    const { data, error } = await supabase
      .from('payments')
      .select('due_amount')
      .eq('tenant_id', tenantId)
      .eq('user_id', uid);
    if (error) throw error;
    
    return data.reduce((sum, p) => sum + (p.due_amount || 0), 0);
  },

  // --- Reports ---
  getReports: async (page: number = 0, pageSize: number = 20) => {
    const uid = await getUid();
    const start = page * pageSize;
    const end = start + pageSize - 1;

    const { data, error } = await supabase
      .from('payments')
      .select('*, rooms(room_number), tenants(name)')
      .eq('user_id', uid)
      .order('payment_date', { ascending: false })
      .range(start, end);
    if (error) throw error;
    return data;
  },

  // --- Delete Room ---
  deleteRoom: async (roomId: string) => {
    const uid = await getUid();

    // Delete related payments
    await supabase.from('payments').delete().eq('room_id', roomId).eq('user_id', uid);
    // Delete related readings
    await supabase.from('readings').delete().eq('room_id', roomId).eq('user_id', uid);
    // Delete related tenants
    await supabase.from('tenants').delete().eq('room_id', roomId).eq('user_id', uid);
    // Delete the room
    const { error } = await supabase.from('rooms').delete().eq('id', roomId).eq('user_id', uid);
    if (error) throw error;
  }
};

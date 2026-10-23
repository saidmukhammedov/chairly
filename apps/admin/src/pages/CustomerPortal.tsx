import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Scissors,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  LogOut,
  RefreshCw,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Building2,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { format, addDays } from 'date-fns';
import { Profile } from './Profile';

interface Shop {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  phone: string;
  coverImageUrl?: string;
  logoUrl?: string;
  currency: string;
  startingPrice?: number;
  servicesCount?: number;
  barbersCount?: number;
}

interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  durationMinutes: number;
}

interface Barber {
  id: string;
  name: string;
  avatarUrl?: string;
  specialty?: string;
}

interface Slot {
  time: string;
  isoString: string;
  startTime?: string;
  available: boolean;
  barberId?: string;
  barberName?: string;
  reason?: string;
}

interface CustomerAppointment {
  id: string;
  bookingReference: string;
  shopName: string;
  shopAddress: string;
  shopPhone?: string;
  barberName: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  currency: string;
  status: string;
  startTime: string;
  endTime: string;
  notes?: string;
  cancellationReason?: string;
}

export const CustomerPortal: React.FC = () => {
  const { user, logout, login } = useAuth();
  const [activeTab, setActiveTab] = useState<'shops' | 'appointments' | 'profile'>('shops');

  // Shops State
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoadingShops, setIsLoadingShops] = useState(true);

  // Appointments State
  const [appointments, setAppointments] = useState<CustomerAppointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);

  // Booking Modal State
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [shopServices, setShopServices] = useState<Service[]>([]);
  const [shopBarbers, setShopBarbers] = useState<Barber[]>([]);
  const [isLoadingShopDetails, setIsLoadingShopDetails] = useState(false);

  // Step state
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [customerNotes, setCustomerNotes] = useState('');
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Cancellation State
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const fetchShops = async () => {
    setIsLoadingShops(true);
    try {
      const data = await api.get<Shop[]>('/shops');
      setShops(data);
    } catch (err: any) {
      console.error('Failed to load shops', err);
    } finally {
      setIsLoadingShops(false);
    }
  };

  const fetchAppointments = async () => {
    setIsLoadingAppointments(true);
    try {
      const data = await api.get<CustomerAppointment[]>('/appointments/my');
      setAppointments(data);
    } catch (err: any) {
      console.error('Failed to load appointments', err);
    } finally {
      setIsLoadingAppointments(false);
    }
  };

  useEffect(() => {
    fetchShops();
    fetchAppointments();
  }, []);

  const openBookingModal = async (shop: Shop) => {
    setSelectedShop(shop);
    setSelectedService(null);
    setSelectedBarber(null);
    setSelectedSlot(null);
    setBookingSuccess(null);
    setBookingError(null);
    setIsLoadingShopDetails(true);

    try {
      const details = await api.get<any>(`/shops/${shop.id}`);
      setShopServices(details.services || []);
      setShopBarbers(details.barbers || []);
      if (details.services?.length > 0) {
        setSelectedService(details.services[0]);
      }
    } catch (err: any) {
      console.error('Failed to load shop details', err);
    } finally {
      setIsLoadingShopDetails(false);
    }
  };

  // Fetch slots whenever service, barber, or date changes
  useEffect(() => {
    if (!selectedShop || !selectedService) return;

    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      setSelectedSlot(null);
      setBookingError(null);
      try {
        const queryParams = new URLSearchParams({
          shopId: selectedShop.id,
          serviceId: selectedService.id,
          date: selectedDate,
          ...(selectedBarber ? { barberId: selectedBarber.id } : {}),
        });

        const data = await api.get<Slot[]>(`/availability?${queryParams.toString()}`);
        setAvailableSlots(data);
      } catch (err: any) {
        setBookingError(err.message || 'Failed to fetch available slots for this date');
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedShop, selectedService, selectedBarber, selectedDate]);

  const handleConfirmBooking = async () => {
    if (!selectedShop || !selectedService || !selectedSlot) {
      setBookingError('Please select a service, date, and available time slot.');
      return;
    }

    setIsSubmittingBooking(true);
    setBookingError(null);

    try {
      const barberId = selectedSlot.barberId || selectedBarber?.id;
      if (!barberId) {
        throw new Error('Please select a barber or a specific time slot with a barber assigned.');
      }

      const payload = {
        shopId: selectedShop.id,
        barberId: barberId,
        serviceId: selectedService.id,
        startTime: selectedSlot.isoString || selectedSlot.startTime,
        notes: customerNotes.trim() || undefined,
      };

      const result = await api.post<any>('/appointments', payload);
      setBookingSuccess(result);
      await fetchAppointments();
    } catch (err: any) {
      setBookingError(err.message || 'Failed to confirm booking. Please choose another slot.');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!window.confirm('Are you sure you want to cancel this haircut appointment?')) {
      return;
    }

    setCancellingId(appointmentId);
    try {
      await api.post(`/appointments/${appointmentId}/cancel`, {
        reason: 'Cancelled by customer via portal',
      });
      await fetchAppointments();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel appointment');
    } finally {
      setCancellingId(null);
    }
  };

  const handleQuickSwitch = async (email: string) => {
    try {
      await login(email, 'chairly123');
      window.location.reload();
    } catch (err: any) {
      alert('Quick switch failed: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-chairly-bg flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-chairly-border sticky top-0 z-30 shadow-2xs safe-area-pt">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-chairly-terracotta-500 text-white flex items-center justify-center font-bold text-lg shadow-2xs">
                C
              </div>
              <div>
                <span className="text-base sm:text-lg font-bold text-chairly-dark tracking-tight leading-tight block">
                  Chairly
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Customer Portal
                </span>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 ml-6 border-l border-chairly-border pl-6">
              <button
                onClick={() => setActiveTab('shops')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'shops'
                    ? 'bg-chairly-terracotta-50 text-chairly-terracotta-600'
                    : 'text-chairly-muted hover:text-chairly-dark hover:bg-chairly-panel'
                }`}
              >
                Browse Barbershops
              </button>
              <button
                onClick={() => setActiveTab('appointments')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'appointments'
                    ? 'bg-chairly-terracotta-50 text-chairly-terracotta-600'
                    : 'text-chairly-muted hover:text-chairly-dark hover:bg-chairly-panel'
                }`}
              >
                My Bookings
                {appointments.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-chairly-terracotta-500 text-white font-bold">
                    {appointments.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'profile'
                    ? 'bg-chairly-terracotta-50 text-chairly-terracotta-600'
                    : 'text-chairly-muted hover:text-chairly-dark hover:bg-chairly-panel'
                }`}
              >
                My Profile
              </button>
            </nav>
          </div>

          {/* Quick Demo Switcher & Profile Header Controls */}
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-1 bg-chairly-panel px-2.5 py-1 rounded-xl border border-chairly-border text-xs">
              <span className="text-chairly-muted font-medium mr-1">Switch:</span>
              <button
                onClick={() => handleQuickSwitch('owner@chopchop.uz')}
                className="px-2 py-0.5 rounded-md font-semibold text-chairly-dark hover:bg-white transition-all"
                title="Log in as Barbershop Admin"
              >
                💈 Shop Admin
              </button>
              <button
                onClick={() => handleQuickSwitch('admin@chairly.app')}
                className="px-2 py-0.5 rounded-md font-semibold text-chairly-terracotta-600 hover:bg-white transition-all"
                title="Log in as Website Owner"
              >
                👑 Owner
              </button>
            </div>

            <button
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-chairly-panel transition-colors"
              title="Edit Profile"
            >
              <div className="w-8 h-8 rounded-full bg-chairly-terracotta-100 text-chairly-terracotta-700 font-bold text-xs flex items-center justify-center border border-chairly-terracotta-200">
                {user?.firstName?.[0] || 'C'}
                {user?.lastName?.[0] || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-chairly-dark leading-tight">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[10px] text-chairly-muted leading-tight">{user?.email}</p>
              </div>
            </button>

            <button
              onClick={logout}
              title="Log Out"
              className="p-2 rounded-xl text-chairly-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Segmented Control (Visible on phone/tablet) */}
        <div className="md:hidden border-t border-chairly-border bg-white px-2 py-1.5 flex items-center justify-around">
          <button
            onClick={() => setActiveTab('shops')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold flex-1 transition-all min-h-[40px] ${
              activeTab === 'shops'
                ? 'bg-chairly-terracotta-50 text-chairly-terracotta-600 shadow-2xs'
                : 'text-chairly-muted'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Barbershops</span>
          </button>

          <button
            onClick={() => setActiveTab('appointments')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold flex-1 transition-all min-h-[40px] ${
              activeTab === 'appointments'
                ? 'bg-chairly-terracotta-50 text-chairly-terracotta-600 shadow-2xs'
                : 'text-chairly-muted'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Bookings</span>
            {appointments.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-chairly-terracotta-500 text-white font-bold">
                {appointments.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold flex-1 transition-all min-h-[40px] ${
              activeTab === 'profile'
                ? 'bg-chairly-terracotta-50 text-chairly-terracotta-600 shadow-2xs'
                : 'text-chairly-muted'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 w-full pb-20">
        {activeTab === 'shops' && (
          <div>
            <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-chairly-dark">
                  Discover Barbershops in Tashkent
                </h1>
                <p className="text-xs sm:text-sm text-chairly-muted mt-0.5">
                  Choose a barbershop, pick your favorite barber, and reserve your haircut in seconds.
                </p>
              </div>
              <button
                onClick={fetchShops}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-chairly-border bg-white text-xs font-semibold text-chairly-dark hover:bg-chairly-panel transition-colors self-start sm:self-auto min-h-[38px]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>

            {isLoadingShops ? (
              <div className="py-20 flex flex-col items-center justify-center text-chairly-muted gap-3">
                <div className="w-8 h-8 border-3 border-chairly-terracotta-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium">Finding premier barbershops...</p>
              </div>
            ) : shops.length === 0 ? (
              <div className="bg-white p-8 sm:p-12 rounded-3xl border border-chairly-border text-center max-w-md mx-auto space-y-3">
                <Building2 className="w-12 h-12 text-chairly-muted mx-auto" />
                <h3 className="text-base font-bold text-chairly-dark">No Barbershops Available</h3>
                <p className="text-xs sm:text-sm text-chairly-muted">
                  There are currently no active barbershops listed. Please check back shortly or switch to the Owner account to register one!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {shops.map((shop) => (
                  <div
                    key={shop.id}
                    className="bg-white rounded-3xl border border-chairly-border overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col group"
                  >
                    {/* Cover Photo */}
                    <div className="h-44 sm:h-48 relative overflow-hidden bg-chairly-panel">
                      <img
                        src={
                          shop.coverImageUrl ||
                          'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80'
                        }
                        alt={shop.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4 text-white">
                        <h3 className="font-bold text-lg leading-tight drop-shadow-sm truncate">{shop.name}</h3>
                        <p className="text-xs text-white/90 flex items-center gap-1 mt-0.5 drop-shadow-sm truncate">
                          <MapPin className="w-3.5 h-3.5 text-chairly-terracotta-400 shrink-0" />
                          {shop.address}, {shop.city}
                        </p>
                      </div>
                    </div>

                    {/* Shop Body */}
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <p className="text-xs text-chairly-body line-clamp-2 mb-2 leading-relaxed">
                          {shop.description}
                        </p>
                        <p className="text-xs text-chairly-muted flex items-center gap-1 font-medium">
                          <Phone className="w-3 h-3 text-chairly-terracotta-500 shrink-0" />
                          {shop.phone}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-chairly-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-chairly-muted font-bold block">
                            Starting from
                          </span>
                          <span className="text-sm font-bold text-chairly-dark">
                            {shop.startingPrice ? `${shop.startingPrice.toLocaleString()} UZS` : '100,000 UZS'}
                          </span>
                        </div>

                        <button
                          onClick={() => openBookingModal(shop)}
                          className="w-full sm:w-auto px-4 py-2.5 bg-chairly-terracotta-500 hover:bg-chairly-terracotta-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs min-h-[44px]"
                        >
                          Book Appointment
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Appointments Tab */}
        {activeTab === 'appointments' && (
          <div>
            <div className="mb-6 sm:mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-chairly-dark">My Bookings</h1>
                <p className="text-xs sm:text-sm text-chairly-muted mt-0.5">
                  View appointment status, reference numbers, or cancel if your schedule changes.
                </p>
              </div>
              <button
                onClick={fetchAppointments}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-chairly-border bg-white text-xs font-semibold text-chairly-dark hover:bg-chairly-panel transition-colors min-h-[38px]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>

            {isLoadingAppointments ? (
              <div className="py-20 flex flex-col items-center justify-center text-chairly-muted gap-3">
                <div className="w-8 h-8 border-3 border-chairly-terracotta-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium">Loading your bookings...</p>
              </div>
            ) : appointments.length === 0 ? (
              <div className="bg-white p-8 sm:p-12 rounded-3xl border border-chairly-border text-center max-w-md mx-auto space-y-3">
                <Calendar className="w-12 h-12 text-chairly-muted mx-auto" />
                <h3 className="text-base font-bold text-chairly-dark">No Appointments Found</h3>
                <p className="text-xs sm:text-sm text-chairly-muted">
                  You don't have any bookings scheduled yet. Browse top barbershops and reserve your spot!
                </p>
                <button
                  onClick={() => setActiveTab('shops')}
                  className="px-5 py-2.5 bg-chairly-terracotta-500 hover:bg-chairly-terracotta-600 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
                >
                  Browse Barbershops
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appt) => {
                  const isUpcoming =
                    ['CONFIRMED', 'PENDING', 'CHECKED_IN', 'IN_PROGRESS'].includes(appt.status) &&
                    new Date(appt.startTime) >= new Date();

                  return (
                    <div
                      key={appt.id}
                      className="bg-white rounded-3xl border border-chairly-border p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-chairly-bg border border-chairly-border flex items-center justify-center shrink-0">
                          <Scissors className="w-5 h-5 text-chairly-terracotta-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-chairly-dark">{appt.serviceName}</h3>
                            <span
                              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                                appt.status === 'CONFIRMED'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : appt.status === 'PENDING'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : appt.status === 'COMPLETED'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {appt.status}
                            </span>
                          </div>

                          <p className="text-xs font-semibold text-chairly-terracotta-600 mt-1">
                            {appt.shopName}
                          </p>

                          <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-xs text-chairly-muted mt-2">
                            <span className="flex items-center gap-1 font-medium">
                              <Calendar className="w-3.5 h-3.5 text-chairly-terracotta-500 shrink-0" />
                              {format(new Date(appt.startTime), 'EEE, MMM d, yyyy')}
                            </span>
                            <span className="flex items-center gap-1 font-medium">
                              <Clock className="w-3.5 h-3.5 text-chairly-terracotta-500 shrink-0" />
                              {format(new Date(appt.startTime), 'HH:mm')} - {format(new Date(appt.endTime), 'HH:mm')}
                            </span>
                            <span className="flex items-center gap-1 font-medium">
                              <User className="w-3.5 h-3.5 text-chairly-terracotta-500 shrink-0" />
                              {appt.barberName}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right column: Price & Cancel */}
                      <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-chairly-border">
                        <div className="md:text-right">
                          <span className="text-[10px] uppercase font-bold text-chairly-muted block">Total</span>
                          <span className="text-sm font-bold text-chairly-dark">
                            {appt.servicePrice.toLocaleString()} {appt.currency}
                          </span>
                        </div>

                        {isUpcoming && (
                          <button
                            onClick={() => handleCancelAppointment(appt.id)}
                            disabled={cancellingId === appt.id}
                            className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors disabled:opacity-50 min-h-[40px]"
                          >
                            {cancellingId === appt.id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div>
            <Profile />
          </div>
        )}
      </main>

      {/* FULL RESPONSIVE BOOKING MODAL */}
      {selectedShop && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-chairly-border shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col animate-scale-up">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-chairly-bg border-b border-chairly-border flex items-center justify-between shrink-0">
              <div className="min-w-0 pr-3">
                <h3 className="text-base sm:text-lg font-bold text-chairly-dark truncate">{selectedShop.name}</h3>
                <p className="text-xs text-chairly-muted flex items-center gap-1 mt-0.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-chairly-terracotta-500 shrink-0" />
                  {selectedShop.address}, {selectedShop.city}
                </p>
              </div>
              <button
                onClick={() => setSelectedShop(null)}
                className="w-8 h-8 rounded-full bg-white border border-chairly-border flex items-center justify-center text-chairly-muted hover:text-chairly-dark shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
              {bookingSuccess ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-chairly-dark">Booking Confirmed!</h4>
                    <p className="text-xs sm:text-sm text-chairly-muted mt-1">
                      Your appointment has been reserved successfully in Tashkent.
                    </p>
                  </div>
                  <div className="bg-chairly-bg p-4 rounded-2xl border border-chairly-border max-w-sm mx-auto text-left text-xs space-y-1.5 font-mono">
                    <p>
                      <strong className="text-chairly-dark">Reference:</strong> {bookingSuccess.bookingReference}
                    </p>
                    <p>
                      <strong className="text-chairly-dark">Service:</strong> {bookingSuccess.serviceName}
                    </p>
                    <p>
                      <strong className="text-chairly-dark">Barber:</strong> {bookingSuccess.barberName}
                    </p>
                    <p>
                      <strong className="text-chairly-dark">Date & Time:</strong>{' '}
                      {format(new Date(bookingSuccess.startTime), 'MMM d, yyyy @ HH:mm')}
                    </p>
                    <p>
                      <strong className="text-chairly-dark">Total:</strong>{' '}
                      {bookingSuccess.servicePrice?.toLocaleString()} {bookingSuccess.currency}
                    </p>
                  </div>
                  <div className="pt-2 flex justify-center gap-3">
                    <button
                      onClick={() => {
                        setSelectedShop(null);
                        setActiveTab('appointments');
                      }}
                      className="px-6 py-2.5 bg-chairly-terracotta-500 text-white rounded-xl text-xs font-semibold hover:bg-chairly-terracotta-600 transition-colors shadow-sm min-h-[44px]"
                    >
                      View in My Bookings
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {bookingError && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{bookingError}</span>
                    </div>
                  )}

                  {/* 1. Choose Service */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-chairly-dark block mb-2">
                      1. Select Service
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {shopServices.map((svc) => (
                        <button
                          key={svc.id}
                          type="button"
                          onClick={() => setSelectedService(svc)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            selectedService?.id === svc.id
                              ? 'border-chairly-terracotta-500 bg-chairly-terracotta-50/50 ring-2 ring-chairly-terracotta-500/20'
                              : 'border-chairly-border bg-white hover:bg-chairly-panel'
                          }`}
                        >
                          <p className="text-xs sm:text-sm font-bold text-chairly-dark truncate">{svc.name}</p>
                          <div className="flex items-center justify-between text-xs mt-1">
                            <span className="text-chairly-terracotta-600 font-semibold">
                              {svc.price.toLocaleString()} UZS
                            </span>
                            <span className="text-chairly-muted">{svc.durationMinutes} min</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Choose Barber */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-chairly-dark block mb-2">
                      2. Select Barber
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedBarber(null)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          selectedBarber === null
                            ? 'border-chairly-terracotta-500 bg-chairly-terracotta-50/50 ring-2 ring-chairly-terracotta-500/20'
                            : 'border-chairly-border bg-white hover:bg-chairly-panel'
                        }`}
                      >
                        <p className="text-xs font-bold text-chairly-dark">Any Barber</p>
                        <p className="text-[10px] text-chairly-muted">Fastest slot</p>
                      </button>

                      {shopBarbers.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setSelectedBarber(b)}
                          className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                            selectedBarber?.id === b.id
                              ? 'border-chairly-terracotta-500 bg-chairly-terracotta-50/50 ring-2 ring-chairly-terracotta-500/20'
                              : 'border-chairly-border bg-white hover:bg-chairly-panel'
                          }`}
                        >
                          <div className="w-7 h-7 rounded-full bg-chairly-panel border border-chairly-border flex items-center justify-center font-bold text-[10px] text-chairly-dark shrink-0">
                            {b.name[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-chairly-dark truncate">{b.name}</p>
                            <p className="text-[10px] text-chairly-muted truncate">{b.specialty || 'Master'}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Choose Date */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-chairly-dark block mb-2">
                      3. Select Date
                    </label>
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                      {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                        const d = addDays(new Date(), offset);
                        const dStr = format(d, 'yyyy-MM-dd');
                        const isSelected = selectedDate === dStr;
                        return (
                          <button
                            key={dStr}
                            type="button"
                            onClick={() => setSelectedDate(dStr)}
                            className={`px-3 py-2 rounded-xl border text-center shrink-0 transition-all min-w-[60px] ${
                              isSelected
                                ? 'border-chairly-terracotta-500 bg-chairly-terracotta-500 text-white font-semibold shadow-xs'
                                : 'border-chairly-border bg-white text-chairly-dark hover:bg-chairly-panel'
                            }`}
                          >
                            <p className="text-[10px] uppercase">{format(d, 'EEE')}</p>
                            <p className="text-xs sm:text-sm font-bold">{format(d, 'd MMM')}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. Choose Time Slot (Responsive 3/4/6 column grid) */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-chairly-dark block">
                        4. Available Time Slots
                      </label>
                      {availableSlots.length > 0 && (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {availableSlots.length} available
                        </span>
                      )}
                    </div>
                    {isLoadingSlots ? (
                      <div className="py-6 flex justify-center items-center gap-2 text-xs text-chairly-muted">
                        <div className="w-4 h-4 border-2 border-chairly-terracotta-500 border-t-transparent rounded-full animate-spin" />
                        Calculating available slots...
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <p className="text-xs text-chairly-muted py-4 text-center bg-chairly-panel rounded-xl">
                        No available slots for this date. Please choose another date or barber.
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1">
                        {availableSlots.map((slot) => {
                          const isSelected =
                            selectedSlot?.isoString === slot.isoString ||
                            selectedSlot?.time === slot.time;
                          return (
                            <button
                              key={slot.isoString || slot.time}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border min-h-[42px] ${
                                isSelected
                                  ? 'bg-chairly-terracotta-500 text-white border-chairly-terracotta-600 shadow-xs ring-2 ring-chairly-terracotta-500/20'
                                  : 'bg-white text-chairly-dark border-chairly-border hover:bg-chairly-panel'
                              }`}
                            >
                              {slot.time}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Customer Notes */}
                  <div>
                    <label className="text-xs font-semibold text-chairly-muted uppercase tracking-wider block mb-1">
                      Notes for Barber (optional)
                    </label>
                    <input
                      type="text"
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      placeholder="e.g. Skin fade with beard trim"
                      className="w-full px-3 py-2 rounded-xl border border-chairly-border text-xs text-chairly-dark"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Modal Sticky Footer */}
            {!bookingSuccess && (
              <div className="p-4 bg-chairly-bg border-t border-chairly-border flex items-center justify-between shrink-0">
                <div>
                  <span className="text-[10px] text-chairly-muted uppercase font-bold block">Estimated Total</span>
                  <span className="text-sm font-bold text-chairly-dark">
                    {selectedService ? `${selectedService.price.toLocaleString()} UZS` : '—'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  disabled={!selectedSlot || isSubmittingBooking}
                  className="px-6 py-2.5 bg-chairly-terracotta-500 hover:bg-chairly-terracotta-600 disabled:opacity-40 text-white rounded-xl text-xs font-semibold shadow-xs transition-all min-h-[44px]"
                >
                  {isSubmittingBooking ? 'Reserving...' : 'Confirm Booking'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  Building2,
  Menu,
  X,
  Search,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { format, addDays } from 'date-fns';
import { Profile } from './Profile';
import { useTranslation } from '../i18n';
import { LanguageSelector } from '../i18n/LanguageSelector';
import { NotificationsBell } from '../components/NotificationsBell';
import { IosTimeWheel } from '../components/IosTimeWheel';
import { formatPhone } from '@chairly/shared';

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
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'shops' | 'appointments' | 'profile'>('shops');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
      setBookingError('Iltimos, xizmat, sana va bo‘sh vaqt oralig‘ini tanlang.');
      return;
    }

    // Guard: Prevent selecting past time
    const slotTimeStr = selectedSlot.isoString || selectedSlot.startTime || `${selectedDate}T${selectedSlot.time}:00`;
    const slotDate = new Date(slotTimeStr);
    if (slotDate.getTime() <= Date.now() || !selectedSlot.available) {
      setBookingError("Ushbu vaqt o'tib ketgan yoki band qilingan. Iltimos, faqat hozirgi vaqtdan keyingi ochiq vaqtni tanlang.");
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

  const filteredShops = shops.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q) || s.city.toLowerCase().includes(q);
  });

  const handleHomeClick = () => {
    setActiveTab('shops');
    setSelectedShop(null);
    setMobileDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-chairly-bg flex flex-col antialiased">
      {/* Sleek, Minimal, Razor-Sharp Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          {/* Brand */}
          <Link
            to="/"
            onClick={handleHomeClick}
            className="flex items-center gap-3 group focus:outline-hidden"
            title="CHAIRLY - Asosiy sahifa"
          >
            <span className="text-sm sm:text-base font-black tracking-[0.25em] uppercase text-black group-hover:text-zinc-600 transition-colors">
              CHAIRLY
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-zinc-100 text-zinc-600 border border-zinc-200">
              Mijoz
            </span>
          </Link>

          {/* Right Header Actions: Notification Bell + Hamburger Menu */}
          <div className="flex items-center gap-2">
            <NotificationsBell />
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="w-9 h-9 rounded-md bg-zinc-100 hover:bg-zinc-200 text-black flex items-center justify-center transition-colors"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Slide-Over Navigation Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative ml-auto w-5/6 max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 border-l border-zinc-200 animate-slide-left">
            {/* Header */}
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
              <Link
                to="/"
                onClick={handleHomeClick}
                className="font-black text-sm tracking-[0.25em] uppercase text-black hover:text-zinc-600 transition-colors"
                title="CHAIRLY - Asosiy sahifa"
              >
                CHAIRLY
              </Link>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="w-7 h-7 rounded-md bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User Info */}
            <div className="p-4 bg-zinc-50 border-b border-zinc-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-black text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {user?.firstName?.[0] || 'C'}
                  {user?.lastName?.[0] || ''}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-zinc-900 truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-[11px] text-zinc-500 font-mono truncate">
                    {user?.phone ? formatPhone(user.phone) : user?.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Options */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              <span className="text-[9px] uppercase tracking-[0.15em] text-zinc-400 font-bold px-2 py-1 block">
                Menu
              </span>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('shops');
                  setMobileDrawerOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-semibold transition-all text-left ${
                  activeTab === 'shops'
                    ? 'bg-black text-white shadow-2xs'
                    : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
                }`}
              >
                <Building2 className="w-4 h-4" />
                {t('customer.exploreTab')}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('appointments');
                  setMobileDrawerOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-semibold transition-all text-left ${
                  activeTab === 'appointments'
                    ? 'bg-black text-white shadow-2xs'
                    : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4" />
                  {t('customer.myBookingsTab')}
                </div>
                {appointments.length > 0 && (
                  <span className={`px-1.5 py-0.2 text-[10px] font-bold rounded-sm ${
                    activeTab === 'appointments' ? 'bg-white text-black' : 'bg-zinc-200 text-zinc-800'
                  }`}>
                    {appointments.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('profile');
                  setMobileDrawerOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-semibold transition-all text-left ${
                  activeTab === 'profile'
                    ? 'bg-black text-white shadow-2xs'
                    : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
                }`}
              >
                <User className="w-4 h-4" />
                {t('customer.profileTab')}
              </button>

              {/* Partner Application Link */}
              <div className="pt-3 mt-3 border-t border-zinc-200 space-y-1">
                <span className="text-[9px] uppercase tracking-[0.15em] text-zinc-400 font-bold px-2 py-1 block">
                  Biznes
                </span>
                <a
                  href="/apply"
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-bold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Scissors className="w-4 h-4 text-black" />
                    <span>{t('nav.applyBusiness')}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                </a>
              </div>
            </nav>

            {/* Language & Sign out Footer */}
            <div className="p-4 border-t border-zinc-200 bg-zinc-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Til / Язык</span>
                <LanguageSelector />
              </div>

              <button
                onClick={() => {
                  setMobileDrawerOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                {t('nav.logout')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full pb-16">
        {/* Crisp Segmented Tab Selector */}
        <div className="mb-6 flex justify-center sm:justify-start">
          <div className="inline-flex p-1 bg-zinc-100 border border-zinc-200 rounded-md gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('shops')}
              className={`px-4 py-1.5 text-xs font-bold rounded-sm transition-all ${
                activeTab === 'shops'
                  ? 'bg-black text-white shadow-2xs'
                  : 'text-zinc-600 hover:text-black'
              }`}
            >
              {t('customer.exploreTab')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('appointments')}
              className={`px-4 py-1.5 text-xs font-bold rounded-sm transition-all flex items-center gap-1.5 ${
                activeTab === 'appointments'
                  ? 'bg-black text-white shadow-2xs'
                  : 'text-zinc-600 hover:text-black'
              }`}
            >
              {t('customer.myBookingsTab')}
              {appointments.length > 0 && (
                <span className={`px-1.5 py-0.2 text-[10px] font-bold rounded-xs ${
                  activeTab === 'appointments' ? 'bg-zinc-800 text-white' : 'bg-zinc-200 text-zinc-800'
                }`}>
                  {appointments.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-1.5 text-xs font-bold rounded-sm transition-all ${
                activeTab === 'profile'
                  ? 'bg-black text-white shadow-2xs'
                  : 'text-zinc-600 hover:text-black'
              }`}
            >
              {t('customer.profileTab')}
            </button>
          </div>
        </div>

        {/* 1. SHOPS VIEW */}
        {activeTab === 'shops' && (
          <div className="space-y-6 sm:space-y-8">
            {/* Minimal Editorial Hero */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-zinc-200">
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900">
                  {t('portal.discoverTitle')}
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                  {t('portal.discoverSubtitle')}
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('customer.searchPlaceholder')}
                  className="w-full bg-white border border-zinc-200 rounded-md pl-9 pr-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:border-black transition-colors"
                />
              </div>
            </div>

            {/* Sleek Dark Barbershop Partner Invitation Banner */}
            <div className="bg-zinc-950 text-white border border-zinc-800 rounded-lg p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-[0.2em] text-zinc-400 font-semibold block">
                  Chairly Partner Network
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {t('portal.partnerBannerTitle')}
                </h3>
                <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
                  {t('portal.partnerBannerDesc')}
                </p>
              </div>
              <a
                href="/apply"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-zinc-200 text-black text-xs font-bold rounded-md transition-colors shrink-0 self-start sm:self-auto shadow-2xs"
              >
                {t('portal.applyPartnerButton')}
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Shop Cards Grid */}
            {isLoadingShops ? (
              <div className="py-20 flex flex-col items-center justify-center text-zinc-400 gap-3">
                <div className="w-7 h-7 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <p className="text-xs uppercase tracking-wider font-semibold">{t('portal.loadingShops')}</p>
              </div>
            ) : filteredShops.length === 0 ? (
              <div className="bg-white p-8 sm:p-12 rounded-lg border border-zinc-200 text-center max-w-md mx-auto space-y-4">
                <Building2 className="w-10 h-10 text-zinc-400 mx-auto" />
                <h3 className="text-base font-bold text-zinc-900">{t('portal.noShopsTitle')}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  {t('portal.noShopsDesc')}
                </p>
                <div className="pt-2">
                  <a
                    href="/apply"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-black hover:bg-zinc-800 text-white rounded-md text-xs font-semibold transition-colors"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    {t('auth.applyButton')}
                  </a>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredShops.map((shop) => (
                  <div
                    key={shop.id}
                    className="bg-white rounded-lg border border-zinc-200 hover:border-black transition-all overflow-hidden flex flex-col group shadow-xs hover:shadow-md"
                  >
                    {/* Cover Photo */}
                    <div className="h-48 sm:h-52 relative overflow-hidden bg-zinc-100">
                      <img
                        src={
                          shop.coverImageUrl ||
                          'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80'
                        }
                        alt={shop.name}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                      
                      {/* Location Badge */}
                      <div className="absolute top-3 left-3">
                        <span className="text-[9px] uppercase tracking-wider font-bold bg-black/80 text-white px-2 py-0.5 rounded-sm backdrop-blur-xs">
                          {shop.city || 'Tashkent'}
                        </span>
                      </div>

                      <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
                        <h3 className="font-bold text-base sm:text-lg leading-tight truncate">{shop.name}</h3>
                        <p className="text-xs text-zinc-300 flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                          {shop.address}
                        </p>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                          {shop.description || 'Professional barbershop services in Tashkent.'}
                        </p>
                        {shop.phone && (
                          <p className="text-[11px] text-zinc-500 flex items-center gap-1 font-mono mt-2">
                            <Phone className="w-3 h-3 text-zinc-400 shrink-0" />
                            {shop.phone}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-3">
                        <div>
                          <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold block">
                            {t('customer.startingFrom')}
                          </span>
                          <span className="text-sm font-black text-zinc-900">
                            {shop.startingPrice ? `${shop.startingPrice.toLocaleString()} UZS` : '50,000 UZS'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => openBookingModal(shop)}
                          className="px-4 py-2 bg-black hover:bg-zinc-800 text-white rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                        >
                          {t('customer.bookAppointment')}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. APPOINTMENTS VIEW */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900">
                  {t('customer.myBookingsTab')}
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
                  Qabul holati va bron ma'lumotlari
                </p>
              </div>
              <button
                type="button"
                onClick={fetchAppointments}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-200 bg-white text-xs font-semibold text-zinc-900 hover:bg-zinc-50 transition-colors shadow-2xs"
              >
                <RefreshCw className="w-3 h-3 text-zinc-500" />
                {t('common.refresh')}
              </button>
            </div>

            {isLoadingAppointments ? (
              <div className="py-20 flex flex-col items-center justify-center text-zinc-400 gap-3">
                <div className="w-7 h-7 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <p className="text-xs uppercase tracking-wider font-semibold">{t('common.loading')}</p>
              </div>
            ) : appointments.length === 0 ? (
              <div className="bg-white p-8 sm:p-12 rounded-lg border border-zinc-200 text-center max-w-md mx-auto space-y-4">
                <Calendar className="w-10 h-10 text-zinc-400 mx-auto" />
                <h3 className="text-base font-bold text-zinc-900">{t('customer.noBookings')}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Sizda hali bron qilingan qabullar mavjud emas. Sara sartaroshxonalarni ko'rib chiqing va yoziling.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('shops')}
                  className="px-4 py-2 bg-black hover:bg-zinc-800 text-white rounded-md text-xs font-bold transition-colors shadow-xs"
                >
                  {t('customer.exploreTab')}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((appt) => {
                  const isUpcoming =
                    ['CONFIRMED', 'PENDING', 'CHECKED_IN', 'IN_PROGRESS'].includes(appt.status) &&
                    new Date(appt.startTime) >= new Date();

                  return (
                    <div
                      key={appt.id}
                      className="bg-white rounded-lg border border-zinc-200 p-4 sm:p-5 shadow-xs hover:border-zinc-400 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-xs font-mono font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-sm">
                            {appt.bookingReference}
                          </span>
                          <h3 className="text-sm sm:text-base font-bold text-zinc-900">{appt.serviceName}</h3>
                          <span
                            className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-sm border ${
                              appt.status === 'CONFIRMED'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : appt.status === 'PENDING'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : appt.status === 'COMPLETED'
                                ? 'bg-zinc-100 text-zinc-700 border-zinc-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                          >
                            {appt.status}
                          </span>
                        </div>

                        <p className="text-xs font-bold text-black">
                          {appt.shopName}
                        </p>

                        <div className="flex items-center gap-4 flex-wrap text-xs text-zinc-500">
                          <span className="flex items-center gap-1 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                            {format(new Date(appt.startTime), 'EEE, d MMM yyyy')}
                          </span>
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="w-3.5 h-3.5 text-zinc-400" />
                            {format(new Date(appt.startTime), 'HH:mm')} - {format(new Date(appt.endTime), 'HH:mm')}
                          </span>
                          <span className="flex items-center gap-1 font-medium">
                            <User className="w-3.5 h-3.5 text-zinc-400" />
                            {appt.barberName}
                          </span>
                        </div>
                      </div>

                      {/* Right column: Price & Cancel */}
                      <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-zinc-100">
                        <div className="md:text-right">
                          <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold block">Jami</span>
                          <span className="text-sm font-black text-zinc-900">
                            {appt.servicePrice.toLocaleString()} {appt.currency}
                          </span>
                        </div>

                        {isUpcoming && (
                          <button
                            type="button"
                            onClick={() => handleCancelAppointment(appt.id)}
                            disabled={cancellingId === appt.id}
                            className="px-3 py-1.5 rounded-md border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            {cancellingId === appt.id ? 'Bekor qilinmoqda...' : t('customer.cancelBooking')}
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

        {/* 3. PROFILE VIEW */}
        {activeTab === 'profile' && (
          <div>
            <Profile />
          </div>
        )}
      </main>

      {/* RAZOR-SHARP MODERN BOOKING MODAL */}
      {selectedShop && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-xl w-full border border-zinc-200 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-scale-up">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between shrink-0">
              <div className="min-w-0 pr-3">
                <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-zinc-500 block">
                  Qabulga yozilish
                </span>
                <h3 className="text-base sm:text-lg font-bold text-zinc-900 truncate">{selectedShop.name}</h3>
                <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5 truncate">
                  <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                  {selectedShop.address}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedShop(null)}
                className="w-8 h-8 rounded-md bg-white border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-black shrink-0 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
              {bookingSuccess ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-2xs">
                    <CheckCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-zinc-900">{t('customer.bookingSuccess')}</h4>
                    <p className="text-xs text-zinc-500 mt-1">
                      Sizning qabulingiz muvaffaqiyatli band qilindi.
                    </p>
                  </div>
                  <div className="bg-zinc-50 p-4 rounded-md border border-zinc-200 max-w-sm mx-auto text-left text-xs space-y-1.5 font-mono">
                    <p>
                      <strong className="text-zinc-900 font-sans">Raqam:</strong> {bookingSuccess.bookingReference}
                    </p>
                    <p>
                      <strong className="text-zinc-900 font-sans">Xizmat:</strong> {bookingSuccess.serviceName}
                    </p>
                    <p>
                      <strong className="text-zinc-900 font-sans">Sana:</strong> {format(new Date(bookingSuccess.startTime), 'd MMM yyyy, HH:mm')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedShop(null);
                      setActiveTab('appointments');
                    }}
                    className="px-5 py-2.5 bg-black hover:bg-zinc-800 text-white rounded-md text-xs font-bold transition-colors shadow-2xs"
                  >
                    Buyurtmalarni ko'rish
                  </button>
                </div>
              ) : (
                <>
                  {bookingError && (
                    <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{bookingError}</span>
                    </div>
                  )}

                  {/* 1. Xizmat turi */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-2">
                      1. {t('customer.selectService')}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-0.5">
                      {shopServices.map((service) => {
                        const isSelected = selectedService?.id === service.id;
                        return (
                          <button
                            key={service.id}
                            type="button"
                            onClick={() => setSelectedService(service)}
                            className={`p-3 rounded-md border text-left transition-all flex flex-col justify-between ${
                              isSelected
                                ? 'border-black bg-zinc-900 text-white shadow-xs'
                                : 'border-zinc-200 bg-white text-zinc-900 hover:border-zinc-400'
                            }`}
                          >
                            <span className="text-xs font-bold leading-tight">{service.name}</span>
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-100/20 text-[11px]">
                              <span className={isSelected ? 'text-zinc-300' : 'text-zinc-500'}>
                                {service.durationMinutes} min
                              </span>
                              <span className="font-bold">
                                {service.price.toLocaleString()} UZS
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Usta tanlash */}
                  {shopBarbers.length > 0 && (
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-2">
                        2. {t('customer.selectBarber')}
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedBarber(null)}
                          className={`p-2.5 rounded-md border text-xs font-semibold text-center transition-all ${
                            selectedBarber === null
                              ? 'border-black bg-black text-white'
                              : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400'
                          }`}
                        >
                          {t('customer.anyBarber')}
                        </button>
                        {shopBarbers.map((barber) => {
                          const isSelected = selectedBarber?.id === barber.id;
                          return (
                            <button
                              key={barber.id}
                              type="button"
                              onClick={() => setSelectedBarber(barber)}
                              className={`p-2.5 rounded-md border text-xs font-semibold text-center transition-all truncate ${
                                isSelected
                                  ? 'border-black bg-black text-white'
                                  : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400'
                              }`}
                            >
                              {barber.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 3. Sana tanlash */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-2">
                      3. {t('customer.selectDate')}
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                      {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                        const d = addDays(new Date(), offset);
                        const dateStr = format(d, 'yyyy-MM-dd');
                        const isSelected = selectedDate === dateStr;
                        return (
                          <button
                            key={dateStr}
                            type="button"
                            onClick={() => setSelectedDate(dateStr)}
                            className={`py-2 px-1 rounded-md border text-center transition-all ${
                              isSelected
                                ? 'border-black bg-black text-white shadow-xs font-bold'
                                : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400'
                            }`}
                          >
                            <p className="text-[9px] uppercase tracking-wider">{format(d, 'EEE')}</p>
                            <p className="text-xs font-bold mt-0.5">{format(d, 'd MMM')}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. Vaqt oralig'i (iPhone Wheel Picker) */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                        4. {t('customer.selectTime')}
                      </label>
                      {availableSlots.length > 0 && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-sm border border-zinc-200">
                          iPhone g‘ildiragi bilan tanlang
                        </span>
                      )}
                    </div>

                    <IosTimeWheel
                      slots={availableSlots}
                      selectedSlot={selectedSlot}
                      onSelectSlot={(slot) => {
                        setSelectedSlot(slot);
                        setBookingError(null);
                      }}
                      selectedDate={selectedDate}
                      isLoading={isLoadingSlots}
                    />
                  </div>

                  {/* Qo'shimcha izoh */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                      {t('customer.notesLabel')}
                    </label>
                    <input
                      type="text"
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      placeholder={t('customer.notesPlaceholder')}
                      className="w-full px-3 py-2 rounded-md border border-zinc-200 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:border-black transition-colors"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            {!bookingSuccess && (
              <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between shrink-0">
                <div>
                  <span className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold block">
                    {t('customer.price')}
                  </span>
                  <span className="text-sm font-black text-zinc-900">
                    {selectedService ? `${selectedService.price.toLocaleString()} UZS` : '—'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  disabled={!selectedSlot || isSubmittingBooking}
                  className="px-5 py-2 bg-black hover:bg-zinc-800 disabled:opacity-40 text-white rounded-md text-xs font-bold shadow-xs transition-all"
                >
                  {isSubmittingBooking ? 'Band qilinmoqda...' : t('customer.confirmBooking')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  List,
  Search,
  Filter,
  Plus,
  Clock,
  User,
  Scissors,
  CheckCircle,
  XCircle,
  ArrowRight,
  RefreshCw,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { ALLOWED_STATUS_TRANSITIONS, AppointmentStatus } from '@chairly/shared';

interface Appointment {
  id: string;
  bookingReference: string;
  shopId: string;
  barberId: string;
  barberName: string;
  barberAvatarUrl?: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  bufferMinutes: number;
  currency: string;
  status: AppointmentStatus;
  startTime: string;
  endTime: string;
  bufferEndTime: string;
  notes?: string;
  createdAt: string;
}

export const Appointments: React.FC = () => {
  const { currentShopId } = useAuth();

  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [barbers, setBarbers] = useState<Array<{ id: string; name: string }>>([]);
  const [services, setServices] = useState<Array<{ id: string; name: string; price: number; durationMinutes: number }>>([]);
  const [selectedBarberId, setSelectedBarberId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<string>('');
  const [statusNote, setStatusNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reschedule state
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [newRescheduleTime, setNewRescheduleTime] = useState('');

  // Cancel state
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // New manual booking state
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [newBookingServiceId, setNewBookingServiceId] = useState('');
  const [newBookingBarberId, setNewBookingBarberId] = useState('');
  const [newBookingDate, setNewBookingDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newBookingTime, setNewBookingTime] = useState('14:00');
  const [newBookingCustomerName, setNewBookingCustomerName] = useState('');
  const [newBookingCustomerPhone, setNewBookingCustomerPhone] = useState('');
  const [newBookingCustomerEmail, setNewBookingCustomerEmail] = useState('');

  const fetchAppointments = async () => {
    if (!currentShopId) return;
    setIsLoading(true);
    try {
      let queryUrl = `/appointments/shop/${currentShopId}?`;
      if (viewMode === 'calendar') {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        queryUrl += `date=${dateStr}&`;
      }
      if (selectedBarberId !== 'all') {
        queryUrl += `barberId=${selectedBarberId}&`;
      }
      if (selectedStatus !== 'all') {
        queryUrl += `status=${selectedStatus}&`;
      }
      if (searchQuery) {
        queryUrl += `search=${encodeURIComponent(searchQuery)}&`;
      }

      const res = await api.get<Appointment[]>(queryUrl);
      setAppointments(res);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMeta = async () => {
    if (!currentShopId) return;
    try {
      const [barbersRes, servicesRes] = await Promise.all([
        api.get<Array<{ id: string; name: string }>>(`/barbers/shop/${currentShopId}`),
        api.get<Array<{ id: string; name: string; price: number; durationMinutes: number }>>(`/services/shop/${currentShopId}`),
      ]);
      setBarbers(barbersRes);
      setServices(servicesRes);
      if (servicesRes.length > 0) setNewBookingServiceId(servicesRes[0].id);
      if (barbersRes.length > 0) setNewBookingBarberId(barbersRes[0].id);
    } catch (err) {
      console.error('Error loading metadata:', err);
    }
  };

  useEffect(() => {
    fetchMeta();
  }, [currentShopId]);

  useEffect(() => {
    fetchAppointments();
  }, [currentShopId, selectedDate, selectedBarberId, selectedStatus, searchQuery, viewMode]);

  const handleUpdateStatus = async () => {
    if (!selectedAppt || !targetStatus || !currentShopId) return;
    setIsSubmitting(true);
    try {
      await api.patch(`/appointments/shop/${currentShopId}/${selectedAppt.id}/status`, {
        status: targetStatus,
        notes: statusNote || undefined,
      });
      setIsStatusModalOpen(false);
      setIsDetailsOpen(false);
      fetchAppointments();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppt) return;
    setIsSubmitting(true);
    try {
      await api.post(`/appointments/${selectedAppt.id}/cancel`, {
        reason: cancelReason || 'Cancelled by staff',
      });
      setIsCancelOpen(false);
      setIsDetailsOpen(false);
      fetchAppointments();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReschedule = async () => {
    if (!selectedAppt || !newRescheduleTime) return;
    setIsSubmitting(true);
    try {
      const newIso = new Date(newRescheduleTime).toISOString();
      await api.post(`/appointments/${selectedAppt.id}/reschedule`, {
        newStartTime: newIso,
      });
      setIsRescheduleOpen(false);
      setIsDetailsOpen(false);
      fetchAppointments();
    } catch (err: any) {
      alert(err.message || 'Failed to reschedule. Selected slot may overlap with an existing booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShopId) return;
    setIsSubmitting(true);

    try {
      const startDateTime = new Date(`${newBookingDate}T${newBookingTime}:00`).toISOString();
      await api.post('/appointments', {
        shopId: currentShopId,
        serviceId: newBookingServiceId,
        barberId: newBookingBarberId,
        startTime: startDateTime,
        notes: `Manual booking for ${newBookingCustomerName} (${newBookingCustomerPhone})`,
      });

      setIsNewBookingOpen(false);
      fetchAppointments();
      alert('Booking created successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to create booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered allowed transitions for currently selected appointment
  const currentTransitions = selectedAppt
    ? ALLOWED_STATUS_TRANSITIONS[selectedAppt.status] || []
    : [];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-chairly-dark">Appointments</h2>
          <p className="text-sm text-chairly-muted mt-0.5">
            Manage daily schedule, customer bookings, and appointment statuses
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-chairly-panel p-1 rounded-xl border border-chairly-border">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'calendar'
                  ? 'bg-white text-chairly-dark shadow-2xs'
                  : 'text-chairly-muted hover:text-chairly-dark'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              Day View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-chairly-dark shadow-2xs'
                  : 'text-chairly-muted hover:text-chairly-dark'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              List View
            </button>
          </div>

          <button
            onClick={() => setIsNewBookingOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-chairly-terracotta-500 hover:bg-chairly-terracotta-600 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Booking
          </button>
        </div>
      </div>

      {/* Filter and Date Bar */}
      <div className="bg-white p-4 rounded-2xl border border-chairly-border shadow-2xs flex flex-wrap items-center justify-between gap-4">
        {/* Date Selector */}
        {viewMode === 'calendar' ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDate(subDays(selectedDate, 1))}
              className="p-1.5 rounded-lg border border-chairly-border hover:bg-chairly-panel text-chairly-muted hover:text-chairly-dark transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-sm text-chairly-dark min-w-44 text-center">
              {format(selectedDate, 'EEEE, MMM d, yyyy')}
            </span>
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              className="p-1.5 rounded-lg border border-chairly-border hover:bg-chairly-panel text-chairly-muted hover:text-chairly-dark transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedDate(new Date())}
              className="ml-2 px-2.5 py-1 text-xs font-semibold text-chairly-terracotta-600 hover:bg-chairly-terracotta-50 rounded-lg transition-colors"
            >
              Today
            </button>
          </div>
        ) : (
          <div className="relative flex-1 max-w-xs">
            <input
              type="text"
              placeholder="Search reference or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-chairly-bg/50 border border-chairly-border rounded-xl pl-9 pr-3 py-2 text-xs text-chairly-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-chairly-terracotta-500/20 focus:border-chairly-terracotta-500"
            />
            <Search className="w-3.5 h-3.5 text-chairly-muted absolute left-3 top-3" />
          </div>
        )}

        {/* Dropdown Filters */}
        <div className="flex items-center gap-3">
          {/* Barber Filter */}
          <select
            value={selectedBarberId}
            onChange={(e) => setSelectedBarberId(e.target.value)}
            className="bg-white border border-chairly-border rounded-xl px-3 py-2 text-xs font-medium text-chairly-dark focus:outline-none focus:ring-2 focus:ring-chairly-terracotta-500/20 focus:border-chairly-terracotta-500"
          >
            <option value="all">All Barbers</option>
            {barbers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-white border border-chairly-border rounded-xl px-3 py-2 text-xs font-medium text-chairly-dark focus:outline-none focus:ring-2 focus:ring-chairly-terracotta-500/20 focus:border-chairly-terracotta-500"
          >
            <option value="all">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CHECKED_IN">Checked In</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="NO_SHOW">No Show</option>
          </select>

          <button
            onClick={fetchAppointments}
            title="Refresh"
            className="p-2 border border-chairly-border rounded-xl hover:bg-chairly-panel text-chairly-muted hover:text-chairly-dark transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-chairly-border">
          <div className="w-8 h-8 border-3 border-chairly-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-chairly-muted">Loading appointments...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-chairly-border">
          <CalendarIcon className="w-12 h-12 text-chairly-subtle mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-bold text-chairly-dark mb-1">No appointments found</h3>
          <p className="text-sm text-chairly-muted mb-4 max-w-sm mx-auto">
            There are no appointments matching your current filters for this period.
          </p>
          <button
            onClick={() => setIsNewBookingOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-chairly-terracotta-500 text-white rounded-xl text-xs font-semibold hover:bg-chairly-terracotta-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Booking
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-chairly-border shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-chairly-bg/50 border-b border-chairly-border text-[11px] uppercase tracking-wider text-chairly-muted font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Schedule</th>
                  <th className="px-6 py-3.5">Ref</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Service</th>
                  <th className="px-6 py-3.5">Barber</th>
                  <th className="px-6 py-3.5">Price</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-chairly-border">
                {appointments.map((appt) => (
                  <tr
                    key={appt.id}
                    onClick={() => {
                      setSelectedAppt(appt);
                      setIsDetailsOpen(true);
                    }}
                    className="hover:bg-chairly-bg/40 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-chairly-dark">
                        {format(new Date(appt.startTime), 'HH:mm')} - {format(new Date(appt.endTime), 'HH:mm')}
                      </div>
                      <div className="text-[11px] text-chairly-muted">
                        {format(new Date(appt.startTime), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-bold text-chairly-terracotta-600">
                      {appt.bookingReference}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-chairly-dark">{appt.customerName}</div>
                      <div className="text-xs text-chairly-muted">{appt.customerPhone || appt.customerEmail}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-chairly-dark">{appt.serviceName}</div>
                      <div className="text-xs text-chairly-muted">{appt.serviceDuration} min</div>
                    </td>
                    <td className="px-6 py-4 text-chairly-dark font-medium">{appt.barberName}</td>
                    <td className="px-6 py-4 font-bold text-chairly-dark">
                      {appt.servicePrice.toLocaleString()} {appt.currency}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={appt.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAppt(appt);
                          setIsDetailsOpen(true);
                        }}
                        className="px-3 py-1 bg-chairly-panel hover:bg-chairly-border text-chairly-dark text-xs font-semibold rounded-lg transition-colors border border-chairly-border"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Appointment Details Modal */}
      {selectedAppt && (
        <Modal
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          title={`Booking ${selectedAppt.bookingReference}`}
        >
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex items-center justify-between p-4 bg-chairly-panel rounded-xl border border-chairly-border">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-chairly-muted">
                  Current Status
                </span>
                <div className="mt-1">
                  <StatusBadge status={selectedAppt.status} />
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-chairly-muted">
                  Total Price
                </span>
                <div className="text-lg font-bold text-chairly-dark mt-0.5">
                  {selectedAppt.servicePrice.toLocaleString()} {selectedAppt.currency}
                </div>
              </div>
            </div>

            {/* Core Details Grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3.5 bg-chairly-bg/50 rounded-xl border border-chairly-border">
                <span className="text-xs text-chairly-muted block">Customer</span>
                <span className="font-semibold text-chairly-dark mt-0.5 block">{selectedAppt.customerName}</span>
                <span className="text-xs text-chairly-muted block mt-1">{selectedAppt.customerPhone}</span>
                <span className="text-xs text-chairly-muted block">{selectedAppt.customerEmail}</span>
              </div>
              <div className="p-3.5 bg-chairly-bg/50 rounded-xl border border-chairly-border">
                <span className="text-xs text-chairly-muted block">Service & Barber</span>
                <span className="font-semibold text-chairly-dark mt-0.5 block">{selectedAppt.serviceName}</span>
                <span className="text-xs text-chairly-muted block mt-1">Barber: {selectedAppt.barberName}</span>
                <span className="text-xs text-chairly-muted block">Duration: {selectedAppt.serviceDuration} min (+{selectedAppt.bufferMinutes}m buffer)</span>
              </div>
              <div className="col-span-2 p-3.5 bg-chairly-bg/50 rounded-xl border border-chairly-border">
                <span className="text-xs text-chairly-muted block">Appointment Date & Time</span>
                <span className="font-semibold text-chairly-dark mt-0.5 block">
                  {format(new Date(selectedAppt.startTime), 'EEEE, MMMM d, yyyy')} from {format(new Date(selectedAppt.startTime), 'HH:mm')} to {format(new Date(selectedAppt.endTime), 'HH:mm')}
                </span>
                {selectedAppt.notes && (
                  <p className="text-xs text-chairly-muted mt-2 pt-2 border-t border-chairly-border italic">
                    "{selectedAppt.notes}"
                  </p>
                )}
              </div>
            </div>

            {/* Allowed Transitions / Actions */}
            <div className="border-t border-chairly-border pt-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-chairly-muted block mb-3">
                Update Appointment Status
              </span>

              {currentTransitions.length === 0 ? (
                <p className="text-xs text-chairly-muted italic">
                  This appointment is in final status ({selectedAppt.status}) and cannot be transitioned further.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {currentTransitions.map((status: any) => (
                    <button
                      key={status}
                      onClick={() => {
                        setTargetStatus(status);
                        setStatusNote('');
                        setIsStatusModalOpen(true);
                      }}
                      className="px-3.5 py-2 bg-chairly-panel hover:bg-chairly-border text-chairly-dark rounded-xl text-xs font-semibold border border-chairly-border transition-colors"
                    >
                      Mark as {status}
                    </button>
                  ))}
                </div>
              )}

              {/* Cancellation & Rescheduling Actions */}
              {(selectedAppt.status === 'CONFIRMED' || selectedAppt.status === 'PENDING') && (
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-chairly-border">
                  <button
                    onClick={() => {
                      setNewRescheduleTime(format(new Date(selectedAppt.startTime), "yyyy-MM-dd'T'HH:mm"));
                      setIsRescheduleOpen(true);
                    }}
                    className="flex-1 py-2 px-3 border border-chairly-border hover:bg-chairly-panel rounded-xl text-xs font-semibold text-chairly-dark text-center transition-colors"
                  >
                    Reschedule
                  </button>
                  <button
                    onClick={() => {
                      setCancelReason('');
                      setIsCancelOpen(true);
                    }}
                    className="flex-1 py-2 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 text-center transition-colors"
                  >
                    Cancel Booking
                  </button>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Status Confirmation Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={`Change Status to ${targetStatus}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-chairly-dark">
            Are you sure you want to transition booking <span className="font-mono font-bold">{selectedAppt?.bookingReference}</span> to <span className="font-semibold text-chairly-terracotta-600">{targetStatus}</span>?
          </p>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-chairly-muted block mb-1">
              Internal Note / Reason (Optional)
            </label>
            <input
              type="text"
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="e.g. Customer arrived 10 min early"
              className="w-full bg-chairly-bg/50 border border-chairly-border rounded-xl px-3.5 py-2 text-sm text-chairly-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-chairly-terracotta-500/20"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsStatusModalOpen(false)}
              className="px-4 py-2 border border-chairly-border rounded-xl text-xs font-semibold text-chairly-muted hover:text-chairly-dark transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateStatus}
              disabled={isSubmitting}
              className="px-4 py-2 bg-chairly-terracotta-500 hover:bg-chairly-terracotta-600 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Confirm Status Change'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        title="Reschedule Appointment"
      >
        <div className="space-y-4">
          <p className="text-sm text-chairly-dark">
            Select a new date and time for booking <span className="font-mono font-bold">{selectedAppt?.bookingReference}</span>.
          </p>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-chairly-muted block mb-1">
              New Start Time
            </label>
            <input
              type="datetime-local"
              value={newRescheduleTime}
              onChange={(e) => setNewRescheduleTime(e.target.value)}
              required
              className="w-full bg-chairly-bg/50 border border-chairly-border rounded-xl px-3.5 py-2 text-sm text-chairly-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-chairly-terracotta-500/20"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsRescheduleOpen(false)}
              className="px-4 py-2 border border-chairly-border rounded-xl text-xs font-semibold text-chairly-muted hover:text-chairly-dark transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleReschedule}
              disabled={isSubmitting}
              className="px-4 py-2 bg-chairly-terracotta-500 hover:bg-chairly-terracotta-600 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Validating...' : 'Confirm Reschedule'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        title="Cancel Appointment"
      >
        <div className="space-y-4">
          <p className="text-sm text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200">
            Warning: Cancelling this appointment will free up the barber's schedule slot for new customer bookings.
          </p>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-chairly-muted block mb-1">
              Cancellation Reason
            </label>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Customer requested cancellation by phone"
              className="w-full bg-chairly-bg/50 border border-chairly-border rounded-xl px-3.5 py-2 text-sm text-chairly-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-chairly-terracotta-500/20"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsCancelOpen(false)}
              className="px-4 py-2 border border-chairly-border rounded-xl text-xs font-semibold text-chairly-muted hover:text-chairly-dark transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleCancelAppointment}
              disabled={isSubmitting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Cancelling...' : 'Cancel Appointment'}
            </button>
          </div>
        </div>
      </Modal>

      {/* New Manual Booking Modal */}
      <Modal
        isOpen={isNewBookingOpen}
        onClose={() => setIsNewBookingOpen(false)}
        title="Create New Walk-in / Phone Booking"
      >
        <form onSubmit={handleCreateManualBooking} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-chairly-muted block mb-1">
              Service
            </label>
            <select
              value={newBookingServiceId}
              onChange={(e) => setNewBookingServiceId(e.target.value)}
              required
              className="w-full bg-chairly-bg/50 border border-chairly-border rounded-xl px-3.5 py-2 text-sm text-chairly-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-chairly-terracotta-500/20"
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.durationMinutes} min • {s.price.toLocaleString()} UZS)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-chairly-muted block mb-1">
              Barber
            </label>
            <select
              value={newBookingBarberId}
              onChange={(e) => setNewBookingBarberId(e.target.value)}
              required
              className="w-full bg-chairly-bg/50 border border-chairly-border rounded-xl px-3.5 py-2 text-sm text-chairly-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-chairly-terracotta-500/20"
            >
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-chairly-muted block mb-1">
                Date
              </label>
              <input
                type="date"
                value={newBookingDate}
                onChange={(e) => setNewBookingDate(e.target.value)}
                required
                className="w-full bg-chairly-bg/50 border border-chairly-border rounded-xl px-3.5 py-2 text-sm text-chairly-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-chairly-terracotta-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-chairly-muted block mb-1">
                Time
              </label>
              <input
                type="time"
                value={newBookingTime}
                onChange={(e) => setNewBookingTime(e.target.value)}
                required
                className="w-full bg-chairly-bg/50 border border-chairly-border rounded-xl px-3.5 py-2 text-sm text-chairly-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-chairly-terracotta-500/20"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-chairly-muted block mb-1">
              Customer Full Name
            </label>
            <input
              type="text"
              value={newBookingCustomerName}
              onChange={(e) => setNewBookingCustomerName(e.target.value)}
              required
              placeholder="e.g. Alisher Usmanov"
              className="w-full bg-chairly-bg/50 border border-chairly-border rounded-xl px-3.5 py-2 text-sm text-chairly-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-chairly-terracotta-500/20"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-chairly-muted block mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={newBookingCustomerPhone}
              onChange={(e) => setNewBookingCustomerPhone(e.target.value)}
              placeholder="+998 90 123 45 67"
              className="w-full bg-chairly-bg/50 border border-chairly-border rounded-xl px-3.5 py-2 text-sm text-chairly-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-chairly-terracotta-500/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-chairly-border">
            <button
              type="button"
              onClick={() => setIsNewBookingOpen(false)}
              className="px-4 py-2 border border-chairly-border rounded-xl text-xs font-semibold text-chairly-muted hover:text-chairly-dark transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-chairly-terracotta-500 hover:bg-chairly-terracotta-600 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Booking...' : 'Create Appointment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

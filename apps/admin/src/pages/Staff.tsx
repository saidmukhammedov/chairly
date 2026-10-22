import React, { useState, useEffect } from 'react';
import { Plus, UserCheck, Clock, Edit, Calendar, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Modal } from '../components/Modal';
import { DAYS_OF_WEEK } from '@chairly/shared';

interface BarberItem {
  id: string;
  shopId: string;
  userId?: string;
  name: string;
  bio?: string;
  avatarUrl?: string;
  specialty?: string;
  isActive: boolean;
  serviceIds: string[];
  schedules?: Array<{
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isWorking: boolean;
  }>;
}

export const Staff: React.FC = () => {
  const { currentShopId, currentMembership } = useAuth();
  const isOwnerOrManager = currentMembership?.role === 'OWNER' || currentMembership?.role === 'MANAGER';

  const [barbers, setBarbers] = useState<BarberItem[]>([]);
  const [services, setServices] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Profile Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<BarberItem | null>(null);
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Schedule Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleBarber, setScheduleBarber] = useState<BarberItem | null>(null);
  const [scheduleDraft, setScheduleDraft] = useState<
    Array<{ dayOfWeek: number; startTime: string; endTime: string; isWorking: boolean }>
  >([]);

  const fetchStaffData = async () => {
    if (!currentShopId) return;
    setIsLoading(true);
    try {
      const [bRes, sRes] = await Promise.all([
        api.get<BarberItem[]>(`/barbers/shop/${currentShopId}`),
        api.get<Array<{ id: string; name: string }>>(`/services/shop/${currentShopId}`),
      ]);
      setBarbers(bRes);
      setServices(sRes);
    } catch (err) {
      console.error('Failed to load staff:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, [currentShopId]);

  const openCreateModal = () => {
    setEditingBarber(null);
    setName('');
    setSpecialty('');
    setBio('');
    setAvatarUrl('');
    setIsActive(true);
    setSelectedServiceIds(services.map((s) => s.id));
    setIsProfileModalOpen(true);
  };

  const openEditModal = (barber: BarberItem) => {
    setEditingBarber(barber);
    setName(barber.name);
    setSpecialty(barber.specialty || '');
    setBio(barber.bio || '');
    setAvatarUrl(barber.avatarUrl || '');
    setIsActive(barber.isActive);
    setSelectedServiceIds(barber.serviceIds || []);
    setIsProfileModalOpen(true);
  };

  const openScheduleModal = (barber: BarberItem) => {
    setScheduleBarber(barber);
    const existing = barber.schedules || [];
    const draft = DAYS_OF_WEEK.map((d: any) => {
      const found = existing.find((s) => s.dayOfWeek === d.day);
      return {
        dayOfWeek: d.day,
        startTime: found?.startTime || '09:00',
        endTime: found?.endTime || '18:00',
        isWorking: found !== undefined ? found.isWorking : d.day !== 0,
      };
    });
    setScheduleDraft(draft);
    setIsScheduleModalOpen(true);
  };

  const handleServiceToggle = (serviceId: string) => {
    if (selectedServiceIds.includes(serviceId)) {
      setSelectedServiceIds(selectedServiceIds.filter((id) => id !== serviceId));
    } else {
      setSelectedServiceIds([...selectedServiceIds, serviceId]);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShopId) return;
    setIsSubmitting(true);

    try {
      const payload = {
        name,
        specialty: specialty || null,
        bio: bio || null,
        avatarUrl: avatarUrl || null,
        isActive,
        serviceIds: selectedServiceIds,
      };

      if (editingBarber) {
        await api.put(`/barbers/shop/${currentShopId}/${editingBarber.id}`, payload);
      } else {
        await api.post(`/barbers/shop/${currentShopId}`, payload);
      }

      setIsProfileModalOpen(false);
      fetchStaffData();
    } catch (err: any) {
      alert(err.message || 'Failed to save barber profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShopId || !scheduleBarber) return;
    setIsSubmitting(true);

    try {
      await api.put(`/barbers/shop/${currentShopId}/${scheduleBarber.id}/schedule`, {
        schedules: scheduleDraft,
      });
      setIsScheduleModalOpen(false);
      fetchStaffData();
    } catch (err: any) {
      alert(err.message || 'Failed to save schedules');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-chairly-dark">
            Staff & Barbers
          </h2>
          <p className="text-sm text-chairly-muted mt-0.5">
            Manage team members, bios, working hours, and bookable services
          </p>
        </div>
        {isOwnerOrManager && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-chairly-terracotta-500 hover:bg-chairly-terracotta-600 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add New Barber
          </button>
        )}
      </div>

      {/* Barbers Grid */}
      {isLoading ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-chairly-border">
          <div className="w-8 h-8 border-3 border-chairly-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-chairly-muted">Loading team members...</p>
        </div>
      ) : barbers.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-chairly-border">
          <UserCheck className="w-12 h-12 text-chairly-subtle mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-bold text-chairly-dark mb-1">No barbers found</h3>
          <p className="text-sm text-chairly-muted mb-4 max-w-sm mx-auto">
            Add barbers to your shop so customers can book appointments with them.
          </p>
          {isOwnerOrManager && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-chairly-terracotta-500 text-white rounded-xl text-xs font-semibold hover:bg-chairly-terracotta-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add First Barber
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {barbers.map((barber) => (
            <div
              key={barber.id}
              className="bg-white rounded-2xl border border-chairly-border shadow-2xs overflow-hidden flex flex-col justify-between hover:border-chairly-terracotta-500/40 transition-all"
            >
              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-chairly-panel border border-chairly-border overflow-hidden shrink-0 flex items-center justify-center font-bold text-base text-chairly-dark">
                    {barber.avatarUrl ? (
                      <img
                        src={barber.avatarUrl}
                        alt={barber.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      barber.name[0]
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-chairly-dark text-base truncate">{barber.name}</h3>
                    <p className="text-xs font-medium text-chairly-terracotta-600 truncate mt-0.5">
                      {barber.specialty || 'Professional Barber'}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full mt-2 ${
                        barber.isActive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          barber.isActive ? 'bg-emerald-500' : 'bg-neutral-400'
                        }`}
                      />
                      {barber.isActive ? 'Active & Bookable' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-chairly-muted line-clamp-3 mb-4">
                  {barber.bio || 'No biography entered yet.'}
                </p>

                <div className="p-3 bg-chairly-bg/50 rounded-xl border border-chairly-border text-xs">
                  <span className="text-chairly-muted block mb-1 font-semibold uppercase tracking-wider text-[10px]">
                    Qualified Services
                  </span>
                  <span className="font-semibold text-chairly-dark">
                    {barber.serviceIds.length} of {services.length} services assigned
                  </span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 bg-chairly-bg/30 border-t border-chairly-border flex items-center justify-between gap-2">
                <button
                  onClick={() => openScheduleModal(barber)}
                  className="flex-1 py-2 px-3 bg-white border border-chairly-border hover:bg-chairly-panel text-chairly-dark text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Clock className="w-3.5 h-3.5 text-chairly-muted" />
                  Schedule
                </button>
                {isOwnerOrManager && (
                  <button
                    onClick={() => openEditModal(barber)}
                    className="flex-1 py-2 px-3 bg-white border border-chairly-border hover:bg-chairly-panel text-chairly-dark text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Edit className="w-3.5 h-3.5 text-chairly-muted" />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Profile Modal */}
      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title={editingBarber ? 'Edit Barber Profile' : 'Add New Barber'}
      >
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-chairly-muted block mb-1">
              Barber Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Farrukh Karimov"
              className="w-full bg-chairly-bg/50 border border-chairly-border rounded-xl px-3.5 py-2 text-sm text-chairly-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-chairly-terracotta-500/20"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-chairly-muted block mb-1">
              Title / Specialty
            </label>
            <input
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="e.g. Master Barber & Beard Specialist"
              className="w-full bg-chairly-bg/50 border border-chairly-border rounded-xl px-3.5 py-2 text-sm text-chairly-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-chairly-terracotta-500/20"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-chairly-muted block mb-1">
              Photo URL (Optional)
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="w-full bg-chairly-bg/50 border border-chairly-border rounded-xl px-3.5 py-2 text-sm text-chairly-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-chairly-terracotta-500/20"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-chairly-muted block mb-1">
              Biography
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Craftsmanship background, certifications, experience..."
              className="w-full bg-chairly-bg/50 border border-chairly-border rounded-xl px-3.5 py-2 text-sm text-chairly-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-chairly-terracotta-500/20"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-chairly-muted block mb-2">
              Assigned Services
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-chairly-bg/50 rounded-xl border border-chairly-border">
              {services.map((service) => (
                <label
                  key={service.id}
                  className="flex items-center gap-2 p-2 bg-white rounded-lg border border-chairly-border text-xs font-medium text-chairly-dark cursor-pointer hover:bg-chairly-panel"
                >
                  <input
                    type="checkbox"
                    checked={selectedServiceIds.includes(service.id)}
                    onChange={() => handleServiceToggle(service.id)}
                    className="rounded text-chairly-terracotta-500 focus:ring-chairly-terracotta-500/20"
                  />
                  <span>{service.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isBarberActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded text-chairly-terracotta-500 focus:ring-chairly-terracotta-500/20"
            />
            <label htmlFor="isBarberActive" className="text-xs font-medium text-chairly-dark cursor-pointer">
              Barber is active and taking customer appointments
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-chairly-border">
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(false)}
              className="px-4 py-2 border border-chairly-border rounded-xl text-xs font-semibold text-chairly-muted hover:text-chairly-dark transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-chairly-terracotta-500 hover:bg-chairly-terracotta-600 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editingBarber ? 'Update Profile' : 'Create Barber'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Schedule Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title={`Weekly Schedule — ${scheduleBarber?.name}`}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleScheduleSubmit} className="space-y-4">
          <p className="text-xs text-chairly-muted">
            Configure working days and shift hours. Times outside these intervals are automatically marked as unavailable on the booking calendar.
          </p>

          <div className="divide-y divide-chairly-border border border-chairly-border rounded-2xl overflow-hidden">
            {scheduleDraft.map((item, index) => {
              const dayName = DAYS_OF_WEEK.find((d: any) => d.day === item.dayOfWeek)?.name || 'Day';
              return (
                <div
                  key={item.dayOfWeek}
                  className={`p-3.5 flex items-center justify-between gap-4 transition-colors ${
                    item.isWorking ? 'bg-white' : 'bg-chairly-bg/40 opacity-70'
                  }`}
                >
                  <div className="w-28 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`day-${item.dayOfWeek}`}
                      checked={item.isWorking}
                      onChange={(e) => {
                        const updated = [...scheduleDraft];
                        updated[index].isWorking = e.target.checked;
                        setScheduleDraft(updated);
                      }}
                      className="rounded text-chairly-terracotta-500 focus:ring-chairly-terracotta-500/20"
                    />
                    <label
                      htmlFor={`day-${item.dayOfWeek}`}
                      className="text-xs font-semibold text-chairly-dark cursor-pointer"
                    >
                      {dayName}
                    </label>
                  </div>

                  {item.isWorking ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={item.startTime}
                        onChange={(e) => {
                          const updated = [...scheduleDraft];
                          updated[index].startTime = e.target.value;
                          setScheduleDraft(updated);
                        }}
                        className="bg-chairly-bg/50 border border-chairly-border rounded-lg px-2.5 py-1 text-xs font-medium text-chairly-dark focus:bg-white"
                      />
                      <span className="text-xs text-chairly-muted">to</span>
                      <input
                        type="time"
                        value={item.endTime}
                        onChange={(e) => {
                          const updated = [...scheduleDraft];
                          updated[index].endTime = e.target.value;
                          setScheduleDraft(updated);
                        }}
                        className="bg-chairly-bg/50 border border-chairly-border rounded-lg px-2.5 py-1 text-xs font-medium text-chairly-dark focus:bg-white"
                      />
                    </div>
                  ) : (
                    <span className="text-xs font-medium text-chairly-muted italic">Day Off</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-chairly-border">
            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(false)}
              className="px-4 py-2 border border-chairly-border rounded-xl text-xs font-semibold text-chairly-muted hover:text-chairly-dark transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-chairly-terracotta-500 hover:bg-chairly-terracotta-600 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Schedule'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

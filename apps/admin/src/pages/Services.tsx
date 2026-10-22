import React, { useState, useEffect } from 'react';
import { Plus, Scissors, Clock, DollarSign, Edit, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Modal } from '../components/Modal';
import { SERVICE_CATEGORIES } from '@chairly/shared';

interface ServiceItem {
  id: string;
  shopId: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  durationMinutes: number;
  bufferMinutes: number;
  isActive: boolean;
  barberIds: string[];
}

export const Services: React.FC = () => {
  const { currentShopId, currentMembership } = useAuth();
  const isOwnerOrManager = currentMembership?.role === 'OWNER' || currentMembership?.role === 'MANAGER';

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [barbers, setBarbers] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('Haircut');
  const [price, setPrice] = useState<number>(150000);
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [bufferMinutes, setBufferMinutes] = useState<number>(5);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [selectedBarberIds, setSelectedBarberIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchServicesAndBarbers = async () => {
    if (!currentShopId) return;
    setIsLoading(true);
    try {
      const [sRes, bRes] = await Promise.all([
        api.get<ServiceItem[]>(`/services/shop/${currentShopId}`),
        api.get<Array<{ id: string; name: string }>>(`/barbers/shop/${currentShopId}`),
      ]);
      setServices(sRes);
      setBarbers(bRes);
    } catch (err) {
      console.error('Failed to load services:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServicesAndBarbers();
  }, [currentShopId]);

  const openCreateModal = () => {
    setEditingService(null);
    setName('');
    setDescription('');
    setCategory('Haircut');
    setPrice(150000);
    setDurationMinutes(45);
    setBufferMinutes(5);
    setIsActive(true);
    setSelectedBarberIds(barbers.map((b) => b.id)); // Default all barbers assigned
    setIsModalOpen(true);
  };

  const openEditModal = (service: ServiceItem) => {
    setEditingService(service);
    setName(service.name);
    setDescription(service.description || '');
    setCategory(service.category);
    setPrice(service.price);
    setDurationMinutes(service.durationMinutes);
    setBufferMinutes(service.bufferMinutes);
    setIsActive(service.isActive);
    setSelectedBarberIds(service.barberIds || []);
    setIsModalOpen(true);
  };

  const handleBarberToggle = (barberId: string) => {
    if (selectedBarberIds.includes(barberId)) {
      setSelectedBarberIds(selectedBarberIds.filter((id) => id !== barberId));
    } else {
      setSelectedBarberIds([...selectedBarberIds, barberId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShopId) return;
    setIsSubmitting(true);

    try {
      const payload = {
        name,
        description: description || null,
        category,
        price: Number(price),
        durationMinutes: Number(durationMinutes),
        bufferMinutes: Number(bufferMinutes),
        isActive,
        barberIds: selectedBarberIds,
      };

      if (editingService) {
        await api.put(`/services/shop/${currentShopId}/${editingService.id}`, payload);
      } else {
        await api.post(`/services/shop/${currentShopId}`, payload);
      }

      setIsModalOpen(false);
      fetchServicesAndBarbers();
    } catch (err: any) {
      alert(err.message || 'Failed to save service');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-chairly-dark">
            Services & Pricing
          </h2>
          <p className="text-sm text-chairly-muted mt-0.5">
            Configure menu options, durations, pricing, and eligible barbers
          </p>
        </div>
        {isOwnerOrManager && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-chairly-terracotta-500 hover:bg-chairly-terracotta-600 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add New Service
          </button>
        )}
      </div>

      {/* Services Grid */}
      {isLoading ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-chairly-border">
          <div className="w-8 h-8 border-3 border-chairly-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-chairly-muted">Loading services...</p>
        </div>
      ) : services.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-chairly-border">
          <Scissors className="w-12 h-12 text-chairly-subtle mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-bold text-chairly-dark mb-1">No services created yet</h3>
          <p className="text-sm text-chairly-muted mb-4 max-w-sm mx-auto">
            Add your barbershop's haircuts, beard trims, and grooming packages.
          </p>
          {isOwnerOrManager && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-chairly-terracotta-500 text-white rounded-xl text-xs font-semibold hover:bg-chairly-terracotta-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add First Service
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white p-6 rounded-2xl border border-chairly-border shadow-2xs flex flex-col justify-between hover:border-chairly-terracotta-500/40 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-chairly-panel text-chairly-dark border border-chairly-border">
                    {service.category}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      service.isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-neutral-100 text-neutral-500'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        service.isActive ? 'bg-emerald-500' : 'bg-neutral-400'
                      }`}
                    />
                    {service.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-chairly-dark tracking-tight">{service.name}</h3>
                <p className="text-xs text-chairly-muted mt-1 line-clamp-2">
                  {service.description || 'No description provided.'}
                </p>

                <div className="mt-4 pt-4 border-t border-chairly-border grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-chairly-muted block">Duration</span>
                    <span className="font-semibold text-chairly-dark">
                      {service.durationMinutes} min (+{service.bufferMinutes}m buffer)
                    </span>
                  </div>
                  <div>
                    <span className="text-chairly-muted block">Assigned Barbers</span>
                    <span className="font-semibold text-chairly-dark">
                      {service.barberIds?.length || 0} barbers
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-chairly-border flex items-center justify-between">
                <span className="text-xl font-bold text-chairly-dark">
                  {service.price.toLocaleString()} UZS
                </span>
                {isOwnerOrManager && (
                  <button
                    onClick={() => openEditModal(service)}
                    className="p-2 rounded-xl border border-chairly-border hover:bg-chairly-panel text-chairly-dark text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Service Modal (Create / Edit) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingService ? 'Edit Service' : 'Add New Service'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-chairly-muted block mb-1">
              Service Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Skin Fade Haircut"
              className="w-full bg-chairly-bg/50 border border-chairly-border rounded-xl px-3.5 py-2 text-sm text-chairly-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-chairly-terracotta-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-chairly-muted block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-chairly-bg/50 border border-chairly-border rounded-xl px-3.5 py-2 text-sm text-chairly-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-chairly-terracotta-500/20"
              >
                {SERVICE_CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-chairly-muted block mb-1">
                Price (UZS)
              </label>
              <input
                type="number"
                min="0"
                step="5000"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                required
                className="w-full bg-chairly-bg/50 border border-chairly-border rounded-xl px-3.5 py-2 text-sm text-chairly-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-chairly-terracotta-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-chairly-muted block mb-1">
                Duration (Minutes)
              </label>
              <input
                type="number"
                min="10"
                max="240"
                step="5"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                required
                className="w-full bg-chairly-bg/50 border border-chairly-border rounded-xl px-3.5 py-2 text-sm text-chairly-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-chairly-terracotta-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-chairly-muted block mb-1">
                Buffer Time (Minutes)
              </label>
              <input
                type="number"
                min="0"
                max="60"
                step="5"
                value={bufferMinutes}
                onChange={(e) => setBufferMinutes(Number(e.target.value))}
                required
                className="w-full bg-chairly-bg/50 border border-chairly-border rounded-xl px-3.5 py-2 text-sm text-chairly-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-chairly-terracotta-500/20"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-chairly-muted block mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what is included in this service..."
              className="w-full bg-chairly-bg/50 border border-chairly-border rounded-xl px-3.5 py-2 text-sm text-chairly-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-chairly-terracotta-500/20"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-chairly-muted block mb-2">
              Assigned Barbers
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-chairly-bg/50 rounded-xl border border-chairly-border">
              {barbers.map((barber) => (
                <label
                  key={barber.id}
                  className="flex items-center gap-2 p-2 bg-white rounded-lg border border-chairly-border text-xs font-medium text-chairly-dark cursor-pointer hover:bg-chairly-panel"
                >
                  <input
                    type="checkbox"
                    checked={selectedBarberIds.includes(barber.id)}
                    onChange={() => handleBarberToggle(barber.id)}
                    className="rounded text-chairly-terracotta-500 focus:ring-chairly-terracotta-500/20"
                  />
                  <span>{barber.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded text-chairly-terracotta-500 focus:ring-chairly-terracotta-500/20"
            />
            <label htmlFor="isActive" className="text-xs font-medium text-chairly-dark cursor-pointer">
              Service is active and available for booking
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-chairly-border">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-chairly-border rounded-xl text-xs font-semibold text-chairly-muted hover:text-chairly-dark transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-chairly-terracotta-500 hover:bg-chairly-terracotta-600 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editingService ? 'Update Service' : 'Create Service'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  ExternalLink,
  Edit3,
  Power,
  Users,
  Scissors,
  Calendar,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Phone,
  Clock,
  Sparkles,
  ShieldCheck,
  UserPlus,
  Trash2,
  Image as ImageIcon,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Modal } from '../components/Modal';

interface ManagedShop {
  id: string;
  name: string;
  slug: string;
  description: string;
  phone: string;
  address: string;
  city: string;
  logoUrl?: string;
  coverImageUrl?: string;
  currency: string;
  timezone: string;
  isActive: boolean;
  leadTimeMinutes: number;
  horizonDays: number;
  cancelDeadlineHours: number;
  createdAt: string;
  startingPrice: number;
  counts: {
    barbers: number;
    services: number;
    appointments: number;
    members: number;
  };
  admins: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    };
  }>;
}

const COVER_PRESETS = [
  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1200&q=80',
];

export const ShopManagement: React.FC = () => {
  const { user, switchShop } = useAuth();
  const [shops, setShops] = useState<ManagedShop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Create / Edit Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingShop, setEditingShop] = useState<ManagedShop | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    city: 'Tashkent',
    address: '',
    phone: '+998 ',
    description: '',
    logoUrl: '',
    coverImageUrl: COVER_PRESETS[0],
    isActive: true,
    adminEmail: '',
    adminFirstName: '',
    adminLastName: '',
    adminPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manage Admins Modal State
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [selectedShopForAdmins, setSelectedShopForAdmins] = useState<ManagedShop | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminFirstName, setNewAdminFirstName] = useState('');
  const [newAdminLastName, setNewAdminLastName] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'OWNER' | 'MANAGER' | 'BARBER'>('OWNER');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);

  // Customer Preview Modal State
  const [previewShop, setPreviewShop] = useState<ManagedShop | null>(null);

  const fetchShops = async () => {
    setIsLoading(true);
    try {
      const data = await api.get<ManagedShop[]>('/shops/manage/all');
      setShops(data);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load shops' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const handleOpenCreate = () => {
    setEditingShop(null);
    setFormData({
      name: '',
      slug: '',
      city: 'Tashkent',
      address: '',
      phone: '+998 ',
      description: '',
      logoUrl: '',
      coverImageUrl: COVER_PRESETS[0],
      isActive: true,
      adminEmail: '',
      adminFirstName: '',
      adminLastName: '',
      adminPassword: '',
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (shop: ManagedShop) => {
    setEditingShop(shop);
    setFormData({
      name: shop.name,
      slug: shop.slug,
      city: shop.city,
      address: shop.address,
      phone: shop.phone,
      description: shop.description,
      logoUrl: shop.logoUrl || '',
      coverImageUrl: shop.coverImageUrl || COVER_PRESETS[0],
      isActive: shop.isActive,
      adminEmail: '',
      adminFirstName: '',
      adminLastName: '',
      adminPassword: '',
    });
    setIsFormOpen(true);
  };

  const handleSaveShop = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      if (editingShop) {
        await api.put(`/shops/${editingShop.id}`, {
          name: formData.name,
          city: formData.city,
          address: formData.address,
          phone: formData.phone,
          description: formData.description,
          logoUrl: formData.logoUrl,
          coverImageUrl: formData.coverImageUrl,
          isActive: formData.isActive,
        });
        setFeedback({ type: 'success', message: `Barbershop "${formData.name}" updated successfully.` });
      } else {
        await api.post('/shops', formData);
        setFeedback({ type: 'success', message: `Barbershop "${formData.name}" created successfully!` });
      }

      setIsFormOpen(false);
      await fetchShops();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save shop' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (shop: ManagedShop) => {
    try {
      const newStatus = !shop.isActive;
      await api.patch(`/shops/${shop.id}/status`, { isActive: newStatus });
      setShops((prev) =>
        prev.map((s) => (s.id === shop.id ? { ...s, isActive: newStatus } : s))
      );
      setFeedback({
        type: 'success',
        message: `Shop "${shop.name}" status updated to ${newStatus ? 'Published' : 'Draft / Inactive'}.`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update status' });
    }
  };

  const handleOpenAdmins = (shop: ManagedShop) => {
    setSelectedShopForAdmins(shop);
    setNewAdminEmail('');
    setNewAdminFirstName('');
    setNewAdminLastName('');
    setNewAdminPassword('');
    setNewAdminRole('OWNER');
    setIsAdminModalOpen(true);
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShopForAdmins || !newAdminEmail.trim()) return;

    setIsAddingAdmin(true);
    try {
      await api.post(`/shops/${selectedShopForAdmins.id}/admins`, {
        email: newAdminEmail.trim(),
        firstName: newAdminFirstName.trim() || undefined,
        lastName: newAdminLastName.trim() || undefined,
        password: newAdminPassword || undefined,
        role: newAdminRole,
      });

      setFeedback({
        type: 'success',
        message: `Admin ${newAdminEmail} assigned to ${selectedShopForAdmins.name}.`,
      });
      setIsAdminModalOpen(false);
      await fetchShops();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to assign administrator' });
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const handleRemoveAdmin = async (shopId: string, userId: string, adminEmail: string) => {
    if (!window.confirm(`Are you sure you want to remove ${adminEmail} from managing this shop?`)) {
      return;
    }

    try {
      await api.delete(`/shops/${shopId}/admins/${userId}`);
      setFeedback({ type: 'success', message: 'Administrator removed successfully.' });
      await fetchShops();
      if (selectedShopForAdmins) {
        setSelectedShopForAdmins((prev) =>
          prev ? { ...prev, admins: prev.admins.filter((a) => a.user.id !== userId) } : null
        );
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to remove admin' });
    }
  };

  const filteredShops = shops.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase()) ||
      s.address.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'active'
        ? s.isActive
        : !s.isActive;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-chairly-dark">
              Barbershop Network
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              👑 Owner View
            </span>
          </div>
          <p className="text-sm text-chairly-muted mt-1">
            Create, configure, publish, and assign administrators to barbershops across Chairly.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 bg-chairly-terracotta-500 hover:bg-chairly-terracotta-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          Add Barbershop
        </button>
      </div>

      {/* Alert Feedback */}
      {feedback && (
        <div
          className={`p-3 rounded-md border text-xs font-medium flex items-center justify-between gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-bold opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-zinc-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by shop name, city, or address..."
            className="w-full pl-10 pr-4 py-2 rounded-md border border-zinc-200 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-950 text-zinc-900 min-h-[38px] bg-zinc-50/50"
          />
        </div>

        <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-md border border-zinc-200 shrink-0 self-start sm:self-auto">
          {(['all', 'active', 'inactive'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-sm text-xs font-semibold capitalize transition-all ${
                filterStatus === status
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-950'
              }`}
            >
              {status === 'all' ? 'All Shops' : status === 'active' ? 'Published' : 'Draft / Inactive'}
            </button>
          ))}
        </div>
      </div>

      {/* Shop Cards Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-zinc-400 gap-3">
          <div className="w-8 h-8 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-zinc-500">Loading barbershops...</p>
        </div>
      ) : filteredShops.length === 0 ? (
        <div className="bg-white p-12 rounded-lg border border-zinc-200 text-center max-w-md mx-auto space-y-4">
          <Building2 className="w-10 h-10 text-zinc-300 mx-auto" />
          <div>
            <h3 className="text-sm font-bold text-zinc-950">No Barbershops Found</h3>
            <p className="text-xs text-zinc-500 mt-1">
              {search || filterStatus !== 'all'
                ? 'Try adjusting your search criteria or filters.'
                : 'Get started by registering the first barbershop on the platform!'}
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-zinc-950 text-white rounded-md text-xs font-semibold hover:bg-black transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create First Barbershop
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredShops.map((shop) => (
            <div
              key={shop.id}
              className="bg-white rounded-lg border border-zinc-200/80 shadow-xs overflow-hidden flex flex-col hover:border-zinc-400 transition-all"
            >
              {/* Cover Image Header */}
              <div className="h-40 relative bg-neutral-100 overflow-hidden">
                <img
                  src={shop.coverImageUrl || COVER_PRESETS[0]}
                  alt={shop.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />

                {/* Status Badge */}
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold border backdrop-blur-xs shadow-xs ${
                      shop.isActive
                        ? 'bg-emerald-500/90 text-white border-emerald-400'
                        : 'bg-neutral-800/80 text-neutral-300 border-neutral-600'
                    }`}
                  >
                    {shop.isActive ? '● Published' : '○ Draft / Inactive'}
                  </span>
                </div>

                {/* Shop Name & Location over Cover */}
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <h3 className="text-lg font-bold truncate leading-snug drop-shadow-xs">{shop.name}</h3>
                  <p className="text-xs text-white/90 flex items-center gap-1 drop-shadow-xs truncate">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-chairly-terracotta-400" />
                    {shop.address}, {shop.city}
                  </p>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                {/* Description & Phone */}
                <div>
                  <p className="text-xs text-chairly-muted line-clamp-2 mb-3">
                    {shop.description || 'No description provided.'}
                  </p>
                  <p className="text-xs font-medium text-chairly-dark flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-chairly-terracotta-500 shrink-0" />
                    {shop.phone}
                  </p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-chairly-border text-center">
                  <div className="bg-chairly-bg p-2 rounded-xl">
                    <span className="block text-sm font-bold text-chairly-dark">{shop.counts.barbers}</span>
                    <span className="text-[10px] text-chairly-muted uppercase font-semibold">Barbers</span>
                  </div>
                  <div className="bg-chairly-bg p-2 rounded-xl">
                    <span className="block text-sm font-bold text-chairly-dark">{shop.counts.services}</span>
                    <span className="text-[10px] text-chairly-muted uppercase font-semibold">Services</span>
                  </div>
                  <div className="bg-chairly-bg p-2 rounded-xl">
                    <span className="block text-sm font-bold text-chairly-dark">{shop.counts.appointments}</span>
                    <span className="text-[10px] text-chairly-muted uppercase font-semibold">Bookings</span>
                  </div>
                </div>

                {/* Assigned Admins Summary */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-chairly-muted uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-chairly-terracotta-500" />
                      Shop Administrators ({shop.admins.length})
                    </span>
                    <button
                      onClick={() => handleOpenAdmins(shop)}
                      className="text-[11px] font-semibold text-chairly-terracotta-600 hover:text-chairly-terracotta-700"
                    >
                      Manage →
                    </button>
                  </div>
                  {shop.admins.length === 0 ? (
                    <p className="text-xs text-amber-600 italic bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                      ⚠️ No admin assigned. Click Manage to assign.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {shop.admins.slice(0, 2).map((a) => (
                        <span
                          key={a.id}
                          className="text-[11px] bg-chairly-bg border border-chairly-border px-2 py-0.5 rounded-lg text-chairly-dark font-medium"
                        >
                          {a.user.firstName} {a.user.lastName} ({a.role})
                        </span>
                      ))}
                      {shop.admins.length > 2 && (
                        <span className="text-[10px] bg-chairly-bg text-chairly-muted px-1.5 py-0.5 rounded">
                          +{shop.admins.length - 2} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons Row */}
                <div className="pt-2 flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleOpenEdit(shop)}
                    className="flex-1 px-3 py-2 bg-chairly-bg hover:bg-chairly-panel border border-chairly-border text-chairly-dark rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors min-h-[38px]"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit Profile
                  </button>

                  <button
                    onClick={() => setPreviewShop(shop)}
                    className="px-3 py-2 bg-chairly-bg hover:bg-chairly-panel border border-chairly-border text-chairly-dark rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors min-h-[38px]"
                    title="Customer Preview"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview
                  </button>

                  <button
                    onClick={() => handleToggleStatus(shop)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors min-h-[38px] ${
                      shop.isActive
                        ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                    }`}
                    title={shop.isActive ? 'Deactivate / Unpublish' : 'Publish to Customers'}
                  >
                    <Power className="w-3.5 h-3.5" />
                    {shop.isActive ? 'Unpublish' : 'Publish'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT SHOP MODAL */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingShop ? `Edit "${editingShop.name}"` : 'Create New Barbershop'}
      >
        <form onSubmit={handleSaveShop} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div>
            <label className="block text-xs font-semibold text-chairly-dark uppercase tracking-wider mb-1.5">
              Barbershop Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g. Master Barbershop Tashkent"
              className="w-full px-4 py-2.5 rounded-xl border border-chairly-border text-sm text-chairly-dark focus:ring-2 focus:ring-chairly-terracotta-500/20 focus:border-chairly-terracotta-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-chairly-dark uppercase tracking-wider mb-1.5">
                City *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
                placeholder="Tashkent"
                className="w-full px-4 py-2.5 rounded-xl border border-chairly-border text-sm text-chairly-dark"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-chairly-dark uppercase tracking-wider mb-1.5">
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                placeholder="+998 90 123 45 67"
                className="w-full px-4 py-2.5 rounded-xl border border-chairly-border text-sm text-chairly-dark"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-chairly-dark uppercase tracking-wider mb-1.5">
              Street Address *
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              placeholder="e.g. 14 Amir Temur Avenue"
              className="w-full px-4 py-2.5 rounded-xl border border-chairly-border text-sm text-chairly-dark"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-chairly-dark uppercase tracking-wider mb-1.5">
              About & Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the barbershop atmosphere, master barbers, and services..."
              className="w-full px-4 py-2.5 rounded-xl border border-chairly-border text-sm text-chairly-dark"
            />
          </div>

          {/* Cover Photo Selection */}
          <div>
            <label className="block text-xs font-semibold text-chairly-dark uppercase tracking-wider mb-1.5">
              Cover Image URL
            </label>
            <input
              type="url"
              value={formData.coverImageUrl}
              onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-4 py-2.5 rounded-xl border border-chairly-border text-sm text-chairly-dark mb-2"
            />
            <div className="flex gap-2 items-center flex-wrap">
              <span className="text-[11px] text-chairly-muted font-medium">Quick Presets:</span>
              {COVER_PRESETS.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setFormData({ ...formData, coverImageUrl: url })}
                  className={`w-12 h-8 rounded-lg overflow-hidden border-2 transition-all ${
                    formData.coverImageUrl === url ? 'border-chairly-terracotta-500 scale-105' : 'border-transparent opacity-70'
                  }`}
                >
                  <img src={url} alt={`Preset ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Publication Status Toggle */}
          <div className="flex items-center gap-3 p-3.5 bg-chairly-bg rounded-xl border border-chairly-border">
            <input
              type="checkbox"
              id="isActiveToggle"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded text-chairly-terracotta-500 focus:ring-chairly-terracotta-500"
            />
            <label htmlFor="isActiveToggle" className="text-xs font-semibold text-chairly-dark cursor-pointer">
              Publish immediately on Chairly (visible to all customers)
            </label>
          </div>

          {/* If creating fresh shop, optional initial Admin details */}
          {!editingShop && (
            <div className="pt-3 border-t border-chairly-border space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-chairly-terracotta-600 flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5" />
                Assign Initial Shop Administrator (Optional)
              </h4>
              <p className="text-[11px] text-chairly-muted">
                Create a dedicated login for this shop's manager or assign an existing email.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-chairly-dark mb-1">Admin Email</label>
                  <input
                    type="email"
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                    placeholder="shopowner@example.uz"
                    className="w-full px-3 py-2 rounded-xl border border-chairly-border text-xs text-chairly-dark"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-chairly-dark mb-1">Initial Password</label>
                  <input
                    type="text"
                    value={formData.adminPassword}
                    onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                    placeholder="Xavfsiz parol kiriting"
                    className="w-full px-3 py-2 rounded-xl border border-chairly-border text-xs text-chairly-dark"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-chairly-dark mb-1">First Name</label>
                  <input
                    type="text"
                    value={formData.adminFirstName}
                    onChange={(e) => setFormData({ ...formData, adminFirstName: e.target.value })}
                    placeholder="e.g. Alisher"
                    className="w-full px-3 py-2 rounded-xl border border-chairly-border text-xs text-chairly-dark"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-chairly-dark mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.adminLastName}
                    onChange={(e) => setFormData({ ...formData, adminLastName: e.target.value })}
                    placeholder="e.g. Navoiy"
                    className="w-full px-3 py-2 rounded-xl border border-chairly-border text-xs text-chairly-dark"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-chairly-border text-xs font-semibold text-chairly-dark hover:bg-chairly-panel min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-chairly-terracotta-500 hover:bg-chairly-terracotta-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold min-h-[44px] shadow-sm"
            >
              {isSubmitting ? 'Saving...' : editingShop ? 'Update Barbershop' : 'Create Barbershop'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MANAGE ADMINS MODAL */}
      <Modal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        title={selectedShopForAdmins ? `Administrators — ${selectedShopForAdmins.name}` : 'Shop Admins'}
      >
        <div className="space-y-6 max-h-[75vh] overflow-y-auto">
          {/* List of Current Admins */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-chairly-muted mb-2">
              Assigned Administrators
            </h4>
            {selectedShopForAdmins?.admins.length === 0 ? (
              <p className="text-xs text-chairly-muted italic bg-chairly-bg p-3 rounded-xl border border-chairly-border">
                No administrators are currently assigned to this shop.
              </p>
            ) : (
              <div className="space-y-2">
                {selectedShopForAdmins?.admins.map((admin) => (
                  <div
                    key={admin.id}
                    className="p-3 bg-chairly-bg rounded-xl border border-chairly-border flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs font-bold text-chairly-dark">
                        {admin.user.firstName} {admin.user.lastName}
                      </p>
                      <p className="text-[11px] text-chairly-muted">{admin.user.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold text-chairly-terracotta-600 bg-chairly-terracotta-50 px-1.5 py-0.2 rounded">
                        {admin.role}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveAdmin(selectedShopForAdmins.id, admin.user.id, admin.user.email)
                      }
                      className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Remove Administrator"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Admin Form */}
          <div className="pt-4 border-t border-chairly-border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-chairly-dark mb-3 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-chairly-terracotta-500" />
              Assign New Administrator
            </h4>

            <form onSubmit={handleAddAdmin} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-chairly-dark mb-1">Email Address *</label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  required
                  placeholder="admin@barbershop.uz"
                  className="w-full px-3 py-2 rounded-xl border border-chairly-border text-xs text-chairly-dark"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-chairly-dark mb-1">First Name</label>
                  <input
                    type="text"
                    value={newAdminFirstName}
                    onChange={(e) => setNewAdminFirstName(e.target.value)}
                    placeholder="First Name"
                    className="w-full px-3 py-2 rounded-xl border border-chairly-border text-xs text-chairly-dark"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-chairly-dark mb-1">Last Name</label>
                  <input
                    type="text"
                    value={newAdminLastName}
                    onChange={(e) => setNewAdminLastName(e.target.value)}
                    placeholder="Last Name"
                    className="w-full px-3 py-2 rounded-xl border border-chairly-border text-xs text-chairly-dark"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-chairly-dark mb-1">Role</label>
                  <select
                    value={newAdminRole}
                    onChange={(e: any) => setNewAdminRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-chairly-border text-xs text-chairly-dark bg-white"
                  >
                    <option value="OWNER">Shop Owner</option>
                    <option value="MANAGER">Shop Manager</option>
                    <option value="BARBER">Barber</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-chairly-dark mb-1">Initial Password</label>
                  <input
                    type="text"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="Xavfsiz parol kiriting"
                    className="w-full px-3 py-2 rounded-xl border border-chairly-border text-xs text-chairly-dark"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isAddingAdmin}
                  className="px-5 py-2.5 bg-chairly-dark hover:bg-neutral-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold min-h-[40px] shadow-xs"
                >
                  {isAddingAdmin ? 'Assigning...' : 'Assign Administrator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Modal>

      {/* CUSTOMER PROFILE PREVIEW MODAL */}
      {previewShop && (
        <Modal
          isOpen={!!previewShop}
          onClose={() => setPreviewShop(null)}
          title={`Customer Preview — ${previewShop.name}`}
        >
          <div className="space-y-4 max-h-[75vh] overflow-y-auto">
            <div className="relative rounded-lg overflow-hidden h-44 bg-neutral-100">
              <img
                src={previewShop.coverImageUrl || COVER_PRESETS[0]}
                alt={previewShop.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 text-white">
                <h3 className="text-lg font-bold">{previewShop.name}</h3>
                <p className="text-xs text-white/90 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-zinc-300" />
                  {previewShop.address}, {previewShop.city}
                </p>
              </div>
            </div>

            <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200 space-y-2">
              <h4 className="text-xs font-bold text-chairly-dark uppercase tracking-wider">About</h4>
              <p className="text-xs text-chairly-muted leading-relaxed">
                {previewShop.description}
              </p>
              <div className="pt-2 flex items-center gap-4 text-xs font-medium text-chairly-dark">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-chairly-terracotta-500" />
                  {previewShop.phone}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-chairly-terracotta-500" />
                  Every day
                </span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
              <span>This is how customers will see your shop in the discovery portal.</span>
              <span className="font-bold">{previewShop.isActive ? 'Active' : 'Draft'}</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

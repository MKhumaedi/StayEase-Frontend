import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Filter, Archive, CheckCircle, XCircle, Star, Building, MapPin, 
  BadgePercent, Undo2, ArrowLeft, Plus, Trash2, Edit2, Save, Image as ImageIcon, 
  DollarSign, Calendar, MessageSquare, Bed, ShieldAlert, Check, RefreshCw, 
  Layers, ChevronRight, User, Shield, Info, Compass, HelpCircle, Eye, EyeOff
} from 'lucide-react';

interface Property {
  id: string;
  name: string;
  location: string;
  city: string;
  basePrice: number;
  rating: string | number;
  status: string;
  category: { name: string } | null;
  tenant: { name: string; email: string } | null;
  bookings: any[];
}

interface Room {
  id: string;
  propertyId: string;
  name: string;
  type: string;
  capacity: number;
  basePrice: number;
  status: 'Available' | 'Occupied' | 'Maintenance' | 'AVAILABLE' | 'UNAVAILABLE' | 'BOOKED' | string;
  wing?: string | null;
  floor?: string | null;
  image?: string | null;
}

interface PropertyManagementProps {
  properties: Property[];
  onUpdatePropertyStatus: (propertyId: string, status: string) => Promise<void>;
  bookings?: any[];
  reviews?: any[];
  onRefreshData?: () => Promise<void>;
}

export default function PropertyManagement({ 
  properties, 
  onUpdatePropertyStatus,
  bookings = [],
  reviews = [],
  onRefreshData
}: PropertyManagementProps) {
  // Navigation & Tabs state
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [activeTab, setActiveTab] = useState<'properties' | 'rooms' | 'categories' | 'amenities' | 'availability'>('properties');
  const [extranetTab, setExtranetTab] = useState<'overview' | 'rooms' | 'images' | 'pricing' | 'availability' | 'reviews' | 'bookings'>('overview');

  // Selected Property Detail + Rooms live states
  const [selectedPropertyFull, setSelectedPropertyFull] = useState<any>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isFetchingFull, setIsFetchingFull] = useState(false);
  const [isSavingRoom, setIsSavingRoom] = useState(false);
  const [roomError, setRoomError] = useState('');

  // Main list filters
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedAmenityFilter, setSelectedAmenityFilter] = useState<string | null>(null);

  // New room form / modal state
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState('Master Suite');
  const [newRoomCapacity, setNewRoomCapacity] = useState('2');
  const [newRoomPrice, setNewRoomPrice] = useState('500000');
  const [newRoomWing, setNewRoomWing] = useState('Main Wing');
  const [newRoomFloor, setNewRoomFloor] = useState('Floor 1');
  const [newRoomStatus, setNewRoomStatus] = useState('Available');

  // Edit room state
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editRoomName, setEditRoomName] = useState('');
  const [editRoomType, setEditRoomType] = useState('');
  const [editRoomCapacity, setEditRoomCapacity] = useState('');
  const [editRoomPrice, setEditRoomPrice] = useState('');
  const [editRoomWing, setEditRoomWing] = useState('');
  const [editRoomFloor, setEditRoomFloor] = useState('');
  const [editRoomStatus, setEditRoomStatus] = useState('');

  // Pricing edit state (inside pricing tab)
  const [editBasePrice, setEditBasePrice] = useState('');
  const [editCleaningFee, setEditCleaningFee] = useState('');
  const [editServiceFee, setEditServiceFee] = useState('');
  const [editSecurityDeposit, setEditSecurityDeposit] = useState('');
  const [isSavingPricing, setIsSavingPricing] = useState(false);

  // Blocked dates state
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [isSavingAvailability, setIsSavingAvailability] = useState(false);

  // New Image URL append
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isSavingImages, setIsSavingImages] = useState(false);

  // Currency helper
  const formatPrice = (price: number | string) => {
    const num = Number(price);
    if (isNaN(num)) return `$${price}`;
    if (num > 5000) {
      return `Rp ${num.toLocaleString('id-ID')}`;
    }
    return `$${num}`;
  };

  // Fetch full details of clicked property (rooms, image grids, fine attributes)
  useEffect(() => {
    if (selectedProperty) {
      setIsFetchingFull(true);
      setRoomError('');
      fetch(`/api/properties/${selectedProperty.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.property) {
            setSelectedPropertyFull(data.property);
            // Pre-fill pricing states
            setEditBasePrice(String(data.property.basePrice || ''));
            setEditCleaningFee(String(data.property.cleaningFee || '0'));
            setEditServiceFee(String(data.property.serviceFee || '0'));
            setEditSecurityDeposit(String(data.property.securityDeposit || '0'));
          } else {
            setSelectedPropertyFull(selectedProperty);
          }
          if (data.rooms) {
            setRooms(data.rooms);
          }
        })
        .catch(err => {
          console.error("Failed to fetch full property details + rooms:", err);
          setSelectedPropertyFull(selectedProperty);
        })
        .finally(() => {
          setIsFetchingFull(false);
        });
    } else {
      setSelectedPropertyFull(null);
      setRooms([]);
    }
  }, [selectedProperty]);

  // Cities selection helper
  const cities = useMemo(() => {
    return Array.from(new Set(properties.map(p => p.city || 'Other').filter(Boolean)));
  }, [properties]);

  // Advanced listing filter
  const filteredProperties = useMemo(() => {
    return properties.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                            p.location.toLowerCase().includes(search.toLowerCase()) ||
                            p.tenant?.name.toLowerCase().includes(search.toLowerCase());
      const matchesCity = cityFilter === 'ALL' || p.city === cityFilter;
      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
      const matchesAmenity = !selectedAmenityFilter || 
                             (p as any).amenities?.includes(selectedAmenityFilter);
      return matchesSearch && matchesCity && matchesStatus && matchesAmenity;
    });
  }, [properties, search, cityFilter, statusFilter, selectedAmenityFilter]);

  // Combined rooms across all properties (for total Inventory tab)
  const [allRoomsCombined, setAllRoomsCombined] = useState<any[]>([]);
  const [isFetchingAllRooms, setIsFetchingAllRooms] = useState(false);

  useEffect(() => {
    if (activeTab === 'rooms') {
      setIsFetchingAllRooms(true);
      Promise.all(properties.slice(0, 15).map(p => 
        fetch(`/api/properties/${p.id}`)
          .then(res => res.json())
          .then(data => (data.rooms || []).map((r: any) => ({ ...r, propertyName: p.name })))
          .catch(() => [])
      )).then(results => {
        setAllRoomsCombined(results.flat());
      }).finally(() => {
        setIsFetchingAllRooms(false);
      });
    }
  }, [activeTab, properties]);

  // Categories counter helper
  const categoriesStats = useMemo(() => {
    const statsMap: Record<string, { count: number; totalBasePrice: number }> = {};
    properties.forEach(p => {
      const catName = p.category?.name || 'Staying Option';
      if (!statsMap[catName]) {
        statsMap[catName] = { count: 0, totalBasePrice: 0 };
      }
      statsMap[catName].count += 1;
      statsMap[catName].totalBasePrice += p.basePrice || 0;
    });
    return Object.entries(statsMap).map(([name, data]) => ({
      name,
      count: data.count,
      avgPrice: Math.round(data.totalBasePrice / data.count)
    }));
  }, [properties]);

  // Amenities metric helper
  const amenitiesStats = useMemo(() => {
    const allUnique = ["Wi-Fi", "Private Pool", "Air Conditioning", "Kitchen", "Free Parking", "Gym", "Spa", "Ocean View", "Pet Friendly"];
    return allUnique.map(amenity => {
      const matchingProps = properties.filter(p => (p as any).amenities?.includes(amenity));
      return {
        name: amenity,
        count: matchingProps.length
      };
    });
  }, [properties]);

  // Property status transition helper
  const handleStatusChange = async (property: Property, status: string) => {
    if (window.confirm(`Are you sure you want to transition property "${property.name}" status to "${status}"?`)) {
      try {
        await onUpdatePropertyStatus(property.id, status);
        // Optimistically update full payload is selected
        if (selectedPropertyFull && selectedPropertyFull.id === property.id) {
          setSelectedPropertyFull((prev: any) => ({ ...prev, status }));
        }
        if (selectedProperty && selectedProperty.id === property.id) {
          setSelectedProperty((prev: any) => ({ ...prev, status }));
        }
        if (onRefreshData) await onRefreshData();
      } catch (err: any) {
        alert(err.message || 'Transition failed');
      }
    }
  };

  // Root saver utility for PUT properties (Room CRUD, image edits, pricing adjustments)
  const savePropertyPayload = async (updatedFields: any) => {
    if (!selectedPropertyFull) return;
    try {
      const token = localStorage.getItem('stayease_token');
      const payload = {
        name: selectedPropertyFull.name,
        description: selectedPropertyFull.description,
        categoryId: selectedPropertyFull.categoryId,
        city: selectedPropertyFull.city,
        province: selectedPropertyFull.province || selectedPropertyFull.city,
        address: selectedPropertyFull.address || selectedPropertyFull.location,
        basePrice: Number(selectedPropertyFull.basePrice),
        imageUrls: selectedPropertyFull.imageUrls?.length > 0 ? selectedPropertyFull.imageUrls : [selectedPropertyFull.image || 'https://images.unsplash.com/photo-1540518614846-7eded433c457'],
        amenities: selectedPropertyFull.amenities || [],
        beds: Number(selectedPropertyFull.beds || 1),
        baths: Number(selectedPropertyFull.baths || 1),
        sqft: Number(selectedPropertyFull.sqft || 35),
        guests: Number(selectedPropertyFull.guests || 2),
        cleaningFee: Number(selectedPropertyFull.cleaningFee || 0),
        serviceFee: Number(selectedPropertyFull.serviceFee || 0),
        securityDeposit: Number(selectedPropertyFull.securityDeposit || 0),
        rooms: rooms,
        ...updatedFields
      };

      const res = await fetch(`/api/properties/${selectedPropertyFull.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to update property settings');
      }

      // Sync local states
      setSelectedPropertyFull((prev: any) => ({ ...prev, ...payload }));
      if (payload.rooms) setRooms(payload.rooms);
      
      if (onRefreshData) {
        await onRefreshData();
      }
      return true;
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  // ROOM CRUD: Create Room
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName || !newRoomPrice) {
      setRoomError("Please provide a name and base price.");
      return;
    }
    setIsSavingRoom(true);
    setRoomError('');
    try {
      const newRoomObj: Room = {
        id: `room-${Date.now()}`,
        propertyId: selectedPropertyFull.id,
        name: newRoomName,
        type: newRoomType,
        capacity: parseInt(newRoomCapacity),
        basePrice: parseInt(newRoomPrice),
        wing: newRoomWing || '',
        floor: newRoomFloor || 'Floor 1',
        status: newRoomStatus
      };

      const updatedRooms = [...rooms, newRoomObj];
      await savePropertyPayload({ rooms: updatedRooms });
      
      // Cleanup field states
      setNewRoomName('');
      setNewRoomPrice('500000');
      setShowAddRoomModal(false);
    } catch (err: any) {
      setRoomError(err.message || 'Room insertion failure');
    } finally {
      setIsSavingRoom(false);
    }
  };

  // ROOM CRUD: Trigger Edit Mode in memory
  const handleStartEditRoom = (room: Room) => {
    setEditingRoomId(room.id);
    setEditRoomName(room.name);
    setEditRoomType(room.type);
    setEditRoomCapacity(String(room.capacity));
    setEditRoomPrice(String(room.basePrice));
    setEditRoomWing(room.wing || '');
    setEditRoomFloor(room.floor || 'Floor 1');
    setEditRoomStatus(room.status || 'Available');
  };

  // ROOM CRUD: Save/Submit Edit
  const handleSaveEditRoom = async (roomId: string) => {
    if (!editRoomName || !editRoomPrice) {
      setRoomError("Please provide edit room name and price");
      return;
    }
    setIsSavingRoom(true);
    setRoomError('');
    try {
      const updatedRooms = rooms.map(r => {
        if (r.id === roomId) {
          return {
            ...r,
            name: editRoomName,
            type: editRoomType,
            capacity: parseInt(editRoomCapacity),
            basePrice: parseInt(editRoomPrice),
            wing: editRoomWing,
            floor: editRoomFloor,
            status: editRoomStatus
          };
        }
        return r;
      });

      await savePropertyPayload({ rooms: updatedRooms });
      setEditingRoomId(null);
    } catch (err: any) {
      setRoomError(err.message || 'Room modification error');
    } finally {
      setIsSavingRoom(false);
    }
  };

  // ROOM CRUD: Delete Room
  const handleDeleteRoom = async (roomId: string) => {
    if (window.confirm("Are you sure you want to delete this room from listing roster?")) {
      setIsSavingRoom(true);
      setRoomError('');
      try {
        const updatedRooms = rooms.filter(r => r.id !== roomId);
        await savePropertyPayload({ rooms: updatedRooms });
      } catch (err: any) {
        setRoomError(err.message || 'Room removal failure');
      } finally {
        setIsSavingRoom(false);
      }
    }
  };

  // PRICING MANAGE: Update structural pricing fields
  const handleUpdatePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPricing(true);
    try {
      await savePropertyPayload({
        basePrice: parseInt(editBasePrice) || 50000,
        cleaningFee: parseInt(editCleaningFee) || 0,
        serviceFee: parseInt(editServiceFee) || 0,
        securityDeposit: parseInt(editSecurityDeposit) || 0
      });
      alert('Pricing attributes successfully integrated!');
    } catch (err: any) {
      alert(err.message || 'Pricing savings aborted');
    } finally {
      setIsSavingPricing(false);
    }
  };

  // IMAGE MANAGE: Add Photo url
  const handleAddImageUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageUrl) return;
    setIsSavingImages(true);
    try {
      const currentUrls = selectedPropertyFull?.imageUrls || [];
      const updatedUrls = [...currentUrls, newImageUrl];
      await savePropertyPayload({ imageUrls: updatedUrls });
      setNewImageUrl('');
    } catch (err: any) {
      alert(err.message || 'Image list refresh failed');
    } finally {
      setIsSavingImages(false);
    }
  };

  // IMAGE MANAGE: Remove Photo
  const handleRemoveImageUrl = async (url: string) => {
    if (window.confirm("Remove this image URL?")) {
      setIsSavingImages(true);
      try {
        const currentUrls = selectedPropertyFull?.imageUrls || [];
        const updatedUrls = currentUrls.filter((u: string) => u !== url);
        await savePropertyPayload({ imageUrls: updatedUrls });
      } catch (err: any) {
        alert(err.message || 'Image deletion failed');
      } finally {
        setIsSavingImages(false);
      }
    }
  };

  // AVAILABILITY MANAGE: Block specific dates
  const handleBlockDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockedDate) return;
    setIsSavingAvailability(true);
    try {
      const currentBlocked = selectedPropertyFull?.blockedDates || [];
      if (currentBlocked.includes(newBlockedDate)) {
        alert("This date is already listed as blocked.");
        return;
      }
      const updatedBlocked = [...currentBlocked, newBlockedDate];
      await savePropertyPayload({ blockedDates: updatedBlocked });
      setNewBlockedDate('');
    } catch (err: any) {
      alert(err.message || 'Blocked dates adjustment failed');
    } finally {
      setIsSavingAvailability(false);
    }
  };

  // AVAILABILITY MANAGE: Unblock date
  const handleUnblockDate = async (date: string) => {
    setIsSavingAvailability(true);
    try {
      const currentBlocked = selectedPropertyFull?.blockedDates || [];
      const updatedBlocked = currentBlocked.filter((d: string) => d !== date);
      await savePropertyPayload({ blockedDates: updatedBlocked });
    } catch (err: any) {
      alert(err.message || 'Date extraction from blocklist aborted');
    } finally {
      setIsSavingAvailability(false);
    }
  };

  // Toggle Review Moderation
  const handleModerateReview = async (reviewId: string, currentHidden: boolean) => {
    if (window.confirm(`Are you sure you want to ${currentHidden ? 'SHOW' : 'HIDE'} this guest review?`)) {
      try {
        const token = localStorage.getItem('stayease_token');
        const res = await fetch(`/api/admin/reviews/${reviewId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ isHidden: !currentHidden })
        });
        if (!res.ok) {
          const resData = await res.json();
          throw new Error(resData.error || 'Review toggling error');
        }
        if (onRefreshData) await onRefreshData();
        alert("Review visibility transformed!");
      } catch (err: any) {
        alert(err.message || 'Moderation aborted');
      }
    }
  };

  // Selected property statistics filtering
  const propertyBookings = useMemo(() => {
    if (!selectedProperty) return [];
    return bookings.filter(b => b.propertyId === selectedProperty.id);
  }, [bookings, selectedProperty]);

  const propertyReviews = useMemo(() => {
    if (!selectedProperty) return [];
    return reviews.filter(r => r.propertyId === selectedProperty.id || r.property?.id === selectedProperty.id);
  }, [reviews, selectedProperty]);


  // ==========================================
  // RENDER VIEW CASE 1: PROPERTIES EXTRANET (selectedProperty !== null)
  // ==========================================
  if (selectedProperty) {
    const p = selectedPropertyFull || selectedProperty;
    const isPending = p.status === 'PENDING' || p.status === 'WAITING';
    const isArchived = p.status === 'ARCHIVED';
    const isApproved = p.status === 'ACTIVE' || p.status === 'APPROVED';

    return (
      <div className="space-y-6 font-sans fade-in" id="admin-property-extranet-viewport">
        {/* Extranet Top Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-150 pb-5" id="extranet-header">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSelectedProperty(null)}
              className="bg-white hover:bg-gray-100 text-gray-700 p-2 border border-gray-250 border-gray-200 rounded-lg shrink-0 flex items-center justify-center transition"
              id="extranet-back-btn"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Hotel Extranet Mode
                </span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                  isApproved ? 'bg-emerald-100 text-emerald-800' :
                  isPending ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {p.status}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mt-1 line-clamp-1">{p.name}</h2>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {p.location} ({p.city})
              </p>
            </div>
          </div>

          {/* Quick status transition in extranet */}
          <div className="flex items-center gap-1.5 self-start md:self-center" id="extranet-status-actions">
            {isPending && (
              <>
                <button 
                  onClick={() => handleStatusChange(p, 'ACTIVE')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs transition"
                >
                  <CheckCircle className="h-3.5 w-3.5" /> Approve
                </button>
                <button 
                  onClick={() => handleStatusChange(p, 'REJECTED')}
                  className="bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                >
                  <XCircle className="h-3.5 w-3.5" /> Reject
                </button>
              </>
            )}

            {isApproved && (
              <button 
                onClick={() => handleStatusChange(p, 'ARCHIVED')}
                className="bg-gray-205 bg-gray-200 text-gray-700 hover:bg-gray-300 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
              >
                <Archive className="h-3.5 w-3.5" /> Archive Listing
              </button>
            )}

            {isArchived && (
              <button 
                onClick={() => handleStatusChange(p, 'ACTIVE')}
                className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
              >
                <Undo2 className="h-3.5 w-3.5" /> Restore Active
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Inner Tab Navigation (Enterprise Submenu) */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1.5 border-b border-gray-100" id="extranet-tabs-nav">
          {[
            { id: 'overview', label: 'Overview', icon: Compass },
            { id: 'rooms', label: `Rooms (${rooms.length})`, icon: Bed },
            { id: 'images', label: 'Images Selection', icon: ImageIcon },
            { id: 'pricing', label: 'Pricing Indices', icon: DollarSign },
            { id: 'availability', label: `Availability (${p.blockedDates?.length || 0} blocked)`, icon: Calendar },
            { id: 'reviews', label: `User Reviews (${propertyReviews.length})`, icon: Star },
            { id: 'bookings', label: `Booking History (${propertyBookings.length})`, icon: Building }
          ].map(tab => {
            const Icon = tab.icon;
            const active = extranetTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setExtranetTab(tab.id as any)}
                className={`py-2 px-4 text-xs font-bold rounded-lg flex items-center gap-2 transition shrink-0 whitespace-nowrap cursor-pointer ${
                  active 
                    ? 'bg-slate-900 text-white' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* If fetching detailed info indicator */}
        {isFetchingFull && (
          <div className="bg-white border rounded-xl p-8 text-center flex flex-col items-center justify-center text-gray-500" id="extranet-loading-card">
            <RefreshCw className="h-6 w-6 animate-spin text-indigo-600 mb-2" />
            <p className="text-sm font-bold">Synchronizing real-time inventory assets...</p>
          </div>
        )}

        {/* EXTRANET TAB 1: OVERVIEW */}
        {extranetTab === 'overview' && !isFetchingFull && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="overview-extranet-grid">
            <div className="lg:col-span-2 space-y-6">
              {/* About description layout */}
              <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-xs">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Property Description</h3>
                <div className="text-slate-600 text-sm whitespace-pre-line leading-relaxed">
                  {p.description || "No description loaded."}
                </div>
              </div>

              {/* Coordinates location layout */}
              <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-xs grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Location Information</h3>
                  <p className="text-xs text-gray-400 mb-2">Detailed street mapping values</p>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400">Street Address</label>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{p.address || p.location}</p>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400">City / Municipality</label>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{p.city}</p>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400">Latitude coordinate</label>
                  <p className="text-sm font-mono text-slate-700 mt-0.5">{p.latitude || "-8.7209"}</p>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400">Longitude coordinate</label>
                  <p className="text-sm font-mono text-slate-700 mt-0.5">{p.longitude || "115.1691"}</p>
                </div>
              </div>

              {/* Amenities overview */}
              <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-xs">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Amenities List</h3>
                <div className="flex flex-wrap gap-2">
                  {p.amenities?.length > 0 ? (
                    p.amenities.map((am: string, index: number) => (
                      <span key={index} className="bg-gray-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-md">
                        {am}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">No amenities registered on this site.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar quick metadata view info */}
            <div className="space-y-6">
              <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-xs flex flex-col gap-4">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest border-b pb-2">Business Attributes</h3>
                
                <div>
                  <span className="text-[10px] uppercase text-gray-400 block font-semibold">Category Options</span>
                  <span className="font-bold text-indigo-750 text-indigo-650 text-sm mt-0.5 block">{p.category?.name || "Standard lodge"}</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase text-gray-400 block font-semibold">Owner / Tenant Account</span>
                  <p className="font-bold text-sm text-slate-800 mt-0.5">{p.tenant?.name || "Independent Host"}</p>
                  <p className="text-xs text-slate-400 font-mono">{p.tenant?.email || "No email"}</p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs border-y py-3">
                  <div>
                    <span className="font-extrabold text-slate-800 block text-base">{p.beds || 1}</span>
                    <span className="text-[9px] uppercase text-gray-400 block font-semibold">Bedrooms</span>
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-800 block text-base">{p.baths || 1}</span>
                    <span className="text-[9px] uppercase text-gray-400 block font-semibold">Baths</span>
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-800 block text-base">{p.guests || 2}</span>
                    <span className="text-[9px] uppercase text-gray-400 block font-semibold">Guests</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg flex items-center justify-between text-xs">
                  <span className="text-slate-500">Average RatingScore:</span>
                  <span className="flex items-center text-amber-500 font-black gap-0.5">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    {Number(p.rating || 5.0).toFixed(1)} / 5.0
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EXTRANET TAB 2: ROOM MODULE MANAGEMENT (LIVE SUITE CRUD!) */}
        {extranetTab === 'rooms' && !isFetchingFull && (
          <div className="space-y-6" id="rooms-extranet-module">
            {/* Header controls inside Room Extranet */}
            <div className="bg-white border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-gray-900 tracking-tight text-sm uppercase">Room Inventory List</h3>
                <p className="text-xs text-gray-400">Create, adjust pricing, wings, capacities, or eliminate defunct suite options.</p>
              </div>
              <button 
                onClick={() => {
                  setRoomError('');
                  setShowAddRoomModal(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-750 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 self-start sm:self-auto transition cursor-pointer"
                id="add-room-trigger-btn"
              >
                <Plus className="w-4 h-4" /> Add Room Suite
              </button>
            </div>

            {/* Room CRUD Messages */}
            {roomError && (
              <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-lg p-3 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{roomError}</span>
              </div>
            )}

            {/* Room Addition Modal */}
            {showAddRoomModal && (
              <div className="bg-slate-900/60 backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center p-4">
                <form 
                  onSubmit={handleCreateRoom} 
                  className="bg-white p-6 rounded-2xl border w-full max-w-lg shadow-2xl flex flex-col gap-4"
                  id="add-room-suite-form"
                >
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
                      <Bed className="text-indigo-600 w-5 h-5" /> Register Suite Option
                    </h3>
                    <button type="button" onClick={() => setShowAddRoomModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">&times;</button>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Room Name / Room No.</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="e.g. Deluxe Suite 305" 
                      value={newRoomName} 
                      onChange={e => setNewRoomName(e.target.value)} 
                      className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-lg p-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Type Roster Class</label>
                      <select 
                        value={newRoomType} 
                        onChange={e => setNewRoomType(e.target.value)} 
                        className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 focus:outline-hidden"
                      >
                        <option>Master Suite</option>
                        <option>Executive Suite</option>
                        <option>Deluxe Suite</option>
                        <option>Family Room</option>
                        <option>Studio Loft</option>
                        <option>Standard Lodge</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Wing Placement</label>
                      <input 
                        type="text" 
                        placeholder="e.g. East Wing"
                        value={newRoomWing} 
                        onChange={e => setNewRoomWing(e.target.value)} 
                        className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 focus:outline-hidden" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Max capacity</label>
                      <input 
                        required 
                        type="number" 
                        min="1"
                        max="20"
                        value={newRoomCapacity} 
                        onChange={e => setNewRoomCapacity(e.target.value)} 
                        className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 focus:outline-hidden" 
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Base Price / night</label>
                      <input 
                        required 
                        type="number" 
                        min="100"
                        value={newRoomPrice} 
                        onChange={e => setNewRoomPrice(e.target.value)} 
                        className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Floor index</label>
                      <input 
                        type="text" 
                        placeholder="Floor 2"
                        value={newRoomFloor} 
                        onChange={e => setNewRoomFloor(e.target.value)} 
                        className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 focus:outline-hidden" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Operational Status</label>
                    <select 
                      value={newRoomStatus} 
                      onChange={e => setNewRoomStatus(e.target.value)} 
                      className="w-full bg-slate-50 border border-gray-200 text-xs font-semibold rounded-lg p-2.5"
                    >
                      <option value="Available">Available</option>
                      <option value="Occupied">Occupied</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Unavailable">Unavailable</option>
                    </select>
                  </div>

                  <div className="flex gap-2 justify-end mt-4 border-t pt-3">
                    <button 
                      type="button" 
                      onClick={() => setShowAddRoomModal(false)} 
                      className="text-xs font-bold text-slate-500 px-4 py-2 border rounded-lg hover:bg-slate-55"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSavingRoom}
                      className="bg-indigo-650 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-5 py-2 rounded-lg flex items-center justify-center gap-2"
                    >
                      {isSavingRoom && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      Record suite option
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Rooms Roster Table */}
            <div className="bg-white border rounded-xl overflow-hidden shadow-xs">
              {rooms.length === 0 ? (
                <div className="p-12 text-center text-gray-400 text-xs" id="empty-rooms-ledger">
                  <Bed className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  No specific rooms registered. All guests booking this list will utilize default base listings config.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600" id="rooms-extranet-table">
                    <thead className="bg-slate-50 text-[10px] text-slate-400 font-extrabold uppercase border-b">
                      <tr>
                        <th className="p-4">Room Name</th>
                        <th className="p-4">Type Class</th>
                        <th className="p-4">Placement (Wing/Floor)</th>
                        <th className="p-4">Guests limit</th>
                        <th className="p-4">Base Rate / night</th>
                        <th className="p-4">Active Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-medium text-slate-700">
                      {rooms.map((room) => {
                        const isEditing = editingRoomId === room.id;
                        return (
                          <tr key={room.id} className="hover:bg-slate-50/50" id={`room-row-${room.id}`}>
                            {isEditing ? (
                              <>
                                <td className="p-3">
                                  <input 
                                    type="text" 
                                    className="border rounded px-2 py-1 text-xs w-full bg-slate-50"
                                    value={editRoomName} 
                                    onChange={e => setEditRoomName(e.target.value)} 
                                  />
                                </td>
                                <td className="p-3">
                                  <select 
                                    className="border rounded px-1.5 py-1 text-xs bg-slate-50"
                                    value={editRoomType} 
                                    onChange={e => setEditRoomType(e.target.value)}
                                  >
                                    <option>Master Suite</option>
                                    <option>Executive Suite</option>
                                    <option>Deluxe Suite</option>
                                    <option>Family Room</option>
                                    <option>Studio Loft</option>
                                    <option>Standard Lodge</option>
                                  </select>
                                </td>
                                <td className="p-3 flex items-center gap-1.5">
                                  <input 
                                    type="text" 
                                    placeholder="Wing"
                                    className="border rounded px-1 text-xs w-1/2 bg-slate-50"
                                    value={editRoomWing} 
                                    onChange={e => setEditRoomWing(e.target.value)} 
                                  />
                                  <input 
                                    type="text" 
                                    placeholder="Floor"
                                    className="border rounded px-1 text-xs w-1/2 bg-slate-50"
                                    value={editRoomFloor} 
                                    onChange={e => setEditRoomFloor(e.target.value)} 
                                  />
                                </td>
                                <td className="p-3">
                                  <input 
                                    type="number" 
                                    className="border rounded p-1 text-xs w-14 bg-slate-50"
                                    value={editRoomCapacity} 
                                    onChange={e => setEditRoomCapacity(e.target.value)} 
                                  />
                                </td>
                                <td className="p-3">
                                  <input 
                                    type="number" 
                                    className="border rounded p-1 text-xs w-24 bg-slate-50"
                                    value={editRoomPrice} 
                                    onChange={e => setEditRoomPrice(e.target.value)} 
                                  />
                                </td>
                                <td className="p-3">
                                  <select 
                                    className="border rounded p-1 text-xs bg-slate-50"
                                    value={editRoomStatus} 
                                    onChange={e => setEditRoomStatus(e.target.value)}
                                  >
                                    <option value="Available">Available</option>
                                    <option value="Occupied">Occupied</option>
                                    <option value="Maintenance">Maintenance</option>
                                    <option value="Unavailable">Unavailable</option>
                                  </select>
                                </td>
                                <td className="p-3 text-right">
                                  <div className="flex justify-end gap-1.5">
                                    <button 
                                      onClick={() => handleSaveEditRoom(room.id)}
                                      disabled={isSavingRoom}
                                      className="bg-emerald-600 text-white border p-1 rounded hover:bg-emerald-700 font-bold transition flex items-center"
                                      title="Save changes"
                                    >
                                      <Check className="w-4.5 h-4.5" />
                                    </button>
                                    <button 
                                      onClick={() => setEditingRoomId(null)}
                                      className="bg-slate-200 text-slate-700 border p-1 rounded hover:bg-slate-300 font-bold transition flex items-center"
                                      title="Cancel"
                                    >
                                      &times;
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="p-4 text-slate-900 font-bold flex items-center gap-2">
                                  <Bed className="w-4 h-4 text-slate-400 shrink-0" />
                                  {room.name}
                                </td>
                                <td className="p-4">{room.type}</td>
                                <td className="p-4 text-slate-500">
                                  {room.wing || 'Main Block'} • {room.floor || 'Floor 1'}
                                </td>
                                <td className="p-4 font-bold text-slate-800">{room.capacity} Guests</td>
                                <td className="p-4 font-black text-slate-900">{formatPrice(room.basePrice)}</td>
                                <td className="p-4">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wide font-extrabold ${
                                    room.status === 'Available' || room.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                    room.status === 'Occupied' || room.status === 'BOOKED' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                    'bg-red-50 text-red-700 border border-red-100'
                                  }`}>
                                    {room.status || 'Available'}
                                  </span>
                                </td>
                                <td className="p-4 text-right">
                                  <div className="flex justify-end gap-1.5">
                                    <button 
                                      onClick={() => handleStartEditRoom(room)}
                                      className="bg-white border text-slate-505 border-slate-200 text-slate-550 border-slate-200 hover:bg-slate-100 p-1.5 rounded-lg transition"
                                      title="Edit Room Attributes"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteRoom(room.id)}
                                      className="bg-white border text-rose-600 border-rose-100 hover:bg-rose-50 p-1.5 rounded-lg transition"
                                      title="Delete Room Suite"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* EXTRANET TAB 3: IMAGES SELECTION */}
        {extranetTab === 'images' && !isFetchingFull && (
          <div className="space-y-6" id="images-extranet-module">
            {/* Add Image Link Form */}
            <div className="bg-white border rounded-xl p-5 shadow-xs">
              <h3 className="font-bold text-sm uppercase tracking-wider mb-2">Append Gallery Assets</h3>
              <form onSubmit={handleAddImageUrl} className="flex gap-2">
                <input 
                  type="url" 
                  placeholder="https://images.unsplash.com/your-image-id..." 
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-1.5 px-3 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  value={newImageUrl}
                  onChange={e => setNewImageUrl(e.target.value)}
                  required
                />
                <button 
                  type="submit" 
                  disabled={isSavingImages}
                  className="bg-indigo-600 hover:bg-indigo-750 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg shrink-0 flex items-center gap-1 transition"
                >
                  {isSavingImages && <RefreshCw className="w-3 animate-spin" />}
                  Add Image
                </button>
              </form>
            </div>

            {/* Image Grid Display */}
            <div className="bg-white border rounded-xl p-6 shadow-xs">
              <h3 className="font-extrabold text-sm uppercase tracking-wider mb-4 text-slate-800">Operational Gallery ({p.imageUrls?.length || 0})</h3>
              
              {!p.imageUrls || p.imageUrls.length === 0 ? (
                <p className="text-xs text-gray-400">No images linked. Showing placeholders.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {p.imageUrls.map((url: string, index: number) => (
                    <div key={index} className="relative group overflow-hidden bg-slate-100 rounded-lg aspect-4/3 border">
                      <img 
                        src={url} 
                        alt="Property Room Exhibit" 
                        referrerPolicy="no-referrer"
                        className="object-cover w-full h-full transition group-hover:scale-105" 
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition gap-2">
                        <button 
                          onClick={() => handleRemoveImageUrl(url)}
                          className="bg-white hover:bg-rose-50 text-rose-600 text-[10px] p-2 hover:scale-110 font-bold rounded-lg shadow-sm transition"
                          title="Delete Photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                        {index === 0 ? 'Cover Image' : `Asset #${index + 1}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* EXTRANET TAB 4: PRICING INDICES */}
        {extranetTab === 'pricing' && !isFetchingFull && (
          <form onSubmit={handleUpdatePricing} className="bg-white border border-gray-100 rounded-xl p-6 shadow-xs max-w-xl space-y-5" id="pricing-extranet-module">
            <div>
              <h3 className="font-black text-sm uppercase text-gray-900 tracking-wider">Structural Financial Configurers</h3>
              <p className="text-xs text-gray-400">Establish structural base tariffs, sanitizing cleaning rates, and escrow reserves.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">Baseline Rate / night</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-bold">Rp | $</span>
                  <input 
                    type="number" 
                    min="100" 
                    required 
                    className="w-full pl-14 bg-gray-50 border rounded-lg py-1.5 px-3 text-xs focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
                    value={editBasePrice}
                    onChange={e => setEditBasePrice(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">Sanitizing/Cleaning fee</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-bold">Rp | $</span>
                  <input 
                    type="number" 
                    min="0" 
                    required 
                    className="w-full pl-14 bg-gray-50 border rounded-lg py-1.5 px-3 text-xs focus:ring-2 focus:ring-indigo-500 font-medium text-slate-850"
                    value={editCleaningFee}
                    onChange={e => setEditCleaningFee(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">Channel operations service fee</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-bold">Rp | $</span>
                  <input 
                    type="number" 
                    min="0" 
                    required 
                    className="w-full pl-14 bg-gray-50 border rounded-lg py-1.5 px-3 text-xs focus:ring-2 focus:ring-indigo-500 font-medium text-slate-855"
                    value={editServiceFee}
                    onChange={e => setEditServiceFee(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">Escrow security deposit</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-bold">Rp | $</span>
                  <input 
                    type="number" 
                    min="0" 
                    required 
                    className="w-full pl-14 bg-gray-50 border rounded-lg py-1.5 px-3 text-xs focus:ring-2 focus:ring-indigo-500 font-medium text-slate-850"
                    value={editSecurityDeposit}
                    onChange={e => setEditSecurityDeposit(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4 flex justify-end">
              <button 
                type="submit" 
                disabled={isSavingPricing}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer font-sans"
              >
                {isSavingPricing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Integrate rates configuration
              </button>
            </div>
          </form>
        )}

        {/* EXTRANET TAB 5: AVAILABILITY BLOCKED LISTS */}
        {extranetTab === 'availability' && !isFetchingFull && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="availability-extranet-module">
            {/* Form dates blockage */}
            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-xs h-fit space-y-4">
              <div>
                <h3 className="font-extrabold text-sm uppercase text-slate-800 tracking-wider">Restrict/Block dates</h3>
                <p className="text-xs text-slate-400 mt-1">Direct calendar freeze for maintenance or private host occupancies.</p>
              </div>

              <form onSubmit={handleBlockDate} className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase font-extrabold text-gray-400">Block date target</label>
                  <input 
                    type="date" 
                    className="w-full mt-1 bg-gray-50 border rounded-lg py-1.5 px-3 text-xs focus:ring-2 focus:ring-indigo-500 text-slate-800 font-bold focus:outline-hidden"
                    value={newBlockedDate}
                    onChange={e => setNewBlockedDate(e.target.value)}
                    required
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isSavingAvailability}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  {isSavingAvailability && <RefreshCw className="w-3 animate-spin" />}
                  Register Block Date
                </button>
              </form>
            </div>

            {/* List blocked intervals */}
            <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl p-6 shadow-xs">
              <h3 className="font-black text-sm uppercase tracking-wider mb-1">Active Blocks On Property Roster</h3>
              <p className="text-xs text-slate-400 mb-4">Dates on this tracker cannot be booked by general users on the guest views.</p>

              {!p.blockedDates || p.blockedDates.length === 0 ? (
                <div className="rounded-xl border border-dashed text-slate-400 text-xs text-center p-12">
                  No date blocks registered yet on this property. Perfect general availability.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {p.blockedDates.map((date: string, index: number) => (
                    <div 
                      key={index} 
                      className="bg-rose-50 border border-rose-100 rounded-lg p-2 flex items-center justify-between gap-3 text-xs font-bold text-rose-700"
                    >
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {date}
                      </span>
                      <button 
                        onClick={() => handleUnblockDate(date)}
                        className="text-rose-500 hover:text-rose-800 text-sm font-bold p-0.5 rounded cursor-pointer leading-none"
                        title="Remove Block Restriction"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* EXTRANET TAB 6: SPECIFIC REVIEWS */}
        {extranetTab === 'reviews' && !isFetchingFull && (
          <div className="bg-white border rounded-xl p-6 shadow-xs space-y-4" id="reviews-extranet-module">
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider text-slate-800">Listing Reviews & Moderation Center</h3>
              <p className="text-xs text-slate-400">Review feedback and toggle guest records from user visibility.</p>
            </div>

            {propertyReviews.length === 0 ? (
              <div className="text-center text-xs text-slate-400 p-12 border border-dashed rounded-xl">
                <MessageSquare className="w-8 h-8 text-indigo-150 mx-auto mb-2" />
                No guest reviews have been submitted for this property.
              </div>
            ) : (
              <div className="divide-y space-y-4">
                {propertyReviews.map((rev) => (
                  <div key={rev.id} className="pt-4 first:pt-0 flex flex-col md:flex-row md:items-start justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-slate-800 font-bold">
                        <User className="w-4 h-4 text-gray-400" />
                        {rev.user?.name || "Guest traveler"}
                        <span className="text-[10px] text-slate-400 font-normal ml-1">
                          ({rev.user?.email || "N/A"})
                        </span>
                      </div>
                      
                      {/* Star Display */}
                      <div className="flex items-center text-amber-500 gap-0.5">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star key={idx} className={`w-3.5 h-3.5 ${idx < Number(rev.rating) ? 'fill-current' : 'text-gray-200'}`} />
                        ))}
                        <span className="text-slate-500 font-bold ml-1.5">{rev.rating} out of 5.0</span>
                      </div>

                      <p className="text-slate-650 bg-slate-55 bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-xs select-text">
                        {rev.comment}
                      </p>
                      
                      {rev.reply && (
                        <div className="border-l-2 border-indigo-200 pl-3 italic text-indigo-650 text-[11px] mt-1">
                          <span className="font-black">Owner Reply:</span> {rev.reply}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-start">
                      <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-black ${rev.isHidden ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-700'}`}>
                        {rev.isHidden ? 'Hidden' : 'Visible'}
                      </span>
                      <button 
                        onClick={() => handleModerateReview(rev.id, rev.isHidden)}
                        className={`text-slate-55 w-8 h-8 p-1.5 hover:bg-slate-50 border border-slate-205 rounded-md flex items-center justify-center transition cursor-pointer`}
                        title={rev.isHidden ? "Make Review Visible" : "Hide Review"}
                      >
                        {rev.isHidden ? <Eye className="w-3.5 h-3.5 text-gray-500" /> : <EyeOff className="w-3.5 h-3.5 text-rose-500" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* EXTRANET TAB 7: BOOKINGS ROSTERS */}
        {extranetTab === 'bookings' && !isFetchingFull && (
          <div className="bg-white border rounded-xl overflow-hidden shadow-xs" id="bookings-extranet-module">
            <div className="p-5 border-b">
              <h3 className="font-black text-sm uppercase tracking-wider text-slate-800">Historical Reservations Output ({propertyBookings.length})</h3>
              <p className="text-xs text-slate-400">Overview of booking blocks, status records, and escrow transactions.</p>
            </div>

            {propertyBookings.length === 0 ? (
              <div className="p-12 text-center text-slate-450 text-xs font-semibold">
                No historic reservation bookings registered on this property unit.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase font-black tracking-wide border-b">
                    <tr>
                      <th className="p-4">Tenant / Guest Profile</th>
                      <th className="p-4">Selected Interval</th>
                      <th className="p-4">Duration</th>
                      <th className="p-4">Finance Roster</th>
                      <th className="p-4">Operational Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-medium text-slate-700">
                    {propertyBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/50">
                        <td className="p-4">
                          <p className="font-bold text-slate-900">{b.user?.name || "Guest traveler"}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{b.user?.email || "No email"}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-slate-800">{b.startDate} </p>
                          <p className="text-[10px] text-slate-500">to {b.endDate}</p>
                        </td>
                        <td className="p-4">
                          <span className="bg-slate-100 px-2.5 py-1 rounded text-slate-600 font-bold whitespace-nowrap">
                            {b.totalNights || 1} nights
                          </span>
                        </td>
                        <td className="p-4">
                          <p className="font-black text-slate-900">{formatPrice(b.totalPrice)}</p>
                          <p className="text-[10px] text-slate-400 uppercase">via {b.paymentMethod || "Bank Transfer"}</p>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wide ${
                            b.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            b.status === 'COMPLETED' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                            b.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                            'bg-yellow-50 text-yellow-700 border border-yellow-100'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    );
  }


  // ==========================================
  // RENDER VIEW CASE 2: PROPERTIES OVERVIEW (No property selected)
  // WITH 5 INTERACTIVE MODULE TABS: Properties, Rooms, Categories, Amenities, Availability
  // ==========================================
  return (
    <div className="space-y-6 font-sans fade-in" id="property-dashboard-viewport">
      {/* Page Heading & Mini Metrics info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900" id="property-heading">Enterprise Property Management</h2>
          <p className="mt-1 text-sm text-gray-500" id="property-subheading">
            Oversee active hotel listings, configure room inventories, and audit booking status rates.
          </p>
        </div>

        {/* Global tab choices */}
        <div className="flex items-center gap-1 bg-white border border-gray-150 p-1 rounded-xl shrink-0 h-fit" id="dashboard-tab-anchors">
          {[
            { id: 'properties', label: 'All Listings', icon: Building },
            { id: 'rooms', label: 'Suite Inventory', icon: Bed },
            { id: 'categories', label: 'Categories Matrix', icon: Layers },
            { id: 'amenities', label: 'Amenities Ledger', icon: Compass },
            { id: 'availability', label: 'Availability Dashboard', icon: Calendar }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSelectedAmenityFilter(null); // Reset sub amenity filters
                }}
                className={`py-1.5 px-3.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
                  active 
                    ? 'bg-indigo-600 text-white shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* RENDER TAB 1: ALL PROPERTIES */}
      {activeTab === 'properties' && (
        <div className="space-y-6" id="dashboard-properties-tab-view">
          {/* Advanced filtration panel */}
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-xs grid grid-cols-1 gap-4 sm:grid-cols-4" id="property-filters-bar">
            {/* Direct text search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input 
                id="prop-search-input"
                type="text" 
                placeholder="Search name, host..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-slate-800 font-medium placeholder-slate-400 focus:outline-hidden"
              />
            </div>

            {/* City choice drop select */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400 shrink-0" />
              <select 
                id="prop-city-filter"
                value={cityFilter} 
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-gray-200 rounded-lg py-1.5 focus:ring-2 focus:ring-indigo-500 cursor-pointer focus:outline-hidden"
              >
                <option value="ALL">All Municipalities</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Operational Status drop select */}
            <select 
              id="prop-status-filter"
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-gray-200 text-slate-700 font-bold rounded-lg py-1.5 cursor-pointer focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value="ALL">All Roster Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="APPROVED">APPROVED</option>
              <option value="PENDING">PENDING</option>
              <option value="REJECTED">REJECTED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>

            {/* Custom Interactive amenity quick filter */}
            <select 
              value={selectedAmenityFilter || ''} 
              onChange={(e) => setSelectedAmenityFilter(e.target.value || null)}
              className="w-full text-xs bg-slate-50 border border-gray-200 text-indigo-700 font-bold rounded-lg py-1.5 cursor-pointer focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value="">No Filter by Amenity</option>
              <option value="Wi-Fi">Wi-Fi Wireless</option>
              <option value="Private Pool">Private Swimming Pool</option>
              <option value="Air Conditioning">Air Conditioning (AC)</option>
              <option value="Kitchen">Kitchen & Cooking stove</option>
              <option value="Free Parking">Free Car Parking</option>
              <option value="Gym">Fitness GYM</option>
              <option value="Spa">Healing Spa & Jacuzzi</option>
            </select>
          </div>

          {/* GRID OF HOTELS */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2" id="property-listings-grid">
            {filteredProperties.length === 0 ? (
              <div className="col-span-full rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center text-gray-400 font-bold text-xs" id="empty-propertys-card">
                <Building className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                No matching property listing matches found. Try widening search bounds.
              </div>
            ) : (
              filteredProperties.map((p) => {
                const isPending = p.status === 'PENDING' || p.status === 'WAITING';
                const isArchived = p.status === 'ARCHIVED';
                const isApproved = p.status === 'ACTIVE' || p.status === 'APPROVED';

                return (
                  <div 
                    key={p.id} 
                    id={`property-card-${p.id}`}
                    className={`overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs hover:shadow-md flex flex-col justify-between transition-all duration-200 ${
                      isArchived ? 'opacity-70' : ''
                    }`}
                  >
                    
                    {/* Information Box */}
                    <div className="p-5 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            {p.category?.name || 'Staying Option'}
                          </span>
                          <h3 className="text-base font-bold text-gray-900 mt-2 line-clamp-1">{p.name}</h3>
                          <p className="flex items-center gap-1 text-[11px] text-gray-550 mt-1 font-medium">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            {p.location} ({p.city})
                          </p>
                        </div>

                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide ${
                          isApproved ? 'bg-emerald-50 text-emerald-700' :
                          isPending ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {p.status}
                        </span>
                      </div>

                      <div className="border-t border-gray-100 pt-3.5 grid grid-cols-2 gap-4 text-xs font-medium">
                        <div>
                          <p className="text-gray-400 text-[10px] font-bold mb-0.5 uppercase tracking-wider">Owner Account</p>
                          <p className="font-extrabold text-slate-800 line-clamp-1">{p.tenant?.name || 'Local Host'}</p>
                          <p className="text-slate-405 text-slate-400 line-clamp-1 text-[11px] font-mono">{p.tenant?.email || 'N/A'}</p>
                        </div>

                        <div>
                          <p className="text-gray-400 text-[10px] font-bold mb-0.5 uppercase tracking-wider">Reserves status</p>
                          <p className="font-extrabold text-slate-800 flex items-center gap-1 text-[11px]">
                            <Building className="h-3.5 w-3.5 text-gray-400" />
                            {p.bookings?.length || 0} booking blocks
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs pt-2 border-t">
                        <span className="text-gray-400 font-bold">Aesthetic quality:</span>
                        <span className="flex items-center text-amber-500 font-extrabold text-xs gap-0.5 bg-amber-50 px-20 px-2 py-0.5 rounded-md">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          {Number(p.rating || 5).toFixed(1)} / 5.0
                        </span>
                      </div>
                    </div>

                    {/* Extranet Entrance and state togglers */}
                    <div className="border-t border-gray-100 bg-gray-50 px-5 py-3.5 flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-slate-900">
                        {formatPrice(p.basePrice)} <span className="text-[10px] text-gray-400 font-normal">/ night</span>
                      </span>

                      <div className="flex gap-1.5">
                        {/* Manage Extranet Button */}
                        <button 
                          onClick={() => setSelectedProperty(p)}
                          className="bg-white hover:bg-slate-100 text-indigo-705 border border-indigo-200 text-indigo-700 text-xs font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer shadow-2xs"
                          id={`manage-extranet-trigger-${p.id}`}
                        >
                          Manage Extranet <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* RENDER TAB 2: ROOM SUITES INVENTORY OVERVIEW (GLOBAL READONLY VIEW) */}
      {activeTab === 'rooms' && (
        <div className="bg-white border rounded-xl overflow-hidden shadow-xs" id="dashboard-rooms-tab-view">
          <div className="p-5 border-b flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm uppercase text-slate-800 tracking-wider">Suite Inventory Overview</h3>
              <p className="text-xs text-slate-400 mt-1">Review unified inventory statuses across all registered accommodations.</p>
            </div>
            
            {isFetchingAllRooms && <RefreshCw className="w-4 h-4 text-indigo-650 animate-spin" />}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase font-black border-b">
                <tr>
                  <th className="p-4">Room Name</th>
                  <th className="p-4">Parent Property</th>
                  <th className="p-4">Type Class</th>
                  <th className="p-4">Placement (Wing/Floor)</th>
                  <th className="p-4">Capacity</th>
                  <th className="p-4">Baseline Rate</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y font-medium text-slate-700">
                {allRoomsCombined.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-gray-400">
                      No Rooms recorded under active properties yet, or loading portfolio...
                    </td>
                  </tr>
                ) : (
                  allRoomsCombined.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-4 text-slate-900 font-extrabold flex items-center gap-2">
                        <Bed className="w-4.5 h-4.5 text-indigo-600 shrink-0" />
                        {r.name}
                      </td>
                      <td className="p-4 font-bold text-indigo-700">{r.propertyName || "StayEase Premium Complex"}</td>
                      <td className="p-4">{r.type}</td>
                      <td className="p-4 text-slate-505 text-slate-400">
                        {r.wing || 'Main Wing'} • {r.floor || 'Floor 1'}
                      </td>
                      <td className="p-4 font-bold text-slate-800">{r.capacity} Guests</td>
                      <td className="p-4 font-black text-slate-900">{formatPrice(r.basePrice)}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] uppercase font-black ${
                          r.status === 'Available' || r.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700' :
                          r.status === 'Occupied' || r.status === 'BOOKED' ? 'bg-amber-50 text-amber-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {r.status || 'Available'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RENDER TAB 3: CATEGORIES MATRIX */}
      {activeTab === 'categories' && (
        <div className="bg-white border rounded-xl overflow-hidden shadow-xs p-6 space-y-4" id="dashboard-categories-tab-view">
          <div>
            <h3 className="font-extrabold text-sm uppercase text-slate-800 tracking-wider">Staying Categories Distribution</h3>
            <p className="text-xs text-slate-400 mt-1">Review density metric highlights categorized dynamically.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categoriesStats.map((cat, idx) => (
              <div key={idx} className="bg-gray-50 border rounded-xl p-5 shadow-2xs space-y-3">
                <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-2.x px-2 py-0.5 rounded-full block w-fit">
                  Type Class
                </span>
                <h4 className="font-black text-lg text-slate-900">{cat.name}</h4>
                <div className="flex items-center justify-between text-xs font-bold pt-2 border-t">
                  <span className="text-slate-400">Listed Density:</span>
                  <span className="text-slate-800">{cat.count} listings</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400">Avg Cost / night:</span>
                  <span className="text-slate-900 font-extrabold">{formatPrice(cat.avgPrice)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RENDER TAB 4: AMENITIES LEDGER */}
      {activeTab === 'amenities' && (
        <div className="bg-white border rounded-xl overflow-hidden shadow-xs p-6 space-y-4" id="dashboard-amenities-tab-view">
          <div>
            <h3 className="font-extrabold text-sm uppercase text-slate-800 tracking-wider">Amenities Saturation Matrix</h3>
            <p className="text-xs text-slate-400 mt-1">Review which high-value resources are saturated most heavily.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="amenities-grid-view">
            {amenitiesStats.map((am, idx) => (
              <button 
                key={idx}
                onClick={() => {
                  setSelectedAmenityFilter(am.name);
                  setActiveTab('properties'); // Switch back to properties with filter applied
                }}
                className="bg-slate-50 hover:bg-slate-100 border text-left p-4 rounded-xl transition space-y-2 flex flex-col justify-between cursor-pointer"
              >
                <Compass className="w-5 h-5 text-indigo-600" />
                <div>
                  <h4 className="font-bold text-xs text-slate-800 line-clamp-1">{am.name}</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">{am.count} listings matching</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* RENDER TAB 5: AVAILABILITY DASHBOARD */}
      {activeTab === 'availability' && (
        <div className="bg-white border border-gray-150 rounded-xl p-6 shadow-xs space-y-4 max-w-2xl" id="dashboard-availability-tab-view">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-black text-sm uppercase text-slate-800 tracking-tight">StayEase Global Availability Metrics</h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                Accommodation inventories are queried in real-time. Hosts/Tenants can establish blocked calendars or declare peak-season multiplier indices to balance operations.
              </p>
            </div>
          </div>

          <div className="border-t pt-4 grid grid-cols-3 gap-4 text-center">
            <div className="bg-slate-50 p-4 rounded-xl">
              <span className="font-extrabold text-2xl text-slate-900 block">{properties.length}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mt-1">Total registered hotels</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl">
              <span className="font-extrabold text-2xl text-indigo-600 block">
                {properties.filter(p => p.status === 'ACTIVE' || p.status === 'APPROVED').length}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mt-1">Active distribution channels</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl">
              <span className="font-extrabold text-2xl text-rose-600 block">
                {properties.filter(p => p.status === 'ARCHIVED').length}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mt-1">Suspended or Archived listings</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

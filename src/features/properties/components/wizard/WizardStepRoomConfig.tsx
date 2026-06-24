import React, { useState } from 'react';
import { Plus, Trash2, Edit, BedDouble, Bath, Users, Image as ImageIcon, Info, PlusCircle, Check, HelpCircle } from 'lucide-react';
import { useLanguage } from '../../../../shared/i18n';

interface WizardStepRoomConfigProps {
  form: any;
  setForm: React.Dispatch<React.SetStateAction<any>>;
}

export function WizardStepRoomConfig({ form, setForm }: WizardStepRoomConfigProps) {
  const { language, formatCurrencyIDR } = useLanguage();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Active form state for add/edit a room
  const [roomForm, setRoomForm] = useState({
    id: '',
    name: '',
    type: 'Suite',
    capacity: 2,
    basePrice: 500000,
    description: '',
    bedCount: 1,
    bathCount: 1,
    quantity: 1,
    image: ''
  });

  const [validationError, setValidationError] = useState('');

  const rooms = form.rooms || [];

  const handleOpenAdd = () => {
    setRoomForm({
      id: '',
      name: '',
      type: 'Suite',
      capacity: 2,
      basePrice: form.basePrice || 500000,
      description: '',
      bedCount: 1,
      bathCount: 1,
      quantity: 1,
      image: form.imageUrls && form.imageUrls.length > 0 ? form.imageUrls[0] : ''
    });
    setValidationError('');
    setIsAdding(true);
    setEditingIndex(null);
  };

  const handleOpenEdit = (index: number) => {
    const r = rooms[index];
    setRoomForm({
      id: r.id || '',
      name: r.name,
      type: r.type || 'Suite',
      capacity: r.capacity || 2,
      basePrice: r.basePrice || 500000,
      description: r.description || '',
      bedCount: r.bedCount || 1,
      bathCount: r.bathCount || 1,
      quantity: r.quantity || 1,
      image: r.image || (form.imageUrls && form.imageUrls.length > 0 ? form.imageUrls[0] : '')
    });
    setValidationError('');
    setEditingIndex(index);
    setIsAdding(false);
  };

  const handleSaveRoom = () => {
    if (!roomForm.name.trim()) {
      setValidationError(language === 'en' ? 'Room Name is required' : 'Nama Kamar harus diisi');
      return;
    }
    if (roomForm.basePrice < 50000) {
      setValidationError(language === 'en' ? 'Minimum room price per night is Rp 50.000' : 'Harga sewa minimal Rp 50.000 per malam');
      return;
    }
    if (roomForm.capacity < 1) {
      setValidationError(language === 'en' ? 'Minimum room capacity is 1 guest' : 'Kapasitas kamar minimal 1 tamu');
      return;
    }

    setForm((prev: any) => {
      const currentRooms = [...(prev.rooms || [])];
      if (editingIndex !== null) {
        currentRooms[editingIndex] = roomForm;
      } else {
        currentRooms.push(roomForm);
      }
      return { ...prev, rooms: currentRooms };
    });

    setIsAdding(false);
    setEditingIndex(null);
    setValidationError('');
  };

  const handleRemoveRoom = (index: number) => {
    setForm((prev: any) => {
      const currentRooms = [...(prev.rooms || [])];
      currentRooms.splice(index, 1);
      return { ...prev, rooms: currentRooms };
    });
    
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const handleSelectImage = (url: string) => {
    setRoomForm(prev => ({ ...prev, image: url }));
  };

  const roomTypes = [
    { label: language === 'en' ? 'Studio' : 'Studio', value: 'Studio' },
    { label: language === 'en' ? 'Suite' : 'Suite', value: 'Suite' },
    { label: language === 'en' ? 'Deluxe' : 'Mewah (Deluxe)', value: 'Deluxe' },
    { label: language === 'en' ? 'Penthouse' : 'Griya Tawang (Penthouse)', value: 'Penthouse' },
    { label: language === 'en' ? 'Villa Wing' : 'Sayap Villa (Villa Wing)', value: 'Villa Wing' },
    { label: language === 'en' ? 'Standard Room' : 'Kamar Standar', value: 'Standard' }
  ];

  return (
    <div className="space-y-6">
      <div className="border-l-4 border-indigo-600 pl-3 py-1 flex justify-between items-center">
        <div>
          <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Step 5 of 8</h4>
          <h3 className="text-base font-black text-indigo-950">
            {language === 'en' ? 'Room configurations' : 'Konfigurasi Kamar/Suite'}
          </h3>
        </div>
        {!isAdding && editingIndex === null && (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-3.5 py-1.5 bg-indigo-900 hover:bg-indigo-850 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            {language === 'en' ? 'Add Room' : 'Tambah Kamar'}
          </button>
        )}
      </div>

      {/* Main Room Manager Area */}
      {!isAdding && editingIndex === null ? (
        <div className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
            {language === 'en' 
              ? 'Every property listing must contain at least one configured room entity. You can define multiple layouts to let guests pick their preferred suite.' 
              : 'Setiap iklan properti wajib didaftarkan dengan minimal satu entitas kamar. Anda dapat mendaftarkan beberapa jenis ruangan berbeda.'}
          </p>

          {rooms.length === 0 ? (
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/50 flex flex-col items-center justify-center gap-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full">
                <BedDouble className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h5 className="text-sm font-bold text-slate-750">
                  {language === 'en' ? 'No Room Configuration Registered' : 'Belum Ada Kamar Terdaftar'}
                </h5>
                <p className="text-xs text-slate-400 max-w-sm">
                  {language === 'en'
                    ? 'Begin by creating your first suite category, setting its capacity and separate nightly rates.'
                    : 'Mulailah dengan menambahkan tipe kamar pertama Anda, menentukan kapasitas dan harga per malam.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAdd}
                className="mt-2 px-4 py-2 bg-indigo-900 hover:bg-indigo-850 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                {language === 'en' ? 'Configure a Room Now' : 'Konfigurasi Kamar Baru'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rooms.map((room: any, index: number) => (
                <div key={index} className="border border-slate-100 rounded-2xl p-4 bg-white flex gap-4 hover:shadow-md transition-all group relative overflow-hidden">
                  <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                    <img 
                      src={room.image || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=300&q=80'} 
                      alt={room.name} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{room.name}</h4>
                        <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded leading-none">
                          {room.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-450 line-clamp-1 mt-0.5">{room.description || (language === 'en' ? 'No description' : 'Tidak ada deskripsi')}</p>
                      
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[10px] text-slate-500 font-semibold">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3 text-slate-400" /> {room.capacity} pax</span>
                        <span className="flex items-center gap-1"><BedDouble className="w-3 h-3 text-slate-400" /> {room.bedCount} beds</span>
                        <span className="flex items-center gap-1"><Bath className="w-3 h-3 text-slate-400" /> {room.bathCount} baths</span>
                        <span className="font-bold text-indigo-900 bg-slate-50 px-1 rounded-sm">Qty: {room.quantity}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center border-t border-slate-50 pt-2 mt-2">
                      <span className="text-xs font-black text-indigo-950 font-mono">
                        {formatCurrencyIDR(room.basePrice)} <span className="text-[10px] font-normal text-slate-400">/night</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(index)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-650 cursor-pointer"
                          title={language === 'en' ? 'Edit' : 'Edit'}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveRoom(index)}
                          className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-650 cursor-pointer"
                          title={language === 'en' ? 'Delete' : 'Hapus'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Add or Edit Room form
        <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h4 className="font-extrabold text-indigo-950 text-sm">
              {editingIndex !== null 
                ? (language === 'en' ? 'Modify Room Layout' : 'Modifikasi Penataan Kamar')
                : (language === 'en' ? 'Add New Room Category' : 'Tambah Kategori Kamar Baru')}
            </h4>
            <button 
              type="button"
              onClick={() => { setIsAdding(false); setEditingIndex(null); }}
              className="text-xs font-bold text-slate-450 hover:text-slate-700 cursor-pointer"
            >
              {language === 'en' ? 'Cancel' : 'Batal'}
            </button>
          </div>

          {validationError && (
            <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-750 text-xs font-bold flex items-center gap-1.5 animate-pulse">
              <Info className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Room Name */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-700 block uppercase tracking-wider">
                {language === 'en' ? 'Room Name / Label' : 'Nama / Label Kamar'}
              </label>
              <input
                type="text"
                value={roomForm.name}
                onChange={e => setRoomForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder={language === 'en' ? 'e.g. Master Ocean Suite' : 'Contoh: Master Ocean Suite'}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-indigo-650 bg-white"
              />
            </div>

            {/* Room Type Selection */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-700 block uppercase tracking-wider">
                {language === 'en' ? 'Room Category' : 'Kategori Kamar'}
              </label>
              <select
                value={roomForm.type}
                onChange={e => setRoomForm(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-indigo-650 bg-white"
              >
                {roomTypes.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Room Description */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[11px] font-black text-slate-700 block uppercase tracking-wider">
                {language === 'en' ? 'Room Description' : 'Deskripsi Kamar'}
              </label>
              <textarea
                value={roomForm.description}
                onChange={e => setRoomForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder={language === 'en' ? 'Private balcony with double glazed glass and modern fittings...' : 'Sensasi menginap dengan balkon pribadi berpemandangan hamparan laut...'}
                rows={2}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-indigo-650 bg-white leading-relaxed resize-none"
              />
            </div>

            {/* Price Per Night */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-700 block uppercase tracking-wider">
                {language === 'en' ? 'Nightly Rate (IDR)' : 'Tarif Sewa per Malam (IDR)'}
              </label>
              <input
                type="number"
                value={roomForm.basePrice}
                onChange={e => setRoomForm(prev => ({ ...prev, basePrice: parseInt(e.target.value) || 0 }))}
                min={50000}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-indigo-650 bg-white font-mono font-bold text-indigo-900"
              />
            </div>

            {/* Max Guest capacity */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-700 block uppercase tracking-wider">
                {language === 'en' ? 'Max Guests' : 'Kapasitas Maksimal Tamu'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={roomForm.capacity}
                  onChange={e => setRoomForm(prev => ({ ...prev, capacity: parseInt(e.target.value) || 1 }))}
                  min={1}
                  max={20}
                  className="w-20 px-3 py-2 border border-slate-200 rounded-xl text-xs text-center focus:outline-indigo-650 bg-white"
                />
                <span className="text-[11px] text-slate-400 font-semibold">{language === 'en' ? 'Guests' : 'Orang'}</span>
              </div>
            </div>

            {/* Beds count */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-700 block uppercase tracking-wider">
                {language === 'en' ? 'Bedrooms / Beds count' : 'Jumlah Tempat Tidur'}
              </label>
              <input
                type="number"
                value={roomForm.bedCount}
                onChange={e => setRoomForm(prev => ({ ...prev, bedCount: parseInt(e.target.value) || 1 }))}
                min={1}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-indigo-650 bg-white"
              />
            </div>

            {/* Bathrooms count */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-700 block uppercase tracking-wider">
                {language === 'en' ? 'Bathrooms count' : 'Jumlah Kamar Mandi'}
              </label>
              <input
                type="number"
                value={roomForm.bathCount}
                onChange={e => setRoomForm(prev => ({ ...prev, bathCount: parseInt(e.target.value) || 1 }))}
                min={1}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-indigo-650 bg-white"
              />
            </div>

            {/* Room Quantity (Inventories) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-700 block uppercase tracking-wider">
                {language === 'en' ? 'Quantity Available' : 'Jumlah Kamar Tersedia'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={roomForm.quantity}
                  onChange={e => setRoomForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  min={1}
                  className="w-20 px-3 py-2 border border-slate-200 rounded-xl text-xs text-center focus:outline-indigo-650 bg-white"
                />
                <span className="text-[11px] text-slate-400 font-semibold">{language === 'en' ? 'Room units' : 'Unit Kamar'}</span>
              </div>
            </div>

            {/* Room Primary Image selection from uploaded photos */}
            <div className="md:col-span-2 space-y-2 mt-2">
              <label className="text-[11px] font-black text-slate-700 block uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                {language === 'en' ? 'Select Room Cover Photo' : 'Pilih Foto Utama Kamar'}
              </label>
              <p className="text-[10px] text-slate-400 select-none">
                {language === 'en' 
                  ? 'Pick a cover photo for this room from your property photographs list uploaded in Step 4.' 
                  : 'Pilih satu foto untuk representasi kamar ini dari daftar foto properti yang telah diunggah di Step 4.'}
              </p>

              {form.imageUrls && form.imageUrls.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1.5">
                  {form.imageUrls.map((url: string, idx: number) => {
                    const isSelected = roomForm.image === url;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectImage(url)}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                          isSelected ? 'border-indigo-600 scale-95 shadow-md' : 'border-slate-100 hover:border-slate-350'
                        }`}
                      >
                        <img src={url} alt={`StayPhoto ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        {isSelected && (
                          <span className="absolute inset-0 bg-indigo-950/20 flex items-center justify-center">
                            <span className="bg-indigo-600 text-white rounded-full p-0.5 shadow-xs">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-lg leading-relaxed border border-amber-100">
                  {language === 'en' 
                    ? 'No property photos found. Please go back to Step 4 to upload at least one stay photograph first.' 
                    : 'Belum ada foto hunian terunggah. Silakan kembali ke Step 4 untuk mengunggah foto terlebih dahulu.'}
                </div>
              )}

              {/* Or manual URL input as a secondary flexible fallback */}
              <div className="space-y-1.5 pt-2">
                <label className="text-[10px] font-bold text-slate-500 block">
                  {language === 'en' ? 'Or paste a custom direct image URL' : 'Atau tempel URL gambar kustom'}
                </label>
                <input
                  type="text"
                  value={roomForm.image}
                  onChange={e => setRoomForm(prev => ({ ...prev, image: e.target.value }))}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-indigo-650 bg-white"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 mt-4">
            <button
              type="button"
              onClick={() => { setIsAdding(false); setEditingIndex(null); }}
              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-600 cursor-pointer"
            >
              {language === 'en' ? 'Discard' : 'Batalkan'}
            </button>
            <button
              type="button"
              onClick={handleSaveRoom}
              className="px-4 py-1.5 bg-indigo-900 hover:bg-indigo-850 text-white rounded-lg text-xs font-black cursor-pointer shadow-xs"
            >
              {language === 'en' ? 'Apply Layout' : 'Terapkan Kamar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

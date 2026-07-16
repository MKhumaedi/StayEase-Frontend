import React, { useState, useEffect } from 'react';
import { Room } from '../../../types';
import { Plus, Hotel, Trash2, HelpCircle } from 'lucide-react';
import { useLanguage } from '../../../shared/i18n';

export default function TenantRooms() {
  const { language, formatCurrencyIDR } = useLanguage();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('Master Suite');
  const [capacity, setCapacity] = useState(2);
  const [price, setPrice] = useState(350);
  const [wing, setWing] = useState('North Wing');

  useEffect(() => {
    fetch('/api/properties/prop-4')
      .then(res => res.json())
      .then(data => setRooms(data.rooms || []));
  }, []);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const newRoom: Room = {
      id: `room-${Date.now()}`,
      propertyId: 'prop-4',
      name,
      type,
      capacity,
      basePrice: price,
      status: 'Available',
      availabilityStatus: 'Tersedia',
      wing,
      floor: 'Floor 1'
    };
    setRooms(p => [newRoom, ...p]);
    setName('');
    setShowModal(false);
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-indigo-950 font-display">
            {language === 'en' ? 'Rooms Inventory' : 'Inventaris Kamar'}
          </h2>
          <p className="text-xs text-slate-500">
            {language === 'en' ? 'Configure standard suites, room capacities, wings, floors, and active statuses' : 'Atur kategori kamar, kapasitas tamu maksimal, penempatan sayap gedung, lantai, dan status aktif'}
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-indigo-900 hover:bg-indigo-850 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1 cursor-pointer">
          <Plus className="w-4 h-4" /> {language === 'en' ? 'Add Room Suite' : 'Tambah Jenis Kamar baru'}
        </button>
      </div>

      {showModal && (
        <div className="bg-slate-900/50 backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateRoom} className="bg-white p-6 rounded-2xl border w-full max-w-md shadow-lg flex flex-col gap-4">
            <h3 className="font-bold text-slate-800 text-lg font-display">
              {language === 'en' ? 'Register New Suite' : 'Daftarkan Kamar baru'}
            </h3>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                {language === 'en' ? 'Room Name / Number' : 'Nama / Nomor Kamar'}
              </label>
              <input required type="text" placeholder="e.g. Suite 501" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-lg p-2.5 focus:outline-hidden" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  {language === 'en' ? 'Type class' : 'Tipe kelas'}
                </label>
                <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 focus:outline-hidden">
                  <option>Master Suite</option>
                  <option>Executive Suite</option>
                  <option>Studio</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  {language === 'en' ? 'Wing Location' : 'Penempatan Sayap'}
                </label>
                <input required type="text" value={wing} onChange={e => setWing(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 focus:outline-hidden" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  {language === 'en' ? 'Base Price' : 'Harga Dasar'}
                </label>
                <input required type="number" value={price} onChange={e => setPrice(parseInt(e.target.value))} className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 focus:outline-hidden" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  {language === 'en' ? 'Max Guests' : 'Tamu Maksimal'}
                </label>
                <input required type="number" value={capacity} onChange={e => setCapacity(parseInt(e.target.value))} className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 focus:outline-hidden" />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-2">
              <button type="button" onClick={() => setShowModal(false)} className="text-xs font-semibold text-slate-500 px-4 py-2 border rounded-lg hover:bg-slate-50">
                {language === 'en' ? 'Cancel' : 'Batal'}
              </button>
              <button type="submit" className="bg-indigo-900 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-indigo-850">
                {language === 'en' ? 'Record Suite' : 'Simpan Kamar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
        <table className="w-full text-xs text-left text-slate-550">
          <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 border-b border-slate-100">
            <tr>
              <th className="p-3">Room Name</th>
              <th className="p-3">Type</th>
              <th className="p-3">Wing/Floor</th>
              <th className="p-3">Max Guests</th>
              <th className="p-3">Base Price</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 font-medium">
            {rooms.map((r, idx) => (
              <tr key={r.id || `room-${idx}`} className="hover:bg-slate-55/40">
                <td className="p-3 text-slate-800 font-bold flex items-center gap-1.5">
                  <Hotel className="w-4 h-4 text-indigo-650" /> {r.name}
                </td>
                <td className="p-3 text-slate-550">{r.type}</td>
                <td className="p-3 text-slate-500">{r.wing} • {r.floor || 'Floor 1'}</td>
                <td className="p-3 text-slate-800 font-bold">{r.capacity} Guests</td>
                <td className="p-3 text-slate-800 font-black">{formatCurrencyIDR(r.basePrice)} / night</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                    (r.availabilityStatus || 'Tersedia') === 'Tersedia' ? 'bg-emerald-50 text-emerald-600' :
                    (r.availabilityStatus || 'Tersedia') === 'Hampir Habis' ? 'bg-amber-50 text-amber-600' :
                    (r.availabilityStatus || 'Tersedia') === 'Penuh' ? 'bg-red-50 text-red-600' :
                    'bg-slate-150 text-slate-650'
                  }`}>
                    {r.availabilityStatus || 'Tersedia'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

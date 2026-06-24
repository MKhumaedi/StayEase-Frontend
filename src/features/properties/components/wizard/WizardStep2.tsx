import React from 'react';
import { OpenStreetMap, OsmAutocomplete, NominatimService } from '../../../maps';
import { useLanguage } from '../../../../shared/i18n';

interface WizardStep2Props {
  form: any;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function WizardStep2({ form, setForm, onChange }: WizardStep2Props) {
  const { language } = useLanguage();

  const handleQuickLoc = (city: string, province: string, lat: number, lng: number) => {
    setForm((prev: any) => ({
      ...prev,
      city,
      province,
      fullAddress: `${city} Luxury Boulevard`,
      latitude: lat,
      longitude: lng,
      country: 'Indonesia'
    }));
  };

  const handleOsmPlaceSelect = async (suggestion: any) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lng);

    setForm((prev: any) => ({
      ...prev,
      fullAddress: suggestion.displayName,
      latitude: lat,
      longitude: lng
    }));

    try {
      const details = await NominatimService.reverseGeocode(lat, lng);
      if (details?.address) {
        const addr = details.address;
        const city = addr.city || addr.town || addr.municipality || addr.suburb || addr.county || '';
        const province = addr.state || addr.region || '';
        const country = addr.country || 'Indonesia';
        const postalCode = addr.postcode || '';

        setForm((prev: any) => ({
          ...prev,
          city: city || prev.city,
          province: province || prev.province,
          country: country || prev.country,
          postalCode: postalCode || prev.postalCode
        }));
      }
    } catch (err) {
      console.error('OSM reverse geocode during select failed:', err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-l-4 border-indigo-600 pl-3 py-1">
        <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Step 2 of 8</h4>
        <h3 className="text-base font-black text-indigo-950">{language === 'en' ? 'Location Specification' : 'Spesifikasi Lokasi'}</h3>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-indigo-950">{language === 'en' ? 'Search Address / Location' : 'Cari Alamat / Lokasi'}</label>
          <OsmAutocomplete 
            onSelect={handleOsmPlaceSelect}
            placeholder={language === 'en' ? 'Search for your property location (e.g. Bali Hyatt)...' : 'Cari lokasi properti Anda (misal: Bali Hyatt)...'}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-indigo-950">{language === 'en' ? 'Full Address' : 'Alamat Lengkap'} <span className="text-rose-500">*</span></label>
            <input 
              type="text"
              name="fullAddress"
              value={form.fullAddress}
              onChange={onChange}
              className="bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-800"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-indigo-950">{language === 'en' ? 'City' : 'Kota'} <span className="text-rose-500">*</span></label>
            <input 
              type="text"
              name="city"
              value={form.city}
              onChange={onChange}
              className="bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-800"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-indigo-950">{language === 'en' ? 'Province / State' : 'Provinsi'} <span className="text-rose-500">*</span></label>
            <input 
              type="text"
              name="province"
              value={form.province}
              onChange={onChange}
              className="bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-800"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-indigo-950">{language === 'en' ? 'Postal Code' : 'Kode Pos'}</label>
            <input 
              type="text"
              name="postalCode"
              value={form.postalCode}
              onChange={onChange}
              className="bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-800"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5 pt-1">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-indigo-950">{language === 'en' ? 'Latitude' : 'Garis Lintang'}</label>
            <input 
              type="number"
              name="latitude"
              step="any"
              value={form.latitude}
              onChange={(e) => setForm((prev: any) => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
              className="bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-800"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-indigo-950">{language === 'en' ? 'Longitude' : 'Garis Bujur'}</label>
            <input 
              type="number"
              name="longitude"
              step="any"
              value={form.longitude}
              onChange={(e) => setForm((prev: any) => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
              className="bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-800"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1 flex-wrap select-none">
          <span className="text-[10px] text-slate-400 font-bold uppercase">{language === 'en' ? 'Presets:' : 'Preset:'}</span>
          <button type="button" onClick={() => handleQuickLoc('Bali', 'Kuta', -8.7209, 115.1691)} className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg font-bold cursor-pointer">Kuta, Bali</button>
          <button type="button" onClick={() => handleQuickLoc('Jakarta', 'DKI Jakarta', -6.2088, 106.8456)} className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg font-bold cursor-pointer">Jakarta</button>
          <button type="button" onClick={() => handleQuickLoc('Bandung', 'Jawa Barat', -6.9175, 107.6191)} className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg font-bold cursor-pointer">Bandung</button>
        </div>

        <div className="pt-2">
          <label className="text-xs font-bold text-indigo-950 block mb-1.5">{language === 'en' ? 'Interactive Map Preview' : 'Pratinjau Peta Interaktif'}</label>
          <OpenStreetMap 
            lat={form.latitude} 
            lng={form.longitude} 
            zoom={14}
            interactive={true}
            height="200px"
            onCoordinatesChange={(lat, lng) => setForm((prev: any) => ({ ...prev, latitude: lat, longitude: lng }))}
          />
        </div>
      </div>
    </div>
  );
}

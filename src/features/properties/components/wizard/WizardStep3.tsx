import React, { useState } from 'react';
import { ImagePlus, X, Plus } from 'lucide-react';
import { useLanguage } from '../../../../shared/i18n';

const STOCK_PHOTOS = [
  { name: 'Luxury modern villa with infinity pool', url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80' },
  { name: 'Cliffside ocean-view mansion', url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80' },
  { name: 'Elegant penthouse skyline suite', url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80' },
  { name: 'Aesthetic cabin forest sanctuary', url: 'https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&w=800&q=80' }
];

interface WizardStep3Props {
  form: any;
  setForm: React.Dispatch<React.SetStateAction<any>>;
}

export function WizardStep3({ form, setForm }: WizardStep3Props) {
  const { language } = useLanguage();
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFiles = (files: FileList) => {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const base64Url = event.target.result as string;
          setForm((prev: any) => ({
            ...prev,
            imageUrls: [...prev.imageUrls, base64Url]
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleAddStock = (url: string) => {
    setForm((prev: any) => ({
      ...prev,
      imageUrls: [...prev.imageUrls, url]
    }));
  };

  const handleRemovePhoto = (index: number) => {
    setForm((prev: any) => {
      const urls = prev.imageUrls.filter((_: string, idx: number) => idx !== index);
      let coverIdx = prev.coverImageIndex;
      if (coverIdx >= urls.length) {
        coverIdx = Math.max(0, urls.length - 1);
      }
      return {
        ...prev,
        imageUrls: urls,
        coverImageIndex: coverIdx
      };
    });
  };

  return (
    <div className="space-y-4">
      <div className="border-l-4 border-indigo-600 pl-3 py-1">
        <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Step 4 of 8</h4>
        <h3 className="text-base font-black text-indigo-950">{language === 'en' ? 'Visual Photography Gallery' : 'Galeri Foto Properti'}</h3>
      </div>

      <div className="space-y-4">
        {/* Drag n Drop upload */}
        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`w-full border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
            dragActive 
              ? 'border-indigo-600 bg-indigo-50/50' 
              : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50'
          }`}
        >
          <input 
            type="file"
            id="file-upload"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <ImagePlus className="w-8 h-8 mx-auto text-slate-400 mb-2 animate-pulse" />
          <p className="text-xs font-bold text-slate-700">
            {language === 'en' ? 'Drag and drop property photos, or ' : 'Tarik & lepas foto properti ke sini, atau '}
            <label htmlFor="file-upload" className="text-indigo-600 hover:underline cursor-pointer">
              {language === 'en' ? 'browse files' : 'cari berkas'}
            </label>
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Supports JPEG, PNG, WEBP (offline base64 conversions)</p>
        </div>

        {/* Stock stays photos */}
        <div>
          <span className="text-[10px] font-bold text-slate-450 uppercase block mb-1.5">{language === 'en' ? 'Or select Preset Stock Photos:' : 'Atau pilih dari foto beresolusi tinggi preset:'}</span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {STOCK_PHOTOS.map((ph, idx) => (
              <div 
                key={idx}
                onClick={() => handleAddStock(ph.url)}
                className="relative aspect-video rounded-xl overflow-hidden cursor-pointer group border border-slate-150 hover:border-indigo-600 transition-colors"
                title={ph.name}
              >
                <img src={ph.url} alt={ph.name} className="w-full h-full object-cover group-hover:scale-102 transition-all duration-300" />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Plus className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Previews display */}
        {form.imageUrls.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-bold text-indigo-950 block">{language === 'en' ? 'Your Loaded Photos' : 'Foto yang Dimuat'} ({form.imageUrls.length})</span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {form.imageUrls.map((url: string, i: number) => (
                <div 
                  key={i}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 ${
                    form.coverImageIndex === i ? 'border-indigo-600 shadow-md' : 'border-slate-100'
                  }`}
                >
                  <img src={url} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                  
                  {form.coverImageIndex === i ? (
                    <span className="absolute top-2 left-2 bg-indigo-600 text-white text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md">
                      Cover
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setForm((prev: any) => ({ ...prev, coverImageIndex: i }))}
                      className="absolute top-2 left-2 bg-white/90 hover:bg-indigo-600 hover:text-white text-slate-800 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md transition-colors"
                    >
                      Set Cover
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(i)}
                    className="absolute top-2 right-2 p-1 bg-white/90 text-rose-600 rounded-md hover:bg-rose-50"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { ImagePlus, X, Plus, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../../../shared/i18n';
import { useAuth } from '../../../../shared/context/AuthContext';

const STOCK_PHOTOS = [
  { name: 'Luxury modern villa with infinity pool', url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80' },
  { name: 'Cliffside ocean-view mansion', url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80' },
  { name: 'Elegant penthouse skyline suite', url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80' },
  { name: 'Aesthetic cabin forest sanctuary', url: 'https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&w=800&q=80' }
];

const MAX_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

interface WizardStep3Props {
  form: any;
  setForm: React.Dispatch<React.SetStateAction<any>>;
}

export function WizardStep3({ form, setForm }: WizardStep3Props) {
  const { language } = useLanguage();
  const { token } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const uploadFileToServer = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch('/api/uploads/upload', {
      method: 'POST',
      headers,
      body: formData
    });

    if (!res.ok) {
      let errText = 'Upload failed';
      try {
        const errJson = await res.json();
        if (errJson.error) errText = errJson.error;
      } catch (e) {
        errText = await res.text();
      }
      throw new Error(errText);
    }

    const data = await res.json();
    if (!data.url) {
      throw new Error('Server returned invalid image response URL');
    }
    return data.url;
  };

  const processFiles = async (files: FileList | File[]) => {
    setUploadError(null);
    setUploadSuccess(null);
    const fileArray = Array.from(files);

    if (fileArray.length === 0) return;

    // Validate files on client side
    for (const file of fileArray) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setUploadError(
          language === 'en'
            ? `Invalid file format for "${file.name}". Only JPG, JPEG, PNG, and WEBP images are allowed.`
            : `Format berkas "${file.name}" tidak valid. Hanya gambar JPG, JPEG, PNG, dan WEBP yang diperbolehkan.`
        );
        return;
      }

      if (file.size > MAX_SIZE_BYTES) {
        setUploadError(
          language === 'en'
            ? `File "${file.name}" exceeds the 1 MB size limit (Size: ${(file.size / (1024 * 1024)).toFixed(2)} MB).`
            : `Berkas "${file.name}" melebihi batas ukuran 1 MB (Ukuran: ${(file.size / (1024 * 1024)).toFixed(2)} MB).`
        );
        return;
      }
    }

    setIsUploading(true);
    const newUploadedUrls: string[] = [];

    try {
      for (const file of fileArray) {
        const uploadedUrl = await uploadFileToServer(file);
        newUploadedUrls.push(uploadedUrl);
      }

      setForm((prev: any) => ({
        ...prev,
        imageUrls: [...prev.imageUrls, ...newUploadedUrls]
      }));

      setUploadSuccess(
        language === 'en'
          ? `Successfully uploaded ${newUploadedUrls.length} image(s).`
          : `Berhasil mengunggah ${newUploadedUrls.length} gambar.`
      );
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload images to server.');
    } finally {
      setIsUploading(false);
    }
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
      e.target.value = ''; // Reset input value to allow re-uploading same file
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
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
          
          {isUploading ? (
            <div className="py-2">
              <Loader2 className="w-8 h-8 mx-auto text-indigo-600 animate-spin mb-2" />
              <p className="text-xs font-bold text-indigo-900">
                {language === 'en' ? 'Uploading images via multipart/form-data...' : 'Mengunggah gambar via multipart/form-data...'}
              </p>
            </div>
          ) : (
            <>
              <ImagePlus className="w-8 h-8 mx-auto text-slate-400 mb-2 animate-pulse" />
              <p className="text-xs font-bold text-slate-700">
                {language === 'en' ? 'Drag and drop property photos, or ' : 'Tarik & lepas foto properti ke sini, atau '}
                <label htmlFor="file-upload" className="text-indigo-600 hover:underline cursor-pointer">
                  {language === 'en' ? 'browse files' : 'cari berkas'}
                </label>
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                {language === 'en' ? 'Supports JPG, JPEG, PNG, WEBP (Max 1 MB per file)' : 'Mendukung JPG, JPEG, PNG, WEBP (Maksimal 1 MB per berkas)'}
              </p>
            </>
          )}
        </div>

        {/* Validation Error Banner */}
        {uploadError && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-none" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Success Banner */}
        {uploadSuccess && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-medium">
            <CheckCircle className="w-4 h-4 flex-none" />
            <span>{uploadSuccess}</span>
          </div>
        )}

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


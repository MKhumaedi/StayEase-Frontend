import React, { useState, useRef } from 'react';
import { UploadCloud, FileImage, ClipboardCheck, Trash2, RefreshCw } from 'lucide-react';
import { processImageToWebp } from '../../uploads/services/ImageProcessor';
import { useAuth } from '../../../shared/context/AuthContext';

export interface UploadedProofInfo {
  url: string;
  originalName: string;
  webpName: string;
  size: number;
}

interface PaymentProofUploaderProps {
  onUploadSuccess: (info: UploadedProofInfo) => void;
  onClear: () => void;
}

export function formatSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function PaymentProofUploader({ onUploadSuccess, onClear }: PaymentProofUploaderProps) {
  const { token } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'converting' | 'uploading' | 'success'>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: number; resolution?: string; url?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const simulateProgress = (finishedCallback: () => void) => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          finishedCallback();
          return 100;
        }
        return prev + 20;
      });
    }, 100);
  };

  const uploadFile = async (webpBlob: Blob, originalName: string, webpName: string, resolution: string) => {
    try {
      setStatus('uploading');
      simulateProgress(async () => {
        const formData = new FormData();
        formData.append('file', webpBlob, webpName);
        const res = await fetch('/api/uploads/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        if (!res.ok) throw new Error('Upload server error');
        const data = await res.json();
        setFileDetails({ name: originalName, size: webpBlob.size, resolution, url: data.url });
        setStatus('success');
        onUploadSuccess({ url: data.url, originalName, webpName, size: webpBlob.size });
      });
    } catch (err: any) {
      setError(err.message || 'Failed to upload');
      setStatus('idle');
    }
  };

  const handleFileProcess = async (file: File) => {
    setError(null);
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10 MB maximum limit.');
      return;
    }
    try {
      setStatus('processing');
      setStatus('converting');
      const { blob, width, height } = await processImageToWebp(file);
      const webpName = file.name.substring(0, file.name.lastIndexOf('.')) + '.webp';
      await uploadFile(blob, file.name, webpName, `${width}x${height}`);
    } catch (err: any) {
      setError('Error processing image. Make sure it is an image file.');
      setStatus('idle');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const renderStatusText = () => {
    if (status === 'processing') return 'Menganalisis berkas...';
    if (status === 'converting') return 'Mengonversi gambar ke WebP...';
    if (status === 'uploading') return `Mengunggah berkas (${progress}%)...`;
    return '';
  };

  if (status !== 'idle' && status !== 'success') {
    return (
      <div className="border border-slate-200 bg-white rounded-2xl p-6 text-center shadow-xs">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
        <p className="font-bold text-sm text-slate-700">{renderStatusText()}</p>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-4 max-w-xs mx-auto">
          <div className="bg-indigo-600 h-full transition-all duration-100" style={{ width: `${progress}%` }} />
        </div>
      </div>
    );
  }

  if (status === 'success' && fileDetails) {
    return (
      <div className="border border-emerald-150 bg-emerald-20/40 rounded-2xl p-5 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-xl overflow-hidden bg-white border border-slate-150 flex-none relative">
            <img src={fileDetails.url} alt="Proof preview" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs mb-1">
              <ClipboardCheck className="w-4 h-4" /> Bukti Berhasil Diproses
            </div>
            <p className="text-xs font-black text-slate-800 truncate mb-0.5">{fileDetails.name}</p>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] text-slate-500 font-medium">
              <span>Ukuran: {formatSize(fileDetails.size)}</span>
              <span>•</span>
              <span>Resolusi: {fileDetails.resolution}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => fileInputRef.current?.click()} className="p-1.5 text-slate-550 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer" title="Ganti Berkas">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => { setStatus('idle'); setFileDetails(null); onClear(); }} className="p-1.5 text-slate-550 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" title="Hapus">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        <input ref={fileInputRef} type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handleChange} />
      </div>
    );
  }

  return (
    <div onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop} className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all relative ${dragActive ? 'border-indigo-600 bg-indigo-50/10 scale-[1.01]' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 hover:border-slate-300'}`}>
      <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-2.5" />
      <span className="block font-black text-xs text-slate-700 mb-1">Seret & lepas bukti transfer di sini</span>
      <span className="block text-[10px] text-slate-500 mb-3 font-medium">Atau klik untuk menelusuri berkas (JPG, PNG, WEBP maks 10MB)</span>
      <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-700 shadow-xs cursor-pointer">Pilih Berkas</button>
      {error && <p className="text-red-650 text-[10px] font-bold mt-2.5">{error}</p>}
      <input ref={fileInputRef} type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handleChange} />
    </div>
  );
}

import React from 'react';
import { Upload, X } from 'lucide-react';

interface UploadFileComponentProps {
  onFileSelect: (file: File) => void;
  onClear: () => void;
  file: File | null;
  loading: boolean;
}

export const UploadFileComponent: React.FC<UploadFileComponentProps> = ({ 
  onFileSelect, 
  onClear, 
  file, 
  loading 
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-xl flex flex-col items-center justify-center text-center transition-all hover:shadow-2xl">
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${file ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-50 text-indigo-500'}`}>
        <Upload className={`w-10 h-10 ${loading ? 'animate-bounce' : ''}`} />
      </div>

      {!file ? (
        <>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2 italic uppercase tracking-tight">Seleccionar Archivo Excel</h2>
          <p className="text-xs text-gray-400 mb-8 max-w-xs font-medium uppercase tracking-widest leading-relaxed">
            Formatos aceptados: .xlsx<br />
            Asegúrese de seguir el orden de carga jerárquico.
          </p>
          <label className="cursor-pointer">
            <input type="file" accept=".xlsx" onChange={handleFileChange} className="hidden" />
            <div className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-500/30 transition-all hover:scale-105">
              Examinar Archivos
            </div>
          </label>
        </>
      ) : (
        <>
          <h2 className="text-xl font-black text-emerald-600 mb-2 italic uppercase">Archivo Seleccionado</h2>
          <div className="flex items-center gap-3 px-6 py-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 mb-8">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{file.name}</span>
            <button onClick={onClear} className="text-gray-400 hover:text-red-500 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

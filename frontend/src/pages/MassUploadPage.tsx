import React, { useState } from 'react';
import { UploadFileComponent } from '../components/UploadFileComponent';
import { DryRunResultComponent } from '../components/DryRunResultComponent';
import { API_BASE_URL } from '../config/api';
import { Database, LayoutTemplate, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '../components/Button';

export const MassUploadPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDryRun = async (selectedFile: File) => {
    setFile(selectedFile);
    setLoading(true);
    setResult(null);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(`${API_BASE_URL}/mass_upload/dry-run`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Error al procesar el archivo. Verifique el formato e intente nuevamente.');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!file) return;
    setExecuting(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    // Hardening: bypass dryRun internally as we already did it and it was successful
    formData.append('skip_dry_run', 'true');

    try {
      const response = await fetch(`${API_BASE_URL}/mass_upload/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        setResult({ ...result, executeSuccess: true, inserted_rows: data.inserted_rows });
      } else {
        setError(data.error || 'Error crítico durante la persistencia de datos.');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión durante la ejecución final.');
    } finally {
      setExecuting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between p-8 bg-gradient-to-br from-indigo-700 to-indigo-900 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
         <div className="absolute -top-10 -right-10 opacity-10 group-hover:scale-110 transition-transform">
             <Database className="w-64 h-64" />
         </div>
         <div className="relative z-10">
            <h1 className="text-4xl font-black italic uppercase tracking-tighter flex items-center gap-3">
               Módulo de Carga Masiva
               <span className="text-xs bg-white/20 px-2 py-1 rounded-lg not-italic font-black text-white/50 border border-white/10 uppercase tracking-widest">Enterprise</span>
            </h1>
            <p className="text-sm font-medium text-indigo-100 max-w-lg mt-2 uppercase tracking-wide opacity-80">
               Motor sgc-core-v2.7.0 determinístico con validación global, mapeo centralizado y transaccionalidad total.
            </p>
         </div>
         {result && (
            <div className="relative z-10 mt-6 md:mt-0">
               <Button variant="secondary" onClick={reset} className="rounded-full font-black uppercase text-[10px] tracking-widest h-12 px-8 bg-white/10 text-white hover:bg-white/20 border-white/10 border backdrop-blur-md italic">
                   Restablecer Sesión
               </Button>
            </div>
         )}
      </div>

      {/* 2. Grid for Status Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-4 font-black uppercase tracking-tighter text-[9px] italic">
         <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 text-indigo-600">
             <LayoutTemplate className="w-3 h-3" /> multi-hoja sincronizado
         </div>
         <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 text-indigo-600">
             <ShieldCheck className="w-3 h-3" /> rbac:mass_upload:execute
         </div>
         <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 text-indigo-600">
             <Zap className="w-3 h-3" /> mapping engine core
         </div>
         <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 text-indigo-600">
             <Database className="w-3 h-3" /> prisma transactions v2
         </div>
      </div>

      {/* 3. Logic: Upload OR Results OR Execution Success */}
      <div className="max-w-6xl mx-auto space-y-12">
        {result?.executeSuccess ? (
          <div className="bg-emerald-500 p-20 rounded-[5rem] shadow-2xl shadow-emerald-500/30 text-center text-white animate-in zoom-in-95 duration-500">
             <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce font-black text-3xl">🎉</div>
             <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-4">¡Carga Masiva Exitosa!</h2>
             <p className="text-lg opacity-80 max-w-lg mx-auto mb-10 leading-relaxed font-bold uppercase tracking-tight">
               Se han persistido {result.inserted_rows} registros en el sistema sin errores reportados. 
               La base de datos se ha actualizado correctamente.
             </p>
             <Button variant="secondary" onClick={reset} className="px-12 py-5 rounded-full font-black uppercase tracking-widest text-[10px] bg-white text-emerald-600 hover:bg-white/90">
                 Finalizar y volver
             </Button>
          </div>
        ) : !result ? (
          <div className="max-w-3xl mx-auto">
             <UploadFileComponent 
               onFileSelect={handleDryRun} 
               onClear={reset} 
               file={file} 
               loading={loading} 
             />
             
             {error && (
               <div className="mt-8 p-8 bg-red-50 dark:bg-red-900/10 border-2 border-red-100 dark:border-red-900/20 rounded-[3rem] text-red-600 text-center animate-in shake duration-500 flex flex-col items-center">
                  <span className="font-black italic uppercase text-xs mb-2">Error de Sistema</span>
                  <p className="text-sm font-bold opacity-80 max-w-sm">{error}</p>
                  <Button variant="secondary" className="mt-4 text-[9px] rounded-xl text-red-500 border-red-100" onClick={reset}>Reintentar</Button>
               </div>
             )}
          </div>
        ) : (
          <DryRunResultComponent 
            stats={result.summary} 
            rowErrors={result.errors || []} 
            globalErrors={result.global_errors || []} 
            readyToExecute={result.ready_to_execute} 
            onExecute={handleExecute}
            loading={executing}
          />
        )}
      </div>

      {/* 4. Footer Guidelines */}
      {!result && !error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto px-10">
              <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 text-center relative group opacity-60 hover:opacity-100 transition-all">
                  <div className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black absolute -top-4 left-1/2 -ml-5 shadow-lg group-hover:scale-110 transition-transform">1</div>
                  <h4 className="font-black italic uppercase text-indigo-600 text-[10px] tracking-widest mb-2 mt-4">Paso 1: Validación</h4>
                  <p className="text-[10px] font-bold text-gray-500 leading-normal uppercase">El sistema escanea todas las hojas, valida formatos y cruza relaciones.</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 text-center relative group opacity-60 hover:opacity-100 transition-all">
                  <div className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black absolute -top-4 left-1/2 -ml-5 shadow-lg group-hover:scale-110 transition-transform">2</div>
                  <h4 className="font-black italic uppercase text-indigo-600 text-[10px] tracking-widest mb-2 mt-4">Paso 2: Resolución</h4>
                  <p className="text-[10px] font-bold text-gray-500 leading-normal uppercase">Detección de duplicados automática (Upsert). Previene fallos en FKs.</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 text-center relative group opacity-60 hover:opacity-100 transition-all">
                  <div className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black absolute -top-4 left-1/2 -ml-5 shadow-lg group-hover:scale-110 transition-transform">3</div>
                  <h4 className="font-black italic uppercase text-indigo-600 text-[10px] tracking-widest mb-2 mt-4">Paso 3: Persistencia</h4>
                  <p className="text-[10px] font-bold text-gray-500 leading-normal uppercase">Transacción síncrona: Todo el archivo se inserta o se cancela todo.</p>
              </div>
          </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { UploadFileComponent } from '../components/UploadFileComponent';
import { DryRunResultComponent } from '../components/DryRunResultComponent';
import { API_BASE_URL } from '../config/api';
import { Database, LayoutTemplate, ShieldCheck, Zap, History, AlertCircle, RefreshCw, CheckCircle2, ZapOff, Edit3 } from 'lucide-react';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router-dom';
import { EditableDataTable } from '../components/EditableDataTable';
import * as XLSX from 'xlsx';

export const MassUploadPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [mappedData, setMappedData] = useState<Record<string, any[]> | null>(null);
  const [autoFix, setAutoFix] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const navigate = useNavigate();

  const handleDryRun = async (selectedFile: File | Blob, isVirtual = false) => {
    if (!isVirtual) setFile(selectedFile as File);
    setLoading(true);
    setError(null);

    const formData = new FormData();
    // Use a fixed name for virtual files to help backend identification if needed
    const fileName = isVirtual ? 'virtual_revalidation.xlsx' : (selectedFile as File).name;
    formData.append('file', selectedFile, fileName);
    formData.append('auto_fix', String(autoFix));

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
        setMappedData(data.allMappedData);
      } else {
        setError(data.error || 'Error al procesar el archivo. Verifique el formato e intente nuevamente.');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleRevalidate = async () => {
    if (!mappedData) return;
    
    // Create virtual Excel from edited mappedData
    const wb = XLSX.utils.book_new();
    Object.keys(mappedData).forEach(sheetName => {
        const ws = XLSX.utils.json_to_sheet(mappedData[sheetName]);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });
    
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    handleDryRun(blob, true);
  };

  const handleExecute = async () => {
    if (!mappedData && !file) return;

    setExecuting(true);
    setShowConfirmModal(false);
    setError(null);

    try {
      let response;
      const headers: any = {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      };

      if (mappedData) {
        // UI-Controlled State-Aware Execution (JSON)
        response = await fetch(`${API_BASE_URL}/mass_upload/execute`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: mappedData,
            auto_fix: String(autoFix)
          })
        });
      } else if (file) {
        // Classic File Execution
        const formData = new FormData();
        formData.append('file', file);
        formData.append('auto_fix', String(autoFix));
        
        response = await fetch(`${API_BASE_URL}/mass_upload/execute`, {
          method: 'POST',
          headers,
          body: formData
        });
      }

      if (!response) throw new Error("Parámetros de ejecución inválidos.");

      const data = await response.json();
      if (response.ok) {
        setResult({ ...result, executeSuccess: true, inserted_rows: data.inserted_rows, modules_processed: data.modules_processed });
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
    setMappedData(null);
    setError(null);
    setShowConfirmModal(false);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between p-8 bg-gradient-to-br from-indigo-700 to-indigo-900 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
         <div className="absolute -top-10 -right-10 opacity-10 group-hover:scale-110 transition-transform">
             <Database className="w-64 h-64" />
         </div>
         <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
                <Button 
                    variant="secondary" 
                    onClick={() => navigate('/mass-upload/history')}
                    className="bg-white/10 text-white rounded-xl text-[9px] h-8 px-4 font-black tracking-widest uppercase hover:bg-white/20 border-white/10"
                >
                    <History className="w-3.5 h-3.5 mr-2" /> Historial Bitácora
                </Button>
                <div onClick={() => setAutoFix(!autoFix)} className={`flex items-center gap-2 px-4 py-1.5 rounded-xl border cursor-pointer transition-all ${autoFix ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-white/5 border-white/10 text-white/40'}`}>
                    {autoFix ? <Zap className="w-3 h-3 animate-pulse" /> : <ZapOff className="w-3 h-3" />}
                    <span className="text-[9px] font-black uppercase tracking-widest">{autoFix ? 'Auto-Fix Activo' : 'Auto-Fix Inactivo'}</span>
                </div>
            </div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter flex items-center gap-3">
               Módulo de Carga Masiva
               <span className="text-xs bg-white/20 px-2 py-1 rounded-lg not-italic font-black text-white/50 border border-white/10 uppercase tracking-widest">v3.0.0</span>
            </h1>
            <p className="text-sm font-medium text-indigo-100 max-w-lg mt-2 uppercase tracking-wide opacity-80">
               Motor heurístico premium con previsualización editable y control de IA.
            </p>
         </div>
         {result && (
            <div className="relative z-10 mt-6 md:mt-0">
               <Button variant="secondary" onClick={reset} className="rounded-full font-black uppercase text-[10px] tracking-widest h-12 px-8 bg-white/10 text-white hover:bg-white/20 border-white/10 border backdrop-blur-md italic">
                   Nueva Carga
               </Button>
            </div>
         )}
      </div>

      {/* 2. Grid for Status Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-4 font-black uppercase tracking-tighter text-[9px] italic">
         <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 text-indigo-600">
             <LayoutTemplate className="w-3 h-3" /> visualización premium v3
         </div>
         <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 text-indigo-600">
             <Edit3 className="w-3 h-3" /> edición binaria activa
         </div>
         <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 text-indigo-600 text-amber-500">
             <Zap className="w-3 h-3" /> ia autocorrect (conf: 0.85)
         </div>
         <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 text-indigo-600">
             <Database className="w-3 h-3" /> prisma transactions v3
         </div>
      </div>

      {/* 3. Logic: Upload OR Results OR Execution Success */}
      <div className="max-w-7xl mx-auto space-y-12 px-4">
        {result?.executeSuccess ? (
          <div className="bg-emerald-500 p-20 rounded-[5rem] shadow-2xl shadow-emerald-500/30 text-center text-white animate-in zoom-in-95 duration-500">
             <CheckCircle2 className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce font-black text-3xl" />
             <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-4">¡Carga Masiva Exitosa!</h2>
             <p className="text-lg opacity-80 max-w-lg mx-auto mb-10 leading-relaxed font-bold uppercase tracking-tight">
               Se han persistido {result.inserted_rows} registros en el sistema.
               Sincronización total de módulos: {result.modules_processed?.join(', ')}.
             </p>
             <div className="flex gap-3 justify-center">
                <Button variant="secondary" onClick={() => navigate('/mass-upload/history')} className="px-10 py-4 rounded-full font-black uppercase tracking-widest text-[10px] bg-white/20 text-white border-white/10 border hover:bg-white/30">
                    Ver Bitácora de Auditoría
                </Button>
                <Button variant="secondary" onClick={reset} className="px-10 py-4 rounded-full font-black uppercase tracking-widest text-[10px] bg-white text-emerald-600 hover:bg-white/90">
                    Finalizar y volver
                </Button>
             </div>
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
          <div className="space-y-12">
            <DryRunResultComponent 
              stats={result.summary} 
              rowErrors={result.errors || []} 
              globalErrors={result.global_errors || []} 
              readyToExecute={result.ready_to_execute} 
              onExecute={() => setShowConfirmModal(true)}
              loading={executing}
            />

            {mappedData && (
              <EditableDataTable 
                data={mappedData} 
                errors={result.errors || []} 
                onDataChange={(d) => setMappedData(d)}
                onRevalidate={handleRevalidate}
              />
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
             <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-[3rem] shadow-2xl p-12 border border-gray-100 dark:border-gray-800 text-center animate-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-red-100 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-red-500/10">
                   <AlertCircle className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white italic uppercase tracking-[max(-0.02em)] mb-4">¿Desea ejecutar la carga real?</h3>
                <p className="text-xs text-gray-400 font-bold mb-8 uppercase leading-relaxed opacity-80 px-6">
                   Esta acción realizará cambios masivos en la base de datos que afectarán la integridad de los datos. 
                   Se usarán los datos modificados actualmente en la previsualización premium.
                </p>
                <div className="grid grid-cols-2 gap-4">
                   <Button variant="secondary" onClick={() => setShowConfirmModal(false)} className="rounded-2xl h-14 uppercase text-[10px] font-black tracking-widest bg-gray-50 border-gray-100">Abortar</Button>
                   <Button onClick={handleExecute} className="rounded-2xl h-14 uppercase text-[10px] font-black tracking-widest bg-indigo-600 text-white shadow-xl shadow-indigo-500/30">Sí, Persistir</Button>
                </div>
             </div>
          </div>
      )}

      {/* Loading Execute Overlay */}
      {executing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-900/40 backdrop-blur-md animate-in fade-in duration-300">
              <div className="bg-white dark:bg-gray-900 p-12 rounded-[3.5rem] text-center border border-white/20 shadow-2xl scale-up-center">
                  <div className="p-5 bg-indigo-50 text-indigo-600 rounded-full inline-block animate-spin mb-6">
                      <RefreshCw className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-black uppercase italic italic tracking-tighter">Sincronizando Base de Datos...</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-2 tracking-widest">No cierre esta ventana, se están aplicando transacciones.</p>
              </div>
          </div>
      )}
    </div>
  );
};

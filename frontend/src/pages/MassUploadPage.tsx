import React, { useState } from 'react';
import { UploadFileComponent } from '../components/UploadFileComponent';
import { DryRunResultComponent } from '../components/DryRunResultComponent';
import { API_BASE_URL } from '../config/api';
import { Database, LayoutTemplate, Zap, History, AlertCircle, RefreshCw, CheckCircle2, ZapOff, Edit3, Download, FileSpreadsheet } from 'lucide-react';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router-dom';
import { EditableDataTable } from '../components/EditableDataTable';
import * as XLSX from 'xlsx';

/**
 * CANONICAL DATA PLATFORM DEFINITION — SGC v3.1
 * Establishes the official source of truth for exportable master modules.
 */
const CANONICAL_MASTER_MODULES = [
  "torres",
  "tipos_unidad",
  "unidades",
  "estacionamientos",
  "espacios",
  "propietarios",
  "residentes",
  "personal",
  "afps",
  "previsiones",
  "bancos",
  "articulos_personal",
  "maestro_categorias_articulos",
  "emergencias"
];

export const MassUploadPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [mappedData, setMappedData] = useState<Record<string, any[]> | null>(null);
  const [autoFix, setAutoFix] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedExportModule, setSelectedExportModule] = useState('');
  
  const navigate = useNavigate();

  const handleDryRun = async (selectedFile: File | Blob, isVirtual = false) => {
    if (!isVirtual) setFile(selectedFile as File);
    setLoading(true);
    setError(null);

    const formData = new FormData();
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
        setError(data.error || 'Error al procesar el archivo.');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  const handleRevalidate = async () => {
    if (!mappedData) return;
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
      const headers: any = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };

      if (mappedData) {
        response = await fetch(`${API_BASE_URL}/mass_upload/execute`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: mappedData, auto_fix: String(autoFix) })
        });
      } else if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('auto_fix', String(autoFix));
        response = await fetch(`${API_BASE_URL}/mass_upload/execute`, { method: 'POST', headers, body: formData });
      }

      if (!response) throw new Error("Parámetros de ejecución inválidos.");
      const data = await response.json();
      if (response.ok) {
        setResult({ ...result, executeSuccess: true, ...data });
      } else {
        setError(data.error || 'Error durante la persistencia de datos.');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión.');
    } finally {
      setExecuting(false);
    }
  };

  const handleExportIndividual = async () => {
      if (!selectedExportModule) return;
      window.open(`${API_BASE_URL}/mass_upload/export/${selectedExportModule}?token=${localStorage.getItem('token')}`, '_blank');
  };

  const handleExportAll = async () => {
      window.open(`${API_BASE_URL}/mass_upload/export-all?token=${localStorage.getItem('token')}`, '_blank');
  };

  const reset = () => {
    setFile(null); setResult(null); setMappedData(null); setError(null); setShowConfirmModal(false);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
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
               <span className="text-xs bg-white/20 px-2 py-1 rounded-lg not-italic font-black text-white/50 border border-white/10 uppercase tracking-widest">v3.1.0</span>
            </h1>
            <p className="text-sm font-medium text-indigo-100 max-w-lg mt-2 uppercase tracking-wide opacity-80">
               Plataforma de datos unificada con definición canónica de maestros SGC.
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
             <LayoutTemplate className="w-3 h-3" /> visualización premium v3.1
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

      <div className="max-w-7xl mx-auto space-y-10 px-4">
        {result?.executeSuccess ? (
          <div className="bg-emerald-500 p-20 rounded-[5rem] shadow-2xl shadow-emerald-500/30 text-center text-white animate-in zoom-in-95 duration-500">
             <CheckCircle2 className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce font-black text-3xl" />
             <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-4">¡Carga Masiva Exitosa!</h2>
             <p className="text-lg opacity-80 max-w-lg mx-auto mb-10 leading-relaxed font-bold uppercase tracking-tight">
               Se han persistido {result.inserted_rows} registros en el sistema.
               Sincronización total de módulos: {result.modules_processed?.join(', ')}.
             </p>

             {result.dataset_hash && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-10 max-w-lg mx-auto text-left animate-in slide-in-from-bottom duration-1000">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full bg-indigo-300 animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-100/50">Certificado de Transacción Data-Platform</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-mono text-white/40 break-all">HASH SHA-256: {result.dataset_hash}</span>
                        <div className="flex gap-4 mt-2">
                             <div className="flex flex-col">
                                <span className="text-[7px] text-white/30 uppercase font-bold">Analytics</span>
                                <span className="text-[10px] font-black uppercase">Snapshotted</span>
                             </div>
                             <div className="flex flex-col border-l border-white/5 pl-4">
                                <span className="text-[7px] text-white/30 uppercase font-bold">Estado</span>
                                <span className="text-[10px] font-black uppercase text-indigo-300">Deduplicado Activo</span>
                             </div>
                        </div>
                    </div>
                </div>
             )}

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
          <div className="space-y-10">
             <div className="max-w-3xl mx-auto">
                <UploadFileComponent onFileSelect={handleDryRun} onClear={reset} file={file} loading={loading} />
                {error && (
                  <div className="mt-8 p-8 bg-red-50 dark:bg-red-900/10 border-2 border-red-100 dark:border-red-900/20 rounded-[3rem] text-red-600 text-center animate-in shake duration-500">
                      <p className="text-sm font-bold opacity-80">{error}</p>
                      <Button variant="secondary" className="mt-4 text-[9px]" onClick={reset}>Reintentar</Button>
                  </div>
                )}
             </div>

             {/* Export Section */}
             {!loading && (
                <div className="max-w-3xl mx-auto p-10 bg-white dark:bg-gray-900/40 rounded-[3.5rem] border border-gray-100 dark:border-gray-800 shadow-xl animate-in fade-in duration-1000 backdrop-blur-sm">
                   <div className="flex items-center justify-between mb-10">
                      <div>
                         <h3 className="text-xl font-black italic uppercase tracking-tighter">Exportación Cañónica</h3>
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Descarga oficial de Maestros SGC v3.1</p>
                      </div>
                      <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                          <FileSpreadsheet className="w-6 h-6 text-indigo-500" />
                      </div>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button 
                        onClick={handleExportAll}
                        className="rounded-2xl h-20 bg-indigo-600 text-white font-black uppercase text-[10px] tracking-[max(0.1em)] shadow-2xl shadow-indigo-500/30 hover:-translate-y-1 transition-all"
                      >
                         <Download className="w-4 h-4 mr-3" /> Descargar Consolidado SGC
                      </Button>
                      <div className="flex gap-2">
                         <select 
                            className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded-2xl px-5 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-indigo-500"
                            onChange={(e) => setSelectedExportModule(e.target.value)}
                            value={selectedExportModule}
                         >
                            <option value="">Seleccionar Módulo Maestro</option>
                            {CANONICAL_MASTER_MODULES.map(m => <option key={m} value={m}>{m.replace(/_/g, ' ').toUpperCase()}</option>)}
                         </select>
                         <Button 
                            variant="secondary" 
                            onClick={handleExportIndividual}
                            disabled={!selectedExportModule}
                            className="rounded-2xl h-20 w-24 px-0 flex items-center justify-center bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-800 hover:bg-gray-50 shadow-lg"
                         >
                            <Download className="w-5 h-5 text-indigo-600" />
                         </Button>
                      </div>
                   </div>
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
             <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-[3rem] shadow-2xl p-12 text-center animate-in zoom-in-95 duration-500">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-6" />
                <h3 className="text-2xl font-black italic uppercase mb-2">¿Confirmar Ejecución?</h3>
                <p className="text-xs text-gray-400 font-bold mb-8 uppercase px-6">Esta acción persistirá los datos visibles en la base de datos.</p>
                <div className="grid grid-cols-2 gap-4">
                   <Button variant="secondary" onClick={() => setShowConfirmModal(false)} className="rounded-2xl h-14 uppercase text-[10px] font-black">Abortar</Button>
                   <Button onClick={handleExecute} className="rounded-2xl h-14 uppercase text-[10px] font-black bg-indigo-600 text-white">Sincronizar</Button>
                </div>
             </div>
          </div>
      )}

      {executing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-900/40 backdrop-blur-md">
              <div className="bg-white dark:bg-gray-900 p-12 rounded-[3.5rem] text-center shadow-2xl">
                  <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-6" />
                  <h3 className="text-xl font-black uppercase italic">Persistiendo Datos...</h3>
              </div>
          </div>
      )}
    </div>
  );
};

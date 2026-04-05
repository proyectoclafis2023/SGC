import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { History, Calendar, CheckCircle2, XCircle, Info, ArrowLeft, Download } from 'lucide-react';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

export const MassUploadHistoryPage: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<any>(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const resp = await fetch(`${API_BASE_URL}/mass_upload/history`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await resp.json();
            if (data.success) setLogs(data.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const exportHistoricalErrors = (log: any) => {
        const errors = JSON.parse(log.errorsJson || '{}');
        const rowErrors = errors.row_errors || [];
        const globalErrors = errors.global_errors || [];

        const data = [
            ...globalErrors.map((e: any) => ({ Módulo: e.module, Fila: e.row, Campo: e.field, Error: e.error, Tipo: 'Global' })),
            ...rowErrors.map((e: any) => ({ Módulo: e.module, Fila: e.row, Campo: e.field, Error: e.error, Tipo: 'Fila' }))
        ];

        if (data.length === 0) return alert('No hay errores registrados en esta sesión.');

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Errores Históricos");
        XLSX.writeFile(wb, `SGC_Errores_Historicos_${log.id}.xlsx`);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <button 
                        onClick={() => navigate('/mass-upload')}
                        className="flex items-center gap-2 text-indigo-600 font-black uppercase text-[10px] tracking-widest mb-2 hover:translate-x-[-4px] transition-transform"
                    >
                        <ArrowLeft className="w-3 h-3" /> Volver al Motor
                    </button>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3 italic uppercase tracking-[max(-0.02em)]">
                        <History className="w-8 h-8 text-indigo-600" />
                        Historial de Auditoría CORE
                    </h1>
                </div>
                <Button variant="secondary" onClick={fetchLogs} className="rounded-2xl text-[10px] uppercase font-black tracking-widest h-12 px-6">
                    Sincronizar Historial
                </Button>
            </div>

            {loading ? (
                <div className="py-40 text-center animate-pulse">
                    <History className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Cargando bitácora de transacciones...</p>
                </div>
            ) : logs.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 p-20 rounded-[4rem] text-center border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-xl">
                    <p className="text-gray-400 font-bold italic uppercase text-xs">No se registran transacciones de carga masiva v2 en este servidor.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {logs.map((log) => {
                        const summary = JSON.parse(log.summaryJson || '{}');
                        const isSuccess = log.status === 'success';
                        
                        return (
                            <div 
                                key={log.id} 
                                className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden"
                            >
                                <div className={`absolute top-0 left-0 w-2 h-full ${isSuccess ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isSuccess ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                            {isSuccess ? <CheckCircle2 className="w-7 h-7" /> : <XCircle className="w-7 h-7" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${isSuccess ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                    {log.status}
                                                </span>
                                                <span className="text-[10px] font-black text-gray-400 italic">ID: {log.id.substring(0, 8)}</span>
                                            </div>
                                            <p className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                                                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                                {new Date(log.timestamp).toLocaleString('es-CL')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-8 md:text-right">
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Módulos</p>
                                            <div className="flex gap-1">
                                                {log.modulesProcessed.split(',').map((m: string) => (
                                                    <span key={m} className="px-1.5 py-0.5 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded text-[8px] font-bold text-gray-500 uppercase">{m}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Resultado</p>
                                            <p className="text-xs font-black">{summary.inserted_rows || 0} Insertados | {log.executionTimeMs}ms</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button 
                                                variant="secondary" 
                                                onClick={() => exportHistoricalErrors(log)}
                                                className="rounded-xl h-10 px-4 text-[9px]"
                                                title="Descargar errores de esta sesión"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button 
                                                variant="secondary" 
                                                onClick={() => setSelectedLog(selectedLog === log.id ? null : log.id)}
                                                className="rounded-xl h-10 px-4 text-[9px]"
                                            >
                                                {selectedLog === log.id ? 'Cerrar Detalle' : 'Ver Detalle'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {selectedLog === log.id && (
                                    <div className="mt-8 pt-8 border-t border-gray-50 dark:border-gray-800 animate-in slide-in-from-top-4 duration-300">
                                        <h4 className="text-[10px] font-black text-indigo-600 uppercase mb-4 italic flex items-center gap-2">
                                            <Info className="w-3.5 h-3.5" /> Metadatos de la Transacción
                                        </h4>
                                        <pre className="bg-gray-50 dark:bg-gray-800 p-6 rounded-3xl text-[10px] font-mono text-gray-600 dark:text-gray-400 overflow-x-auto border border-gray-100 dark:border-gray-700">
                                            {JSON.stringify(JSON.parse(log.summaryJson), null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

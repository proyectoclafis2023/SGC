import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { Shield, Info, Calendar, Globe } from 'lucide-react';

interface AuditLog {
    id: string;
    userId: string | null;
    action: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    entity: string | null;
    endpoint: string | null;
    method: string | null;
    status: number | null;
    details: string | null;
    createdAt: string;
}

export const AuditLogPage: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLogs = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/audit-logs`, {
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
            });
            if (response.ok) {
                const data = await response.json();
                setLogs(data);
            }
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'HIGH': return 'text-red-600 bg-red-50 border-red-100';
            case 'MEDIUM': return 'text-amber-600 bg-amber-50 border-amber-100';
            default: return 'text-blue-600 bg-blue-50 border-blue-100';
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <Shield className="w-8 h-8 text-indigo-600" />
                        Auditoría de Sistema
                    </h1>
                    <p className="text-gray-500 mt-1 uppercase text-xs font-bold tracking-widest">Registros inmutables de configuración y acceso</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => fetchLogs()}
                        className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 flex items-center gap-2 transition-all shadow-sm"
                    >
                        <Calendar className="w-4 h-4" />
                        Actualizar
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">Timestamp</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">Acción / Severidad</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">Entidad</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">Detalles</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-medium">Cargando registros...</td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-medium whitespace-pre-wrap italic">Empieza a realizar cambios para ver registros de auditoría.</td>
                                </tr>
                            ) : logs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-mono text-gray-500">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-black text-gray-700 dark:text-gray-200">{log.action}</span>
                                            <span className={`inline-flex items-center w-fit px-2 py-0.5 rounded-full text-[9px] font-black border ${getSeverityColor(log.severity)}`}>
                                                {log.severity}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Globe className="w-3.5 h-3.5 text-gray-400" />
                                            <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{log.entity || 'Sistema'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="max-w-md">
                                            <pre className="text-[10px] font-mono bg-gray-100 dark:bg-gray-950 p-2 rounded-lg text-gray-600 dark:text-gray-400 overflow-hidden text-ellipsis">
                                                {log.details ? log.details.substring(0, 150) + (log.details.length > 150 ? '...' : '') : 'Sin detalles'}
                                            </pre>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="mt-6 flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-widest px-2">
                <div className="flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    <span>Los registros de auditoría son de solo lectura y no pueden ser eliminados.</span>
                </div>
                <span>SGC Enterprise v3.6.0</span>
            </div>
        </div>
    );
};

import React, { useState } from 'react';
import { useCameraRequests } from '../context/CameraRequestContext';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { useCameras } from '../context/CameraContext';
import { useInfrastructure } from '../context/InfrastructureContext';
import { useResidents } from '../context/ResidentContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import {
    Video, Plus, X, Search, Clock, Filter, Calendar, Building, User, CheckCircle2, AlertCircle,
    LayoutGrid, List
} from 'lucide-react';

export const CameraRequestsPage: React.FC = () => {
    const { user } = useAuth();
    const { requests, addRequest, updateRequestStatus } = useCameraRequests();
    const { settings } = useSettings();
    const { cameras } = useCameras();
    const { towers } = useInfrastructure();
    const { residents } = useResidents();

    const [selectedTower, setSelectedTower] = useState('');

    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterUnit, setFilterUnit] = useState('');
    const [filterResident, setFilterResident] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAttentionModalOpen, setIsAttentionModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [attentionStatus, setAttentionStatus] = useState<'attended' | 'rejected'>('attended');
    const [adminNotes, setAdminNotes] = useState('');

    // Form fields
    const [cameraId, setCameraId] = useState('');
    const [residentName, setResidentName] = useState(user?.name || '');
    const [unitId, setUnitId] = useState('');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [reason, setReason] = useState('');

    const isAdmin = user?.role === 'admin' || user?.role === 'global_admin';
    const activeUserId = user?.name || '';

    const getRemainingTime = (requestDate: string, camId: string) => {
        const camera = cameras.find(c => c.id === camId);
        const backupHours = camera?.backupHours || settings.cameraBackupDays * 24 || 168;

        const eventDate = new Date(requestDate + 'T00:00:00');
        const expirationDate = new Date(eventDate.getTime() + (backupHours * 60 * 60 * 1000));

        const now = new Date();
        const diffMs = expirationDate.getTime() - now.getTime();

        if (diffMs <= 0) return { text: 'Expirado (No recuperable)', color: 'bg-rose-100 text-rose-700', isExpired: true };

        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (diffDays > 0) {
            return { text: `${diffDays}d ${diffHours}h para expirar`, color: 'bg-amber-100 text-amber-700 font-black', isExpired: false };
        }
        return { text: `${diffHours}h para expirar (URGENTE)`, color: 'bg-rose-500 text-white font-black animate-pulse', isExpired: false };
    };

    const displayedRequests = requests.filter(r => {
        const camera = cameras.find(c => c.id === r.cameraId);
        const cameraName = camera?.name || r.cameraId;

        const matchesSearch = cameraName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.residentName || r.userId).toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.unitId || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDate = !filterDate || r.date === filterDate;
        const matchesUnit = !filterUnit || (r.unitId || '').toLowerCase().includes(filterUnit.toLowerCase());
        const matchesResident = !filterResident || (r.residentName || r.userId).toLowerCase().includes(filterResident.toLowerCase());

        const isOwner = r.userId === activeUserId;
        const hasAccess = isAdmin || isOwner;

        return matchesSearch && matchesDate && matchesUnit && matchesResident && hasAccess;
    });

    const pendingCount = requests.filter(r => r.status === 'pending').length;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await addRequest({
            userId: activeUserId,
            residentName: isAdmin ? residentName : (user?.name || ''),
            unitId,
            cameraId,
            date,
            startTime,
            endTime,
            reason
        });
        setIsModalOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setCameraId('');
        setResidentName(user?.name || '');
        setUnitId('');
        setSelectedTower('');
        setDate('');
        setStartTime('');
        setEndTime('');
        setReason('');
    };

    const handleUnitSelect = (uId: string) => {
        setUnitId(uId);
        const res = residents.find(r => r.unitId === uId && !r.isArchived);
        if (res) setResidentName(`${res.names} ${res.lastNames}`);
    };

    const timeOptions = Array.from({ length: 48 }, (_, i) => {
        const h = Math.floor(i / 2).toString().padStart(2, '0');
        const m = (i % 2 === 0 ? '00' : '30');
        return `${h}:${m}`;
    });

    const handleAttentionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedRequest) {
            await updateRequestStatus(selectedRequest.id, attentionStatus, adminNotes);
            setIsAttentionModalOpen(false);
            setAdminNotes('');
            setSelectedRequest(null);
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending': return 'Pendiente';
            case 'attended': return 'Atendido';
            case 'rejected': return 'Rechazado';
            default: return status;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            case 'attended': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'rejected': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className={`text-2xl font-black flex items-center gap-2 ${settings.theme === 'modern' ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        <Video className="w-8 h-8 text-indigo-600" />
                        Solicitud de Grabaciones
                    </h1>
                    <p className={`text-sm mt-1 font-bold italic ${settings.theme === 'modern' ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'}`}>Gestión de acceso a registros fílmicos de seguridad.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setIsModalOpen(true)} className="shadow-lg shadow-indigo-600/20">
                        <Plus className="w-4 h-4 mr-2" /> Nueva Solicitud
                    </Button>
                </div>
            </div>

            {isAdmin && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pendientes</p>
                            <h3 className="text-2xl font-black text-amber-600">{pendingCount}</h3>
                        </div>
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/10 text-amber-600 rounded-2xl">
                            <Clock className="w-6 h-6" />
                        </div>
                    </div>
                </div>
            )}

            {/* Filtros */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Filter className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Filtros de Búsqueda</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar en todo..."
                            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-sm font-bold"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="date"
                            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-sm font-bold"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <Building className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Unidad / Depto"
                            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-sm font-bold"
                            value={filterUnit}
                            onChange={(e) => setFilterUnit(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Residente"
                            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-sm font-bold"
                            value={filterResident}
                            onChange={(e) => setFilterResident(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex items-center justify-between mt-2 pt-4 border-t dark:border-gray-800">
                    {(searchTerm || filterDate || filterUnit || filterResident) ? (
                        <button
                            onClick={() => { setSearchTerm(''); setFilterDate(''); setFilterUnit(''); setFilterResident(''); }}
                            className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline flex items-center gap-1"
                        >
                            <X className="w-3 h-3" /> Limpiar Filtros
                        </button>
                    ) : <div />}

                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-900 text-indigo-600 shadow-sm' : 'text-gray-400'}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-900 text-indigo-600 shadow-sm' : 'text-gray-400'}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayedRequests.map((req) => (
                        <div key={req.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all relative group h-full flex flex-col">
                            <div className="p-8 flex-1">
                                <div className="flex justify-between items-start mb-6">
                                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-xl border border-indigo-100/50 dark:border-indigo-900/30">
                                        # {req.folio}
                                    </span>
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(req.status)}`}>
                                        {getStatusText(req.status)}
                                    </span>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                                            <User className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Solicitante</p>
                                            <h4 className="text-lg font-black text-gray-900 dark:text-white">{req.residentName || req.userId}</h4>
                                            {req.unitId && <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{req.unitId}</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="p-6 bg-gray-50 dark:bg-gray-800/40 rounded-3xl border border-gray-100 dark:border-gray-700">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Video className="w-4 h-4 text-indigo-600" />
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{cameras.find(c => c.id === req.cameraId)?.name || "Cámara Desconocida"}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Fecha</p>
                                                    <p className="text-sm font-black text-gray-900 dark:text-white">{new Date(req.date + 'T00:00:00').toLocaleDateString()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Horario</p>
                                                    <p className="text-sm font-black text-gray-900 dark:text-white">{req.startTime} - {req.endTime}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {req.status === 'pending' && (
                                            <div className={`p-4 rounded-2xl border flex items-center gap-3 ${getRemainingTime(req.date, req.cameraId).color} border-current/10`}>
                                                <Clock className="w-5 h-5" />
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-widest opacity-70">Disponibilidad</p>
                                                    <p className="text-xs font-black">{getRemainingTime(req.date, req.cameraId).text}</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="px-1">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Motivo</p>
                                            <p className="text-sm font-bold text-gray-700 dark:text-gray-300 line-clamp-2">{req.reason}</p>
                                        </div>

                                        {req.adminNotes && (
                                            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                                                <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Respuesta Administración</p>
                                                <p className="text-xs font-bold text-amber-800 dark:text-amber-400">{req.adminNotes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {isAdmin && (
                                <div className="p-4 bg-gray-50 dark:bg-gray-800/20 border-t dark:border-gray-800 flex gap-2">
                                    <button
                                        onClick={() => { setSelectedRequest(req); setAttentionStatus('attended'); setAdminNotes(req.adminNotes || ''); setIsAttentionModalOpen(true); }}
                                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20"
                                    >
                                        {req.status === 'pending' ? 'Atender' : 'Re-editar'}
                                    </button>
                                    <button
                                        onClick={() => { setSelectedRequest(req); setAttentionStatus('rejected'); setAdminNotes(req.adminNotes || ''); setIsAttentionModalOpen(true); }}
                                        className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-600/20"
                                    >
                                        Rechazar
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Folio</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Solicitante / Unidad</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Cámara / Fecha Suceso</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                            {displayedRequests.map(req => (
                                <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">#{req.folio}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-black text-gray-900 dark:text-white leading-none">{req.residentName || req.userId}</p>
                                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1">{req.unitId}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Video className="w-3.5 h-3.5 text-indigo-500" />
                                            <span className="text-sm font-black text-gray-700 dark:text-gray-300">
                                                {cameras.find(c => c.id === req.cameraId)?.name || "Cámara"}
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-400 mt-1">
                                            {new Date(req.date + 'T00:00:00').toLocaleDateString()} ({req.startTime}-{req.endTime})
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${getStatusColor(req.status)}`}>
                                            {getStatusText(req.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {isAdmin && (
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => { setSelectedRequest(req); setAttentionStatus('attended'); setAdminNotes(req.adminNotes || ''); setIsAttentionModalOpen(true); }}
                                                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border transition-all ${req.status === 'pending' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'text-gray-400 border-gray-100 hover:text-indigo-600'}`}
                                                >
                                                    {req.status === 'pending' ? 'Atender' : 'Respuesta'}
                                                </button>
                                                <button
                                                    onClick={() => { setSelectedRequest(req); setAttentionStatus('rejected'); setAdminNotes(req.adminNotes || ''); setIsAttentionModalOpen(true); }}
                                                    className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border border-gray-100 text-gray-400 hover:text-rose-600"
                                                >
                                                    Rechazar
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {displayedRequests.length === 0 && (
                <div className="py-20 text-center bg-gray-50 dark:bg-gray-800/10 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-gray-800">
                    <Video className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-bold">No se encontraron solicitudes con los filtros aplicados.</p>
                </div>
            )}

            {/* Modal de Nueva Solicitud */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-[3rem] w-full max-w-xl shadow-2xl border border-white/20 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b dark:border-gray-800 flex items-center justify-between bg-indigo-50 dark:bg-indigo-950/20">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 ring-4 ring-indigo-100 dark:ring-indigo-900/30">
                                    <Video className="w-7 h-7" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-none mb-1">Solicitar Grabación</h2>
                                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Protocolo de Seguridad</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white dark:hover:bg-gray-800 rounded-2xl transition-colors text-gray-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Seleccionar Torre</label>
                                    <select
                                        required
                                        className="w-full px-5 py-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-sm h-[58px]"
                                        value={selectedTower}
                                        onChange={e => {
                                            setSelectedTower(e.target.value);
                                            setUnitId('');
                                        }}
                                    >
                                        <option value="">-- Elige Torre --</option>
                                        {towers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Unidad / Depto</label>
                                    <select
                                        required
                                        disabled={!selectedTower}
                                        className="w-full px-5 py-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-sm h-[58px] disabled:opacity-50"
                                        value={unitId}
                                        onChange={e => handleUnitSelect(e.target.value)}
                                    >
                                        <option value="">-- Elige Unidad --</option>
                                        {towers.find(t => t.id === selectedTower)?.departments.map(d => (
                                            <option key={d.id} value={d.id}>Depto {d.number}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="mb-6">
                                <Input
                                    label="Nombre del Solicitante"
                                    value={residentName}
                                    onChange={e => setResidentName(e.target.value)}
                                    placeholder="Se cargará al elegir unidad..."
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cámara Requerida</label>
                                <select
                                    required
                                    className="w-full px-5 py-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-sm h-[58px]"
                                    value={cameraId}
                                    onChange={e => setCameraId(e.target.value)}
                                >
                                    <option value="">Seleccione una cámara...</option>
                                    {cameras.filter(c => !c.isArchived).map(c => (
                                        <option key={c.id} value={c.id}>{c.name} ({Math.round(c.backupHours / 24)} días de respaldo)</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-1">
                                    <Input
                                        label="Día del Suceso"
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        required
                                        max={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                                <div className="space-y-1.5 font-bold">
                                    <label className="text-[10px] font-black text-gray-400 ml-1 uppercase tracking-widest mb-1 block">Desde</label>
                                    <select
                                        className="w-full px-5 py-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-sm h-[58px]"
                                        value={startTime}
                                        onChange={e => setStartTime(e.target.value)}
                                        required
                                    >
                                        <option value="">Elegir...</option>
                                        {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5 font-bold">
                                    <label className="text-[10px] font-black text-gray-400 ml-1 uppercase tracking-widest mb-1 block">Hasta</label>
                                    <select
                                        className="w-full px-5 py-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-sm h-[58px]"
                                        value={endTime}
                                        onChange={e => setEndTime(e.target.value)}
                                        required
                                    >
                                        <option value="">Elegir...</option>
                                        {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Motivo de la solicitud</label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-5 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all min-h-[100px]"
                                    placeholder="Explique el motivo de su requerimiento..."
                                    required
                                />
                            </div>

                            <Button type="submit" className="w-full py-4 text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20">
                                Enviar Requerimiento
                            </Button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Atención/Rechazo */}
            {isAttentionModalOpen && selectedRequest && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-[3rem] w-full max-w-lg shadow-2xl border border-white/20 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className={`p-8 border-b dark:border-gray-800 flex items-center justify-between ${attentionStatus === 'attended' ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'bg-rose-50 dark:bg-rose-950/20'}`}>
                            <div className="flex items-center gap-5">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl ring-4 ${attentionStatus === 'attended' ? 'bg-emerald-600 shadow-emerald-500/30 ring-emerald-100' : 'bg-rose-600 shadow-rose-500/30 ring-rose-100'}`}>
                                    {attentionStatus === 'attended' ? <CheckCircle2 className="w-7 h-7" /> : <AlertCircle className="w-7 h-7" />}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-none mb-1">
                                        {attentionStatus === 'attended' ? 'Aprobar/Atender' : 'Rechazar Solicitud'}
                                    </h2>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest ${attentionStatus === 'attended' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        Folio: {selectedRequest.folio}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsAttentionModalOpen(false)} className="p-3 hover:bg-white dark:hover:bg-gray-800 rounded-2xl transition-colors text-gray-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleAttentionSubmit} className="p-10 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                    {attentionStatus === 'attended' ? 'Notas de atención o Enlace al Video' : 'Motivo del Rechazo'}
                                </label>
                                <textarea
                                    value={adminNotes}
                                    onChange={e => setAdminNotes(e.target.value)}
                                    className={`w-full rounded-2xl border p-5 text-sm font-bold bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-4 transition-all min-h-[150px] ${attentionStatus === 'attended' ? 'border-emerald-100 dark:border-emerald-900/30 focus:ring-emerald-500/10' : 'border-rose-100 dark:border-rose-900/30 focus:ring-rose-500/10'}`}
                                    placeholder={attentionStatus === 'attended' ? 'Detalle como se atendió o comparta el link...' : 'Explique por qué se rechaza...'}
                                    required
                                />
                            </div>
                            <div className="flex gap-4">
                                <Button type="button" variant="secondary" className="flex-1 py-4" onClick={() => setIsAttentionModalOpen(false)}>Cancelar</Button>
                                <Button
                                    type="submit"
                                    className={`flex-1 py-4 text-sm font-black uppercase tracking-widest shadow-xl ${attentionStatus === 'attended' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'}`}
                                >
                                    {attentionStatus === 'attended' ? 'Confirmar Atención' : 'Confirmar Rechazo'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

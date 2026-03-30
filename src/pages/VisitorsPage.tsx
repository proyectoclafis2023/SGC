import React, { useState } from 'react';
import { useVisitors } from '../context/VisitorContext';
import { useInfrastructure } from '../context/InfrastructureContext';
import { useResidents } from '../context/ResidentContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import {
    Users, Plus, Search, X,
    User, CreditCard, CheckCircle2,
    LogIn, Clock, History, ClipboardList, Trash2
} from 'lucide-react';

export const VisitorsPage: React.FC = () => {
    const { visitors, addVisitor, updateVisitorStatus, deleteVisitor } = useVisitors();
    const { towers, departments } = useInfrastructure();
    const { residents } = useResidents();
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin' || user?.role === 'global_admin' || user?.role === 'worker';

    const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form fields
    const [names, setNames] = useState('');
    const [dni, setDni] = useState('');
    const [towerId, setTowerId] = useState('');
    const [departmentId, setDepartmentId] = useState('');
    const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
    const [visitTime, setVisitTime] = useState('Mañana');
    const [vehiclePlate, setVehiclePlate] = useState('');
    const [notes, setNotes] = useState('');

    const filteredVisitors = visitors.filter(v => {
        const matchesSearch = v.names.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.dni.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.folio.toLowerCase().includes(searchTerm.toLowerCase());

        if (activeTab === 'current') {
            return matchesSearch && v.status !== 'exited' && v.status !== 'cancelled';
        } else {
            return matchesSearch && (v.status === 'exited' || v.status === 'cancelled');
        }
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const filteredDepartments = departments.filter(d => d.towerId === towerId);

    // Check if selected department has parking associated
    const selectedResident = residents.find(r => r.unitId === departmentId);
    const hasParking = selectedResident ? (selectedResident.parkingIds?.length || 0) > 0 : true;

    const resetForm = () => {
        setNames('');
        setDni('');
        setTowerId('');
        setDepartmentId('');
        setVisitDate(new Date().toISOString().split('T')[0]);
        setVisitTime('Mañana');
        setVehiclePlate('');
        setNotes('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await addVisitor({
            names,
            dni,
            towerId,
            departmentId,
            visitDate,
            visitTime,
            vehiclePlate,
            notes,
            isPreRegistered: !isAdmin,
            status: 'scheduled'
        });
        setIsModalOpen(false);
        resetForm();
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'scheduled': return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest">Agendada</span>;
            case 'entered': return <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest">En Recinto</span>;
            case 'exited': return <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest">Salida</span>;
            case 'cancelled': return <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest">Cancelada</span>;
            default: return null;
        }
    };

    const todayStr = new Date().toISOString().split('T')[0];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <Users className="w-8 h-8 text-indigo-600" />
                        Control de Visitas
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 font-bold">
                        {isAdmin ? 'Registro de ingresos y salidas del recinto.' : 'Pre-registra tus visitas para agilizar su ingreso.'}
                    </p>
                </div>
                <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    {isAdmin ? 'Registrar Ingreso' : 'Agendar Visita'}
                </Button>
            </div>

            <div className="flex p-1.5 bg-gray-100 dark:bg-gray-800 rounded-3xl w-fit border border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('current')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'current' ? 'bg-white dark:bg-gray-900 text-indigo-600 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <ClipboardList className="w-4 h-4" />
                    Visitas Activas
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-white dark:bg-gray-900 text-indigo-600 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <History className="w-4 h-4" />
                    Log de Visitas
                </button>
            </div>

            <div className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, RUT o folio..."
                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVisitors.map(v => (
                    <div key={v.id} className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden group hover:shadow-xl transition-all relative">
                        {v.isPreRegistered && v.status === 'scheduled' && (
                            <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] font-black px-3 py-1 rounded-bl-2xl uppercase tracking-tighter shadow-lg">
                                Pre-Registrada
                            </div>
                        )}
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-2xl ${v.status === 'entered' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Folio</p>
                                        <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 leading-none">{v.folio}</p>
                                    </div>
                                </div>
                                {getStatusBadge(v.status)}
                            </div>

                            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1 leading-tight">{v.names}</h3>
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-4 uppercase tracking-widest">
                                <CreditCard className="w-3.5 h-3.5" /> {v.dni}
                            </div>

                            <div className="space-y-3 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-black text-gray-400 uppercase tracking-widest">Destino</span>
                                    <span className="font-bold text-gray-900 dark:text-white">
                                        Torre {towers.find(t => t.id === v.towerId)?.name} - Depto {departments.find(d => d.id === v.departmentId)?.number}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-black text-gray-400 uppercase tracking-widest">Fecha Visita</span>
                                    <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                        {new Date(v.visitDate).toLocaleDateString()}
                                        <span className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[9px]">{v.visitTime}</span>
                                    </span>
                                </div>
                                {v.vehiclePlate && (
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-black text-gray-400 uppercase tracking-widest">Vehículo</span>
                                        <span className="font-bold text-indigo-600 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg uppercase tracking-wider border border-indigo-100 dark:border-indigo-800">{v.vehiclePlate}</span>
                                    </div>
                                )}
                            </div>

                            {(v.entryTime || v.exitTime) && (
                                <div className="mt-4 grid grid-cols-2 gap-2">
                                    {v.entryTime && (
                                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30 text-center">
                                            <p className="text-[8px] font-black text-emerald-600 uppercase mb-0.5">Ingreso</p>
                                            <p className="text-xs font-black text-emerald-700 dark:text-emerald-400">{v.entryTime}</p>
                                        </div>
                                    )}
                                    {v.exitTime && (
                                        <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
                                            <p className="text-[8px] font-black text-gray-400 uppercase mb-0.5">Salida</p>
                                            <p className="text-xs font-black text-gray-500">{v.exitTime}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {isAdmin && (
                                <div className="mt-6 flex gap-2">
                                    {v.status === 'scheduled' && (
                                        <button
                                            onClick={() => updateVisitorStatus(v.id, 'entered')}
                                            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase transition hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                                        >
                                            <LogIn className="w-3.5 h-3.5" /> Registrar Ingreso
                                        </button>
                                    )}
                                    {v.status === 'entered' && (
                                        <div className="flex-1 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black uppercase text-center border border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-800">
                                            ✓ Ingresado
                                        </div>
                                    )}
                                    <button
                                        onClick={() => { if (confirm('¿Eliminar registro?')) deleteVisitor(v.id); }}
                                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-colors border border-transparent hover:border-rose-100 ml-auto"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto">
                    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] w-full max-w-xl shadow-2xl border border-white/20 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-300 my-8">
                        <div className="p-8 border-b dark:border-gray-800 flex items-center justify-between bg-indigo-50/30 dark:bg-indigo-900/5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                                    <Plus className="w-6 h-6" />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-none">
                                    {isAdmin ? 'Ingreso de Visita' : 'Agendar Visita'}
                                </h2>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-colors text-gray-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <Input
                                        label="Nombre Completo Visita"
                                        value={names}
                                        onChange={e => setNames(e.target.value)}
                                        required
                                        autoFocus
                                        placeholder="Ej: Juan Pérez"
                                    />
                                </div>

                                <div className="md:col-span-1">
                                    <Input
                                        label="RUN / DNI"
                                        value={dni}
                                        onChange={e => setDni(e.target.value)}
                                        required
                                        placeholder="12.345.678-9"
                                    />
                                </div>

                                {hasParking && (
                                    <div className="md:col-span-1">
                                        <Input
                                            label="Patente Vehículo"
                                            value={vehiclePlate}
                                            onChange={e => setVehiclePlate(e.target.value.toUpperCase())}
                                            placeholder="ABCD12"
                                            maxLength={6}
                                        />
                                    </div>
                                )}

                                <div className="space-y-1.5 font-bold">
                                    <label className="text-xs font-black text-gray-500 ml-1 uppercase tracking-widest">Torre / Bloque</label>
                                    <select
                                        className="w-full p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-gray-900 dark:text-white"
                                        value={towerId}
                                        onChange={e => setTowerId(e.target.value)}
                                        required
                                    >
                                        <option value="">Seleccionar...</option>
                                        {towers.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5 font-bold">
                                    <label className="text-xs font-black text-gray-500 ml-1 uppercase tracking-widest">Departamento / Unidad</label>
                                    <select
                                        className="w-full p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-gray-900 dark:text-white"
                                        value={departmentId}
                                        onChange={e => setDepartmentId(e.target.value)}
                                        required
                                        disabled={!towerId}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {filteredDepartments.map((d: any) => (
                                            <option key={d.id} value={d.id}>{d.number}</option>
                                        ))}
                                    </select>
                                </div>

                                <Input
                                    label="Fecha de Visita"
                                    type="date"
                                    value={visitDate}
                                    onChange={e => setVisitDate(e.target.value)}
                                    required
                                    min={todayStr}
                                />

                                <div className="space-y-1.5 font-bold">
                                    <div className="flex items-center gap-1.5 ml-1">
                                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Jornada</label>
                                    </div>
                                    <select
                                        className="w-full p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                        value={visitTime}
                                        onChange={e => setVisitTime(e.target.value)}
                                        required
                                    >
                                        <option value="Mañana">Mañana (07:00 - 14:59)</option>
                                        <option value="Tarde">Tarde (15:00 - 22:59)</option>
                                        <option value="Noche">Noche (23:00 - 06:59)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-gray-500 ml-1 uppercase tracking-widest">Motivo / Notas</label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className="w-full rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all min-h-[80px]"
                                    placeholder="Ej. Delivery, revisión eléctrica, visita familiar..."
                                />
                            </div>

                            {!isAdmin && (
                                <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30 flex items-start gap-3 shadow-inner">
                                    <CheckCircle2 className="w-5 h-5 text-amber-600 mt-0.5" />
                                    <p className="text-xs font-bold text-amber-800 dark:text-amber-400">
                                        Al agendar tu visita, el personal de portería podrá ver los datos pre-cargados y agilizar el ingreso al recinto.
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                                <Button type="submit" className="flex-1 shadow-lg shadow-indigo-500/20">
                                    {isAdmin ? 'Confirmar Ingreso' : 'Agendar Visita'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

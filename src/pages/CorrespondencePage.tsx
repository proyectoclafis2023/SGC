import React, { useState, useMemo, useEffect } from 'react';
import { useCorrespondence } from '../context/CorrespondenceContext';
import { useInfrastructure } from '../context/InfrastructureContext';
import { useAuth } from '../context/AuthContext';
import { useCouriers } from '../context/CourierContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import {
    Package, Plus, Search, X, CheckCircle2,
    Truck, Camera, AlertCircle
} from 'lucide-react';
import type { Correspondence } from '../types';

export const CorrespondencePage: React.FC = () => {
    const { user } = useAuth();
    const { towers, departments } = useInfrastructure();
    const { items, addItem, updateItemStatus } = useCorrespondence();
    const { couriers } = useCouriers();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'all' | 'pending' | 'delivered' | 'expected'>('all');

    // Form states
    const [towerId, setTowerId] = useState('');
    const [departmentId, setDepartmentId] = useState('');
    const [type, setType] = useState<Correspondence['type']>('package');
    const [addressee, setAddressee] = useState('');
    const [courier, setCourier] = useState('');
    const [details, setDetails] = useState('');
    const [evidenceImage, setEvidenceImage] = useState<string | undefined>(undefined);
    const [expectedDate, setExpectedDate] = useState('');
    const [expectedTimeRange, setExpectedTimeRange] = useState('');

    const isAdmin = user?.role === 'admin' || user?.role === 'global_admin' || user?.role === 'worker';
    const isResident = user?.role === 'resident';

    // Get resident properties if applicable
    const residentProperties = useMemo(() => {
        if (!isResident || !user?.relatedId) return [];
        return departments.filter(d => d.residentId === user.relatedId || d.ownerId === user.relatedId);
    }, [isResident, user?.relatedId, departments]);

    // Effect to pre-select unit if resident has only one property
    useEffect(() => {
        if (isModalOpen && isResident && residentProperties.length === 1) {
            setTowerId(residentProperties[0].towerId || '');
            setDepartmentId(residentProperties[0].id);
        }
    }, [isModalOpen, isResident, residentProperties]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEvidenceImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const status = isResident ? 'expected' : 'received';

        await addItem({
            towerId,
            departmentId,
            type,
            addressee,
            courier,
            details,
            evidenceImage,
            status,
            expectedDate,
            expectedTimeRange,
            receivedAt: status === 'received' ? new Date().toISOString() : undefined,
            receivedBy: status === 'received' ? user?.name : undefined
        });

        setIsModalOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setTowerId('');
        setDepartmentId('');
        setType('package');
        setAddressee('');
        setCourier('');
        setDetails('');
        setEvidenceImage(undefined);
        setExpectedDate('');
        setExpectedTimeRange('');
    };

    const getUnitInfo = (tId?: string, uId?: string) => {
        const tower = towers.find(t => t.id === tId);
        const unit = tower?.departments.find(d => d.id === uId);
        return unit ? `${tower?.name} - Depto ${unit.number}` : 'Ubicación no definida';
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.addressee.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.courier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.details?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesView = viewMode === 'all' ||
            (viewMode === 'pending' && (item.status === 'received' || item.status === 'notified')) ||
            (viewMode === 'delivered' && item.status === 'delivered') ||
            (viewMode === 'expected' && item.status === 'expected');

        const isAuthorized = isAdmin || (isResident && item.departmentId === (user as any).relatedId);

        return matchesSearch && matchesView && isAuthorized;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'received': return <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-700">Recibido</span>;
            case 'notified': return <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-700">Notificado</span>;
            case 'delivered': return <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-700">Entregado</span>;
            case 'expected': return <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 text-indigo-700">Por llegar</span>;
            default: return null;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <Package className="w-8 h-8 text-indigo-600" />
                        Gestión de Correspondencia
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 font-bold">Registro de paquetes, sobres y encomiendas.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    {isResident ? 'Informar Encomienda' : 'Registrar Recepción'}
                </Button>
            </div>

            <div className="flex bg-white dark:bg-gray-900 p-2 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm flex-col md:flex-row gap-4">
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl overflow-x-auto no-scrollbar">
                    {[
                        { id: 'all', label: 'Todos' },
                        { id: 'pending', label: 'Pendientes' },
                        { id: 'delivered', label: 'Entregados' },
                        { id: 'expected', label: 'Avisos' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setViewMode(tab.id as any)}
                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === tab.id ? 'bg-white dark:bg-gray-900 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar por destinatario o courier..."
                        className="w-full pl-12 pr-4 py-3 rounded-2xl bg-transparent border-none focus:ring-0 text-sm font-bold"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map(item => (
                    <div key={item.id} className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden group hover:shadow-xl transition-all">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl">
                                        <Truck className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Folio</p>
                                        <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 leading-none">{item.folio}</p>
                                    </div>
                                </div>
                                {getStatusBadge(item.status)}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight">{item.addressee}</h3>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                                        {getUnitInfo(item.towerId, item.departmentId)}
                                    </p>
                                </div>

                                <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl">
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-indigo-600 uppercase">Courier</p>
                                        <p className="text-sm font-black text-gray-900 dark:text-white capitalize">{item.courier || 'No especificado'}</p>
                                    </div>
                                    <div className="flex-1 text-right">
                                        <p className="text-[10px] font-black text-indigo-600 uppercase">Tipo</p>
                                        <p className="text-sm font-black text-gray-900 dark:text-white capitalize">{item.type}</p>
                                    </div>
                                </div>

                                {item.status === 'expected' ? (
                                    <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                                        <div className="flex items-center gap-2 text-indigo-600 mb-1">
                                            <AlertCircle className="w-4 h-4" />
                                            <p className="text-xs font-black uppercase tracking-widest">Información de llegada</p>
                                        </div>
                                        <p className="text-sm font-bold">Fecha: {item.expectedDate ? new Date(item.expectedDate).toLocaleDateString() : 'Por definir'}</p>
                                        <p className="text-xs text-gray-500 font-medium">Bloque: {item.expectedTimeRange || 'No especificado'}</p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Detalles</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.details || 'Sin observaciones adicionales'}</p>
                                    </div>
                                )}

                                {item.evidenceImage && (
                                    <div className="relative group/img aspect-video rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
                                        <img src={item.evidenceImage} alt="Evidencia" className="w-full h-full object-cover" />
                                    </div>
                                )}

                                {isAdmin && item.status !== 'delivered' && (
                                    <div className="pt-2">
                                        <button
                                            onClick={() => updateItemStatus(item.id, 'delivered', new Date().toISOString())}
                                            className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle2 className="w-4 h-4" /> Marcar como Entregado
                                        </button>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-gray-50 dark:border-gray-800 flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                    <span>Ref: {item.id.toUpperCase()}</span>
                                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-[3rem] w-full max-w-xl shadow-2xl border border-white/20 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b dark:border-gray-800 flex items-center justify-between">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                                <Package className="w-8 h-8 text-indigo-600" />
                                {isResident ? 'Informar Encomienda' : 'Nueva Recepción'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-colors text-gray-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-500 ml-1 uppercase">Torre/Edificio</label>
                                    <select
                                        className="w-full p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 font-bold text-sm outline-none"
                                        value={towerId}
                                        onChange={(e) => setTowerId(e.target.value)}
                                        required
                                    >
                                        <option value="">Seleccionar...</option>
                                        {isResident ? (
                                            Array.from(new Set(residentProperties.map(p => p.towerId))).map(tId => {
                                                const tower = towers.find(t => t.id === tId);
                                                return <option key={tId} value={tId}>{tower?.name}</option>;
                                            })
                                        ) : (
                                            towers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                                        )}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-500 ml-1 uppercase">Departamento</label>
                                    <select
                                        className="w-full p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 font-bold text-sm outline-none"
                                        value={departmentId}
                                        onChange={(e) => setDepartmentId(e.target.value)}
                                        required
                                        disabled={!towerId}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {isResident ? (
                                            residentProperties.filter(p => p.towerId === towerId).map(d => (
                                                <option key={d.id} value={d.id}>Depto {d.number}</option>
                                            ))
                                        ) : (
                                            towers.find(t => t.id === towerId)?.departments.map(d => (
                                                <option key={d.id} value={d.id}>Depto {d.number}</option>
                                            ))
                                        )}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input label="Destinatario" value={addressee} onChange={(e) => setAddressee(e.target.value)} placeholder="Nombre del residente" required />
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-500 ml-1 uppercase">Tipo</label>
                                    <select
                                        className="w-full p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 font-bold text-sm outline-none"
                                        value={type}
                                        onChange={(e) => setType(e.target.value as any)}
                                        required
                                    >
                                        <option value="package">Paquete / Encomienda</option>
                                        <option value="letter">Sobre / Documento</option>
                                        <option value="delivery">Pedido de Comida (Delivery)</option>
                                        <option value="other">Otro</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-500 ml-1 uppercase">Courier / Empresa</label>
                                    <select
                                        className="w-full p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 font-bold text-sm outline-none"
                                        value={courier}
                                        onChange={(e) => setCourier(e.target.value)}
                                        required
                                    >
                                        <option value="">Seleccionar Courier...</option>
                                        {couriers.filter(c => !c.isArchived).map(c => (
                                            <option key={c.id} value={c.name}>{c.name}</option>
                                        ))}
                                        <option value="OTRO">OTRO (Manual)</option>
                                    </select>
                                </div>
                                {courier === 'OTRO' && (
                                    <Input
                                        label="Especificar Empresa"
                                        onChange={(e) => setCourier(e.target.value)}
                                        placeholder="Ingrese nombre manual"
                                        autoFocus
                                        required
                                    />
                                )}
                                {isResident && (
                                    <Input label="Fecha Estimada" type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
                                )}
                                {isResident && (
                                    <Input label="Bloque Horario" value={expectedTimeRange} onChange={(e) => setExpectedTimeRange(e.target.value)} placeholder="Ej: 14:00 - 18:00" />
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-500 ml-1 uppercase">Detalles / Nota</label>
                                <textarea
                                    className="w-full p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 font-bold text-sm outline-none min-h-[100px]"
                                    value={details}
                                    onChange={(e) => setDetails(e.target.value)}
                                    placeholder="Indicaciones para el conserje..."
                                />
                            </div>

                            {!isResident && (
                                <div className="space-y-4">
                                    <label className="text-xs font-black text-gray-500 ml-1 uppercase tracking-widest">Foto de Evidencia</label>
                                    <div className="flex items-center gap-6 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                                        <div
                                            onClick={() => document.getElementById('camera-upload')?.click()}
                                            className="w-24 h-24 bg-white dark:bg-gray-800 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-sm cursor-pointer hover:scale-105 transition-transform overflow-hidden relative"
                                        >
                                            {evidenceImage ? (
                                                <img src={evidenceImage} className="w-full h-full object-cover" />
                                            ) : (
                                                <>
                                                    <Camera className="w-6 h-6 text-indigo-600" />
                                                    <span className="text-[10px] font-black uppercase text-gray-400">Subir</span>
                                                </>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Fotografía del paquete</p>
                                            <p className="text-xs text-gray-500 font-medium italic">Capture la etiqueta o el estado del paquete al recibirlo.</p>
                                        </div>
                                        <input id="camera-upload" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                    </div>
                                </div>
                            )}

                            <div className="pt-6">
                                <Button type="submit" className="w-full py-5 text-sm uppercase tracking-widest font-black shadow-xl shadow-indigo-600/20">
                                    Finalizar Registro
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

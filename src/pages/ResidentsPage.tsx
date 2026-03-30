import React, { useState, useRef } from 'react';
import { useResidents } from '../context/ResidentContext';
import { SecurityModal } from '../components/SecurityModal';
import { useInfrastructure } from '../context/InfrastructureContext';
import { useSpecialConditions } from '../context/SpecialConditionContext';
import { useHistoryLogs } from '../context/HistoryLogContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import {
    Plus, Search, Phone, Mail, FileText, Trash2, Edit2, X, Bookmark,
    Dog, CheckCircle2, Camera, User, Heart, History, Key, ShieldCheck,
    ChevronRight, MapPin, Info
} from 'lucide-react';
import type { Resident, HistoryLog } from '../types';
import { formatRUT } from '../utils/formatters';
import { useUsers } from '../context/UserContext';
import { compressImage } from '../utils/imageCompression';

export const ResidentsPage: React.FC = () => {
    const { residents, addResident, updateResident, deleteResident, uploadResidents } = useResidents();
    const { users, addUser, resetPassword, deleteUser } = useUsers();
    const { getLogsByEntity } = useHistoryLogs();
    const { towers } = useInfrastructure();
    const { conditions } = useSpecialConditions();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConditionsModalOpen, setIsConditionsModalOpen] = useState(false);
    const [editingResident, setEditingResident] = useState<Resident | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLogs, setSelectedLogs] = useState<HistoryLog[] | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [residentToDelete, setResidentToDelete] = useState<Resident | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form states
    const [names, setNames] = useState('');
    const [lastNames, setLastNames] = useState('');
    const [dni, setDni] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [photo, setPhoto] = useState<string | undefined>(undefined);
    const [notes, setNotes] = useState('');
    const [towerId, setTowerId] = useState('');
    const [unitId, setUnitId] = useState('');
    const [familyCount, setFamilyCount] = useState(0);
    const [hasPets, setHasPets] = useState(false);
    const [conditionIds, setConditionIds] = useState<string[]>([]);
    const [parkingIds, setParkingIds] = useState<string[]>([]);
    const [isTenant, setIsTenant] = useState(false);
    const [rentAmount, setRentAmount] = useState<number | undefined>(undefined);

    const handleViewLogs = (resident: Resident) => {
        const logs = getLogsByEntity('resident', resident.id);
        setSelectedLogs(logs);
    };

    const handleOpenModal = (res?: Resident) => {
        if (res) {
            setEditingResident(res);
            setNames(res.names);
            setLastNames(res.lastNames);
            setDni(res.dni);
            setPhone(res.phone);
            setEmail(res.email);
            setPhoto(res.photo);
            setNotes(res.notes || '');
            setTowerId(res.towerId || '');
            setUnitId(res.unitId || '');
            setFamilyCount(res.familyCount || 0);
            setHasPets(res.hasPets || false);
            setConditionIds(res.conditionIds || []);
            setParkingIds(res.parkingIds || []);
            setIsTenant(res.isTenant || false);
            setRentAmount(res.rentAmount);
        } else {
            setEditingResident(null);
            setNames('');
            setLastNames('');
            setDni('');
            setPhone('');
            setEmail('');
            setPhoto(undefined);
            setNotes('');
            setTowerId('');
            setUnitId('');
            setFamilyCount(0);
            setHasPets(false);
            setConditionIds([]);
            setParkingIds([]);
            setIsTenant(false);
            setRentAmount(undefined);
        }
        setIsModalOpen(true);
    };

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const compressed = await compressImage(file);
                setPhoto(compressed);
            } catch (err) {
                console.error('Error compressing image:', err);
            }
        }
    };

    const toggleCondition = (id: string) => {
        setConditionIds(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
    };



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = {
            names, lastNames, dni, phone, email, photo, notes,
            towerId: towerId || undefined,
            unitId: unitId || undefined,
            familyCount: Number(familyCount),
            hasPets, conditionIds, parkingIds, isTenant,
            rentAmount: isTenant ? Number(rentAmount) : undefined
        };
        if (editingResident) {
            await updateResident({ ...editingResident, ...data });
        } else {
            await addResident(data);
        }
        setIsModalOpen(false);
    };

    const selectedTower = towers.find(t => t.id === towerId);
    const availableUnits = selectedTower ? selectedTower.departments : [];

    const getUnitInfo = (tId?: string, uId?: string) => {
        if (!tId || !uId) return null;
        const tower = towers.find(t => t.id === tId);
        if (!tower) return null;
        const unit = tower.departments.find(d => d.id === uId);
        if (!unit) return null;
        return `Dpto ${unit.number}`;
    };

    const filteredResidents = residents.filter(r => {
        if (r.isArchived) return false;
        const cleanSearch = searchTerm.toLowerCase().trim();
        const cleanDniSearch = searchTerm.replace(/[^0-9kK]/g, '').toLowerCase();
        const matchName = `${r.names} ${r.lastNames}`.toLowerCase().includes(cleanSearch);
        const matchDni = r.dni.replace(/[^0-9kK]/g, '').toLowerCase().includes(cleanDniSearch);
        return matchName || (cleanDniSearch.length > 0 && matchDni);
    });

    const cleanRutForPassword = (rut: string) => {
        // En base a la solicitud: RUT sin puntos ni guiones ni dígito verificador
        const clean = rut.replace(/[^0-9kK]/g, '');
        return clean.slice(0, -1);
    };

    const handleCreateUser = async (res: Resident) => {
        const initialPassword = cleanRutForPassword(res.dni);
        await addUser({
            name: `${res.names} ${res.lastNames}`,
            email: res.email,
            role: 'resident',
            status: 'active',
            relatedId: res.id,
            mustChangePassword: true,
            password: initialPassword
        });
        alert(`Usuario creado para ${res.names}. La clave inicial es su RUT (${initialPassword}). Se le pedirá cambio al entrar.`);
    };

    const handleResetPassword = async (res: Resident) => {
        const user = users.find(u => u.relatedId === res.id);
        if (!user) return;
        const initialPassword = cleanRutForPassword(res.dni);
        await resetPassword(user.id, initialPassword);
        alert(`Contraseña restablecida para ${res.names}. La clave vuelve a ser su RUT (${initialPassword}).`);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                            <Bookmark className="w-6 h-6" />
                        </div>
                        Maestro de Residentes
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 font-bold px-1">Censo y contacto de propietarios y arrendatarios.</p>
                </div>
                <div className="flex gap-3">
                    <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            try {
                                const result = await uploadResidents(file);
                                alert(result.message);
                            } catch (err: any) {
                                alert(err.message);
                            }
                        }
                    }} />
                    <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="rounded-2xl font-black uppercase text-[10px] tracking-widest h-12">
                        <FileText className="w-4 h-4 mr-2" />
                        Masiva
                    </Button>
                    <Button onClick={() => handleOpenModal()} className="rounded-2xl font-black uppercase text-[10px] tracking-widest h-12 px-6">
                        <Plus className="w-4 h-4 mr-2" />
                        Nuevo Residente
                    </Button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-4 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
                <div className="relative flex-1 max-w-md ml-2">
                    <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o RUT..."
                        className="w-full pl-14 pr-6 py-4 rounded-3xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-sm shadow-inner"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mr-6 hidden md:block">
                    Total: <span className="text-indigo-600 ml-1">{filteredResidents.length}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredResidents.map((r) => (
                    <div key={r.id} className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 p-8 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <button onClick={() => handleOpenModal(r)} className="p-3 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all">
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setResidentToDelete(r); setIsDeleteModalOpen(true); }} className="p-3 bg-rose-50 dark:bg-rose-900/40 text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white transition-all">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex flex-col items-center mb-6">
                            {r.photo ? (
                                <img src={r.photo} alt={r.names} className="w-24 h-24 rounded-[2rem] object-cover border-4 border-white dark:border-gray-800 shadow-xl group-hover:scale-105 transition-transform" />
                            ) : (
                                <div className="w-24 h-24 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white font-black text-3xl uppercase shadow-xl group-hover:scale-105 transition-transform">
                                    {r.names.charAt(0)}{r.lastNames.charAt(0)}
                                </div>
                            )}
                            <div className="mt-6 text-center">
                                <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight">{r.names} {r.lastNames}</h3>
                                <div className="inline-flex items-center gap-2 mt-1 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                                    <span className="text-[10px] font-black text-gray-500 tracking-widest uppercase">{r.dni}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {r.unitId && (
                                <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-[1.5rem] border border-indigo-100 dark:border-indigo-900/40">
                                    <div className="flex items-center gap-3">
                                        <MapPin className="w-4 h-4 text-indigo-500" />
                                        <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">{getUnitInfo(r.towerId, r.unitId)}</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-indigo-300" />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl flex flex-col items-center justify-center text-center">
                                    <Phone className="w-4 h-4 text-emerald-500 mb-1" />
                                    <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 truncate w-full px-1">{r.phone}</span>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl flex flex-col items-center justify-center text-center">
                                    <Mail className="w-4 h-4 text-blue-500 mb-1" />
                                    <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 truncate w-full px-1">{r.email}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-6 py-4 border-t border-gray-100 dark:border-gray-800">
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">Habitantes</span>
                                    <span className="text-lg font-black text-gray-900 dark:text-white leading-none">{r.familyCount || 0}</span>
                                </div>
                                <div className="w-px h-8 bg-gray-100 dark:bg-gray-800"></div>
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">Mascotas</span>
                                    <div className="flex items-center gap-1.5 leading-none">
                                        <Dog className={`w-4 h-4 ${r.hasPets ? 'text-amber-500' : 'text-gray-200'}`} />
                                        <span className={`text-lg font-black leading-none ${r.hasPets ? 'text-gray-900 dark:text-white' : 'text-gray-300'}`}>{r.hasPets ? 'SÍ' : 'NO'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex items-center justify-between">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">En sistema: {new Date(r.createdAt).toLocaleDateString()}</span>
                                <button onClick={() => handleViewLogs(r)} className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">
                                    <History className="w-3.5 h-3.5" />
                                    Log
                                </button>
                            </div>

                            <div className="mt-4 pt-4 border-t border-dashed border-gray-100 dark:border-gray-800 flex gap-3">
                                {users.find(u => u.relatedId === r.id) ? (
                                    <Button variant="secondary" size="sm" className="w-full text-[10px] h-10 font-black uppercase tracking-widest rounded-2xl" onClick={() => handleResetPassword(r)}>
                                        <Key className="w-3.5 h-3.5 mr-2 text-amber-500" />
                                        Reset Clave
                                    </Button>
                                ) : (
                                    <Button size="sm" className="w-full text-[10px] h-10 font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 rounded-2xl shadow-lg shadow-emerald-500/20" onClick={() => handleCreateUser(r)}>
                                        <ShieldCheck className="w-3.5 h-3.5 mr-2" />
                                        Crear Acceso
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modals are already functional, just applying small aesthetic tweaks if necessary */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-[3rem] w-full max-w-4xl shadow-2xl border border-white/20 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b dark:border-gray-800 flex items-center justify-between">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                                    <Plus className="w-6 h-6" />
                                </div>
                                {editingResident ? 'Editar Residente' : 'Nuevo Residente'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl text-gray-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                                <div className="md:col-span-4 lg:col-span-3">
                                    <div className="flex flex-col items-center">
                                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                            <div className="w-48 h-48 rounded-[3rem] bg-gray-50 dark:bg-gray-800 border-4 border-dashed border-gray-200 dark:border-gray-700 overflow-hidden flex items-center justify-center transition-all group-hover:border-indigo-400">
                                                {photo ? <img src={photo} alt="Preview" className="w-full h-full object-cover" /> : <User className="w-16 h-16 text-gray-300" />}
                                                <div className="absolute inset-0 bg-indigo-600/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[2px]">
                                                    <Camera className="w-10 h-10 text-white" />
                                                </div>
                                            </div>
                                            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white border-4 border-white dark:border-gray-900 shadow-xl">
                                                <Plus className="w-6 h-6" />
                                            </div>
                                        </div>
                                        <input type="file" ref={fileInputRef} onChange={handlePhotoChange} accept="image/*" className="hidden" />
                                        <p className="mt-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center leading-relaxed">
                                            Fotografía del residente (No avatar).<br />
                                            <span className="opacity-70 normal-case tracking-normal">Requerida para control de identidad formal y autorización expresa de acceso.</span><br />
                                            Formato: JPG, PNG o WebP
                                        </p>
                                    </div>
                                </div>
                                <div className="md:col-span-8 lg:col-span-9 space-y-8">
                                    <div className="grid grid-cols-2 gap-6">
                                        <Input label="Nombres" value={names} onChange={(e) => setNames(e.target.value)} required />
                                        <Input label="Apellidos" value={lastNames} onChange={(e) => setLastNames(e.target.value)} required />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Input label="RUT" value={dni} onChange={(e) => setDni(formatRUT(e.target.value))} required />
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input label="Teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                                            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6 p-8 bg-gray-50 dark:bg-gray-800/40 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-inner">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Torre / Edificio</label>
                                            <select value={towerId} onChange={(e) => { setTowerId(e.target.value); setUnitId(''); }} className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all">
                                                <option value="">Seleccione Torre</option>
                                                {towers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Unidad de Vivienda</label>
                                            <select value={unitId} onChange={(e) => setUnitId(e.target.value)} disabled={!towerId} className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm font-bold disabled:opacity-50 focus:ring-4 focus:ring-indigo-500/10 transition-all">
                                                <option value="">Seleccione Unidad</option>
                                                {availableUnits.map(u => <option key={u.id} value={u.id}>Depto {u.number}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-8 border-t dark:border-gray-800">
                                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="rounded-2xl px-8 h-12 uppercase font-black text-[10px] tracking-widest">Cancelar</Button>
                                <Button type="submit" className="rounded-2xl px-12 h-12 uppercase font-black text-[10px] tracking-widest shadow-xl shadow-indigo-500/20">Guardar Registro</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Other modals remain the same for logic, but wrapped in similar premium styles */}
            {isConditionsModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
                    <div className="bg-white dark:bg-gray-900 rounded-[3rem] w-full max-w-md shadow-2xl p-10">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-4 mb-8 leading-none">
                            <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-500">
                                <Heart className="w-6 h-6" />
                            </div>
                            Condiciones
                        </h2>
                        <div className="space-y-3 max-h-[45vh] overflow-y-auto mb-8 custom-scrollbar px-1">
                            {conditions.map(c => (
                                <button key={c.id} onClick={() => toggleCondition(c.id)} className={`w-full flex items-center justify-between p-5 rounded-3xl border-2 transition-all ${conditionIds.includes(c.id) ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/10 text-rose-700 dark:text-rose-400' : 'border-gray-100 dark:border-gray-800 text-gray-400'}`}>
                                    <span className="text-sm font-black uppercase tracking-widest">{c.name}</span>
                                    {conditionIds.includes(c.id) && <CheckCircle2 className="w-6 h-6" />}
                                </button>
                            ))}
                        </div>
                        <Button onClick={() => setIsConditionsModalOpen(false)} className="w-full h-14 font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-rose-500/10">Confirmar</Button>
                    </div>
                </div>
            )}

            {selectedLogs && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-[3rem] w-full max-w-2xl max-h-[80vh] shadow-2xl border border-white/20 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
                        <div className="p-8 border-b dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-10">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                                <History className="w-6 h-6 text-indigo-600" />
                                Historial de Auditoría
                            </h2>
                            <button onClick={() => setSelectedLogs(null)} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl text-gray-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto space-y-4 custom-scrollbar">
                            {selectedLogs.length === 0 ? (
                                <div className="text-center py-20 text-gray-300">
                                    <Info className="w-16 h-16 mx-auto mb-4 opacity-10" />
                                    <p className="font-bold italic">No hay registros históricos para este residente.</p>
                                </div>
                            ) : (
                                selectedLogs.map(log => (
                                    <div key={log.id} className="p-6 bg-gray-50 dark:bg-gray-800/40 rounded-[2rem] border border-gray-100 dark:border-gray-700/50">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] ${log.action === 'created' ? 'bg-emerald-100 text-emerald-700' :
                                                log.action === 'updated' ? 'bg-indigo-100 text-indigo-700' :
                                                    'bg-rose-100 text-rose-700'
                                                }`}>
                                                {log.action}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-black">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-900 dark:text-white font-bold mb-4">"{log.details}"</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            <SecurityModal
                isOpen={isDeleteModalOpen}
                onClose={() => { setIsDeleteModalOpen(false); setResidentToDelete(null); }}
                onConfirm={() => {
                    if (residentToDelete) {
                        const user = users.find(u => u.relatedId === residentToDelete.id);
                        if (user) {
                            deleteUser(user.id);
                        }
                        deleteResident(residentToDelete.id);
                    }
                }}
                title="Eliminar Residente"
                description="¿Está seguro de eliminar a"
                itemName={residentToDelete ? `${residentToDelete.names} ${residentToDelete.lastNames}` : ''}
                actionLabel="Eliminar Residente"
            />
        </div>
    );
};

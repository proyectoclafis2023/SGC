import React, { useState } from 'react';
import { useOwners } from '../context/OwnerContext';
import { useHistoryLogs } from '../context/HistoryLogContext';
import { useUsers } from '../context/UserContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { SecurityModal } from '../components/SecurityModal';
import { Plus, Search, UserCheck, Edit2, Trash2, X, History, Info, Key, ShieldCheck } from 'lucide-react';
import { formatRUT } from '../utils/formatters';
import type { Owner, HistoryLog } from '../types';

export const OwnersPage: React.FC = () => {
    const { owners, addOwner, updateOwner, deleteOwner } = useOwners();
    const { users, addUser, resetPassword, deleteUser } = useUsers();
    const { getLogsByEntity } = useHistoryLogs();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOwner, setEditingOwner] = useState<Owner | null>(null);
    const [selectedLogs, setSelectedLogs] = useState<HistoryLog[] | null>(null);

    // Deletion states
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [ownerToDelete, setOwnerToDelete] = useState<Owner | null>(null);

    // Form states
    const [names, setNames] = useState('');
    const [lastNames, setLastNames] = useState('');
    const [dni, setDni] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [receiveResidentNotifications, setReceiveResidentNotifications] = useState(false);

    const handleOpenModal = (owner?: Owner) => {
        if (owner) {
            setEditingOwner(owner);
            setNames(owner.names);
            setLastNames(owner.lastNames);
            setDni(owner.dni);
            setPhone(owner.phone);
            setEmail(owner.email);
            setReceiveResidentNotifications(owner.receiveResidentNotifications || false);
        } else {
            setEditingOwner(null);
            setNames('');
            setLastNames('');
            setDni('');
            setPhone('');
            setEmail('');
            setReceiveResidentNotifications(false);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = { names, lastNames, dni, phone, email, receiveResidentNotifications };
        if (editingOwner) {
            await updateOwner({ ...editingOwner, ...data });
        } else {
            //@ts-ignore - status is handled in context
            await addOwner(data);
        }
        setIsModalOpen(false);
    };

    const handleViewLogs = (owner: Owner) => {
        const logs = getLogsByEntity('owner', owner.id);
        setSelectedLogs(logs);
    };

    const handleDeleteClick = (owner: Owner) => {
        setOwnerToDelete(owner);
        setIsDeleteModalOpen(true);
    };

    const filteredOwners = owners.filter(o => {
        if (o.isArchived) return false;

        const cleanSearch = searchTerm.toLowerCase().trim();
        const cleanDniSearch = searchTerm.replace(/[^0-9kK]/g, '').toLowerCase();

        const matchName = `${o.names} ${o.lastNames}`.toLowerCase().includes(cleanSearch);
        const matchDni = o.dni.replace(/[^0-9kK]/g, '').toLowerCase().includes(cleanDniSearch);

        return matchName || (cleanDniSearch.length > 0 && matchDni);
    });

    const cleanRutForPassword = (rut: string) => {
        // En base a la solicitud: RUT sin puntos ni guiones ni dígito verificador
        const clean = rut.replace(/[^0-9kK]/g, '');
        return clean.slice(0, -1);
    };

    const handleCreateUser = async (owner: Owner) => {
        const initialPassword = cleanRutForPassword(owner.dni);
        await addUser({
            name: `${owner.names} ${owner.lastNames}`,
            email: owner.email,
            role: 'owner',
            status: 'active',
            relatedId: owner.id,
            mustChangePassword: true,
            password: initialPassword
        });
        alert(`Usuario creado para ${owner.names}. La clave inicial es su RUT (${initialPassword}). Se le pedirá cambio al entrar.`);
    };

    const handleResetPassword = async (owner: Owner) => {
        const user = users.find(u => u.relatedId === owner.id);
        if (!user) return;
        const initialPassword = cleanRutForPassword(owner.dni);
        await resetPassword(user.id, initialPassword);
        alert(`Contraseña restablecida para ${owner.names}. La clave vuelve a ser su RUT (${initialPassword}).`);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <UserCheck className="w-8 h-8 text-indigo-600" />
                        Maestro de Propietarios
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 font-bold">Gestión de dueños de unidades y su historial de cambios.</p>
                </div>
                <Button onClick={() => handleOpenModal()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Propietario
                </Button>
            </div>

            <div className="bg-white dark:bg-gray-900 p-4 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o DNI..."
                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOwners.map((o) => (
                    <div key={o.id} className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden group hover:shadow-xl transition-all relative">
                        <div className="p-8">
                            <div className="flex items-start justify-between">
                                <div className="flex gap-4">
                                    <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-2xl uppercase shadow-sm">
                                        {o.names.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-gray-900 dark:text-white text-lg">{o.names} {o.lastNames}</h3>
                                        <p className="text-xs font-black text-indigo-500 uppercase tracking-widest">{o.dni}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleOpenModal(o)} className="p-2 text-gray-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleDeleteClick(o)} className="p-2 text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="mt-6 space-y-3">
                                <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 font-bold">
                                    <span className="w-4 flex justify-center"><Info className="w-3.5 h-3.5" /></span>
                                    <span className="truncate">{o.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 font-bold">
                                    <span className="w-4 flex justify-center font-black">#</span>
                                    <span>{o.phone}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs font-bold mt-2">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-widest ${o.receiveResidentNotifications ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                                        Notificaciones del Residente: {o.receiveResidentNotifications ? 'Activadas' : 'Inactivas'}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-50 dark:border-gray-800 flex justify-between items-center">
                                <span className="text-[9px] text-gray-400 uppercase tracking-widest font-black opacity-60">Ingreso: {new Date(o.createdAt).toLocaleDateString()}</span>
                                <button
                                    onClick={() => handleViewLogs(o)}
                                    className="flex items-center gap-1.5 text-[10px] text-indigo-600 uppercase font-black hover:underline"
                                >
                                    <History className="w-3 h-3" />
                                    Log Cambios
                                </button>
                            </div>

                            <div className="mt-4 pt-4 border-t border-dashed border-gray-100 dark:border-gray-800 flex gap-2">
                                {users.find(u => u.relatedId === o.id) ? (
                                    <Button variant="secondary" size="sm" className="w-full text-[10px] h-9 font-black uppercase tracking-widest rounded-xl" onClick={() => handleResetPassword(o)}>
                                        <Key className="w-3.5 h-3.5 mr-2 text-amber-500" />
                                        Reset Clave
                                    </Button>
                                ) : (
                                    <Button size="sm" className="w-full text-[10px] h-9 font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 rounded-xl" onClick={() => handleCreateUser(o)}>
                                        <ShieldCheck className="w-3.5 h-3.5 mr-2" />
                                        Crear Acceso
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modals remain similarly structured but with improved aesthetics */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] w-full max-w-md shadow-2xl border border-white/20 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b dark:border-gray-800 flex items-center justify-between">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-4Leading-none">
                                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                                    <UserCheck className="w-6 h-6" />
                                </div>
                                <span>{editingOwner ? 'Editar Dueño' : 'Nuevo Dueño'}</span>
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl text-gray-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Nombres" value={names} onChange={(e) => setNames(e.target.value)} required />
                                <Input label="Apellidos" value={lastNames} onChange={(e) => setLastNames(e.target.value)} required />
                            </div>
                            <Input label="DNI / RUT" value={dni} onChange={(e) => setDni(formatRUT(e.target.value))} required />
                            <Input label="Teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">Notificaciones de Residentes</p>
                                    <p className="text-[10px] text-gray-500 font-medium">Recibir copias cuando un residente genere acciones (visitas, encomiendas, reservas).</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setReceiveResidentNotifications(!receiveResidentNotifications)}
                                    className={`w-12 h-6 rounded-full transition-all relative shrink-0 ${receiveResidentNotifications ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-700'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${receiveResidentNotifications ? 'right-1' : 'left-1'}`} />
                                </button>
                            </div>
                            <div className="flex justify-end gap-3 pt-6 border-t dark:border-gray-800">
                                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                                <Button type="submit">Guardar</Button>
                            </div>
                        </form>
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
                                    <p className="font-bold italic">No hay registros históricos para este propietario.</p>
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
                                        {log.action === 'updated' && log.previousValue && (
                                            <div className="grid grid-cols-2 gap-4 text-[10px] font-bold">
                                                <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                                                    <p className="text-gray-400 mb-2 uppercase tracking-widest border-b pb-1">Anterior</p>
                                                    <pre className="text-rose-500 whitespace-pre-wrap font-mono">{JSON.stringify(log.previousValue, null, 2)}</pre>
                                                </div>
                                                <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                                                    <p className="text-gray-400 mb-2 uppercase tracking-widest border-b pb-1">Nuevo</p>
                                                    <pre className="text-emerald-500 whitespace-pre-wrap font-mono">{JSON.stringify(log.newValue, null, 2)}</pre>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            <SecurityModal
                isOpen={isDeleteModalOpen}
                onClose={() => { setIsDeleteModalOpen(false); setOwnerToDelete(null); }}
                onConfirm={() => {
                    if (ownerToDelete) {
                        const user = users.find(u => u.relatedId === ownerToDelete.id);
                        if (user) {
                            deleteUser(user.id);
                        }
                        deleteOwner(ownerToDelete.id);
                        setIsDeleteModalOpen(false);
                        setOwnerToDelete(null);
                    }
                }}
                title="Eliminar Propietario"
                description="¿Está seguro de eliminar a"
                itemName={ownerToDelete ? `${ownerToDelete.names} ${ownerToDelete.lastNames}` : ''}
                actionLabel="Eliminar Propietario"
            />
        </div>
    );
};

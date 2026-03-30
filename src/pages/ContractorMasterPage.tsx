import React, { useState } from 'react';
import { useContractors } from '../context/ContractorContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import {
    HardHat, Plus, Search, X, Phone, Mail,
    DollarSign, AlertCircle, Edit2, Trash2, CheckCircle2,
    Calendar, Eye, EyeOff, Info
} from 'lucide-react';
import type { Contractor } from '../types';
import { useSettings } from '../context/SettingsContext';

export const ContractorMasterPage: React.FC = () => {
    const { contractors, addContractor, updateContractor, deleteContractor } = useContractors();
    const { settings } = useSettings();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingContractor, setEditingContractor] = useState<Contractor | null>(null);

    // Form fields
    const [name, setName] = useState('');
    const [specialty, setSpecialty] = useState('');
    const [monthlyPayment, setMonthlyPayment] = useState(0);
    const [hours, setHours] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [escalationContact, setEscalationContact] = useState('');
    const [escalationPhone, setEscalationPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [maintenanceFrequency, setMaintenanceFrequency] = useState<Contractor['maintenanceFrequency']>('none');
    const [lastMaintenanceDate, setLastMaintenanceDate] = useState('');
    const [showToResidents, setShowToResidents] = useState(true);

    const filteredContractors = contractors.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.specialty.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const resetForm = () => {
        setName('');
        setSpecialty('');
        setMonthlyPayment(0);
        setHours('');
        setPhone('');
        setEmail('');
        setEscalationContact('');
        setEscalationPhone('');
        setNotes('');
        setIsActive(true);
        setMaintenanceFrequency('none');
        setLastMaintenanceDate('');
        setShowToResidents(true);
        setEditingContractor(null);
    };

    const handleEdit = (c: Contractor) => {
        setEditingContractor(c);
        setName(c.name);
        setSpecialty(c.specialty);
        setMonthlyPayment(c.monthlyPaymentAmount || 0);
        setHours(c.hoursOfService || '');
        setPhone(c.phone);
        setEmail(c.email);
        setEscalationContact(c.escalationContact || '');
        setEscalationPhone(c.escalationPhone || '');
        setNotes(c.notes || '');
        setIsActive(c.isActive);
        setMaintenanceFrequency(c.maintenanceFrequency || 'none');
        setLastMaintenanceDate(c.lastMaintenanceDate || '');
        setShowToResidents(c.showToResidents ?? true);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const contractorData = {
            name,
            specialty,
            monthlyPaymentAmount: monthlyPayment,
            hoursOfService: hours,
            phone,
            email,
            escalationContact,
            escalationPhone,
            notes,
            isActive,
            maintenanceFrequency,
            lastMaintenanceDate,
            showToResidents
        } as Omit<Contractor, 'id' | 'folio' | 'createdAt'>;

        if (editingContractor) {
            await updateContractor({ ...editingContractor, ...contractorData });
        } else {
            await addContractor(contractorData);
        }

        setIsModalOpen(false);
        resetForm();
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className={`text-2xl font-black flex items-center gap-2 ${settings.theme === 'modern' ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        <HardHat className="w-8 h-8 text-indigo-600" />
                        Maestro de Contratistas
                    </h1>
                    <p className={`text-sm mt-1 font-bold ${settings.theme === 'modern' ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'}`}>Gestión de servicios externos y mantenimientos preventivos.</p>
                </div>
                <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
                    <Plus className="w-4 h-4 mr-2" /> Nuevo Contratista
                </Button>
            </div>

            <div className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o especialidad..."
                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredContractors.map(c => (
                    <div key={c.id} className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden group hover:shadow-xl transition-all">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-2xl ${c.isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-400'}`}>
                                        <HardHat className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Especialidad</p>
                                        <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 leading-none">{c.specialty}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${c.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                        {c.isActive ? 'Activo' : 'Inactivo'}
                                    </span>
                                    {c.showToResidents && (
                                        <span className="flex items-center gap-1 text-[8px] font-black text-indigo-500 uppercase tracking-tighter">
                                            <Eye className="w-2 h-2" /> Visible Residentes
                                        </span>
                                    )}
                                </div>
                            </div>

                            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">{c.name}</h3>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm font-bold text-gray-600 dark:text-gray-400">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    {c.phone}
                                </div>
                                <div className="flex items-center gap-3 text-sm font-bold text-gray-600 dark:text-gray-400">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    {c.email}
                                </div>

                                {c.maintenanceFrequency && c.maintenanceFrequency !== 'none' && (
                                    <div className="flex items-center gap-3 text-xs font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                                        <Calendar className="w-4 h-4" />
                                        Mantención: {
                                            c.maintenanceFrequency === 'monthly' ? 'Mensual' :
                                                c.maintenanceFrequency === 'half-yearly' ? 'Semestral' : 'Anual'
                                        }
                                    </div>
                                )}

                                {c.monthlyPaymentAmount && c.monthlyPaymentAmount > 0 && (
                                    <div className="flex items-center gap-3 text-xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 p-2 rounded-xl">
                                        <DollarSign className="w-4 h-4" />
                                        Iguala mensual: ${c.monthlyPaymentAmount.toLocaleString('es-CL')}
                                    </div>
                                )}
                            </div>

                            {(c.escalationContact || c.escalationPhone) && (
                                <div className="mt-4 p-4 bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/30">
                                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> Escalamiento / Urgencias
                                    </p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{c.escalationContact}</p>
                                    <p className="text-xs font-bold text-rose-600">{c.escalationPhone}</p>
                                </div>
                            )}

                            <div className="mt-6 flex gap-2">
                                <button
                                    onClick={() => handleEdit(c)}
                                    className="flex-1 py-2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl text-xs font-black uppercase transition hover:bg-indigo-600 hover:text-white flex items-center justify-center gap-2"
                                >
                                    <Edit2 className="w-3 h-3" /> Editar
                                </button>
                                <button
                                    onClick={() => { if (confirm('¿Eliminar contratista?')) deleteContractor(c.id); }}
                                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto">
                    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] w-full max-w-2xl shadow-2xl border border-white/20 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-200 my-8">
                        <div className="p-8 border-b dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900 z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                                    <HardHat className="w-6 h-6" />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-none">
                                    {editingContractor ? 'Editar Contratista' : 'Nuevo Contratista'}
                                </h2>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-colors text-gray-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] md:max-h-[80vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input label="Nombre de Empresa / Profesional" value={name} onChange={e => setName(e.target.value)} required />
                                <Input label="Especialidad" value={specialty} onChange={e => setSpecialty(e.target.value)} placeholder="Ej. Eléctrica, Hidropack" required />
                                <Input label="Teléfono" value={phone} onChange={e => setPhone(e.target.value)} required />
                                <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                            </div>

                            <div className="pt-4 border-t dark:border-gray-800">
                                <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4">Programación de Mantención</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5 font-bold">
                                        <label className="text-xs font-black text-gray-500 ml-1 uppercase tracking-widest">Frecuencia de Mantención</label>
                                        <select
                                            value={maintenanceFrequency}
                                            onChange={e => setMaintenanceFrequency(e.target.value as any)}
                                            className="w-full p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-sm font-bold text-gray-900 dark:text-white"
                                        >
                                            <option value="none">Sin mantención programada</option>
                                            <option value="monthly">Mensual</option>
                                            <option value="half-yearly">Semestral</option>
                                            <option value="annual">Anual</option>
                                        </select>
                                    </div>
                                    <Input
                                        label="Fecha Última Mantención"
                                        type="date"
                                        value={lastMaintenanceDate}
                                        onChange={e => setLastMaintenanceDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t dark:border-gray-800">
                                <Input label="Horario de Servicio" value={hours} onChange={e => setHours(e.target.value)} placeholder="Ej. Lunes a Viernes 09:00 - 18:00" />
                                <Input label="Iguala Mensual ($)" type="number" value={monthlyPayment} onChange={e => setMonthlyPayment(Number(e.target.value))} />
                            </div>

                            <div className="pt-4 border-t dark:border-gray-800">
                                <h3 className="text-xs font-black text-rose-600 uppercase tracking-widest mb-4">Contacto de Escalamiento / Urgencias</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input label="Nombre de Contacto" value={escalationContact} onChange={e => setEscalationContact(e.target.value)} />
                                    <Input label="Teléfono de Urgencia" value={escalationPhone} onChange={e => setEscalationPhone(e.target.value)} />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-gray-500 ml-1 uppercase tracking-widest">Notas Adicionales</label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className="w-full rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all min-h-[100px]"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 className={`w-5 h-5 ${isActive ? 'text-emerald-500' : 'text-gray-300'}`} />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-white">Estado Activo</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsActive(!isActive)}
                                        className={`w-10 h-5 rounded-full transition-all relative ${isActive ? 'bg-emerald-600' : 'bg-gray-300'}`}
                                    >
                                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${isActive ? 'right-0.5' : 'left-0.5'}`} />
                                    </button>
                                </div>

                                <div className="p-4 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            {showToResidents ? <Eye className="w-5 h-5 text-indigo-500" /> : <EyeOff className="w-5 h-5 text-gray-300" />}
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-white">Ver Residentes</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowToResidents(!showToResidents)}
                                            className={`w-10 h-5 rounded-full transition-all relative ${showToResidents ? 'bg-indigo-600' : 'bg-gray-300'}`}
                                        >
                                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${showToResidents ? 'right-0.5' : 'left-0.5'}`} />
                                        </button>
                                    </div>
                                    <div className="flex gap-2 items-start bg-white/50 dark:bg-black/20 p-2 rounded-xl border border-indigo-100/50 dark:border-indigo-800/30">
                                        <Info className="w-3 h-3 text-indigo-500 mt-0.5" />
                                        <p className="text-[9px] font-bold text-gray-600 dark:text-gray-400 leading-tight italic">
                                            Habilitar para que los residentes vean este contacto como un trabajador recomendado y calificado por el condominio.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                                <Button type="submit" className="flex-1 shadow-xl shadow-indigo-600/20">
                                    {editingContractor ? 'Guardar Cambios' : 'Registrar Contratista'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

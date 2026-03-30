import React, { useState } from 'react';
import { useContractorVisits } from '../context/ContractorVisitContext';
import { useContractors } from '../context/ContractorContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import {
    HardHat, Plus, Search, X,
    LogIn, LogOut, History
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export const ContractorsPage: React.FC = () => {
    const { visits, addVisit, updateVisitStatus } = useContractorVisits();
    const { contractors } = useContractors();
    const { settings } = useSettings();

    const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form fields
    const [names, setNames] = useState('');
    const [dni, setDni] = useState('');
    const [company, setCompany] = useState('');
    const [subject, setSubject] = useState('');
    const [contractorId, setContractorId] = useState('');

    const filteredVisits = visits.filter(v =>
        v.names.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.dni.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.company.toLowerCase().includes(searchTerm.toLowerCase())
    ).filter(v => activeTab === 'current' ? v.status === 'entered' : v.status === 'exited');

    const resetForm = () => {
        setNames('');
        setDni('');
        setCompany('');
        setSubject('');
        setContractorId('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await addVisit({
            names,
            dni,
            company,
            subject,
            contractorId: contractorId || undefined,
            entryTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        setIsModalOpen(false);
        resetForm();
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className={`text-2xl font-black flex items-center gap-2 ${settings.theme === 'modern' ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        <HardHat className="w-8 h-8 text-indigo-600" />
                        Registro de Contratistas
                    </h1>
                    <p className={`text-sm mt-1 font-bold ${settings.theme === 'modern' ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'}`}>Control de ingreso para personal externo y servicios.</p>
                </div>
                <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="shadow-lg shadow-indigo-600/20">
                    <Plus className="w-4 h-4 mr-2" />
                    Registrar Ingreso
                </Button>
            </div>

            <div className="flex p-1.5 bg-gray-100 dark:bg-gray-800 rounded-3xl w-fit border border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('current')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'current' ? 'bg-white dark:bg-gray-900 text-indigo-600 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <LogIn className="w-4 h-4" />
                    En Recinto
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-white dark:bg-gray-900 text-indigo-600 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <History className="w-4 h-4" />
                    Historial
                </button>
            </div>

            <div className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, RUT o empresa..."
                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVisits.map(v => (
                    <div key={v.id} className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden group hover:shadow-xl transition-all">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl">
                                    <HardHat className="w-6 h-6" />
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${v.status === 'entered' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {v.status === 'entered' ? 'En Recinto' : 'Salida'}
                                </span>
                            </div>

                            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1 leading-tight">{v.names}</h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">{v.dni}</p>

                            <div className="space-y-3 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-black text-gray-400 uppercase tracking-widest">Empresa</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{v.company}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-black text-gray-400 uppercase tracking-widest">Motivo</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{v.subject}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-200 dark:border-gray-700">
                                    <span className="font-black text-gray-400 uppercase tracking-widest">Ingreso</span>
                                    <span className="font-black text-emerald-600">{v.entryTime}</span>
                                </div>
                                {v.exitTime && (
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-black text-gray-400 uppercase tracking-widest">Salida</span>
                                        <span className="font-black text-rose-600">{v.exitTime}</span>
                                    </div>
                                )}
                            </div>

                            {v.status === 'entered' && (
                                <button
                                    onClick={() => updateVisitStatus(v.id, 'exited')}
                                    className="w-full mt-6 py-3 bg-gray-900 dark:bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-lg"
                                >
                                    <LogOut className="w-4 h-4" /> Registrar Salida
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] w-full max-w-xl shadow-2xl border border-white/20 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className={`p-8 border-b flex items-center justify-between ${settings.theme === 'modern' ? 'bg-indigo-950/40 border-indigo-900/50' : 'bg-gray-50/30'}`}>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                                <HardHat className="w-8 h-8 text-indigo-600" />
                                Nuevo Ingreso Contratista
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-colors text-gray-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <Input label="Nombre Completo" value={names} onChange={e => setNames(e.target.value)} required />
                                </div>
                                <Input label="RUT / DNI" value={dni} onChange={e => setDni(e.target.value)} required />
                                <Input label="Empresa / Institución" value={company} onChange={e => setCompany(e.target.value)} required />

                                <div className="md:col-span-1 space-y-1.5 font-bold">
                                    <label className="text-xs font-black text-gray-500 ml-1 uppercase tracking-widest">Maestro Contratistas (Opcional)</label>
                                    <select
                                        className="w-full p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-bold text-gray-900 dark:text-white"
                                        value={contractorId}
                                        onChange={e => {
                                            const selected = contractors.find(c => c.id === e.target.value);
                                            setContractorId(e.target.value);
                                            if (selected) {
                                                setCompany(selected.name);
                                                setSubject(selected.specialty);
                                            }
                                        }}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {contractors.map(c => <option key={c.id} value={c.id}>{c.name} ({c.specialty})</option>)}
                                    </select>
                                </div>
                                <Input label="Motivo de Ingreso" value={subject} onChange={e => setSubject(e.target.value)} required placeholder="Ej. Mantención Ascensores" />
                            </div>
                            <div className="flex gap-3 pt-6 border-t dark:border-gray-800">
                                <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                                <Button type="submit" className="flex-1 shadow-xl shadow-indigo-600/20">Registrar Entrada</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

import React, { useState } from 'react';
import { useContractors } from '../context/ContractorContext';
import { HardHat, Phone, Mail, Clock, Search, ExternalLink, ShieldCheck } from 'lucide-react';

export const ResidentsServicesPage: React.FC = () => {
    const { contractors } = useContractors();
    const [searchTerm, setSearchTerm] = useState('');

    const publicContractors = contractors.filter(c => c.isActive && c.showToResidents);

    const filtered = publicContractors.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.specialty.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="relative overflow-hidden bg-indigo-600 rounded-[3rem] p-12 text-white">
                <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                    <ShieldCheck className="w-64 h-64" />
                </div>
                <div className="relative z-10">
                    <h1 className="text-4xl font-black mb-2 flex items-center gap-4">
                        <HardHat className="w-12 h-12" />
                        Servicios para Residentes
                    </h1>
                    <p className="text-indigo-100 font-bold max-w-xl text-lg">
                        Listado oficial de proveedores recomendados y servicios externos certificados por el condominio.
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="¿Qué servicio busca? (Gasfiter, Eléctrico, etc.)"
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-lg"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {filtered.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filtered.map(c => (
                        <div key={c.id} className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden group hover:shadow-2xl hover:translate-y--2 transition-all">
                            <div className="p-8">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <HardHat className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Especialidad</p>
                                        <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight">{c.specialty}</h3>
                                    </div>
                                </div>

                                <h2 className="text-2xl font-black text-indigo-600 dark:text-white mb-6 leading-tight">{c.name}</h2>

                                <div className="space-y-4">
                                    <a
                                        href={`tel:${c.phone}`}
                                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 group transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white dark:bg-gray-900 rounded-xl text-emerald-500 shadow-sm">
                                                <Phone className="w-5 h-5" />
                                            </div>
                                            <span className="font-black text-gray-900 dark:text-white">{c.phone}</span>
                                        </div>
                                        <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-emerald-500" />
                                    </a>

                                    <a
                                        href={`mailto:${c.email}`}
                                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 group transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white dark:bg-gray-900 rounded-xl text-indigo-500 shadow-sm">
                                                <Mail className="w-5 h-5" />
                                            </div>
                                            <span className="font-black text-gray-900 dark:text-white truncate max-w-[150px]">{c.email}</span>
                                        </div>
                                        <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-indigo-500" />
                                    </a>

                                    {c.hoursOfService && (
                                        <div className="flex items-center gap-3 p-4 text-xs font-bold text-gray-500">
                                            <Clock className="w-5 h-5 text-gray-400" />
                                            Horario: {c.hoursOfService}
                                        </div>
                                    )}
                                </div>

                                {c.notes && (
                                    <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                                        <p className="text-xs font-bold text-gray-400 leading-relaxed italic">
                                            "{c.notes}"
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-20 text-center bg-gray-50 dark:bg-gray-800/20 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <HardHat className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-black text-gray-400">No se encontraron proveedores</h3>
                    <p className="text-sm font-bold text-gray-300 mt-2">Intente con otra búsqueda o especialidad</p>
                </div>
            )}
        </div>
    );
};

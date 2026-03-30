import React, { useState } from 'react';
import { useEmergencyNumbers } from '../context/EmergencyNumberContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import {
    Phone, Plus, Search, Trash2, Edit2, Shield, Flame, Activity, Wrench, Globe, ExternalLink, X
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export const EmergencyNumbersPage: React.FC<{ isMaster?: boolean }> = ({ isMaster = false }) => {
    const { numbers, addNumber, updateNumber, deleteNumber } = useEmergencyNumbers();
    const { user } = useAuth();
    const { settings } = useSettings();
    const isAdmin = user?.role === 'admin' || user?.role === 'global_admin';

    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNumber, setEditingNumber] = useState<any>(null);

    // Form fields
    const [category, setCategory] = useState('SEGURIDAD');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [description, setDescription] = useState('');
    const [webUrl, setWebUrl] = useState('');

    const filteredNumbers = numbers.filter(n =>
        n.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const categories = [
        { id: 'SEGURIDAD', label: 'Seguridad', icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 'EMERGENCIA', label: 'Emergencia', icon: Flame, color: 'text-rose-600', bg: 'bg-rose-50' },
        { id: 'SALUD', label: 'Salud', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { id: 'SERVICIOS_BASICOS', label: 'Servicios Básicos', icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-50' },
        { id: 'OTROS', label: 'Otros', icon: Globe, color: 'text-gray-600', bg: 'bg-gray-50' }
    ];

    const resetForm = () => {
        setCategory('SEGURIDAD');
        setName('');
        setPhone('');
        setDescription('');
        setWebUrl('');
        setEditingNumber(null);
    };

    const handleEdit = (num: any) => {
        setEditingNumber(num);
        setCategory(num.category);
        setName(num.name);
        setPhone(num.phone);
        setDescription(num.description || '');
        setWebUrl(num.webUrl || '');
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = { category, name, phone, description, webUrl };
        if (editingNumber) {
            await updateNumber(editingNumber.id, data);
        } else {
            await addNumber(data);
        }
        setIsModalOpen(false);
        resetForm();
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className={`text-2xl font-black flex items-center gap-2 ${settings.theme === 'modern' ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        <Phone className="w-8 h-8 text-rose-600" />
                        {isMaster ? 'Maestro Números de Emergencia' : 'Números de Emergencia'}
                    </h1>
                    <p className={`text-sm mt-1 font-bold ${settings.theme === 'modern' ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'}`}>Contactos críticos y servicios básicos.</p>
                </div>
                {(isAdmin && isMaster) && (
                    <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
                        <Plus className="w-4 h-4 mr-2" /> Agregar Contacto
                    </Button>
                )}
            </div>

            <div className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar servicio o categoría..."
                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {!isMaster ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredNumbers.map(num => {
                        const cat = categories.find(c => c.id === num.category) || categories[4];
                        return (
                            <div key={num.id} className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-6 shadow-sm hover:shadow-xl transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-4 rounded-2xl ${cat.bg} ${cat.color} group-hover:scale-110 transition-transform`}>
                                        <cat.icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex gap-2">
                                        {(isAdmin && isMaster) && (
                                            <>
                                                <button onClick={() => handleEdit(num)} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => { if (confirm('¿Eliminar contacto?')) deleteNumber(num.id); }} className="p-2 text-gray-400 hover:text-rose-600 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1">{num.name}</h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">{cat.label}</p>

                                <div className="space-y-4">
                                    <a
                                        href={`tel:${num.phone}`}
                                        className="block w-full py-4 bg-gray-900 dark:bg-black text-white rounded-2xl text-center text-lg font-black hover:bg-rose-600 transition-all shadow-lg shadow-black/10 active:scale-95"
                                    >
                                        {num.phone}
                                    </a>

                                    {num.description && (
                                        <p className="text-xs font-bold text-gray-500 italic leading-relaxed px-2">
                                            {num.description}
                                        </p>
                                    )}

                                    {num.webUrl && (
                                        <a
                                            href={num.webUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-700 transition-colors tracking-widest"
                                        >
                                            Ver sitio web <ExternalLink className="w-3 h-3" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredNumbers.map(num => {
                        const cat = categories.find(c => c.id === num.category) || categories[4];
                        return (
                            <div key={num.id} className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-6 shadow-sm hover:shadow-xl transition-all group relative flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`p-4 rounded-2xl ${cat.bg} ${cat.color} group-hover:scale-110 transition-transform shadow-sm`}>
                                            <cat.icon className="w-6 h-6" />
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEdit(num)} className="p-3 text-gray-400 hover:text-indigo-600 transition-colors bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => { if (confirm('¿Eliminar contacto?')) deleteNumber(num.id); }} className="p-3 text-gray-400 hover:text-rose-600 transition-colors bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1 group-hover:text-indigo-600 transition-colors">{num.name}</h3>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4">{cat.label}</span>

                                    {num.description && (
                                        <p className="text-xs font-bold text-gray-500 italic leading-relaxed line-clamp-2 border-l-2 border-gray-100 dark:border-gray-800 pl-3 mb-6">
                                            {num.description}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="block w-full py-4 bg-gray-900 dark:bg-black text-white rounded-2xl text-center text-lg font-black shadow-lg shadow-black/10">
                                        {num.phone}
                                    </div>

                                    {num.webUrl && (
                                        <a
                                            href={num.webUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-700 transition-colors tracking-widest pt-2"
                                        >
                                            Sitio Web <ExternalLink className="w-3 h-3" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto">
                    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-white/20 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-300 my-8">
                        <div className="p-8 border-b dark:border-gray-800 flex items-center justify-between">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                                {editingNumber ? 'Editar Contacto' : 'Nuevo Contacto'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                <X className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-1.5 font-bold">
                                <label className="text-xs font-black text-gray-500 ml-1 uppercase tracking-widest">Categoría</label>
                                <select
                                    className="w-full p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-bold"
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    required
                                >
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.label}</option>
                                    ))}
                                </select>
                            </div>
                            <Input label="Nombre del Servicio / Contacto" value={name} onChange={e => setName(e.target.value)} required />
                            <Input label="Teléfono / Número" value={phone} onChange={e => setPhone(e.target.value)} required />
                            <Input label="Descripción Corta (Op)" value={description} onChange={e => setDescription(e.target.value)} />
                            <Input label="URL Web (Op)" value={webUrl} onChange={e => setWebUrl(e.target.value)} />

                            <div className="flex gap-4 pt-4">
                                <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                                <Button type="submit" className="flex-1">Guardar</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

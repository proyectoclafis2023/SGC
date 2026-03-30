import React, { useState } from 'react';
import { useCommonSpaces } from '../context/CommonSpaceContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { MapPin, Plus, Trash2, Edit2, X, Clock, Banknote, Layout } from 'lucide-react';
import type { CommonSpace } from '../types';

export const CommonSpacesPage: React.FC = () => {
    const { spaces, addSpace, updateSpace, deleteSpace } = useCommonSpaces();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSpace, setEditingSpace] = useState<CommonSpace | null>(null);

    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [rentalValue, setRentalValue] = useState<number>(0);
    const [durationHours, setDurationHours] = useState<number>(1);
    const [conditions, setConditions] = useState('');

    const handleOpenModal = (space?: CommonSpace) => {
        if (space) {
            setEditingSpace(space);
            setName(space.name);
            setLocation(space.location);
            setRentalValue(space.rentalValue);
            setDurationHours(space.durationHours);
            setConditions(space.conditions || '');
        } else {
            setEditingSpace(null);
            setName('');
            setLocation('');
            setRentalValue(0);
            setDurationHours(1);
            setConditions('');
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingSpace) {
            await updateSpace({ ...editingSpace, name, location, rentalValue: Math.floor(rentalValue), durationHours: Math.floor(durationHours), conditions });
        } else {
            await addSpace({ name, location, rentalValue: Math.floor(rentalValue), durationHours: Math.floor(durationHours), conditions });
        }
        setIsModalOpen(false);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(value);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Layout className="w-8 h-8 text-indigo-600" />
                        Maestro de Espacios Comunes
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Define las áreas disponibles para reserva y sus costos.</p>
                </div>
                <Button onClick={() => handleOpenModal()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Espacio
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {spaces.filter(s => !s.isArchived).map((space) => (
                    <div key={space.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                                    <Layout className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleOpenModal(space)} className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => deleteSpace(space.id)} className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{space.name}</h3>
                            <div className="mt-4 space-y-3">
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <MapPin className="w-4 h-4 text-indigo-500" />
                                    <span>{space.location}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <Banknote className="w-4 h-4 text-emerald-500" />
                                    <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(space.rentalValue)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <Clock className="w-4 h-4 text-blue-500" />
                                    <span>{space.durationHours} {space.durationHours === 1 ? 'hora' : 'horas'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md shadow-2xl border border-white/20 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-300 transition-colors">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Layout className="w-5 h-5 text-indigo-600" />
                                {editingSpace ? 'Editar Espacio' : 'Nuevo Espacio'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <Input label="Nombre del Espacio" value={name} onChange={(e) => setName(e.target.value)} placeholder="ej. Quincho Mirador" required />
                            <Input label="Ubicación" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="ej. Piso 15" required />
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Arriendo ($)"
                                    type="number"
                                    value={rentalValue}
                                    onChange={(e) => setRentalValue(Math.floor(Number(e.target.value)))}
                                    required
                                />
                                <Input
                                    label="Duración (Horas)"
                                    type="number"
                                    value={durationHours}
                                    onChange={(e) => setDurationHours(Math.floor(Number(e.target.value)))}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 ml-1 uppercase">Condiciones y Reglas</label>
                                <textarea
                                    className="w-full p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 min-h-[100px]"
                                    value={conditions}
                                    onChange={(e) => setConditions(e.target.value)}
                                    placeholder="Ej: Se entrega limpio, acceso a luz incluído, multa por ruidos molestos..."
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                                <Button type="submit">Guardar Espacio</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

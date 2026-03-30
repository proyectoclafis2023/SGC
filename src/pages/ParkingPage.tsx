import React, { useState } from 'react';
import { useParkings } from '../context/ParkingContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Plus, Trash2, Edit2, X, Car, MapPin, Accessibility } from 'lucide-react';
import type { Parking } from '../types';

export const ParkingPage: React.FC = () => {
    const { parkings, addParking, updateParking, deleteParking } = useParkings();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingParking, setEditingParking] = useState<Parking | null>(null);

    const [number, setNumber] = useState('');
    const [location, setLocation] = useState('');
    const [isHandicapped, setIsHandicapped] = useState(false);
    const [notes, setNotes] = useState('');

    const handleOpenModal = (p?: Parking) => {
        if (p) {
            setEditingParking(p);
            setNumber(p.number);
            setLocation(p.location || '');
            setIsHandicapped(p.isHandicapped || false);
            setNotes(p.notes || '');
        } else {
            setEditingParking(null);
            setNumber('');
            setLocation('');
            setIsHandicapped(false);
            setNotes('');
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = { number, location, isHandicapped, notes };
        if (editingParking) {
            await updateParking({ ...editingParking, ...data });
        } else {
            await addParking(data);
        }
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2"><Car className="text-indigo-600 w-8 h-8" /> Estacionamientos</h1>
                    <p className="text-gray-500 dark:text-gray-400">Maestro de espacios de estacionamiento disponibles.</p>
                </div>
                <Button onClick={() => handleOpenModal()}><Plus className="w-4 h-4 mr-2" /> Nuevo Estacionamiento</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {parkings.filter(p => !p.isArchived).map(p => (
                    <div key={p.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-2xl shadow-sm relative group hover:shadow-md transition-all">
                        <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenModal(p)} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => deleteParking(p.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                        <div className="flex flex-col items-center text-center">
                            <div className={`p-4 rounded-3xl mb-4 ${p.isHandicapped ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-500'}`}>
                                <Car className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1">N° {p.number}</h3>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold uppercase tracking-wider">
                                <MapPin className="w-3 h-3 text-indigo-500" />
                                <span>{p.location || 'Sin Ubicación'}</span>
                            </div>
                            {p.isHandicapped && (
                                <div className="mt-3 flex items-center gap-1 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                    <Accessibility className="w-3 h-3" /> Preferencial
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                            <h2 className="text-xl font-bold flex items-center gap-2 font-black uppercase tracking-tight"><Car className="text-indigo-600" /> {editingParking ? 'Editar' : 'Nuevo'} Estacionamiento</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-full transition-colors"><X /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <Input label="Número / Código" value={number} onChange={(e) => setNumber(e.target.value)} required placeholder="Ej: E-101" />
                            <Input label="Ubicación" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ej: Piso -1 (Subterráneo)" />

                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-3">
                                    <Accessibility className="text-blue-500 w-5 h-5" />
                                    <div>
                                        <p className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-tighter">Espacio Preferencial</p>
                                        <p className="text-[10px] text-gray-500">¿Es para personas con discapacidad?</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsHandicapped(!isHandicapped)}
                                    className={`w-12 h-6 rounded-full transition-all relative ${isHandicapped ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isHandicapped ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Notas Adicionales</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full h-24 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all dark:text-white"
                                    placeholder="Detalles sobre el acceso, pilares, etc."
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                                <Button type="submit">Guardar Estacionamiento</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

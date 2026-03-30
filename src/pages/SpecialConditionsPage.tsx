import React, { useState } from 'react';
import { useSpecialConditions } from '../context/SpecialConditionContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Plus, Trash2, Edit2, X, Heart } from 'lucide-react';
import type { SpecialCondition } from '../types';

export const SpecialConditionsPage: React.FC = () => {
    const { conditions, addCondition, updateCondition, deleteCondition } = useSpecialConditions();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCondition, setEditingCondition] = useState<SpecialCondition | null>(null);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleOpenModal = (c?: SpecialCondition) => {
        if (c) {
            setEditingCondition(c);
            setName(c.name);
            setDescription(c.description || '');
        } else {
            setEditingCondition(null);
            setName('');
            setDescription('');
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCondition) {
            await updateCondition({ ...editingCondition, name, description });
        } else {
            await addCondition({ name, description });
        }
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2"><Heart className="text-red-500" /> Maestro Condiciones Especiales</h1>
                    <p className="text-gray-500">Definición de condiciones críticas para residentes.</p>
                </div>
                <Button onClick={() => handleOpenModal()}><Plus className="w-4 h-4 mr-2" /> Nueva Condición</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {conditions.filter(c => !c.isArchived).map(c => (
                    <div key={c.id} className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm relative group">
                        <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenModal(c)} className="p-2 text-gray-400 hover:text-indigo-600"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => deleteCondition(c.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{c.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{c.description}</p>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md shadow-2xl border border-white/20">
                        <div className="p-6 border-b flex items-center justify-between">
                            <h2 className="text-xl font-bold">{editingCondition ? 'Editar' : 'Nueva'} Condición</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full"><X /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <Input label="Nombre de la Condición" value={name} onChange={(e) => setName(e.target.value)} required />
                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold">Descripción</label>
                                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full min-h-[100px] rounded-xl border p-3 bg-white dark:bg-gray-800" />
                            </div>
                            <div className="flex justify-end gap-3 pt-4"><Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button><Button type="submit">Guardar</Button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

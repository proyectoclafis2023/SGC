import React, { useState } from 'react';
import { useUnitTypes } from '../context/UnitTypeContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Plus, Trash2, Edit2, X, Tag } from 'lucide-react';
import type { UnitType } from '../types';

export const UnitTypesPage: React.FC = () => {
    const { unitTypes, addUnitType, updateUnitType, deleteUnitType } = useUnitTypes();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingType, setEditingType] = useState<UnitType | null>(null);

    const [name, setName] = useState('');
    const [baseCommonExpense, setBaseCommonExpense] = useState(0);

    const handleOpenModal = (t?: UnitType) => {
        if (t) {
            setEditingType(t);
            setName(t.name);
            setBaseCommonExpense(t.baseCommonExpense);
        } else {
            setEditingType(null);
            setName('');
            setBaseCommonExpense(0);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingType) {
            await updateUnitType({ ...editingType, name, baseCommonExpense: Number(baseCommonExpense) });
        } else {
            await addUnitType({ name, baseCommonExpense: Number(baseCommonExpense) });
        }
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2"><Tag className="text-indigo-600" /> Maestro Tipos de Unidad</h1>
                    <p className="text-gray-500">Define los tipos de unidad y sus cuotas base de Gastos Comunes.</p>
                </div>
                <Button onClick={() => handleOpenModal()}><Plus className="w-4 h-4 mr-2" /> Nuevo Tipo</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {unitTypes.filter(t => !t.isArchived).map(t => (
                    <div key={t.id} className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm relative group">
                        <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenModal(t)} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => deleteUnitType(t.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t.name}</h3>
                        <div className="flex items-center justify-between mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Base Gasto Común</span>
                            <span className="text-lg font-bold text-indigo-600">${t.baseCommonExpense.toLocaleString()}</span>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b flex items-center justify-between">
                            <h2 className="text-xl font-bold flex items-center gap-2"><Tag className="text-indigo-600 w-5 h-5" /> {editingType ? 'Editar' : 'Nuevo'} Tipo</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition-colors"><X /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <Input label="Nombre del Tipo" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ej: Penthouse" />
                            <Input label="Monto Base Gasto Común ($)" type="number" value={baseCommonExpense} onChange={(e) => setBaseCommonExpense(Number(e.target.value))} required min="0" />
                            <div className="flex justify-end gap-3 pt-6 border-t">
                                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                                <Button type="submit" className="bg-indigo-600">Guardar Tipo</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

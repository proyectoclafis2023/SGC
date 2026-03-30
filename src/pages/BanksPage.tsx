import React, { useState } from 'react';
import { useBanks } from '../context/BankContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Plus, Trash2, Edit2, X, Landmark, Search } from 'lucide-react';
import type { Bank } from '../types';

export const BanksPage: React.FC = () => {
    const { banks, addBank, updateBank, deleteBank } = useBanks();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBank, setEditingBank] = useState<Bank | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [name, setName] = useState('');

    const handleOpenModal = (bank?: Bank) => {
        if (bank) {
            setEditingBank(bank);
            setName(bank.name);
        } else {
            setEditingBank(null);
            setName('');
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingBank) {
            await updateBank({ ...editingBank, name });
        } else {
            await addBank({ name });
        }
        setIsModalOpen(false);
    };

    const filteredBanks = banks.filter(b =>
        !b.isArchived && b.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Landmark className="w-8 h-8 text-indigo-600" />
                        Maestro de Bancos
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Gestión de instituciones bancarias para pagos de nómina.</p>
                </div>
                <Button onClick={() => handleOpenModal()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Banco
                </Button>
            </div>

            <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar banco..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBanks.map((b) => (
                    <div key={b.id} className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                                <Landmark className="w-6 h-6" />
                            </div>
                            <span className="font-bold text-gray-900 dark:text-white">{b.name}</span>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenModal(b)} className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteBank(b.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md shadow-2xl border border-white/20 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Landmark className="w-5 h-5 text-indigo-600" />
                                {editingBank ? 'Editar Banco' : 'Nuevo Banco'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <Input label="Nombre del Banco" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ej: Banco de Chile" />
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                                <Button type="submit">Guardar Banco</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

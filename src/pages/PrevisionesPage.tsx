import React, { useState } from 'react';
import { useHealthProviders } from '../context/HealthProviderContext';
import { HealthProviderList } from '../components/HealthProviderList';
import { HealthProviderForm } from '../components/HealthProviderForm';
import { Button } from '../components/Button';
import { Plus, Search, ShieldCheck } from 'lucide-react';
import type { HealthProvider } from '../types';

export const PrevisionesPage: React.FC = () => {
    const { providers, addProvider, updateProvider, deleteProvider } = useHealthProviders();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProvider, setEditingProvider] = useState<HealthProvider | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleAdd = () => {
        setEditingProvider(null);
        setIsModalOpen(true);
    };

    const handleEdit = (provider: HealthProvider) => {
        setEditingProvider(provider);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`¿Está seguro de eliminar la previsión "${name}"?`)) {
            await deleteProvider(id);
        }
    };

    const handleSubmit = async (data: Omit<HealthProvider, 'id'>, id?: string) => {
        if (id) {
            await updateProvider({ ...data, id });
        } else {
            await addProvider(data);
        }
        setIsModalOpen(false);
    };

    const filteredProviders = providers.filter(p =>
        !p.isArchived && p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <ShieldCheck className="w-8 h-8 text-indigo-600" />
                        Maestro de Previsiones
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Administra las instituciones de salud (Fonasa e Isapres) disponibles en el sistema.</p>
                </div>
                <Button onClick={handleAdd} className="shadow-indigo-500/20">
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Previsión
                </Button>
            </div>

            <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4 transition-colors">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar previsión..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 ml-auto hidden md:block">
                    Total: <span className="font-semibold text-gray-900 dark:text-white">{filteredProviders.length}</span>
                </div>
            </div>

            <HealthProviderList
                providers={filteredProviders}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            <HealthProviderForm
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                initialData={editingProvider}
            />
        </div>
    );
};

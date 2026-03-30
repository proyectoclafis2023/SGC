import React, { useState } from 'react';
import { usePensionFunds } from '../context/PensionFundContext';
import { PensionFundForm } from '../components/PensionFundForm';
import { Button } from '../components/Button';
import { Plus, Search, Landmark, Edit2, Trash2 } from 'lucide-react';
import type { PensionFund } from '../types';

export const AFPsPage: React.FC = () => {
    const { funds, addFund, updateFund, deleteFund } = usePensionFunds();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFund, setEditingFund] = useState<PensionFund | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleAdd = () => {
        setEditingFund(null);
        setIsModalOpen(true);
    };

    const handleEdit = (fund: PensionFund) => {
        setEditingFund(fund);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`¿Está seguro de eliminar la AFP "${name}"?`)) {
            await deleteFund(id);
        }
    };

    const handleSubmit = async (data: Omit<PensionFund, 'id'>, id?: string) => {
        if (id) {
            await updateFund({ ...data, id });
        } else {
            await addFund(data);
        }
        setIsModalOpen(false);
    };

    const filteredFunds = funds.filter(f =>
        !f.isArchived && f.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Landmark className="w-8 h-8 text-indigo-600" />
                        Maestro de AFPs
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Administra las Administradoras de Fondos de Pensiones y sus tasas de descuento.</p>
                </div>
                <Button onClick={handleAdd} className="shadow-indigo-500/20">
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva AFP
                </Button>
            </div>

            <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4 transition-colors">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar AFP..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 ml-auto hidden md:block">
                    Total: <span className="font-semibold text-gray-900 dark:text-white">{filteredFunds.length}</span>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden transition-colors">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">AFP</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">% Descuento</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filteredFunds.map((fund) => (
                                <tr key={fund.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                                        {fund.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                        {fund.discountRate}%
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(fund)}
                                                className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(fund.id, fund.name)}
                                                className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <PensionFundForm
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                initialData={editingFund}
            />
        </div>
    );
};

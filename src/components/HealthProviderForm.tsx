import React, { useState, useEffect } from 'react';
import type { HealthProvider } from '../types';
import { Input } from './Input';
import { Button } from './Button';
import { X } from 'lucide-react';

interface HealthProviderFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (provider: Omit<HealthProvider, 'id'>, id?: string) => void;
    initialData?: HealthProvider | null;
}

export const HealthProviderForm: React.FC<HealthProviderFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<'fonasa' | 'isapre'>('isapre');
    const [discountRate, setDiscountRate] = useState(0);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setType(initialData.type);
            setDiscountRate(initialData.discountRate);
        } else {
            setName('');
            setType('isapre');
            setDiscountRate(0);
        }
    }, [initialData, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ name, type, discountRate: Number(discountRate) }, initialData?.id);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border dark:border-gray-800 transition-colors">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {initialData ? 'Editar Previsión' : 'Nueva Previsión'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <Input
                        label="Nombre de la Institución"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="ej. Isapre Colmena"
                    />

                    <Input
                        label="% de Descuento (Cotización)"
                        type="number"
                        step="0.01"
                        value={discountRate}
                        onChange={(e) => setDiscountRate(Number(e.target.value))}
                        required
                        placeholder="ej. 7.00"
                    />

                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Tipo</label>
                        <div className="flex gap-4 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                            <label className="flex items-center space-x-2 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="type"
                                    value="isapre"
                                    checked={type === 'isapre'}
                                    onChange={() => setType('isapre')}
                                    className="w-4 h-4 text-indigo-600 dark:bg-gray-800 dark:border-gray-700 focus:ring-indigo-500"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Isapre</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="type"
                                    value="fonasa"
                                    checked={type === 'fonasa'}
                                    onChange={() => setType('fonasa')}
                                    className="w-4 h-4 text-indigo-600 dark:bg-gray-800 dark:border-gray-700 focus:ring-indigo-500"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Fonasa</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="ghost" onClick={onClose} className="dark:text-gray-300">
                            Cancelar
                        </Button>
                        <Button type="submit">
                            {initialData ? 'Guardar Cambios' : 'Crear Previsión'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

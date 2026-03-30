import React, { useState, useEffect } from 'react';
import type { PensionFund } from '../types';
import { Input } from './Input';
import { Button } from './Button';
import { X } from 'lucide-react';

interface PensionFundFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (fund: Omit<PensionFund, 'id'>, id?: string) => void;
    initialData?: PensionFund | null;
}

export const PensionFundForm: React.FC<PensionFundFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
    const [name, setName] = useState('');
    const [discountRate, setDiscountRate] = useState(0);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setDiscountRate(initialData.discountRate);
        } else {
            setName('');
            setDiscountRate(0);
        }
    }, [initialData, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ name, discountRate: Number(discountRate) }, initialData?.id);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border dark:border-gray-800 transition-colors">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {initialData ? 'Editar AFP' : 'Nueva AFP'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <Input
                        label="Nombre de la AFP"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="ej. AFP Provida"
                    />

                    <Input
                        label="% de Descuento"
                        type="number"
                        step="0.01"
                        value={discountRate}
                        onChange={(e) => setDiscountRate(Number(e.target.value))}
                        required
                        placeholder="ej. 11.45"
                    />

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="ghost" onClick={onClose} className="dark:text-gray-300">
                            Cancelar
                        </Button>
                        <Button type="submit">
                            {initialData ? 'Guardar Cambios' : 'Crear AFP'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

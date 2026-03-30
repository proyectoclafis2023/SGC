import React, { useState } from 'react';
import { ShieldOff, Trash2, X } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { useSettings } from '../context/SettingsContext';

interface SecurityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    itemName: string;
    actionLabel?: string;
    critical?: boolean;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    itemName,
    actionLabel = 'Confirmar',
    critical = true
}) => {
    const { settings } = useSettings();
    const [passwordInput, setPasswordInput] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const masterPass = settings.deletionPassword?.trim() || '';
    const requiresPass = masterPass !== '';

    const handleConfirm = () => {
        if (requiresPass && passwordInput !== masterPass) {
            setError('Clave de seguridad incorrecta');
            return;
        }
        onConfirm();
        onClose();
        setPasswordInput('');
        setError('');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-red-100 dark:border-red-900/30">
                {/* Header */}
                <div className={`p-8 text-center ${critical ? 'bg-red-50 dark:bg-red-900/10' : 'bg-indigo-50 dark:bg-indigo-900/10'} border-b dark:border-gray-800 relative`}>
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className={`w-20 h-20 ${critical ? 'bg-red-100 dark:bg-red-900/40 text-red-600' : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600'} rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl`}>
                        {critical ? <Trash2 className="w-10 h-10" /> : <ShieldOff className="w-10 h-10" />}
                    </div>

                    <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{title}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">
                        {description} <span className={critical ? 'text-red-600 font-black' : 'text-indigo-600 font-black'}>"{itemName}"</span>
                    </p>
                </div>

                <div className="p-8 space-y-6">
                    {requiresPass && (
                        <div className="space-y-4">
                            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex items-start gap-3">
                                <ShieldOff className="w-5 h-5 text-amber-600 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-[10px] text-amber-800 dark:text-amber-400 font-black uppercase tracking-widest">Protección Activa</p>
                                    <p className="text-[10px] text-amber-700/70 dark:text-amber-500/70 font-bold uppercase leading-tight">Esta acción requiere clave maestra por política de seguridad.</p>
                                </div>
                            </div>
                            <Input
                                label="Clave de Seguridad"
                                type="password"
                                value={passwordInput}
                                onChange={(e) => {
                                    setPasswordInput(e.target.value);
                                    setError('');
                                }}
                                placeholder="••••••••"
                                className="text-center text-lg font-black tracking-widest bg-gray-50 dark:bg-gray-800"
                                autoFocus
                            />
                            {error && (
                                <p className="text-[10px] font-black text-red-500 uppercase text-center animate-shake">{error}</p>
                            )}
                        </div>
                    )}

                    <div className="flex gap-4 pt-2">
                        <Button
                            variant="secondary"
                            className="flex-1 py-4 font-black uppercase tracking-widest text-[10px] rounded-2xl"
                            onClick={onClose}
                        >
                            Cancelar
                        </Button>
                        <Button
                            className={`flex-1 py-4 ${critical ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'} text-white shadow-xl font-black uppercase tracking-widest text-[10px] rounded-2xl`}
                            onClick={handleConfirm}
                        >
                            {actionLabel}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

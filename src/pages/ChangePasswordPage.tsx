import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { ShieldAlert, Save, AlertTriangle } from 'lucide-react';

export const ChangePasswordPage: React.FC = () => {
    const { changePassword } = useAuth();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        setLoading(true);
        try {
            await changePassword(newPassword);
        } catch (err) {
            setError('Error al actualizar la contraseña. Reintenta.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-amber-200/20 dark:bg-amber-900/10 blur-[100px]" />
                <div className="absolute -bottom-[30%] -right-[10%] w-[70%] h-[70%] rounded-full bg-indigo-200/20 dark:bg-indigo-900/10 blur-[100px]" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white dark:border-gray-800 overflow-hidden">
                    <div className="p-8 bg-amber-500/10 border-b border-amber-500/10 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-500/30 mb-4 animate-bounce">
                            <ShieldAlert className="w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Cambio Obligatorio</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">Por seguridad, debes actualizar tu contraseña antes de continuar.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="space-y-4">
                            <Input
                                label="Nueva Contraseña"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                            <Input
                                label="Confirmar Contraseña"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                <p className="text-xs font-bold text-red-600 dark:text-red-400 leading-relaxed uppercase tracking-widest">{error}</p>
                            </div>
                        )}

                        <Button type="submit" className="w-full py-4 text-lg font-black uppercase tracking-[0.2em]" isLoading={loading}>
                            <Save className="w-5 h-5 mr-3" /> Actualizar Clave
                        </Button>

                        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center leading-relaxed">
                                Una vez actualizada, el sistema te permitirá acceder al maestro de tu unidad y servicios.
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

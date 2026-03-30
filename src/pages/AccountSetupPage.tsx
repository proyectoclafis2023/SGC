import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useUsers } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Building2, Briefcase, ChevronRight, UserCircle } from 'lucide-react';

export const AccountSetupPage: React.FC = () => {
    const { user, updateUserAuthData } = useAuth();
    const { settings } = useSettings();
    const { updateUser } = useUsers();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [accountType, setAccountType] = useState<'resident' | 'worker' | null>(null);
    const [loading, setLoading] = useState(false);

    if (user?.status !== 'setting_up') {
        navigate('/');
        return null; // redirecting
    }

    const handleCompleteSetup = async () => {
        if (!accountType || !user?.id) return;
        setLoading(true);

        try {
            // Update the user globally
            await updateUser(user.id, {
                name: user.name,
                email: user.email,
                role: accountType,
                status: 'pending_approval'
            });

            // Update auth state locally
            updateUserAuthData({
                role: accountType,
                status: 'pending_approval'
            });

            // Redirect automatically handled by App.tsx router but just in case
            window.location.reload();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-6 relative overflow-hidden transition-colors duration-300">
            {/* Elementos decorativos de fondo */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-blue-200/30 dark:bg-blue-900/10 blur-[100px]" />
                <div className="absolute -bottom-[30%] -right-[10%] w-[70%] h-[70%] rounded-full bg-indigo-200/30 dark:bg-indigo-900/10 blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-2xl w-full">
                <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-white/50 dark:border-gray-800 p-10">

                    <div className="text-center space-y-4 mb-10">
                        <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-indigo-500/30 text-white transform -rotate-6">
                            {settings.systemIcon}
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 dark:text-white mt-6">Completa tu Registro</h1>
                        <p className="text-gray-500 dark:text-gray-400 font-bold max-w-md mx-auto">
                            ¡Bienvenido, {user.name}! Necesitamos un par de detalles para enlazar tu cuenta correctamente con el condominio.
                        </p>
                    </div>

                    {step === 1 && (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                            <h2 className="text-xl font-black text-center mb-6 text-gray-800 dark:text-gray-200 uppercase tracking-widest">Soy...</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                    onClick={() => setAccountType('resident')}
                                    className={`relative p-8 rounded-3xl border-2 transition-all group overflow-hidden flex flex-col items-center justify-center gap-4 ${accountType === 'resident'
                                            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 shadow-lg shadow-indigo-500/20'
                                            : 'border-gray-200 dark:border-gray-800 hover:border-indigo-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                        }`}
                                >
                                    <div className={`p-4 rounded-2xl ${accountType === 'resident' ? 'bg-indigo-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}>
                                        <Building2 className="w-8 h-8" />
                                    </div>
                                    <span className={`text-lg font-black ${accountType === 'resident' ? 'text-indigo-700 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'}`}>Residente</span>
                                </button>

                                <button
                                    onClick={() => setAccountType('worker')}
                                    className={`relative p-8 rounded-3xl border-2 transition-all group overflow-hidden flex flex-col items-center justify-center gap-4 ${accountType === 'worker'
                                            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 shadow-lg shadow-indigo-500/20'
                                            : 'border-gray-200 dark:border-gray-800 hover:border-indigo-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                        }`}
                                >
                                    <div className={`p-4 rounded-2xl ${accountType === 'worker' ? 'bg-indigo-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}>
                                        <Briefcase className="w-8 h-8" />
                                    </div>
                                    <span className={`text-lg font-black ${accountType === 'worker' ? 'text-indigo-700 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'}`}>Trabajador</span>
                                </button>
                            </div>

                            <div className="mt-8 flex justify-end">
                                <Button
                                    onClick={() => setStep(2)}
                                    disabled={!accountType}
                                    className="px-8 py-3 text-sm tracking-widest uppercase font-black"
                                >
                                    Continuar <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-500 text-center">
                            <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 text-amber-500 rounded-full mx-auto flex items-center justify-center mb-6">
                                <UserCircle className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4">Revisión de Administrador</h2>
                            <p className="text-gray-600 dark:text-gray-400 font-bold max-w-md mx-auto mb-8">
                                Al finalizar, tu cuenta pasará a estado <strong>Pendiente de Aprobación</strong>. El administrador de la comunidad verificará tus datos y habilitará el acceso completo a tus funcionalidades como {accountType === 'resident' ? 'Residente' : 'Trabajador'}.
                            </p>

                            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                                <button
                                    onClick={() => setStep(1)}
                                    className="text-gray-500 hover:text-gray-800 dark:hover:text-white font-bold text-sm tracking-widest uppercase"
                                >
                                    Volver
                                </button>
                                <Button
                                    onClick={handleCompleteSetup}
                                    isLoading={loading}
                                    className="px-8 py-3 text-sm tracking-widest uppercase font-black"
                                >
                                    Enviar Solicitud
                                </Button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

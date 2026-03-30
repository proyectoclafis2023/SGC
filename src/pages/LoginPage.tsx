import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Mail } from 'lucide-react';

export const LoginPage: React.FC = () => {
    const { login, loginWithGoogle } = useAuth();
    const { settings } = useSettings();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Simulate network delay for effect
        await new Promise(resolve => setTimeout(resolve, 800));

        try {
            if (await login(username.trim(), password)) {
                navigate('/');
            } else {
                setError('Credenciales inválidas. Verifica tu usuario y contraseña.');
                setLoading(false);
            }
        } catch (err) {
            setError('Error de conexión con el servidor. Intenta con admin/admin.');
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');

        // Simular flujo de Google OAuth
        await new Promise(resolve => setTimeout(resolve, 600));

        // En una app real, esto abriría el popup de Google y luego
        // llamaríamos a loginWithGoogle(user.email, user.displayName)
        // Para este prototipo simularemos una cuenta al azar:
        const randomNum = Math.floor(Math.random() * 100);
        const email = `usuario${randomNum}@gmail.com`;
        const name = `Usuario Nuevo ${randomNum}`;

        const success = await loginWithGoogle(email, name);
        if (success) {
            navigate('/');
        } else {
            setError('Error al iniciar sesión con Google.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 relative overflow-hidden transition-colors duration-300">
            {/* Elementos decorativos de fondo */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-purple-200/30 dark:bg-purple-900/10 blur-[100px]" />
                <div className="absolute -bottom-[30%] -right-[10%] w-[70%] h-[70%] rounded-full bg-indigo-200/30 dark:bg-indigo-900/10 blur-[100px]" />
            </div>

            <div className="relative z-10 w-full max-w-md p-6">
                <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 dark:border-gray-800 p-8">
                    <div className="flex flex-col items-center mb-8">
                        {settings.systemLogo ? (
                            <img src={settings.systemLogo} alt="Logo" className="h-16 w-auto object-contain mb-4 drop-shadow-md" />
                        ) : (
                            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/30 mb-4 transform -rotate-6 text-white font-bold text-3xl">
                                {settings.systemIcon}
                            </div>
                        )}
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center">{settings.systemName}</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Por favor, inicia sesión para continuar</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Nombre de usuario"
                            type="text"
                            placeholder="admin"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            error={error ? " " : ""}
                            required
                        />
                        <Input
                            label="Contraseña"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-sm text-center font-medium">
                                {error === 'Invalid credentials or server error' ? 'Credenciales inválidas o error de servidor' : error}
                            </div>
                        )}

                        <Button type="submit" className="w-full text-lg py-3" isLoading={loading}>
                            Iniciar Sesión
                        </Button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white/70 dark:bg-gray-900/70 text-gray-500">O continuar con</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-2xl text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition font-bold shadow-sm"
                    >
                        <Mail className="w-5 h-5 text-red-500" />
                        Acceder con Google
                    </button>

                    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center text-xs text-gray-400 dark:text-gray-500">
                        Usa <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">admin</span> / <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">admin</span> para entrar
                    </div>
                </div>
            </div>
        </div>
    );
};

import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Mail, CheckCircle2, ShieldCheck, MailWarning, BellRing, UserCheck, Package, CalendarDays, Wallet } from 'lucide-react';

export const EmailSettingsMasterPage: React.FC = () => {
    const { settings, updateSettings } = useSettings();
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');

    // SMTP Config
    const [smtpHost, setSmtpHost] = useState(settings.smtpHost || '');
    const [smtpPort, setSmtpPort] = useState(settings.smtpPort?.toString() || '');
    const [smtpUser, setSmtpUser] = useState(settings.smtpUser || '');
    const [smtpPassword, setSmtpPassword] = useState(settings.smtpPassword || '');
    const [smtpFrom, setSmtpFrom] = useState(settings.smtpFrom || '');
    const [smtpBcc, setSmtpBcc] = useState(settings.smtpBcc || '');
    const [conciergeEmail, setConciergeEmail] = useState(settings.conciergeEmail || '');

    // Triggers State
    const [triggers, setTriggers] = useState({
        expenses: settings.emailTriggers?.expenses || false,
        visits: settings.emailTriggers?.visits || false,
        correspondence: settings.emailTriggers?.correspondence || false,
        reservations: settings.emailTriggers?.reservations || false,
        systemAnnouncements: settings.emailTriggers?.systemAnnouncements || false,
        suggestions: settings.emailTriggers?.suggestions || false,
    });

    const handleToggleTrigger = (key: keyof typeof triggers) => {
        setTriggers(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage('');

        await new Promise(resolve => setTimeout(resolve, 600));

        updateSettings({
            ...settings,
            smtpHost,
            smtpPort: smtpPort ? parseInt(smtpPort) : undefined,
            smtpUser,
            smtpPassword,
            smtpFrom,
            smtpBcc,
            conciergeEmail,
            emailTriggers: triggers,
        });

        setIsSaving(false);
        setMessage('¡Configuración de correo actualizada!');
        setTimeout(() => setMessage(''), 3000);
    };

    const TRIGGER_MAPPINGS = [
        { key: 'expenses', label: 'Emisión de Gastos Comunes', desc: 'Avisa a residentes cuando un GC es emitido o pagado.', icon: Wallet },
        { key: 'visits', label: 'Registro de Visitas', desc: 'Notifica al residente cuando llega una visita a conserjería.', icon: UserCheck },
        { key: 'correspondence', label: 'Recepción de Encomiendas', desc: 'Envía un aviso al residente tras registrar un paquete.', icon: Package },
        { key: 'reservations', label: 'Confirmación de Reservas', desc: 'Notifica estado de reserva de áreas comunes.', icon: CalendarDays },
        { key: 'systemAnnouncements', label: 'Avisos de Sistema', desc: 'Notificaciones masivas de la comunidad (Cortes, etc).', icon: BellRing },
        { key: 'suggestions', label: 'Sugerencias y Reclamos', desc: 'Avisa a la administración sobre nuevos tickets de ayuda.', icon: MailWarning }
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 max-w-full overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className={`text-2xl font-black flex items-center gap-2 ${settings.theme === 'modern' ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        <div className="p-2 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20">
                            <Mail className="w-8 h-8 text-white" />
                        </div>
                        Maestro Envíos por Correo
                    </h1>
                    <p className={`text-sm mt-1 font-bold ${settings.theme === 'modern' ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'}`}>
                        Configura el servidor SMTP y habilita opciones de notificaciones automáticas en el sistema.
                    </p>
                </div>
                {message && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full border border-green-100 dark:border-green-800 animate-bounce">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span className="text-sm font-bold">{message}</span>
                    </div>
                )}
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* SMTP Config List */}
                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl text-indigo-600 dark:text-indigo-400">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">Credenciales Servidor SMTP</h3>
                            <p className="text-[10px] uppercase font-black tracking-widest text-indigo-500 mt-1">Configuración requerida</p>
                        </div>
                    </div>
                    <div className="p-6 space-y-5">
                        <Input
                            label="Servidor / Host SMTP"
                            value={smtpHost}
                            onChange={(e) => setSmtpHost(e.target.value)}
                            placeholder="ej. smtp.gmail.com"
                            required
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Puerto SMTP"
                                type="number"
                                value={smtpPort}
                                onChange={(e) => setSmtpPort(e.target.value)}
                                placeholder="ej. 587 o 465"
                                required
                            />
                            <Input
                                label="Correo Remitente (From)"
                                type="email"
                                value={smtpFrom}
                                onChange={(e) => setSmtpFrom(e.target.value)}
                                placeholder="no-reply@condominio.com"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Usuario de Autenticación"
                                value={smtpUser}
                                onChange={(e) => setSmtpUser(e.target.value)}
                                placeholder="ej. mi-correo@dominio.com"
                                required
                            />
                            <Input
                                label="Contraseña o Token de App"
                                type="password"
                                value={smtpPassword}
                                onChange={(e) => setSmtpPassword(e.target.value)}
                                placeholder="*************"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Correo en Copia (BCC - Auditoría)"
                                type="email"
                                value={smtpBcc}
                                onChange={(e) => setSmtpBcc(e.target.value)}
                                placeholder="ej. auditoria@condominio.com (Opcional)"
                            />
                            <Input
                                label="Correo de Conserjería / Recepción"
                                type="email"
                                value={conciergeEmail}
                                onChange={(e) => setConciergeEmail(e.target.value)}
                                placeholder="ej. conserjeria@condominio.com (Opcional)"
                            />
                        </div>
                    </div>
                </div>

                {/* Triggers Form */}
                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-rose-100 dark:bg-rose-900/40 rounded-xl text-rose-600 dark:text-rose-400">
                                <BellRing className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">Reglas y Opt-in de Módulos</h3>
                                <p className="text-[10px] uppercase font-black tracking-widest text-indigo-500 mt-1">Activa funciones de correo</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 space-y-2">
                        {TRIGGER_MAPPINGS.map((trigger) => {
                            const IconCmp = trigger.icon;
                            const isActive = triggers[trigger.key as keyof typeof triggers];
                            return (
                                <div
                                    key={trigger.key}
                                    className={`p-4 rounded-2xl border transition-all hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between gap-4 cursor-pointer ${isActive ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/30' : 'border-gray-100 dark:border-gray-800'}`}
                                    onClick={() => handleToggleTrigger(trigger.key as keyof typeof triggers)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                                            <IconCmp className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{trigger.label}</span>
                                            <span className="text-[10px] text-gray-500 font-medium mt-0.5">{trigger.desc}</span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleTrigger(trigger.key as keyof typeof triggers);
                                        }}
                                        className={`w-12 h-6 rounded-full transition-all relative shrink-0 ${isActive ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-700'}`}
                                        aria-pressed={isActive}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isActive ? 'right-1' : 'left-1'}`} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="lg:col-span-2 flex justify-end gap-3 mt-4">
                    <Button type="submit" disabled={isSaving} className="shadow-lg shadow-indigo-600/20 px-8 py-4">
                        {isSaving ? 'Guardando Configuración...' : 'Guardar y Aplicar Cambios'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

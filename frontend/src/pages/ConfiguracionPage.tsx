import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { formatRUT } from '../utils/formatters';
import { Settings as SettingsIcon, Save, Info, Building2, AlertTriangle, RefreshCw, FileText, Download, CheckCircle2, CreditCard, Shield, History as HistoryIcon } from 'lucide-react';
import { resetSystemData } from '../utils/dataManagement';

const TEMPLATES = [
    { id: 'personal', name: 'Personal', desc: 'Trabajadores y datos base sueldo' },
    { id: 'residentes', name: 'Residentes', desc: 'Habitantes y contactos' },
    { id: 'propietarios', name: 'Propietarios', desc: 'Dueños de unidades' },
    { id: 'inventario', name: 'Inventario', desc: 'Artículos y stock' },
    { id: 'infraestructura', name: 'Infraestructura', desc: 'Torres y Unidades' },
    { id: 'bancos', name: 'Bancos', desc: 'Maestro de bancos' },
    { id: 'afps', name: 'AFPs', desc: 'Instituciones de previsión' },
    { id: 'prevision', name: 'Salud', desc: 'Isapres y Fonasa' },
    { id: 'contratistas', name: 'Contratistas', desc: 'Empresas externas' },
    { id: 'estacionamientos', name: 'Estacionamientos', desc: 'Nómina de parkings' },
    { id: 'tipos_unidad', name: 'Tipos Unidad', desc: 'Modelos de unidades' },
    { id: 'emergencias', name: 'Emergencias', desc: 'Números útiles' }
];

export const ConfiguracionPage: React.FC = () => {
    const { settings, updateSettings } = useSettings();
    const [system_name, setSystemName] = useState(settings.system_name || '');
    const [system_icon, setSystemIcon] = useState(settings.system_icon || '');
    const [logo, setLogo] = useState(settings.system_logo || '');
    const [favicon, setFavicon] = useState(settings.system_favicon || '');
    const [admin_name, setAdminName] = useState(settings.admin_name || '');
    const [admin_rut, setAdminRut] = useState(settings.admin_rut || '');
    const [condo_rut, setCondoRut] = useState(settings.condo_rut || '');
    const [condo_address, setCondoAddress] = useState(settings.condo_address || '');
    const [admin_phone, setAdminPhone] = useState(settings.admin_phone || '');
    const [signature, setSignature] = useState(settings.admin_signature || '');
    const [camera_backup_days, setCameraBackupDays] = useState(settings.camera_backup_days || 7);
    const [vacation_accrual_rate, setVacationAccrualRate] = useState(settings.vacation_accrual_rate || 1.25);
    // --- Password Management (v3.6.2) ---
    const initialSmtpPassword = settings.smtp_password ? '********' : '';
    const initialDeletionPassword = settings.deletion_password ? '********' : '';

    const [smtp_password, setSmtpPassword] = useState(initialSmtpPassword);
    const [deletion_password, setDeletionPassword] = useState(initialDeletionPassword);
    
    // Billing Settings
    const [payment_deadline_day, setPaymentDeadlineDay] = useState(settings.payment_deadline_day || 5);
    const [max_arrears_months, setMaxArrearsMonths] = useState(settings.max_arrears_months || 3);
    const [arrears_fine_amount, setArrearsFineAmount] = useState(settings.arrears_fine_amount || 0);
    const [arrears_fine_percentage, setArrearsFinePercentage] = useState(settings.arrears_fine_percentage || 0);

    // Maintenance & Others
    const [census_frequency_years, setCensusFrequencyYears] = useState(settings.census_frequency_years || 5);

    // Email (SMTP)
    const [smtp_host, setSmtpHost] = useState(settings.smtp_host || '');
    const [smtp_port, setSmtpPort] = useState(settings.smtp_port || 587);
    const [smtp_user, setSmtpUser] = useState(settings.smtp_user || '');
    const [smtp_from, setSmtpFrom] = useState(settings.smtp_from || '');

    // System Doctor Settings
    const [doctor_alert_enabled, setDoctorAlertEnabled] = useState(settings.doctor_alert_enabled ?? true);
    const [doctor_threshold_warning, setDoctorThresholdWarning] = useState(settings.doctor_threshold_warning ?? 90);
    const [doctor_threshold_error, setDoctorThresholdError] = useState(settings.doctor_threshold_error ?? 70);
    const [doctor_cooldown_min, setDoctorCooldownMin] = useState(settings.doctor_cooldown_min ?? 15);
    const [doctor_webhook_url, setDoctorWebhookUrl] = useState(settings.doctor_webhook_url || '');

    const [isDarkMode, setIsDarkMode] = useState(settings.darkMode || false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogo(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFavicon(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSignature(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const normalize = (val: any) => val === null || val === undefined ? '' : String(val);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage('');

        await new Promise(resolve => setTimeout(resolve, 600));

        try {
            const updateData: any = {
                ...settings,
                system_name,
                system_icon: system_icon.charAt(0).toUpperCase(),
                system_logo: logo,
                system_favicon: favicon,
                admin_name,
                admin_rut,
                condo_rut,
                condo_address,
                admin_phone,
                admin_signature: signature,
                camera_backup_days: Number(camera_backup_days),
                vacation_accrual_rate: Number(vacation_accrual_rate),
                payment_deadline_day: Number(payment_deadline_day),
                max_arrears_months: Number(max_arrears_months),
                arrears_fine_amount: Number(arrears_fine_amount),
                arrears_fine_percentage: Number(arrears_fine_percentage),
                census_frequency_years: Number(census_frequency_years),
                smtp_host,
                smtp_port: Number(smtp_port),
                smtp_user,
                smtp_from,
                doctor_alert_enabled,
                doctor_threshold_warning: Number(doctor_threshold_warning),
                doctor_threshold_error: Number(doctor_threshold_error),
                doctor_cooldown_min: Number(doctor_cooldown_min),
                doctor_webhook_url,
                darkMode: isDarkMode
            };

            // Solo enviar contraseñas si han sido explícitamente modificadas (detección real y normalizada)
            if (normalize(smtp_password) !== normalize(initialSmtpPassword)) {
                updateData.smtp_password = smtp_password;
            }
            if (normalize(deletion_password) !== normalize(initialDeletionPassword)) {
                updateData.deletion_password = deletion_password;
            }

            await updateSettings(updateData);

            setMessage('¡Configuración actualizada con éxito!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error: any) {
            setMessage(`❌ Error: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        const msg = `⚠️ ADVERTENCIA CRÍTICA:
Esta acción borrará TODOS los datos maestros y operativos de la plataforma:
- Personal y Liquidaciones
- Residentes y Propietarios
- Inventario y Artículos
- Torres y Unidades
- Bancos, AFPs y Isapres
- Historial de Visitas, Encomiendas e Incidentes
- Números de Emergencia y Mensajes del Sistema

¿Está ABSOLUTAMENTE SEGURO de continuar?`;

        if (window.confirm(msg)) {
            if (window.confirm('¿Desea MANTENER la configuración básica (Nombre Condominio, RUT, Admin y Logo)?\n- Aceptar: Solo borra registros.\n- Cancelar: Borra TODO (Plataforma desde cero).')) {
                resetSystemData(true);
            } else {
                if (window.confirm('🚨 ÚLTIMO AVISO 🚨\nEsto eliminará ABSOLUTAMENTE TODO, incluyendo logos y accesos. El sistema quedará vacío.\n\n¿Confirmar reinicio total?')) {
                    resetSystemData(false);
                }
            }
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 max-w-full overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <div className="p-2 bg-indigo-600 rounded-xl">
                            <SettingsIcon className="w-5 h-5 text-white" />
                        </div>
                        Ajustes del Sistema
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Gestión de identidad, configuración legal y mantenimiento de datos.</p>
                </div>
                {message && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full border border-green-100 dark:border-green-800 animate-bounce">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm font-bold">{message}</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4 sticky top-24 transition-colors text-center">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-left">Identidad Actual</h3>

                        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 space-y-4 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                {logo ? (
                                    <img src={logo} alt="System Logo" className="h-16 w-auto object-contain drop-shadow-md" />
                                ) : (
                                    <div className="w-16 h-16 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-3xl">
                                        {system_icon?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                )}
                                <div className="text-center z-10">
                                    <p className="text-lg font-bold text-gray-900 dark:text-white truncate max-w-[200px]">{system_name || 'Nombre del Sistema'}</p>
                                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest mt-1">Identidad Corporativa</p>
                                </div>
                        </div>

                        <div className="flex items-start space-x-2 text-xs text-gray-500 dark:text-gray-400 bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100/50 dark:border-blue-800/50 text-left">
                            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                            <p className="leading-relaxed font-medium">El logo se mostrará en las cabeceras de todos los documentos y certificados generados.</p>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden transition-colors">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <SettingsIcon className="w-5 h-5 text-gray-400" />
                                <h3 className="font-semibold text-gray-900 dark:text-white">Personalización Visual</h3>
                            </div>
                            <div className="flex items-center space-x-3 bg-white dark:bg-gray-800 p-1.5 rounded-lg border border-gray-100 dark:border-gray-700 shadow-inner">
                                <span className="text-[10px] font-black text-gray-400 uppercase ml-2">Modo Oscuro</span>
                                <button
                                    type="button"
                                    onClick={() => setIsDarkMode(!isDarkMode)}
                                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${isDarkMode ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                                >
                                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-[22px]' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2">
                                    <Input
                                        label="Nombre de la Comunidad"
                                        value={system_name}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSystemName(e.target.value)}
                                        placeholder="ej. Condominio Las Camelias"
                                        required
                                    />
                                </div>
                                <Input
                                    label="Icono / Inicial"
                                    value={system_icon}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSystemIcon(e.target.value.substring(0, 1).toUpperCase())}
                                    placeholder="Ej: G"
                                    maxLength={1}
                                    required
                                />
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Logo Principal</label>
                                    <div className="flex items-center gap-3">
                                        <input type="file" accept="image/*" onChange={handleLogoChange} id="logo-upload-2" className="hidden" />
                                        <label htmlFor="logo-upload-2" className="flex-1 cursor-pointer bg-indigo-50 dark:bg-indigo-900/10 hover:bg-indigo-100 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-4 py-2.5 rounded-xl border border-dashed border-indigo-200 dark:border-indigo-900/50 text-xs font-bold transition-all flex items-center justify-center">
                                            <Download className="w-4 h-4 mr-2 rotate-180" />
                                            Subir Logo (.png / .svg)
                                        </label>
                                        <input type="file" accept="image/x-icon,image/png" onChange={handleFaviconChange} id="favicon-upload" className="hidden" />
                                        <label htmlFor="favicon-upload" className="cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 px-4 py-2.5 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-[10px] font-black uppercase transition-all flex items-center justify-center">
                                            <Download className="w-3 h-3 mr-2 rotate-180" />
                                            Favicon
                                        </label>
                                        {logo && (
                                            <button type="button" onClick={() => setLogo('')} className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors border border-red-100 dark:border-red-900/30">
                                                <AlertTriangle className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-indigo-600" />
                                    Datos Legales y Representación
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input
                                        label="Administrador Responsable"
                                        value={admin_name}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdminName(e.target.value)}
                                        placeholder="Nombre completo"
                                    />
                                    <Input
                                        label="RUT Administrador"
                                        value={admin_rut}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdminRut(formatRUT(e.target.value))}
                                        placeholder="12.345.678-9"
                                    />
                                    <Input
                                        label="RUT del Condominio"
                                        value={condo_rut}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCondoRut(formatRUT(e.target.value))}
                                        placeholder="76.543.210-K"
                                    />
                                    <Input
                                        label="Dirección Oficial"
                                        value={condo_address}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCondoAddress(e.target.value)}
                                        placeholder="Av. Principal #123"
                                    />
                                    <Input
                                        label="Teléfono Admin"
                                        value={admin_phone}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdminPhone(e.target.value)}
                                        placeholder="+56 9 1234 5678"
                                    />
                                    <Input
                                        label="Días Respaldo Cámaras"
                                        type="number"
                                        value={camera_backup_days}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCameraBackupDays(Number(e.target.value))}
                                        min={1}
                                        max={365}
                                    />
                                    <Input
                                        label="Días Vacaciones / Mes"
                                        type="number"
                                        step="0.01"
                                        value={vacation_accrual_rate}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVacationAccrualRate(Number(e.target.value))}
                                        min={0}
                                        max={10}
                                    />
                                    <Input
                                        label="Clave de Eliminación Maestro"
                                        type="password"
                                        value={deletion_password}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeletionPassword(e.target.value)}
                                        placeholder="Clave para borrados críticos"
                                    />
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Firma Digitalizada</label>
                                        <div className="flex items-center gap-3">
                                            <input type="file" accept="image/*" onChange={handleSignatureChange} id="signature-upload-2" className="hidden" />
                                            <label htmlFor="signature-upload-2" className="flex-1 cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 px-4 py-2.5 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-xs font-bold transition-all flex items-center justify-center">
                                                <Download className="w-4 h-4 mr-2 rotate-180" />
                                                Subir Firma (.png)
                                            </label>
                                            {signature && (
                                                <div className="h-10 w-16 bg-white rounded border border-gray-200 overflow-hidden relative group">
                                                    <img src={signature} alt="Firma" className="h-full w-full object-contain" />
                                                    <button type="button" onClick={() => setSignature('')} className="absolute inset-0 bg-red-600/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <AlertTriangle className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Billing Section */}
                            <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-indigo-600" />
                                    Gestión de Cobranza y Mora
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <Input
                                        label="Día Tope de Pago"
                                        type="number"
                                        value={payment_deadline_day}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPaymentDeadlineDay(Number(e.target.value))}
                                        min={1}
                                        max={31}
                                        placeholder="Ej: 5"
                                    />
                                    <Input
                                        label="Meses Máximos Mora"
                                        type="number"
                                        value={max_arrears_months}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxArrearsMonths(Number(e.target.value))}
                                        min={1}
                                        placeholder="Ej: 3"
                                    />
                                    <Input
                                        label="Multa Fija ($)"
                                        type="number"
                                        value={arrears_fine_amount}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setArrearsFineAmount(Number(e.target.value))}
                                        min={0}
                                        placeholder="Ej: 5000"
                                    />
                                    <Input
                                        label="Multa Porcentaje (%)"
                                        type="number"
                                        value={arrears_fine_percentage}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setArrearsFinePercentage(Number(e.target.value))}
                                        min={0}
                                        max={100}
                                        placeholder="Ej: 5"
                                    />
                                </div>
                            </div>

                            {/* Email Section (SMTP v3.6) */}
                            <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-indigo-600" />
                                    Configuración de Correo (SMTP)
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <Input
                                        label="Host SMTP"
                                        value={smtp_host}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSmtpHost(e.target.value)}
                                        placeholder="mail.ejemplo.com"
                                    />
                                    <Input
                                        label="Puerto SMTP"
                                        type="number"
                                        value={smtp_port}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSmtpPort(Number(e.target.value))}
                                        placeholder="587"
                                    />
                                    <Input
                                        label="Usuario SMTP"
                                        value={smtp_user}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSmtpUser(e.target.value)}
                                        placeholder="no-reply@ejemplo.com"
                                    />
                                    <Input
                                        label="Contraseña SMTP"
                                        type="password"
                                        value={smtp_password}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSmtpPassword(e.target.value)}
                                        placeholder="••••••••"
                                    />
                                    <Input
                                        label="Remitente (From)"
                                        value={smtp_from}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSmtpFrom(e.target.value)}
                                        placeholder="Nombre Condominio"
                                    />
                                    <Input
                                        label="Frecuencia Censo (Años)"
                                        type="number"
                                        value={census_frequency_years}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCensusFrequencyYears(Number(e.target.value))}
                                        min={1}
                                        placeholder="Ej: 5"
                                    />
                                </div>
                                <p className="mt-4 text-[10px] text-gray-400 dark:text-gray-500 italic">
                                    * La configuración SMTP es necesaria para el envío de liquidaciones, avisos y alertas del System Doctor.
                                </p>
                            </div>

                            {/* System Doctor Section (v3.5.0+) */}
                            <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <RefreshCw className="w-5 h-5 text-indigo-600" />
                                        System Doctor & Salud Proactiva
                                    </h3>
                                    <div className="flex items-center space-x-3 bg-white dark:bg-gray-800 p-1.5 rounded-lg border border-gray-100 dark:border-gray-700 shadow-inner">
                                        <span className="text-[10px] font-black text-gray-400 uppercase ml-2">Alertas Externas</span>
                                        <button
                                            type="button"
                                            onClick={() => setDoctorAlertEnabled(!doctor_alert_enabled)}
                                            className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${doctor_alert_enabled ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                                        >
                                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${doctor_alert_enabled ? 'translate-x-[22px]' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <Input
                                        label="Umbral Advertencia (%)"
                                        type="number"
                                        value={doctor_threshold_warning}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDoctorThresholdWarning(Number(e.target.value))}
                                        min={1}
                                        max={100}
                                        placeholder="Ej: 90"
                                    />
                                    <Input
                                        label="Umbral Crítico (%)"
                                        type="number"
                                        value={doctor_threshold_error}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDoctorThresholdError(Number(e.target.value))}
                                        min={1}
                                        max={100}
                                        placeholder="Ej: 70"
                                    />
                                    <Input
                                        label="Intervalo Alertas (Min)"
                                        type="number"
                                        value={doctor_cooldown_min}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDoctorCooldownMin(Number(e.target.value))}
                                        min={1}
                                        placeholder="Ej: 15"
                                    />
                                    <Input
                                        label="Webhook URL"
                                        value={doctor_webhook_url}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDoctorWebhookUrl(e.target.value)}
                                        placeholder="https://hooks.slack.com/..."
                                    />
                                </div>
                                <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 italic">
                                    * El sistema enviará notificaciones cuando el Health Score baje de los umbrales definidos. El intervalo evita saturación de mensajes.
                                </p>
                            </div>

                            <div className="pt-6 flex items-center justify-end border-t border-gray-100 dark:border-gray-800">
                                <Button type="submit" isLoading={isSaving} className="px-10 py-6 rounded-2xl font-black uppercase tracking-widest text-xs">
                                    <Save className="w-4 h-4 mr-2" />
                                    Actualizar Configuración
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Mastering Section */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-red-100 dark:border-red-900/30 overflow-hidden shadow-sm transition-all">
                <div className="p-8 border-b border-red-50 dark:border-red-900/20 bg-red-50/30 dark:bg-red-900/10 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-2xl">
                            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-red-700 dark:text-red-400 uppercase tracking-tight">Zona de Mantenimiento Maestro</h3>
                            <p className="text-xs font-bold text-red-600/60 dark:text-red-400/60">Gestión destructiva y carga inicial de datos.</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleReset}
                        className="px-6 py-4 bg-red-600 text-white hover:bg-red-700 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-red-500/20 flex items-center gap-2 group"
                    >
                        <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                        Reiniciar Sistema
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-indigo-600" />
                            <p className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest italic">Kit de Plantillas para Carga Masiva (CSV)</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                            {TEMPLATES.map((template) => (
                                <a
                                    key={template.id}
                                    href={`/templates/${template.id}.csv`}
                                    download={`plantilla_${template.id}.csv`}
                                    className="p-5 bg-gray-50 dark:bg-gray-800 rounded-2xl text-center hover:bg-white dark:hover:bg-gray-700 transition-all border border-transparent hover:border-indigo-100 shadow-sm group border-dashed border-gray-200 dark:border-gray-700"
                                >
                                    <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                        <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <p className="text-[11px] font-black text-gray-800 dark:text-gray-200 uppercase mb-1 truncate">{template.name}</p>
                                    <p className="text-[9px] text-gray-400 dark:text-gray-500 font-medium leading-tight mb-2 line-clamp-1">{template.desc}</p>
                                    <div className="flex items-center justify-center text-[9px] font-black text-indigo-600 uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Download className="w-3 h-3 mr-1" />
                                        Bajar .CSV
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 flex items-start gap-3">
                        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-xs font-black text-amber-800 dark:text-amber-400 uppercase">Instrucciones de Carga</p>
                            <p className="text-xs text-amber-700 dark:text-amber-500/80 leading-relaxed font-medium">
                                Los archivos deben mantenerse en formato **CSV (delimitado por punto y coma `;`)**.
                                No cambie las cabeceras de la primera fila. Para evitar errores, se recomienda llenar los datos de ejemplo y luego borrarlos.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            {/* Enterprise & Auditoría Section (v3.6) */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-indigo-100 dark:border-indigo-900/30 overflow-hidden shadow-sm transition-all mt-8">
                <div className="p-8 border-b border-indigo-50 dark:border-indigo-900/20 bg-indigo-50/10 dark:bg-indigo-900/5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl">
                            <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-tight">Enterprise & Auditoría</h3>
                            <p className="text-xs font-bold text-indigo-600/60 dark:text-indigo-400/60">Monitoreo inmutable y exportación de configuración global.</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <a
                            href="/configuracion/auditoria"
                            className="px-6 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:bg-gray-50 flex items-center gap-2 transition-all shadow-sm"
                        >
                            <HistoryIcon className="w-4 h-4 text-indigo-600" />
                            Ver Auditoría de Sistema
                        </a>
                        <button
                            type="button"
                            onClick={async () => {
                                try {
                                    const response = await fetch(`${import.meta.env.VITE_API_URL}/system-settings/export`, {
                                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                                    });
                                    if (response.ok) {
                                        const data = await response.json();
                                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `SGC_Config_Export_${new Date().toISOString().split('T')[0]}.json`;
                                        a.click();
                                    }
                                } catch (e) {
                                    console.error('Export failed:', e);
                                }
                            }}
                            className="px-6 py-4 bg-indigo-600 text-white hover:bg-indigo-700 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 group"
                        >
                            <Download className="w-4 h-4" />
                            Exportar Configuración Global
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

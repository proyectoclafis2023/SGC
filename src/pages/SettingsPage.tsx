import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { formatRUT } from '../utils/formatters';
import { Settings as SettingsIcon, Save, Info, Building2, AlertTriangle, RefreshCw, FileText, Download, CheckCircle2 } from 'lucide-react';
import { resetSystemData } from '../utils/dataManagement';

const TEMPLATES = [
    { id: 'personal', name: 'Personal', desc: 'Trabajadores y datos base sueldo' },
    { id: 'residentes', name: 'Residentes', desc: 'Habitantes y contactos' },
    { id: 'propietarios', name: 'Propietarios', desc: 'Dueños de unidades' },
    { id: 'inventario', name: 'Inventario', desc: 'Artículos y stock' },
    { id: 'infraestructura', name: 'Infraestructura', desc: 'Torres y Departamentos' },
    { id: 'bancos', name: 'Bancos', desc: 'Maestro de bancos' },
    { id: 'afps', name: 'AFPs', desc: 'Instituciones de previsión' },
    { id: 'prevision', name: 'Salud', desc: 'Isapres y Fonasa' },
    { id: 'contratistas', name: 'Contratistas', desc: 'Empresas externas' },
    { id: 'estacionamientos', name: 'Estacionamientos', desc: 'Nómina de parkings' },
    { id: 'tipos_unidad', name: 'Tipos Unidad', desc: 'Modelos de depto' },
    { id: 'emergencias', name: 'Emergencias', desc: 'Números útiles' }
];

export const SettingsPage: React.FC = () => {
    const { settings, updateSettings } = useSettings();
    const [name, setName] = useState(settings.systemName);
    const [icon, setIcon] = useState(settings.systemIcon);
    const [logo, setLogo] = useState(settings.systemLogo || '');
    const [favicon, setFavicon] = useState(settings.systemFavicon || '');
    const [adminName, setAdminName] = useState(settings.adminName || '');
    const [adminRut, setAdminRut] = useState(settings.adminRut || '');
    const [condoRut, setCondoRut] = useState(settings.condoRut || '');
    const [condoAddress, setCondoAddress] = useState(settings.condoAddress || '');
    const [adminPhone, setAdminPhone] = useState(settings.adminPhone || '');
    const [signature, setSignature] = useState(settings.adminSignature || '');
    const [cameraBackupDays, setCameraBackupDays] = useState(settings.cameraBackupDays || 7);
    const [vacationAccrualRate, setVacationAccrualRate] = useState(settings.vacationAccrualRate || 1.25);
    const [deletionPassword, setDeletionPassword] = useState(settings.deletionPassword || '');
    const [isDarkMode, setIsDarkMode] = useState(settings.darkMode);
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

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage('');

        await new Promise(resolve => setTimeout(resolve, 600));

        updateSettings({
            systemName: name,
            systemIcon: icon.charAt(0).toUpperCase(),
            systemLogo: logo,
            systemFavicon: favicon,
            adminName,
            adminRut,
            condoRut,
            condoAddress,
            adminPhone,
            adminSignature: signature,
            cameraBackupDays: Number(cameraBackupDays),
            vacationAccrualRate: Number(vacationAccrualRate),
            deletionPassword,
            darkMode: isDarkMode
        });

        setIsSaving(false);
        setMessage('¡Configuración actualizada con éxito!');
        setTimeout(() => setMessage(''), 3000);
    };

    const handleReset = () => {
        const msg = `⚠️ ADVERTENCIA CRÍTICA:
Esta acción borrará TODOS los datos maestros y operativos de la plataforma:
- Personal y Liquidaciones
- Residentes y Propietarios
- Inventario y Artículos
- Torres y Departamentos
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
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ajustes del Sistema</h1>
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
                                    {icon.charAt(0).toUpperCase() || '?'}
                                </div>
                            )}
                            <div className="text-center z-10">
                                <p className="text-lg font-bold text-gray-900 dark:text-white truncate max-w-[200px]">{name || 'Nombre del Sistema'}</p>
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
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="ej. Condominio Las Camelias"
                                        required
                                    />
                                </div>
                                <Input
                                    label="Icono / Inicial"
                                    value={icon}
                                    onChange={(e) => setIcon(e.target.value.substring(0, 1).toUpperCase())}
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
                                        value={adminName}
                                        onChange={(e) => setAdminName(e.target.value)}
                                        placeholder="Nombre completo"
                                    />
                                    <Input
                                        label="RUT Administrador"
                                        value={adminRut}
                                        onChange={(e) => setAdminRut(formatRUT(e.target.value))}
                                        placeholder="12.345.678-9"
                                    />
                                    <Input
                                        label="RUT del Condominio"
                                        value={condoRut}
                                        onChange={(e) => setCondoRut(formatRUT(e.target.value))}
                                        placeholder="76.543.210-K"
                                    />
                                    <Input
                                        label="Dirección Oficial"
                                        value={condoAddress}
                                        onChange={(e) => setCondoAddress(e.target.value)}
                                        placeholder="Av. Principal #123"
                                    />
                                    <Input
                                        label="Teléfono Admin"
                                        value={adminPhone}
                                        onChange={(e) => setAdminPhone(e.target.value)}
                                        placeholder="+56 9 1234 5678"
                                    />
                                    <Input
                                        label="Días Respaldo Cámaras"
                                        type="number"
                                        value={cameraBackupDays}
                                        onChange={(e) => setCameraBackupDays(Number(e.target.value))}
                                        min={1}
                                        max={365}
                                    />
                                    <Input
                                        label="Días Vacaciones / Mes"
                                        type="number"
                                        step="0.01"
                                        value={vacationAccrualRate}
                                        onChange={(e) => setVacationAccrualRate(Number(e.target.value))}
                                        min={0}
                                        max={10}
                                    />
                                    <Input
                                        label="Clave de Eliminación Maestro"
                                        type="password"
                                        value={deletionPassword}
                                        onChange={(e) => setDeletionPassword(e.target.value)}
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
        </div>
    );
};

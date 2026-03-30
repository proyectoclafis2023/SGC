import React, { useState } from 'react';
import { useProfiles } from '../context/ProfileContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ShieldCheck, Plus, Search, Shield, Save, X, Trash2, Edit2, Check, Lock } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import type { Profile, ProfilePermissions } from '../types';

export const ProfilesPage: React.FC = () => {
    const { profiles, addProfile, updateProfile, deleteProfile } = useProfiles();
    const { settings } = useSettings();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeGroup, setActiveGroup] = useState(0);

    const DEFAULT_PERMISSIONS: ProfilePermissions = {
        canViewPersonnel: true,
        canManagePersonnel: true,
        canViewPrevisiones: true,
        canManagePrevisiones: true,
        canViewAFPs: true,
        canManageAFPs: true,
        canViewUsers: true,
        canManageUsers: true,
        canViewProfiles: true,
        canManageProfiles: true,
        canViewSettings: true,
        canManageSettings: true,
        canViewInfrastructure: true,
        canManageInfrastructure: true,
        canViewResidents: true,
        canManageResidents: true,
        canViewOwners: true,
        canManageOwners: true,
        canViewUnitTypes: true,
        canManageUnitTypes: true,
        canViewParking: true,
        canManageParking: true,
        canViewCommonSpaces: true,
        canManageCommonSpaces: true,
        canViewArticles: true,
        canManageArticles: true,
        canViewContractors: true,
        canManageContractors: true,
        canViewFixedAssets: true,
        canManageFixedAssets: true,
        canViewEmergencyNumbers: true,
        canManageEmergencyNumbers: true,
        canViewOperationalMasters: true,
        canManageOperationalMasters: true,
        canViewCommonExpenses: true,
        canManageCommonExpenses: true,
        canViewCertificates: true,
        canManageCertificates: true,
        canViewVisitors: true,
        canManageVisitors: true,
        canViewShiftReports: true,
        canManageShiftReports: true,
        canViewCorrespondence: true,
        canManageCorrespondence: true,
        canViewTickets: true,
        canManageTickets: true,
        canViewCameraRequests: true,
        canManageCameraRequests: true,
        canViewReservations: true,
        canManageReservations: true,
        canViewSystemMessages: true,
        canManageSystemMessages: true,
        canViewArticleDeliveries: true,
        canManageArticleDeliveries: true,
        canViewPayslips: true,
        canManagePayslips: true,
    };

    const [name, setName] = useState('');
    const [permissions, setPermissions] = useState<ProfilePermissions>(DEFAULT_PERMISSIONS);

    const resetForm = () => {
        setName('');
        setPermissions(DEFAULT_PERMISSIONS);
        setEditingProfile(null);
    };

    const handleOpenModal = (profile?: Profile) => {
        if (profile) {
            setEditingProfile(profile);
            setName(profile.name);
            setPermissions({ ...DEFAULT_PERMISSIONS, ...profile.permissions });
        } else {
            resetForm();
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingProfile) {
            await updateProfile({ ...editingProfile, name, permissions });
        } else {
            await addProfile({ name, permissions });
        }
        setIsModalOpen(false);
        resetForm();
    };

    const filteredProfiles = profiles.filter(p =>
        !p.isArchived && p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const togglePermission = (key: keyof ProfilePermissions) => {
        setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const PERMISSION_GROUPS = [
        {
            title: 'Administración y Maestros',
            items: [
                { label: 'Personal (Ver)', key: 'canViewPersonnel' },
                { label: 'Personal (Gestionar)', key: 'canManagePersonnel' },
                { label: 'Previsiones/Salud (Ver)', key: 'canViewPrevisiones' },
                { label: 'Previsiones/Salud (Gestionar)', key: 'canManagePrevisiones' },
                { label: 'AFPs (Ver)', key: 'canViewAFPs' },
                { label: 'AFPs (Gestionar)', key: 'canManageAFPs' },
                { label: 'Usuarios (Ver)', key: 'canViewUsers' },
                { label: 'Usuarios (Gestionar)', key: 'canManageUsers' },
                { label: 'Perfiles (Ver)', key: 'canViewProfiles' },
                { label: 'Perfiles (Gestionar)', key: 'canManageProfiles' },
                { label: 'Configuración (Ver)', key: 'canViewSettings' },
                { label: 'Configuración (Gestionar)', key: 'canManageSettings' },
                { label: 'Torres/Deptos (Ver)', key: 'canViewInfrastructure' },
                { label: 'Torres/Deptos (Gestionar)', key: 'canManageInfrastructure' },
                { label: 'Residentes (Ver)', key: 'canViewResidents' },
                { label: 'Residentes (Gestionar)', key: 'canManageResidents' },
                { label: 'Propietarios (Ver)', key: 'canViewOwners' },
                { label: 'Propietarios (Gestionar)', key: 'canManageOwners' },
                { label: 'Tipos Unidad (Ver)', key: 'canViewUnitTypes' },
                { label: 'Tipos Unidad (Gestionar)', key: 'canManageUnitTypes' },
                { label: 'Estacionamientos (Ver)', key: 'canViewParking' },
                { label: 'Estacionamientos (Gestionar)', key: 'canManageParking' },
                { label: 'Espacios Comunes (Ver)', key: 'canViewCommonSpaces' },
                { label: 'Espacios Comunes (Gestionar)', key: 'canManageCommonSpaces' },
                { label: 'Artículos (Ver)', key: 'canViewArticles' },
                { label: 'Artículos (Gestionar)', key: 'canManageArticles' },
                { label: 'Contratistas (Ver)', key: 'canViewContractors' },
                { label: 'Contratistas (Gestionar)', key: 'canManageContractors' },
                { label: 'Activos Fijos (Ver)', key: 'canViewFixedAssets' },
                { label: 'Activos Fijos (Gestionar)', key: 'canManageFixedAssets' },
                { label: 'Números Emergencia (Ver)', key: 'canViewEmergencyNumbers' },
                { label: 'Números Emergencia (Gestionar)', key: 'canManageEmergencyNumbers' },
                { label: 'Maestros Operacionales (Ver)', key: 'canViewOperationalMasters' },
                { label: 'Maestros Operacionales (Gestionar)', key: 'canManageOperationalMasters' },
            ]
        },
        {
            title: 'Operaciones y Gestión',
            items: [
                { label: 'Gastos Comunes (Ver)', key: 'canViewCommonExpenses' },
                { label: 'Gastos Comunes (Gestionar)', key: 'canManageCommonExpenses' },
                { label: 'Certificados (Ver)', key: 'canViewCertificates' },
                { label: 'Certificados (Gestionar)', key: 'canManageCertificates' },
                { label: 'Visitas (Ver)', key: 'canViewVisitors' },
                { label: 'Visitas (Gestionar)', key: 'canManageVisitors' },
                { label: 'Libro Novedades (Ver)', key: 'canViewShiftReports' },
                { label: 'Libro Novedades (Gestionar)', key: 'canManageShiftReports' },
                { label: 'Conserjería/Encomiendas (Ver)', key: 'canViewCorrespondence' },
                { label: 'Conserjería/Encomiendas (Gestionar)', key: 'canManageCorrespondence' },
                { label: 'Tickets Sugerencia (Ver)', key: 'canViewTickets' },
                { label: 'Tickets Sugerencia (Gestionar)', key: 'canManageTickets' },
                { label: 'Solicitud Cámaras (Ver)', key: 'canViewCameraRequests' },
                { label: 'Solicitud Cámaras (Gestionar)', key: 'canManageCameraRequests' },
                { label: 'Reservas (Ver)', key: 'canViewReservations' },
                { label: 'Reservas (Gestionar)', key: 'canManageReservations' },
                { label: 'Mensajes Sistema (Ver)', key: 'canViewSystemMessages' },
                { label: 'Mensajes Sistema (Gestionar)', key: 'canManageSystemMessages' },
                { label: 'Entrega Artículos (Ver)', key: 'canViewArticleDeliveries' },
                { label: 'Entrega Artículos (Gestionar)', key: 'canManageArticleDeliveries' },
                { label: 'Liquidaciones (Ver)', key: 'canViewPayslips' },
                { label: 'Liquidaciones (Gestionar)', key: 'canManagePayslips' },
            ]
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className={`text-2xl font-black flex items-center gap-2 ${settings.theme === 'modern' ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        <ShieldCheck className="w-8 h-8 text-indigo-600" />
                        Maestro Perfiles de Acceso
                    </h1>
                    <p className={`text-sm mt-1 font-bold ${settings.theme === 'modern' ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'}`}>Configura niveles de acceso y permisos granulares.</p>
                </div>
                <Button onClick={() => handleOpenModal()} className="shadow-lg shadow-indigo-600/20 px-8">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Perfil
                </Button>
            </div>

            <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4 transition-colors">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar perfil..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProfiles.map((profile) => (
                    <div key={profile.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                                    <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleOpenModal(profile)} className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => deleteProfile(profile.id)} className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{profile.name}</h3>
                            <div className="mt-4 space-y-2">
                                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Permisos Clave</p>
                                <div className="flex flex-wrap gap-2">
                                    {profile.permissions.canManagePersonnel && <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-md">Personal</span>}
                                    {profile.permissions.canManageCommonExpenses && <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-md">Finanzas</span>}
                                    {profile.permissions.canManageResidents && <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-md">Residentes</span>}
                                    {profile.permissions.canManageUsers && <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-[10px] font-bold rounded-md">Usuarios</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-4xl shadow-2xl border border-white/20 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className={`p-8 border-b flex items-center justify-between ${settings.theme === 'modern' ? 'bg-indigo-950/40 border-indigo-900/50' : 'bg-gray-50/80 border-gray-100 dark:bg-gray-800/50 dark:border-gray-800'}`}>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-none mb-1">
                                        {editingProfile ? 'Editar Perfil' : 'Nuevo Perfil Access'}
                                    </h2>
                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">Control de Seguridad de la Plataforma</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white dark:hover:bg-gray-800 rounded-2xl transition-colors text-gray-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex border-b dark:border-gray-800">
                            {PERMISSION_GROUPS.map((group, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setActiveGroup(idx)}
                                    className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeGroup === idx ? 'text-indigo-600 border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
                                >
                                    {group.title}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                            <Input
                                label="Nombre del Perfil"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="ej. Supervisor de RRHH"
                                required
                            />

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                                    {PERMISSION_GROUPS[activeGroup].items.map((item) => (
                                        <label key={item.key} className={`flex items-center justify-between p-5 rounded-[2rem] border transition-all cursor-pointer group/item ${permissions[item.key as keyof ProfilePermissions] ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-600/20' : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-gray-300'}`}>
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-2xl transition-all ${permissions[item.key as keyof ProfilePermissions] ? 'bg-white/20 text-white' : 'bg-white dark:bg-gray-900 text-gray-400 group-hover/item:text-indigo-600'}`}>
                                                    {permissions[item.key as keyof ProfilePermissions] ? <Check className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <span className={`text-[11px] font-black uppercase tracking-widest block transition-all ${permissions[item.key as keyof ProfilePermissions] ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                                        {item.label.split('(')[0]}
                                                    </span>
                                                    <span className={`text-[9px] font-bold uppercase tracking-tighter block transition-all ${permissions[item.key as keyof ProfilePermissions] ? 'text-indigo-100' : 'text-gray-400'}`}>
                                                        {item.label.includes('Ver') ? 'Solo Consulta' : 'Control Total'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className={`w-12 h-6 rounded-full relative transition-all ${permissions[item.key as keyof ProfilePermissions] ? 'bg-indigo-400' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${permissions[item.key as keyof ProfilePermissions] ? 'right-1' : 'left-1'}`} />
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={permissions[item.key as keyof ProfilePermissions]}
                                                onChange={() => togglePermission(item.key as keyof ProfilePermissions)}
                                                className="hidden"
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 sticky bottom-0 bg-white dark:bg-gray-900 pb-2">
                                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit">
                                    <Save className="w-4 h-4 mr-2" />
                                    {editingProfile ? 'Guardar Cambios' : 'Crear Perfil'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

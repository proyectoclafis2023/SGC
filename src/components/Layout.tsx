import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { EmergencyTicker } from './EmergencyTicker';
import {
    LogOut,
    LayoutDashboard,
    Settings,
    Users,
    Building2,
    Menu,
    Package,
    Video,
    HardHat,
    FileText,
    History,
    Phone,
    ChevronDown,
    ChevronRight,
    Sun,
    Moon,
    Landmark,
    Database,
    Zap,
    LifeBuoy,
    ShieldCheck,
    Briefcase,
    Banknote,
    Calendar,
    Wallet,
    Home
} from 'lucide-react';

interface SubMenuItem {
    label: string;
    path: string;
    icon?: any;
}

interface NavItemProps {
    to?: string;
    icon: any;
    label: string;
    isCollapsed: boolean;
    children?: SubMenuItem[];
}

const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label, isCollapsed, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { settings } = useSettings();
    const location = useLocation();
    const hasChildren = children && children.length > 0;

    const isChildActive = hasChildren && children.some(child => location.pathname === child.path);
    const isActive = to ? location.pathname === to : isChildActive;

    useEffect(() => {
        if (isChildActive) setIsOpen(true);
    }, [isChildActive]);

    const baseClasses = `flex items-center w-full rounded-2xl font-black transition-all duration-300 group ${isCollapsed ? 'justify-center px-0' : 'space-x-3 px-4'} py-3`;
    const activeClasses = `shadow-lg shadow-indigo-500/30 ${settings.theme === 'modern' ? 'bg-white text-indigo-900' : 'bg-indigo-600 text-white'}`;
    const inactiveClasses = `${settings.theme === 'modern' ? 'text-indigo-200 hover:bg-white/10 hover:text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 hover:text-indigo-600 dark:hover:text-indigo-400'}`;

    if (hasChildren && !isCollapsed) {
        return (
            <div className="space-y-1">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
                >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="flex-1 text-left text-[9px] uppercase tracking-[0.2em]">{label}</span>
                    {isOpen ? <ChevronDown className="w-4 h-4 shrink-0 transition-transform" /> : <ChevronRight className="w-4 h-4 shrink-0 transition-transform text-gray-400" />}
                </button>
                {isOpen && (
                    <div className="ml-9 border-l-2 border-indigo-100 dark:border-indigo-900/30 pl-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
                        {children.map((child, idx) => (
                            <NavLink
                                key={idx}
                                to={child.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${isActive
                                        ? (settings.theme === 'modern' ? 'bg-white text-indigo-900 shadow-md' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20')
                                        : 'text-gray-400 hover:text-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/5'
                                    }`
                                }
                            >
                                {child.icon && <child.icon className="w-3 h-3" />}
                                {child.label}
                            </NavLink>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (to) {
        return (
            <NavLink
                to={to}
                className={({ isActive }) => `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
                title={isCollapsed ? label : ""}
            >
                <Icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span className="text-[9px] uppercase tracking-[0.2em]">{label}</span>}
            </NavLink>
        );
    }

    return null;
};

export const Layout: React.FC = () => {
    const { user, logout } = useAuth();
    const { settings, toggleTheme } = useSettings();
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isAdmin = user?.role === 'admin' || user?.role === 'global_admin';
    const isWorker = user?.role === 'worker';
    const isResidentOrOwner = user?.role === 'resident' || user?.role === 'owner';

    return (
        <div className={`min-h-screen font-sans selection:bg-indigo-500/30 flex transition-colors duration-300 ${settings.theme === 'modern' ? 'bg-[#f0f2ff]' : 'bg-[#f4f6f8] dark:bg-black'}`}>
            {/* Sidebar Overlay for Mobile */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                ${isCollapsed ? 'w-20' : 'w-72'} 
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                ${settings.theme === 'modern' ? 'bg-[#1e1b4b] border-indigo-900/40 text-indigo-100' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'}
                border-r flex flex-col fixed md:sticky top-0 h-screen transition-all duration-500 z-50 
                shadow-2xl shadow-gray-200/20 dark:shadow-none
            `}>
                <div className={`p-8 border-b border-gray-50 dark:border-gray-800 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} relative`}>
                    <div className={`flex items-center ${isCollapsed ? 'hidden' : 'space-x-3 animate-in fade-in duration-500'}`}>
                        {settings.systemLogo ? (
                            <img src={settings.systemLogo} alt="Logo" className="h-8 w-auto object-contain" />
                        ) : (
                            <div className="w-10 h-10 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center transform -rotate-3 transition-transform shadow-xl shadow-indigo-500/20 text-white font-black text-xl shrink-0">
                                {settings.systemIcon}
                            </div>
                        )}
                        <span className="text-[14px] font-black text-gray-900 dark:text-white tracking-widest uppercase leading-tight">
                            PLATAFORMA DE GESTIÓN COMUNITARIA
                        </span>
                    </div>
                    {isCollapsed && (
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-xl shrink-0">
                            {settings.systemIcon}
                        </div>
                    )}
                </div>

                <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
                    <NavItem to="/" icon={LayoutDashboard} label="Dashboard" isCollapsed={isCollapsed} />

                    {/* OPERACIÓN & GESTIÓN DIARIA (Admins & Workers) */}
                    {(isAdmin || isWorker) && (
                        <>
                            <div className={`pt-6 pb-2 px-4 transition-opacity duration-300 ${isCollapsed ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
                                <span className="text-[9px] font-black text-indigo-400 dark:text-indigo-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Zap className="w-3 h-3" /> Operaciones
                                </span>
                            </div>
                            <NavItem to="/bitacora-turnos" icon={History} label="Bitácora Turnos" isCollapsed={isCollapsed} />
                            <NavItem to="/visitas" icon={Users} label="Control Visitas" isCollapsed={isCollapsed} />
                            <NavItem to="/correspondencia" icon={Package} label="Encomiendas" isCollapsed={isCollapsed} />
                            <NavItem to="/registro-contratistas" icon={HardHat} label="Contratistas" isCollapsed={isCollapsed} />
                            <NavItem
                                icon={FileText}
                                label="Reportes"
                                isCollapsed={isCollapsed}
                                children={[
                                    { label: 'Reporte Diario', path: '/reporte-diario' },
                                ]}
                            />
                            <NavItem to="/camaras" icon={Video} label="Cámaras / Grabaciones" isCollapsed={isCollapsed} />
                        </>
                    )}

                    {/* MI HOGAR (Resident or Owner) */}
                    {isResidentOrOwner && (
                        <>
                            <div className={`pt-6 pb-2 px-4 transition-opacity duration-300 ${isCollapsed ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
                                <span className="text-[9px] font-black text-indigo-400 dark:text-indigo-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Home className="w-3 h-3" /> Mi Hogar
                                </span>
                            </div>
                            <NavItem to="/reservas" icon={Calendar} label="Mis Reservas" isCollapsed={isCollapsed} />
                            <NavItem to="/gastos-comunes" icon={Wallet} label="Mis Pagos" isCollapsed={isCollapsed} />
                        </>
                    )}

                    {/* SOPORTE & SERVICIOS (Public for all) */}
                    <div className={`pt-6 pb-2 px-4 transition-opacity duration-300 ${isCollapsed ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
                        <span className="text-[9px] font-black text-indigo-400 dark:text-indigo-500 uppercase tracking-[0.2em] flex items-center gap-2">
                            <LifeBuoy className="w-3 h-3" /> Soporte y Servicios
                        </span>
                    </div>
                    <NavItem to="/servicios-residentes" icon={HardHat} label="Directorio de Servicios" isCollapsed={isCollapsed} />
                    <NavItem to="/reclamos" icon={LifeBuoy} label="Sugerencias & Reclamos" isCollapsed={isCollapsed} />
                    <NavItem to="/emergencias" icon={Phone} label="Números Emergencia" isCollapsed={isCollapsed} />

                    {/* ADMINISTRACIÓN (Admins only) */}
                    {isAdmin && (
                        <>
                            <div className={`pt-8 pb-2 px-4 transition-opacity duration-300 ${isCollapsed ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
                                <span className="text-[9px] font-black text-indigo-400 dark:text-indigo-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Database className="w-3 h-3" /> Administración
                                </span>
                            </div>
                            <NavItem
                                icon={Building2}
                                label="Comunidad"
                                isCollapsed={isCollapsed}
                                children={[
                                    { label: 'Residentes', path: '/residentes', icon: Users },
                                    { label: 'Propietarios', path: '/propietarios', icon: ShieldCheck },
                                    { label: 'Maestro Servicios / Contratistas', path: '/contratistas', icon: HardHat },
                                ]}
                            />
                            <NavItem
                                icon={Users}
                                label="Recursos Humanos"
                                isCollapsed={isCollapsed}
                                children={[
                                    { label: 'Maestro Personal', path: '/personal', icon: Briefcase },
                                    { label: 'Gestión de Nómina', path: '/liquidaciones', icon: Banknote },
                                    { label: 'Entrega de EPP', path: '/entregas-articulos', icon: Package },
                                    { label: 'Maestro EPP', path: '/articulos-personal', icon: ShieldCheck },
                                    { label: 'Certificados', path: '/certificados', icon: FileText },
                                ]}
                            />
                            <NavItem
                                icon={Landmark}
                                label="Finanzas"
                                isCollapsed={isCollapsed}
                                children={[
                                    { label: 'Gastos Comunes Admin', path: '/gastos-comunes' },
                                    { label: 'Registro de Egresos', path: '/registro-gastos' },
                                    { label: 'Reglas de Cobro', path: '/reglas-gastos-comunes' },
                                    { label: 'Fondos Especiales', path: '/maestro-fondos' },
                                    { label: 'Activo Fijo', path: '/activo-fijo' },
                                ]}
                            />
                            <NavItem
                                icon={Settings}
                                label="Configuración"
                                isCollapsed={isCollapsed}
                                children={[
                                    { label: 'Maestro Números Emergencia', path: '/maestro-emergencias' },
                                    { label: 'Maestro Edificios y Unidades', path: '/infraestructura' },
                                    { label: 'Maestro Tipos de Unidad', path: '/tipos-unidad' },
                                    { label: 'Maestro Bitácora Turnos', path: '/maestros-operativos' },
                                    { label: 'Maestro Cámaras', path: '/maestro-camaras' },
                                    { label: 'Maestro Avisos Sistema', path: '/mensajes' },
                                    { label: 'Maestro Perfiles de Acceso', path: '/perfiles' },
                                    { label: 'Maestro Envíos por Correo', path: '/maestro-correos' },
                                    { label: 'Ajustes Generales', path: '/configuracion' },
                                    { label: 'Carga Masiva', path: '/carga-masiva' },
                                ]}
                            />
                        </>
                    )}
                </nav>

                <div className={`p-6 border-t border-gray-50 dark:border-gray-800 transition-all ${isCollapsed ? 'px-2' : ''}`}>
                    {!isCollapsed ? (
                        <div className="flex items-center space-x-3 px-4 py-4 mb-3 bg-gray-50 dark:bg-gray-800/40 rounded-3xl border border-gray-100 dark:border-gray-700/50 animate-in fade-in duration-300">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-indigo-500/20">
                                {user?.name?.charAt(0) || 'A'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-gray-900 dark:text-white truncate">{user?.name}</p>
                                <p className="text-[9px] text-indigo-500 dark:text-indigo-400 uppercase tracking-widest font-black mt-0.5">{user?.role === 'admin' ? 'Administrador' : user?.role === 'global_admin' ? 'Global Admin' : user?.role === 'worker' ? 'Funcionario' : 'Residente'}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-center mb-3" title={user?.name}>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
                                {user?.name?.charAt(0) || 'A'}
                            </div>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className={`flex items-center ${isCollapsed ? 'justify-center p-3' : 'space-x-3 px-4 py-3 w-full'} text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-2xl transition-colors text-[9px] font-black uppercase tracking-widest group shadow-sm hover:shadow-rose-500/10`}
                        title={isCollapsed ? "Cerrar Sesión" : ""}
                    >
                        <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1 shrink-0" />
                        {!isCollapsed && <span>Cerrar Sesión</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto flex flex-col">
                <header className={`h-20 backdrop-blur-xl border-b flex items-center justify-between px-8 sticky top-0 z-20 ${settings.theme === 'modern' ? 'bg-[#1e1b4b]/80 border-indigo-900/40 shadow-sm' : 'bg-white/80 dark:bg-[#020617]/80 border-gray-100 dark:border-gray-800'}`}>
                    <div className="flex items-center gap-4">
                        <button
                            className="md:hidden p-2 -ml-2 text-gray-400 hover:text-indigo-600 transition-colors"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="hidden md:flex p-2 text-gray-400 hover:text-indigo-600 transition-colors bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <span className={`hidden lg:block font-black text-[10px] uppercase tracking-[0.2em] ${settings.theme === 'modern' ? 'text-indigo-200' : 'text-gray-400'}`}>Plataforma de Gestion Comunitaria</span>
                    </div>

                    <div className="flex items-center gap-4">

                        <button
                            onClick={toggleTheme}
                            className="p-3 rounded-2xl text-gray-400 border border-gray-100 dark:border-gray-800 hover:text-indigo-600 hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                        >
                            {settings.theme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : settings.theme === 'modern' ? <Moon className="w-5 h-5 text-indigo-400" /> : <Zap className="w-5 h-5 text-indigo-600" />}
                            {settings.theme === 'modern' && <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Modern</span>}
                        </button>
                        <div className="lg:hidden w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black">
                            {user?.name?.charAt(0)}
                        </div>
                    </div>
                </header>

                <div className="p-10 max-w-[1600px] w-full mx-auto flex-1">
                    <EmergencyTicker />
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

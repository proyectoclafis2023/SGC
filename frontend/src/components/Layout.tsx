import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { EmergencyTicker } from './EmergencyTicker';
import { usePermissions } from '../hooks/usePermissions';
import {
    LogOut,
    // ... rest of imports
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
    Home,
    Mail,
    Activity,
    Cpu,
    Shield,
    BarChart3,
    ClipboardCheck,
    Bell,
    Tag
} from 'lucide-react';

interface SubMenuItem {
    label: string;
    path?: string;
    icon?: any;
    isHeader?: boolean;
    permission?: string;
}

interface NavItemProps {
    to?: string;
    icon: any;
    label: string;
    isCollapsed: boolean;
    children?: SubMenuItem[];
    permission?: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label, isCollapsed, children, permission }) => {
    const { hasPermission } = usePermissions();
    if (permission && !hasPermission(permission)) return null;
    
    const [isOpen, setIsOpen] = useState(false);
    const [expandedHeaders, setExpandedHeaders] = useState<string[]>([]);
    const { settings } = useSettings();
    const location = useLocation();

    // Filter children by permissions
    const filteredChildren = children?.filter(child => !child.permission || hasPermission(child.permission));
    const hasChildren = filteredChildren && filteredChildren.length > 0;

    const isChildActive = hasChildren && filteredChildren.some(child => child.path && location.pathname === child.path);
    const isActive = to ? location.pathname === to : isChildActive;

    useEffect(() => {
        if (isChildActive) {
            setIsOpen(true);
            // Auto-expand the header containing the active child
            const activeChild = filteredChildren?.find(child => child.path && location.pathname === child.path);
            if (activeChild) {
                // Find the header preceding this child
                let headerFound = '';
                for (const child of filteredChildren || []) {
                    if (child.isHeader) headerFound = child.label;
                    if (child.path && location.pathname === child.path) break;
                }
                if (headerFound) setExpandedHeaders(prev => prev.includes(headerFound) ? prev : [...prev, headerFound]);
            }
        }
    }, [isChildActive, filteredChildren, location.pathname]);

    const toggleHeader = (headerLabel: string) => {
        setExpandedHeaders(prev =>
            prev.includes(headerLabel)
                ? prev.filter(h => h !== headerLabel)
                : [...prev, headerLabel]
        );
    };

    const baseClasses = `flex items-center w-full rounded-2xl font-black transition-all duration-300 group ${isCollapsed ? 'justify-center px-0' : 'space-x-3 px-4'} py-3`;
    const activeClasses = `shadow-lg shadow-indigo-500/30 ${settings.theme === 'modern' ? 'bg-white text-indigo-900' : 'bg-indigo-600 text-white'}`;
    const inactiveClasses = `${settings.theme === 'modern' ? 'text-indigo-200 hover:bg-white/10 hover:text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 hover:text-indigo-600 dark:hover:text-indigo-400'}`;

    if (hasChildren && !isCollapsed && filteredChildren) {
        // Group items by header
        const sections: { header?: SubMenuItem; items: SubMenuItem[] }[] = [];
        let currentSection: { header?: SubMenuItem; items: SubMenuItem[] } = { items: [] };

        filteredChildren.forEach(child => {
            if (child.isHeader) {
                if (currentSection.items.length > 0 || currentSection.header) {
                    sections.push(currentSection);
                }
                currentSection = { header: child, items: [] };
            } else {
                currentSection.items.push(child);
            }
        });
        sections.push(currentSection);

        return (
            <div className="space-y-1">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
                >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="flex-1 text-left text-[13px] uppercase tracking-[0.2em] font-black">{label}</span>
                    {isOpen ? <ChevronDown className="w-4 h-4 shrink-0 transition-transform" /> : <ChevronRight className="w-4 h-4 shrink-0 transition-transform text-gray-400" />}
                </button>
                {isOpen && (
                    <div className="ml-9 border-l-2 border-indigo-100 dark:border-indigo-900/30 pl-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
                        {sections.map((section, sIdx) => (
                            <div key={sIdx} className="space-y-1">
                                {section.header && (
                                    <button
                                        onClick={() => toggleHeader(section.header!.label)}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-300 group/header ${expandedHeaders.includes(section.header.label)
                                            ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                            : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-400 dark:text-gray-500'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {section.header.icon ? (
                                                <section.header.icon className={`w-3 h-3 transition-colors ${expandedHeaders.includes(section.header.label) ? 'text-indigo-500' : 'text-gray-400'
                                                    }`} />
                                            ) : (
                                                <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${expandedHeaders.includes(section.header.label) ? 'bg-indigo-500 scale-110' : 'bg-gray-300 dark:bg-gray-700'
                                                    }`}></div>
                                            )}
                                            <span className="text-[11px] font-black uppercase tracking-[0.15em] text-left">
                                                {section.header.label}
                                            </span>
                                        </div>
                                        <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${expandedHeaders.includes(section.header.label) ? 'rotate-0' : '-rotate-90'
                                            }`} />
                                    </button>
                                )}
                                <div className={`space-y-1 overflow-hidden transition-all duration-300 ${(!section.header || expandedHeaders.includes(section.header.label)) ? 'max-h-[1200px] opacity-100 py-1' : 'max-h-0 opacity-0'
                                    }`}>
                                    {section.items.map((child, idx) => (
                                        <NavLink
                                            key={idx}
                                            to={child.path || '#'}
                                            className={({ isActive }) =>
                                                `flex items-center gap-3 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] transition-all duration-300 ${isActive
                                                    ? (settings.theme === 'modern' ? 'bg-white text-indigo-900 shadow-md translate-x-1' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 translate-x-1')
                                                    : 'text-gray-400 hover:text-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/5 hover:translate-x-1'
                                                }`
                                            }
                                        >
                                            {child.icon && <child.icon className="w-3 h-3" />}
                                            {child.label}
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
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
                {!isCollapsed && <span className="text-[13px] uppercase tracking-[0.2em] font-black">{label}</span>}
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
    const isConcierge = user?.role === 'concierge';
    const isResidentOrOwner = user?.role === 'resident' || user?.role === 'owner';

    return (
        <div className={`min-h-screen font-sans selection:bg-indigo-500/30 flex transition-colors duration-300 bg-[var(--app-bg)] text-[var(--text-primary)]`}>
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
                bg-[var(--sidebar-bg)] border-[var(--border-color)] text-[var(--text-primary)]
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
                            SGC - SISTEMA DE GESTIÓN DE CONDOMINIOS
                        </span>
                    </div>
                    {isCollapsed && (
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-xl shrink-0">
                            S
                        </div>
                    )}
                </div>
                <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
                    <NavItem to="/" icon={LayoutDashboard} label="Dashboard" isCollapsed={isCollapsed} />

                    {/* SECCIÓN OPERACIONES */}
                    {(isAdmin || isConcierge) && (
                        <NavItem
                            icon={Zap}
                            label="Operaciones"
                            isCollapsed={isCollapsed}
                            children={[
                                { label: 'Reporte Diario', path: '/reporte-diario', icon: FileText, permission: 'reports:view' },
                                { label: 'Libro de Novedades', path: '/bitacora-turnos', icon: History, permission: 'shift_logs:view' },
                                { label: 'Controles', isHeader: true, icon: ShieldCheck },
                                { label: 'Visitas', path: '/visitas', icon: Users, permission: 'visits:view' },
                                { label: 'Encomiendas', path: '/correspondencia', icon: Package, permission: 'correspondence:view' },
                                { label: 'Contratistas', path: '/registro-contratistas', icon: HardHat, permission: 'contractors:view' },
                                { label: 'Gestión', isHeader: true, icon: ClipboardCheck },
                                { label: 'Solicitud Insumos', path: '/solicitud-insumos', icon: Package, permission: 'supplies:manage' },
                                { label: 'Gestión Registros CCTV', path: '/camaras', icon: Video, permission: 'cctv:view' },
                            ]}
                        />
                    )}

                    {/* SECCIÓN MI HOGAR */}
                    {isResidentOrOwner && (
                        <NavItem
                            icon={Home}
                            label="Mi Hogar"
                            isCollapsed={isCollapsed}
                            children={[
                                { label: 'Mis Pagos', path: '/mis-pagos', icon: Wallet, permission: 'payments:view' },
                            ]}
                        />
                    )}

                    {/* SECCIÓN SOPORTE & SERVICIOS */}
                    <NavItem
                        icon={LifeBuoy}
                        label="Soporte y Servicios"
                        isCollapsed={isCollapsed}
                        children={[
                            { label: 'Atención y Soporte', path: '/reclamos', icon: LifeBuoy, permission: 'tickets:view' },
                            { label: 'Reserva Espacios Comunes', path: '/reservas', icon: Calendar, permission: 'reservations:view' },
                            { label: 'Directorio de Servicios', path: '/servicios-residentes', icon: HardHat, permission: 'services:view' },
                            { label: 'Números Emergencia', path: '/emergencias', icon: Phone, permission: 'emergencies:view' },
                        ]}
                    />

                    {/* SECCIÓN ADMINISTRACIÓN */}
                    {isAdmin && (
                        <NavItem
                            icon={Shield}
                            label="Administración"
                            isCollapsed={isCollapsed}
                            children={[
                                { label: 'Gestión Estratégica', path: '/dashboard-kpi', icon: BarChart3, permission: 'admin:stats' },
                                { label: 'Centro de Gestiones', path: '/tickets', icon: ClipboardCheck, permission: 'admin:tickets' },

                                { label: 'Comunidad', isHeader: true, icon: Building2 },
                                { label: 'Residentes', path: '/residentes', icon: Users, permission: 'residents:manage' },
                                { label: 'Propietarios', path: '/propietarios', icon: ShieldCheck, permission: 'owners:manage' },
                                { label: 'Directiva', path: '/directiva', icon: Landmark, permission: 'comite:manage' },
                                { label: 'Mensajes Dirigidos (Email)', path: '/mensajes-dirigidos', icon: Mail, permission: 'email:manage' },
                                { label: 'Avisos del Sistema (Visor)', path: '/mensajes', icon: Bell, permission: 'announcements:manage' },

                                { label: 'Recursos Humanos', isHeader: true, icon: Users },
                                { label: 'Maestro Personal', path: '/personal', icon: Briefcase, permission: 'personnel:manage' },
                                { label: 'Servicios / Contratistas', path: '/contratistas', icon: HardHat, permission: 'contractors:manage' },
                                { label: 'Gestión de Nómina', path: '/liquidaciones', icon: Banknote, permission: 'payroll:manage' },
                                { label: 'Entrega de EPP', path: '/entregas-articulos', icon: Package, permission: 'epp:manage' },
                                { label: 'Certificados', path: '/certificados', icon: FileText, permission: 'certificates:manage' },

                                { label: 'Finanzas', isHeader: true, icon: Landmark },
                                { label: 'Gastos Comunes Admin', path: '/gastos-comunes', icon: Banknote, permission: 'finances:manage' },
                                { label: 'Registro de Egresos', path: '/registro-gastos', icon: Wallet, permission: 'finances:manage' },
                                { label: 'Reglas de Cobro', path: '/reglas-gastos-comunes', icon: Settings, permission: 'finances:manage' },
                                { label: 'Fondos Especiales', path: '/maestro-fondos', icon: Database, permission: 'finances:manage' },
                                { label: 'Activo Fijo', path: '/activo-fijo', icon: Landmark, permission: 'assets:manage' },
                            ]}
                        />
                    )}

                    {/* SECCIÓN AJUSTES DE SISTEMA */}
                    {isAdmin && (
                        <NavItem
                            icon={Settings}
                            label="Ajustes de Sistema"
                            isCollapsed={isCollapsed}
                            children={[
                                { label: 'Configuración Comunidad', path: '/configuracion', icon: Building2 },
                                { label: 'Configuración Email', path: '/maestro-correos', icon: Mail },
                                { label: 'Parámetros Generales', path: '/parametros', icon: Settings },
                                { label: 'Perfiles de Acceso', path: '/perfiles', icon: ShieldCheck },
                            ]}
                        />
                    )}

                    {/* SECCIÓN MAESTROS BASE */}
                    {isAdmin && (
                        <NavItem
                            icon={Database}
                            label="Maestros Base"
                            isCollapsed={isCollapsed}
                            children={[
                                { label: 'Infraestructura', isHeader: true, icon: Building2 },
                                { label: 'Edificios y propiedades', path: '/infraestructura', icon: Building2 },
                                { label: 'Tipos de Unidad', path: '/tipos-unidad', icon: Home },
                                { label: 'Espacios Comunes', path: '/espacios', icon: Landmark },
                                { label: 'Estacionamientos', path: '/estacionamientos', icon: Zap },

                                { label: 'Recursos Humanos', isHeader: true, icon: Briefcase },
                                { label: 'Previsiones', path: '/previsiones', icon: Briefcase },
                                { label: 'AFPs', path: '/afps', icon: ShieldCheck },
                                { label: 'Maestro AFC', path: '/afc', icon: ShieldCheck },
                                { label: 'Maestro Insumos y EPP', path: '/articulos-personal', icon: ShieldCheck },
                                { label: 'Maestro Categorías de Insumos', path: '/maestro-categorias-articulos', icon: Tag },
                                { label: 'Maestro Feriados', path: '/feriados', icon: Calendar },

                                { label: 'Finanzas y Operación', isHeader: true, icon: Landmark },
                                { label: 'Bancos', path: '/bancos', icon: Landmark },
                                { label: 'Maestro IPC', path: '/maestro-ipc', icon: BarChart3 },
                                { label: 'Maestro de Bitácora y Cámaras', path: '/maestros-operativos', icon: History },
                                { label: 'Mensajes Prefijados', path: '/maestro-mensajes', icon: Mail },
                                { label: 'Números Emergencia', path: '/maestro-emergencias', icon: Phone },
                                { label: 'Condiciones Especiales', path: '/condiciones-especiales', icon: Shield },
                            ]}
                        />
                    )}

                    {/* SECCIÓN SUPER ADMIN — v3.3 */}
                    {isAdmin && (
                        <NavItem
                            icon={Cpu}
                            label="Super Admin"
                            isCollapsed={isCollapsed}
                            children={[
                                { label: 'Salud del Sistema (Doctor)', path: '/salud-sistema', icon: Activity, permission: 'mass_upload:execute' },
                                { label: 'Motor de Carga (Data)', path: '/carga-masiva', icon: Package, permission: 'mass_upload:execute' },
                                { label: 'Historial de Cargas', path: '/carga-masiva/historial', icon: History, permission: 'mass_upload:execute' },
                            ]}
                        />
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
                                <p className="text-[9px] text-indigo-500 dark:text-indigo-400 uppercase tracking-widest font-black mt-0.5">{user?.role === 'admin' ? 'Administrador' : user?.role === 'global_admin' ? 'Global Admin' : user?.role === 'concierge' ? 'Conserje' : 'Residente'}</p>
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
                <header className={`h-20 backdrop-blur-xl border-b flex items-center justify-between px-8 sticky top-0 z-20 bg-[var(--header-bg)] border-[var(--border-color)] shadow-sm`}>
                    <div className="flex items-center gap-4">
                        <button
                            className="md:hidden p-2 -ml-2 text-gray-400 hover:text-indigo-600 transition-colors"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="hidden md:flex p-2 text-gray-400 hover:text-indigo-600 transition-colors bg-[var(--app-bg)] rounded-xl border border-[var(--border-color)]"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <span className={`hidden lg:block font-black text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]`}>SGC - Sistema de Gestión de Condominios</span>
                    </div>

                    <div className="flex items-center gap-4">

                        <button
                            onClick={toggleTheme}
                            className="p-3 rounded-2xl text-gray-400 border border-[var(--border-color)] hover:text-indigo-600 hover:bg-[var(--card-bg)] hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                        >
                            {settings.theme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-600" />}
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

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useReservations } from '../context/ReservationContext';
import { useTickets } from '../context/TicketContext';
import { useCommonSpaces } from '../context/CommonSpaceContext';
import {
    Calendar, MessageSquare, Wallet, Bell, Clock,
    CheckCircle, Package, Video, HardHat, Building,
    ChevronRight, MapPin, Home
} from 'lucide-react';
import { useCorrespondence } from '../context/CorrespondenceContext';
import { useCameraRequests } from '../context/CameraRequestContext';
import { useInfrastructure } from '../context/InfrastructureContext';
import { useCommonExpenses } from '../context/CommonExpenseContext';
import { useUnitTypes } from '../context/UnitTypeContext';
import { Link } from 'react-router-dom';
import { AlertCircle, TrendingUp, TrendingDown, FileText } from 'lucide-react';

export const ResidentDashboard: React.FC = () => {
    const { user } = useAuth();
    const { reservations } = useReservations();
    const { tickets } = useTickets();
    const { spaces } = useCommonSpaces();
    const { items: correspondence } = useCorrespondence();
    const { requests: cameraRequests } = useCameraRequests();
    const { towers, departments } = useInfrastructure();
    const { payments, communityExpenses } = useCommonExpenses();
    const { unitTypes } = useUnitTypes();

    const activeUserId = user?.name || '';
    const isOwner = user?.role === 'owner';

    // Gastos comunes mockeados para residente
    const hasDeudamora = false;

    const myReservations = reservations.filter(r => r.userId === activeUserId);
    const myTickets = tickets.filter(t => t.userId === activeUserId);

    const pendingTickets = myTickets.filter(t => t.status !== 'solved').length;
    const approvedReservations = myReservations.filter(r => r.status === 'approved').length;

    const myUnits = isOwner
        ? departments.filter(d => d.ownerId === user?.relatedId)
        : departments.filter(d => d.id === (user as any).relatedId);

    const myCorrespondence = correspondence.filter(i =>
        myUnits.some(u => u.id === i.departmentId) && i.status !== 'delivered'
    );

    const myRequests = cameraRequests.filter(r => r.userId === user?.name);

    const financials = (() => {
        const now = new Date();
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const currentMonthName = months[now.getMonth()];
        const currentYearNum = now.getFullYear();
        const currentMonthNum = now.getMonth() + 1;

        const allDepts = towers.flatMap(t => t.departments).filter(d => !d.isArchived);
        const gcTarget = allDepts.reduce((acc, dept) => {
            const ut = unitTypes.find(u => u.id === dept.unitTypeId);
            return acc + (ut?.baseCommonExpense || 0);
        }, 0);

        const gcCollected = payments
            .filter(p => p.periodMonth === currentMonthNum && p.periodYear === currentYearNum)
            .reduce((acc, p) => acc + p.amountPaid, 0);

        const gcPending = Math.max(0, gcTarget - gcCollected);

        const monthCommunityExpenses = communityExpenses.filter(e => {
            if (e.isArchived) return false;
            const d = new Date(e.date);
            return (d.getMonth() + 1) === currentMonthNum && d.getFullYear() === currentYearNum;
        });

        const totalExpenses = monthCommunityExpenses.reduce((acc, e) => acc + e.amount, 0);

        return {
            gcCollected,
            gcTarget,
            gcPending,
            totalExpenses,
            monthCommunityExpenses,
            currentMonthName,
            currentYearNum
        };
    })();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-indigo-600 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-500/20">
                <div className="absolute -top-[30%] -right-[10%] w-[50%] h-[150%] bg-indigo-500/30 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-[20%] -left-[5%] w-[30%] h-[80%] bg-purple-500/20 rounded-full blur-3xl"></div>

                <div className="relative z-10">
                    <div className="inline-flex items-center px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-white/10">
                        {isOwner ? 'Cuenta de Propietario' : 'Cuenta de Residente'}
                    </div>
                    <h1 className="text-4xl font-black tracking-tight leading-none mb-3">Hola, {user?.name || 'Residente'}</h1>
                    <p className="text-indigo-100 font-bold opacity-80 max-w-md">Bienvenido a tu panel de control {isOwner ? 'de propiedad' : 'habitacional'}. Aquí puedes gestionar todo lo relacionado con tu comunidad.</p>
                </div>

                <div className="relative z-10 flex gap-4">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/10 shadow-xl group hover:bg-white hover:text-indigo-600 transition-all cursor-pointer">
                        <Bell className="w-7 h-7" />
                    </div>
                </div>
            </div>

            {/* Mis Unidades Section (Highlight for Owners) */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <Building className="w-6 h-6 text-indigo-500" />
                        {isOwner ? 'Mis Unidades' : 'Mi Unidad'}
                    </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myUnits.map(unit => (
                        <div key={unit.id} className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-all">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                    <Home className="w-7 h-7" />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-0.5">Unidad {unit.number}</p>
                                    <p className="text-lg font-black text-gray-900 dark:text-white">Depto. {unit.number}</p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <MapPin className="w-3 h-3 text-indigo-500" />
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">Piso {Math.floor(parseInt(unit.number) / 100)} • Edificio A</span>
                                    </div>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                        </div>
                    ))}
                    {myUnits.length === 0 && (
                        <div className="col-span-full p-12 bg-gray-50/50 dark:bg-gray-800/30 rounded-[2.5rem] border border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center text-center">
                            <Home className="w-12 h-12 text-gray-300 mb-4" />
                            <p className="text-sm font-bold text-gray-400 italic">No tienes unidades asociadas registradas.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link to="/reservas" className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-[2rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
                        <Calendar className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 leading-none">Reservas</h3>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mb-6 leading-tight">Zonas Comunes</p>
                    <div className="mt-auto inline-flex items-center justify-center px-4 py-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-400 rounded-xl font-black text-[10px] uppercase tracking-widest">
                        {approvedReservations} Aprobadas
                    </div>
                </Link>

                <Link to="/reclamos" className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-[2rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
                        <MessageSquare className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 leading-none">Comunidad</h3>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mb-6 leading-tight">Casos de Comunidad</p>
                    <div className="mt-auto inline-flex items-center justify-center px-4 py-2 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400 rounded-xl font-black text-[10px] uppercase tracking-widest">
                        {pendingTickets} En Proceso
                    </div>
                </Link>

                <Link to="/gastos-comunes" className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-[2rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
                        <Wallet className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 leading-none">Finanzas</h3>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mb-6 leading-tight">Detalle de Pagos</p>
                    <div className={`mt-auto inline-flex items-center justify-center px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest ${hasDeudamora ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {hasDeudamora ? 'Deuda Vigente' : 'Al Día'}
                    </div>
                </Link>

                <Link to="/correspondencia" className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-[2rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
                        <Package className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 leading-none">Encomiendas</h3>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mb-6 leading-tight">Recepción y Paquetes</p>
                    <div className="mt-auto inline-flex items-center justify-center px-4 py-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-400 rounded-xl font-black text-[10px] uppercase tracking-widest">
                        {myCorrespondence.length} Pendientes
                    </div>
                </Link>

                <Link to="/camaras" className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-[2rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
                        <Video className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 leading-none">Seguridad</h3>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mb-6 leading-tight">Revisión de Cámaras</p>
                    <div className="mt-auto inline-flex items-center justify-center px-4 py-2 bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-400 rounded-xl font-black text-[10px] uppercase tracking-widest">
                        {myRequests.length} Solicitudes
                    </div>
                </Link>

                <Link to="/servicios-residentes" className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col items-center text-center text-indigo-600 dark:text-indigo-400">
                    <div className="w-20 h-20 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-xl shadow-indigo-500/20">
                        <HardHat className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-black mb-2 leading-none">Servicios</h3>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mb-6 leading-tight">Certificados y Técnicos</p>
                    <div className="mt-auto inline-flex items-center justify-center px-6 py-2 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest">
                        Ver Contactos
                    </div>
                </Link>
            </div>

            {/* Community Financial Transparency */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <Wallet className="w-6 h-6 text-indigo-500" />
                        Finanzas de la Comunidad ({financials.currentMonthName})
                    </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
                        <div className="space-y-6">
                            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/20">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-black text-emerald-600 uppercase">Gasto Común Recaudado</span>
                                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                                </div>
                                <p className="text-xl font-black text-emerald-700 dark:text-emerald-400">${financials.gcCollected.toLocaleString()}</p>
                            </div>

                            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/20">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-black text-amber-600 uppercase">Pendiente de Recaudación</span>
                                    <AlertCircle className="w-3 h-3 text-amber-500" />
                                </div>
                                <p className="text-xl font-black text-amber-700 dark:text-amber-400">${financials.gcPending.toLocaleString()}</p>
                            </div>

                            <div className="pt-4 border-t dark:border-gray-800">
                                <div className="flex justify-between items-end mb-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase">Cumplimiento del Mes</p>
                                    <p className="text-xs font-black text-indigo-600">{((financials.gcCollected / (financials.gcTarget || 1)) * 100).toFixed(1)}%</p>
                                </div>
                                <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-600 rounded-full transition-all duration-1000"
                                        style={{ width: `${(financials.gcCollected / (financials.gcTarget || 1)) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 shadow-sm flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-2xl flex items-center justify-center">
                                    <TrendingDown className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 dark:text-white">Egresos Operacionales</h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Inversión en Comunidad</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-black text-rose-600 leading-none">${financials.totalExpenses.toLocaleString()}</p>
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">Total {financials.currentMonthName}</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto max-h-[250px] custom-scrollbar space-y-3 pr-2">
                            {financials.monthCommunityExpenses.length === 0 ? (
                                <div className="text-center py-10 opacity-40">
                                    <FileText className="w-10 h-10 mx-auto mb-3" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest">No hay gastos reportados este mes</p>
                                </div>
                            ) : (
                                financials.monthCommunityExpenses.map(exp => (
                                    <div key={exp.id} className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-black text-gray-900 dark:text-white leading-none">{exp.description}</p>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className="text-[9px] font-black text-gray-400 uppercase bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">{exp.category}</span>
                                                <span className="text-[9px] font-bold text-gray-300">{new Date(exp.date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <p className="text-base font-black text-gray-900 dark:text-white">${exp.amount.toLocaleString()}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-900 p-10 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Calendar className="w-32 h-32" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-3 relative z-10">
                        <Clock className="w-6 h-6 text-indigo-500" />
                        Próximas Reservas
                    </h3>
                    <div className="space-y-4 relative z-10">
                        {myReservations.filter(r => r.status === 'approved').slice(0, 3).length === 0 ? (
                            <div className="p-8 text-center bg-gray-50 dark:bg-gray-800/40 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                                <p className="text-sm font-bold text-gray-400 italic">No tienes reservas aprobadas próximamente.</p>
                            </div>
                        ) : myReservations.filter(r => r.status === 'approved').slice(0, 3).map(res => (
                            <div key={res.id} className="p-5 rounded-[2rem] bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-white dark:hover:bg-gray-800 transition-all shadow-sm hover:shadow-md">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">{spaces.find(s => s.id === res.spaceId)?.name}</p>
                                    <p className="text-base font-black text-gray-900 dark:text-white">{new Date(res.date).toLocaleDateString()}</p>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{res.startTime} a {res.endTime}</p>
                                </div>
                                <span className="inline-flex items-center px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-800/50">
                                    <CheckCircle className="w-3 h-3 mr-2" /> Aprobado
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-10 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <MessageSquare className="w-32 h-32" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-3 relative z-10">
                        <MessageSquare className="w-6 h-6 text-indigo-500" />
                        Historial Comunitario
                    </h3>
                    <div className="space-y-4 relative z-10">
                        {myTickets.slice(0, 3).length === 0 ? (
                            <div className="p-8 text-center bg-gray-50 dark:bg-gray-800/40 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                                <p className="text-sm font-bold text-gray-400 italic">No tienes solicitudes activas.</p>
                            </div>
                        ) : myTickets.slice(0, 3).map(ticket => (
                            <div key={ticket.id} className="p-5 rounded-[2rem] bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50 flex flex-col gap-2 group hover:bg-white dark:hover:bg-gray-800 transition-all shadow-sm hover:shadow-md">
                                <div className="flex justify-between items-start">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Solicitud #{ticket.folio}</p>
                                    <span className="text-[9px] font-black px-2 py-0.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase">{ticket.status}</span>
                                </div>
                                <p className="text-base font-black text-gray-900 dark:text-white leading-tight">{ticket.subject}</p>
                                <p className="text-xs text-gray-500 font-bold line-clamp-2 leading-relaxed opacity-70 italic">"{ticket.description}"</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

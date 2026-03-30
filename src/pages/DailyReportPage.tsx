import React, { useState, useMemo } from 'react';
import { useShiftReport } from '../context/ShiftReportContext';
import { useVisitors } from '../context/VisitorContext';
import { useCorrespondence } from '../context/CorrespondenceContext';
import { useTickets } from '../context/TicketContext';
import { useReservations } from '../context/ReservationContext';
import { useFixedAssets } from '../context/FixedAssetContext';
import { Button } from '../components/Button';
import { Link } from 'react-router-dom';
import {
    BarChart3, Calendar, Download, Printer,
    Users, Package, ClipboardList, AlertTriangle,
    CalendarCheck, Wrench, ChevronRight, FileText,
    CheckCircle2, X, Building2, Smartphone
} from 'lucide-react';

export const DailyReportPage: React.FC = () => {
    const { reports } = useShiftReport();
    const { visitors } = useVisitors();
    const { items: packages } = useCorrespondence();
    const { tickets } = useTickets();
    const { reservations } = useReservations();
    const { assets } = useFixedAssets();

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const data = useMemo(() => {
        const dateStr = selectedDate;

        return {
            date: dateStr,
            shifts: reports.filter(r => r.shiftDate === dateStr),
            visitors: visitors.filter(v => v.visitDate === dateStr),
            packages: packages.filter(p => p.createdAt?.startsWith(dateStr)),
            tickets: tickets.filter(t => t.createdAt?.startsWith(dateStr)),
            reservations: reservations.filter(r => r.date === dateStr),
            maintenance: assets.flatMap(a => a.maintenanceHistory || [])
                .filter(m => m.date === dateStr)
        };
    }, [selectedDate, reports, visitors, packages, tickets, reservations, assets]);

    const stats = [
        { label: 'Visitas', value: data.visitors.length, color: 'indigo', icon: Users, path: '/visitas' },
        { label: 'Paquetes', value: data.packages.length, color: 'amber', icon: Package, path: '/correspondencia' },
        { label: 'Reservas', value: data.reservations.length, color: 'emerald', icon: CalendarCheck, path: '/reservas' },
        { label: 'Tickets', value: data.tickets.length, color: 'rose', icon: AlertTriangle, path: '/reclamos' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-white dark:bg-gray-900 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 pointer-events-none">
                    <FileText className="w-64 h-64" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30">
                        <BarChart3 className="w-10 h-10" />
                    </div>
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl font-black text-gray-900 dark:text-white leading-tight">Consolidado Diario</h1>
                        <p className="text-gray-500 dark:text-gray-400 font-bold mt-1 tracking-widest uppercase text-xs">Administración & Operaciones</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 relative z-10">
                    <div className="relative flex-1 sm:w-64">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-600" />
                        <input
                            type="date"
                            className="w-full pl-12 pr-4 py-4 rounded-3xl bg-gray-50 dark:bg-gray-800 border-none font-black text-sm text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                    <Button variant="secondary" className="px-6 py-4 rounded-3xl backdrop-blur-sm bg-indigo-50/50">
                        <Printer className="w-4 h-4 mr-2" /> Imprimir
                    </Button>
                    <Button className="px-6 py-4 rounded-3xl shadow-xl shadow-indigo-600/20">
                        <Download className="w-4 h-4 mr-2" /> Exportar PDF
                    </Button>
                </div>
            </div>

            {/* Stats section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <Link
                        key={i}
                        to={stat.path}
                        className={`bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:translate-y-[-4px] transition-all flex flex-col items-center justify-center text-center group`}
                    >
                        <div className={`p-4 rounded-2xl mb-4 bg-${stat.color}-50 text-${stat.color}-600 group-hover:bg-${stat.color}-600 group-hover:text-white transition-colors`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-1">{stat.label}</p>
                        <h3 className="text-3xl font-black text-gray-900 dark:text-white">{stat.value}</h3>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
                {/* Left Column: Operations and Shifts */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Shift Reports */}
                    <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between bg-indigo-50/30 dark:bg-indigo-900/5">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                                <ClipboardList className="w-6 h-6 text-indigo-600" />
                                Bitácora de Turnos del Día
                            </h3>
                            <span className="px-4 py-1.5 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest">{data.shifts.length} Registros</span>
                        </div>
                        <div className="p-8 pb-0">
                            {/* Consolidado de Jornadas en el reporte */}
                            <div className="grid grid-cols-3 gap-3 mb-8">
                                {(['Mañana', 'Tarde', 'Noche'] as const).map(type => {
                                    const reported = data.shifts.find(s => s.shiftType === type && s.status === 'closed');
                                    return (
                                        <div key={type} className={`p-4 rounded-2xl border flex items-center justify-between ${reported ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10' : 'bg-rose-50 border-rose-100 dark:bg-rose-900/10'}`}>
                                            <div>
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{type}</p>
                                                <p className={`text-[10px] font-black ${reported ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                    {reported ? '✓ REPORTADO' : '⚠ NO INFORMADO'}
                                                </p>
                                            </div>
                                            {reported ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-rose-500" />}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="p-8 pt-4 space-y-6">
                            {data.shifts.length > 0 ? data.shifts.map(shift => (
                                <div key={shift.id} className="p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                                                <Users className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-gray-900 dark:text-white leading-tight">{shift.workerName}</h4>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                    <span className="text-indigo-600 font-black">Turno {shift.shiftType}</span>
                                                    <span>•</span>
                                                    <span>{shift.status === 'open' ? 'En curso' : 'Cerrado'}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-xs font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-xl"># {shift.folio}</p>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl text-sm italic font-bold text-gray-700 dark:text-gray-300">
                                            "{shift.noveldades || 'Sin novedades reportadas'}"
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {shift.hasIncidents && (
                                                <div className="p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-2xl text-sm italic font-black text-rose-600">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <AlertTriangle className="w-4 h-4" />
                                                        <span className="text-[10px] uppercase tracking-widest text-rose-500">Incidencia Crítica</span>
                                                    </div>
                                                    {shift.incidentDetails}
                                                </div>
                                            )}
                                            {shift.hasInfrastructureIssues && (
                                                <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl text-sm italic font-black text-amber-600">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Building2 className="w-4 h-4" />
                                                        <span className="text-[10px] uppercase tracking-widest text-amber-500">Instalaciones</span>
                                                    </div>
                                                    <p className="text-[10px] font-black uppercase mb-1">{shift.infrastructureIssueTypes?.join(', ') || shift.infrastructureIssueType}</p>
                                                    {shift.infrastructureIssueDetails}
                                                </div>
                                            )}
                                            {shift.hasEquipmentIssues && (
                                                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl text-sm italic font-black text-indigo-600">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Smartphone className="w-4 h-4" />
                                                        <span className="text-[10px] uppercase tracking-widest text-indigo-500">Equipamiento</span>
                                                    </div>
                                                    <p className="text-[10px] font-black uppercase mb-1">{shift.equipmentIssueTypes?.join(', ') || shift.equipmentIssueType}</p>
                                                    {shift.equipmentIssueDetails}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-12 flex flex-col items-center">
                                    <ClipboardList className="w-16 h-16 text-gray-100 mb-4" />
                                    <p className="text-sm font-bold text-gray-400 italic">No hay cierres de jornada cargados hoy.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Maintenance / Fix Asset records */}
                    <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                                <Wrench className="w-6 h-6 text-amber-600" />
                                Mantenciones Realizadas
                            </h3>
                        </div>
                        <div className="p-8 space-y-4">
                            {data.maintenance.length > 0 ? data.maintenance.map((m, i) => (
                                <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-amber-50/50 dark:bg-amber-900/10 rounded-[2rem] border border-amber-100/50 dark:border-amber-900/20 gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-amber-600 text-white rounded-xl flex items-center justify-center">
                                            <Wrench className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white leading-tight">{m.description}</h4>
                                            <p className="text-xs text-gray-500 font-medium italic">{m.technicianName} • Folio {m.folio}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {m.cost && <p className="text-lg font-black text-amber-700 dark:text-amber-400">${m.cost.toLocaleString('es-CL')}</p>}
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm font-bold text-gray-400 italic text-center py-6">Hoy no se registraron mantenciones.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Log Activity and Schedules */}
                <div className="space-y-8">
                    {/* Visitors Summary */}
                    <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between bg-emerald-50/30 dark:bg-emerald-900/5">
                            <h4 className="font-black text-gray-900 dark:text-white flex items-center gap-2">
                                <Users className="w-5 h-5 text-emerald-600" />
                                Visitas del Día
                            </h4>
                            <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">{data.visitors.length}</span>
                        </div>
                        <div className="p-4 space-y-2">
                            {data.visitors.length > 0 ? data.visitors.map(v => (
                                <Link
                                    key={v.id}
                                    to={`/visitas?id=${v.id}`}
                                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-between group hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                                >
                                    <div>
                                        <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-1">U: {v.towerId} - {v.departmentId}</p>
                                        <p className="text-sm font-black text-gray-900 dark:text-white leading-tight">{v.names}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{v.status === 'entered' ? 'En Recinto' : v.status === 'exited' ? 'Salió' : 'Esperada'}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                                </Link>
                            )) : (
                                <p className="text-xs font-bold text-gray-400 italic text-center py-4">Sin registro de visitas.</p>
                            )}
                        </div>
                    </div>

                    {/* Packages Summary */}
                    <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between bg-amber-50/30 dark:bg-amber-900/5">
                            <h4 className="font-black text-gray-900 dark:text-white flex items-center gap-2">
                                <Package className="w-5 h-5 text-amber-600" />
                                Paquetería
                            </h4>
                            <span className="text-[10px] font-black uppercase text-amber-600 tracking-widest">{data.packages.length}</span>
                        </div>
                        <div className="p-4 space-y-2">
                            {data.packages.length > 0 ? data.packages.map(p => (
                                <Link
                                    key={p.id}
                                    to={`/correspondencia?id=${p.id}`}
                                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-between group hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                                >
                                    <div>
                                        <p className="text-xs font-black text-amber-600 uppercase tracking-widest mb-1">U: {p.departmentId}</p>
                                        <p className="text-sm font-black text-gray-900 dark:text-white leading-tight">{p.addressee}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{p.courier || 'Courier no espec.'}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-amber-500 transition-colors" />
                                </Link>
                            )) : (
                                <p className="text-xs font-bold text-gray-400 italic text-center py-4">Sin entregas hoy.</p>
                            )}
                        </div>
                    </div>

                    {/* Claims / Suggestions */}
                    <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between bg-rose-50/30 dark:bg-rose-900/5">
                            <h4 className="font-black text-gray-900 dark:text-white flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-rose-600" />
                                Reclamos / Solicitudes
                            </h4>
                            <span className="text-[10px] font-black uppercase text-rose-600 tracking-widest">{data.tickets.length}</span>
                        </div>
                        <div className="p-4 space-y-2">
                            {data.tickets.length > 0 ? data.tickets.map(t => (
                                <Link
                                    key={t.id}
                                    to={`/reclamos?id=${t.id}`}
                                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-between group hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                                >
                                    <div>
                                        <div className="mb-1">
                                            <p className="text-xs font-black text-rose-600 uppercase tracking-widest">U: {t.unitId}</p>
                                            <span className={`inline-block mt-1 text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${t.type === 'complaint' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {t.type === 'complaint' ? 'Reclamo' : 'Sugerencia'}
                                            </span>
                                        </div>
                                        <p className="text-sm font-black text-gray-900 dark:text-white leading-tight">{t.subject}</p>
                                        <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${t.status === 'pending' ? 'text-rose-500' : 'text-emerald-500'}`}>{t.status}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-rose-500 transition-colors" />
                                </Link>
                            )) : (
                                <p className="text-xs font-bold text-gray-400 italic text-center py-4">Día tranquilo sin reclamos.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

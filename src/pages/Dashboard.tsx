import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserList } from '../components/UserList';
import { UserForm } from '../components/UserForm';
import { Button } from '../components/Button';
import { useUsers } from '../context/UserContext';
import { useInfrastructure } from '../context/InfrastructureContext';
import { useReservations } from '../context/ReservationContext';
import { useArticleDeliveries } from '../context/ArticleDeliveryContext';
import { useCommonExpenses } from '../context/CommonExpenseContext';
import { useUnitTypes } from '../context/UnitTypeContext';
import { useAuth } from '../context/AuthContext';
import { ResidentDashboard } from './ResidentDashboard';
import { PersonnelDashboard } from './PersonnelDashboard';
import { useCorrespondence } from '../context/CorrespondenceContext';
import { useVisitors } from '../context/VisitorContext';
import { useShiftReport } from '../context/ShiftReportContext';
import { useContractorVisits } from '../context/ContractorVisitContext';
import { useContractors } from '../context/ContractorContext';
import type { User } from '../types';
import {
    Plus, Search, Users as UsersIcon, ShieldCheck, UserCheck,
    Calendar, FileWarning, Wallet,
    CheckCircle, XCircle, Landmark,
    Package, HardHat, PieChart, Activity, X, FileText, AlertCircle, TrendingDown, TrendingUp
} from 'lucide-react';
import { Input } from '../components/Input';

export const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { users, addUser, updateUser, deleteUser } = useUsers();
    const { towers } = useInfrastructure();
    const { reservations } = useReservations();
    const { deliveries } = useArticleDeliveries();
    const { payments, communityExpenses, addCommunityExpense, deleteCommunityExpense, funds } = useCommonExpenses();
    const { unitTypes } = useUnitTypes();
    const { items: correspondence } = useCorrespondence();
    const { visitors } = useVisitors();
    const { reports: shiftReports } = useShiftReport();
    const { visits: contractorVisits } = useContractorVisits();
    const { contractors } = useContractors();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [expenseDescription, setExpenseDescription] = useState('');
    const [expenseAmount, setExpenseAmount] = useState('');
    const [expenseCategory, setExpenseCategory] = useState<any>('Otros');
    const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

    const handleAddUser = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleDeleteUser = (id: string, name: string) => {
        if (window.confirm(`¿Está seguro de eliminar a ${name}?`)) {
            deleteUser(id);
        }
    };

    const handleSubmit = (userData: Omit<User, 'id' | 'createdAt'>, id?: string) => {
        if (id) {
            updateUser(id, userData);
        } else {
            addUser(userData);
        }
    };

    const filteredUsers = users.filter(user =>
        !user.isArchived && user.status !== 'pending_approval' && user.status !== 'setting_up' &&
        (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const pendingUsers = users.filter(user => user.status === 'pending_approval');

    const handleApproveUser = (userToApprove: User) => {
        if (window.confirm(`¿Aprobar solicitud de acceso de ${userToApprove.name}?`)) {
            updateUser(userToApprove.id, {
                ...userToApprove,
                status: 'active'
            });
        }
    };

    const handleRejectUser = (userToReject: User) => {
        if (window.confirm(`¿Rechazar solicitud de acceso de ${userToReject.name}? Esta acción eliminará el registro.`)) {
            deleteUser(userToReject.id);
        }
    };

    if (user?.role === 'resident' || user?.role === 'owner') {
        return <ResidentDashboard />;
    }

    if (user?.role === 'worker') {
        return <PersonnelDashboard />;
    }

    if (user?.status === 'pending_approval') {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-amber-50 dark:bg-amber-900/10 rounded-[3rem] border border-amber-200 dark:border-amber-900/30 text-center animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-amber-100 dark:bg-amber-900/40 text-amber-500 rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-amber-500/10">
                    <ShieldCheck className="w-12 h-12" />
                </div>
                <h1 className="text-3xl font-black text-amber-900 dark:text-amber-100 mb-4">Aprobación Pendiente</h1>
                <p className="text-amber-800 dark:text-amber-200/80 font-bold max-w-lg mb-8">
                    Tu solicitud de acceso ha sido enviada al administrador del condominio. Una vez que validen tus datos, tendrás acceso completo a tus funcionales. Vuelve a revisar más tarde.
                </p>
                <button onClick={() => window.location.reload()} className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black uppercase tracking-widest text-sm transition-colors shadow-lg shadow-amber-500/30">
                    Refrescar Estado
                </button>
            </div>
        );
    }

    const stats = [
        { label: 'Reservas Pendientes', value: reservations.filter(r => r.status === 'pending').length, icon: Calendar, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20', url: '/reservas' },
        { label: 'Entregas s/Respaldo', value: deliveries.filter(d => !d.signedDocument).length, icon: FileWarning, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', url: '/entregas-articulos' }
    ];

    const today = new Date().toISOString().split('T')[0];
    const todayReservations = reservations.filter(r => r.status === 'approved' && r.date === today).length;
    const todayContractors = contractorVisits.filter(c => c.createdAt && c.createdAt.startsWith(today) && c.status !== 'exited').length;
    const currentMonth = new Date().getMonth(); // 0-indexed
    const currentYear = new Date().getFullYear();

    const todayVisitors = visitors.filter(v => v.visitDate === today).length;
    const todayDeliveries = correspondence.filter(i => i.status === 'received' && i.receivedAt?.startsWith(today)).length;

    const monthVisitors = visitors.filter(v => v.visitDate.startsWith(`${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}`)).length;
    const monthDeliveries = correspondence.filter(i => i.receivedAt?.startsWith(`${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}`)).length;

    const monthShifts = shiftReports.filter(sr => sr.shiftDate.startsWith(`${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}`));
    const closedMonthShifts = monthShifts.filter(sr => sr.status === 'closed').length;
    // Expected shifts: 3 per day until today
    const daysPassed = new Date().getDate();
    const expectedShifts = daysPassed * 3;
    const shiftCompliance = expectedShifts > 0 ? (closedMonthShifts / expectedShifts) * 100 : 0;

    const complianceByShift = ['Mañana', 'Tarde', 'Noche'].map(type => {
        const totalClosed = monthShifts.filter(sr => sr.shiftType === type && sr.status === 'closed').length;
        const expected = daysPassed;
        return { type, percentage: expected > 0 ? (totalClosed / expected) * 100 : 0, closed: totalClosed };
    });

    // Maintenance logic
    const scheduledMaintenances = contractors.filter(c => {
        if (!c.isActive || c.maintenanceFrequency === 'none') return false;
        if (c.maintenanceFrequency === 'monthly') return true;

        if (!c.lastMaintenanceDate) return true; // Nunca se ha hecho

        const last = new Date(c.lastMaintenanceDate);
        const lastMonth = last.getMonth();
        const lastYear = last.getFullYear();
        const monthsDiff = (currentYear - lastYear) * 12 + (currentMonth - lastMonth);

        if (c.maintenanceFrequency === 'half-yearly') return monthsDiff >= 6;
        if (c.maintenanceFrequency === 'annual') return monthsDiff >= 12;

        return false;
    });

    const financials = (() => {
        const now = new Date();
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const currentMonthName = months[now.getMonth()];
        const currentYearNum = now.getFullYear();

        const allDepts = towers.flatMap(t => t.departments).filter(d => !d.isArchived);
        const gcTarget = allDepts.reduce((acc, dept) => {
            const ut = unitTypes.find(u => u.id === dept.unitTypeId);
            return acc + (ut?.baseCommonExpense || 0);
        }, 0);

        const currentMonthNum = now.getMonth() + 1;
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

    const handleExpenseSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await addCommunityExpense({
            description: expenseDescription,
            amount: Number(expenseAmount),
            category: expenseCategory,
            date: expenseDate,
        });
        setIsExpenseModalOpen(false);
        setExpenseDescription('');
        setExpenseAmount('');
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Consolidado Mensual */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                <div className="xl:col-span-3 bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 p-8 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                        <PieChart className="w-64 h-64" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Consolidado Mensual</h2>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Acumulado {financials.currentMonthName} {currentYear}</p>
                            </div>
                            <div className="flex gap-4">
                                <Activity className="w-6 h-6 text-indigo-500 animate-pulse" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase text-gray-400">Cumplimiento Turnos</span>
                                    <span className={`text-[10px] font-black ${shiftCompliance >= 90 ? 'text-emerald-500' : 'text-amber-500'}`}>{shiftCompliance.toFixed(1)}%</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-1000 ${shiftCompliance >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                        style={{ width: `${shiftCompliance}%` }}
                                    />
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-800 grid grid-cols-3 gap-2">
                                    {complianceByShift.map(s => (
                                        <div key={s.type} className="text-center">
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">{s.type}</p>
                                            <p className={`text-[10px] font-black ${s.percentage >= 90 ? 'text-emerald-500' : 'text-amber-500'}`}>{s.percentage.toFixed(0)}%</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-6 border-x border-gray-100 dark:border-gray-800 px-8">
                                <div>
                                    <p className="text-3xl font-black text-gray-900 dark:text-white">{monthVisitors}</p>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Visitas Mes</p>
                                </div>
                                <div className="border-l border-gray-100 dark:border-gray-800 pl-6">
                                    <p className="text-3xl font-black text-gray-900 dark:text-white">{monthDeliveries}</p>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Encomiendas</p>
                                </div>
                            </div>

                            <div className="pl-8">
                                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/20">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-black text-indigo-600 uppercase">Fondos Especiales</span>
                                        <Landmark className="w-3 h-3 text-indigo-500" />
                                    </div>
                                    <p className="text-xl font-black text-indigo-700 dark:text-indigo-400">
                                        ${(funds?.reduce((acc: number, f: any) => acc + (f.totalAmountPerUnit || 0), 0) || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase text-gray-400">Mantenciones Programadas ({scheduledMaintenances.length})</p>
                                <div className="flex flex-wrap gap-2">
                                    {scheduledMaintenances.slice(0, 4).map((c: any) => (
                                        <div key={c.id} title={`${c.name} - ${c.specialty}`} className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100 dark:border-indigo-800 group hover:bg-indigo-600 hover:text-white transition-all cursor-help relative">
                                            <HardHat className="w-5 h-5" />
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[8px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                                                {c.specialty}
                                            </div>
                                        </div>
                                    ))}
                                    {scheduledMaintenances.length > 4 && (
                                        <div className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center text-xs font-black text-gray-400">
                                            +{scheduledMaintenances.length - 4}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-[3rem] p-8 text-white shadow-xl flex flex-col justify-between">
                    <div>
                        <h3 className="text-xl font-black mb-1">Resumen Diario</h3>
                        <p className="text-[10px] font-black uppercase text-indigo-200 tracking-widest">{new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="space-y-4 my-8">
                        <div className="flex justify-between items-center bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                            <UsersIcon className="w-5 h-5 text-indigo-200" />
                            <span className="text-2xl font-black">{todayVisitors}</span>
                            <span className="text-[10px] font-black uppercase opacity-60">Visitas</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                            <Package className="w-5 h-5 text-indigo-200" />
                            <span className="text-2xl font-black">{todayDeliveries}</span>
                            <span className="text-[10px] font-black uppercase opacity-60">Encomiendas</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                            <HardHat className="w-5 h-5 text-indigo-200" />
                            <span className="text-2xl font-black">{todayContractors}</span>
                            <span className="text-[10px] font-black uppercase opacity-60">Contratistas</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                            <Calendar className="w-5 h-5 text-indigo-200" />
                            <span className="text-2xl font-black">{todayReservations}</span>
                            <span className="text-[10px] font-black uppercase opacity-60">Reservas</span>
                        </div>
                    </div>
                    <Button onClick={() => navigate('/reporte-diario')} className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-black py-4 rounded-2xl text-xs uppercase tracking-widest border-none">
                        Reporte Completo
                    </Button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
                {stats.map((stat, idx) => (
                    <div
                        key={idx}
                        onClick={() => stat.url ? navigate(stat.url) : null}
                        className={`bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all ${stat.url ? 'hover:translate-y-[-4px] hover:border-indigo-200 cursor-pointer' : ''}`}
                    >
                        <div className={`p-3 rounded-2xl w-fit mb-4 ${stat.bg} ${stat.color}`}>
                            <stat.icon className="w-5 h-5" />
                        </div>
                        <p className="text-2xl font-black text-gray-900 dark:text-white leading-none">{stat.value}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1.5">{stat.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Financial Summary */}
                <div className="lg:col-span-1 bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center">
                            <Wallet className="w-7 h-7" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white">Gastos Comunes</h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{financials.currentMonthName} {financials.currentYearNum}</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/20">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-black text-emerald-600 uppercase">Recaudado</span>
                                <TrendingUp className="w-3 h-3 text-emerald-500" />
                            </div>
                            <p className="text-xl font-black text-emerald-700 dark:text-emerald-400">${financials.gcCollected.toLocaleString()}</p>
                        </div>

                        <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/20">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-black text-amber-600 uppercase">Pendiente</span>
                                <AlertCircle className="w-3 h-3 text-amber-500" />
                            </div>
                            <p className="text-xl font-black text-amber-700 dark:text-amber-400">${financials.gcPending.toLocaleString()}</p>
                        </div>

                        <div className="pt-4 border-t dark:border-gray-800">
                            <div className="flex justify-between items-end mb-2">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Progreso Recaudación</p>
                                <p className="text-xs font-black text-indigo-600 tracking-tighter">{((financials.gcCollected / (financials.gcTarget || 1)) * 100).toFixed(1)}%</p>
                            </div>
                            <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-indigo-600 rounded-full transition-all duration-1000"
                                    style={{ width: `${(financials.gcCollected / (financials.gcTarget || 1)) * 100}%` }}
                                />
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 mt-2 text-right uppercase italic">Meta: ${financials.gcTarget.toLocaleString()}</p>
                        </div>

                        <Button onClick={() => navigate('/gastos-comunes')} className="w-full py-4 text-xs tracking-widest uppercase font-black bg-gray-900 hover:bg-black text-white rounded-2xl">
                            Detalle de Pagos
                        </Button>
                    </div>
                </div>

                {/* Community Expenses Column */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 shadow-sm h-full flex flex-col">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-2xl flex items-center justify-center">
                                    <TrendingDown className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 dark:text-white">Egresos Comunidad</h3>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Reportería {financials.currentMonthName}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right mr-2">
                                    <p className="text-2xl font-black text-rose-600 leading-none">${financials.totalExpenses.toLocaleString()}</p>
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">Total Mensual</p>
                                </div>
                                <Button size="sm" onClick={() => setIsExpenseModalOpen(true)} className="rounded-2xl h-12 px-6">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Registrar Gasto
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto max-h-[400px] custom-scrollbar space-y-3 pr-2">
                            {financials.monthCommunityExpenses.length === 0 ? (
                                <div className="text-center py-20 opacity-40">
                                    <FileText className="w-12 h-12 mx-auto mb-4" />
                                    <p className="text-xs font-bold uppercase tracking-widest">No hay gastos registrados este mes</p>
                                </div>
                            ) : (
                                financials.monthCommunityExpenses.map(exp => (
                                    <div key={exp.id} className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center shadow-sm text-gray-400 group-hover:text-rose-500 transition-colors">
                                                <TrendingDown className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-gray-900 dark:text-white leading-none">{exp.description}</p>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">{exp.category}</span>
                                                    <span className="text-[10px] font-bold text-gray-300">{new Date(exp.date).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <p className="text-lg font-black text-gray-900 dark:text-white">${exp.amount.toLocaleString()}</p>
                                            <button
                                                onClick={() => deleteCommunityExpense(exp.id)}
                                                className="p-2 text-gray-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Operations column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                            <ShieldCheck className="w-6 h-6 text-indigo-600" />
                            Accesos Pendientes ({pendingUsers.length})
                        </h3>
                    </div>

                    {pendingUsers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {pendingUsers.map(u => (
                                <div key={u.id} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 flex items-center justify-between group hover:border-indigo-200 transition-all shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                            <UserCheck className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-gray-900 dark:text-white leading-none">{u.name}</h4>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{u.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleApproveUser(u)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors">
                                            <CheckCircle className="w-6 h-6" />
                                        </button>
                                        <button onClick={() => handleRejectUser(u)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
                                            <XCircle className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 bg-gray-50 dark:bg-gray-800/20 rounded-[2.5rem] border border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center text-center opacity-60">
                            <UserCheck className="w-12 h-12 text-gray-300 mb-4" />
                            <p className="text-sm font-bold text-gray-400 italic">No hay solicitudes pendientes de aprobación.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Administradores User List */}
            {user?.role === 'global_admin' && (
                <div className="space-y-6 pt-8">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                            <UsersIcon className="w-7 h-7 text-indigo-600" />
                            Maestro de Usuarios
                        </h2>
                        <div className="flex gap-4">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    className="pl-12 pr-4 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-sm font-bold shadow-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button onClick={handleAddUser} size="sm"><Plus className="w-4 h-4 mr-2" /> Nuevo</Button>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
                        <UserList users={filteredUsers} onEdit={handleEditUser} onDelete={handleDeleteUser} />
                    </div>
                </div>
            )}

            <UserForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmit} initialData={editingUser} />
            {isExpenseModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-[3rem] w-full max-w-md shadow-2xl border border-white/20 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b dark:border-gray-800 flex items-center justify-between">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-4">
                                <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center text-white">
                                    <TrendingDown className="w-6 h-6" />
                                </div>
                                Registrar Gasto
                            </h2>
                            <button onClick={() => setIsExpenseModalOpen(false)} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl text-gray-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleExpenseSubmit} className="p-8 space-y-6">
                            <Input
                                label="Descripción del Gasto"
                                value={expenseDescription}
                                onChange={e => setExpenseDescription(e.target.value)}
                                required
                                placeholder="Ej: Pago CGE Marzo, Mantención Ascensores"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Monto ($)"
                                    type="number"
                                    value={expenseAmount}
                                    onChange={e => setExpenseAmount(e.target.value)}
                                    required
                                />
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Categoría</label>
                                    <select
                                        value={expenseCategory}
                                        onChange={e => setExpenseCategory(e.target.value)}
                                        className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                    >
                                        <option value="Servicios Básicos">Servicios Básicos</option>
                                        <option value="Sueldos">Sueldos</option>
                                        <option value="Mantención">Mantención</option>
                                        <option value="Seguros">Seguros</option>
                                        <option value="Reparaciones">Reparaciones</option>
                                        <option value="Administración">Administración</option>
                                        <option value="Otros">Otros</option>
                                    </select>
                                </div>
                            </div>
                            <Input
                                label="Fecha"
                                type="date"
                                value={expenseDate}
                                onChange={e => setExpenseDate(e.target.value)}
                                required
                            />
                            <div className="flex justify-end gap-3 pt-6 border-t dark:border-gray-800">
                                <Button type="button" variant="secondary" onClick={() => setIsExpenseModalOpen(false)} className="rounded-2xl h-12 uppercase font-black text-[10px] tracking-widest px-8">Cancelar</Button>
                                <Button type="submit" className="rounded-2xl h-12 uppercase font-black text-[10px] tracking-widest px-8 shadow-xl shadow-indigo-500/20">Guardar Gasto</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

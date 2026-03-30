import React from 'react';
import { useAuth } from '../context/AuthContext';
import { usePersonnel } from '../context/PersonnelContext';
import { usePayslips } from '../context/PayslipContext';
import { useShiftReport } from '../context/ShiftReportContext';
import {
    Clock, Banknote, Calendar, FileText, TrendingUp, CheckCircle2, History
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ShiftReport } from '../types';

export const PersonnelDashboard: React.FC = () => {
    const { user } = useAuth();
    const { personnel } = usePersonnel();
    const { payslips } = usePayslips();
    const { reports } = useShiftReport();

    const currentPerson = personnel.find(p => p.id === user?.relatedId);

    const myPayslips = payslips.filter(p => p.personnelId === currentPerson?.id);
    const myReports = (reports as ShiftReport[]).filter(r => r.workerId === currentPerson?.id);
    const completedShifts = myReports.filter(r => r.status === 'closed').length;

    const latestPayslip = myPayslips.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())[0];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-emerald-600 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-emerald-500/20">
                <div className="absolute -top-[30%] -right-[10%] w-[50%] h-[150%] bg-emerald-500/30 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-[20%] -left-[5%] w-[30%] h-[80%] bg-emerald-400/20 rounded-full blur-3xl"></div>

                <div className="relative z-10">
                    <div className="inline-flex items-center px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-white/10">
                        Cuenta de Personal / Trabajador
                    </div>
                    <h1 className="text-4xl font-black tracking-tight leading-none mb-3">Hola, {user?.name}</h1>
                    <p className="text-emerald-100 font-bold max-w-lg opacity-90 text-sm">
                        Bienvenido a tu panel personal. Aquí podrás consultar tus liquidaciones, revisar tus días de vacaciones y acceder a tu bitácora de turnos.
                    </p>
                </div>

                <div className="relative z-10 bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/20 shadow-inner flex flex-col items-center justify-center min-w-[200px]">
                    <Clock className="w-10 h-10 text-emerald-200 mb-2" />
                    <p className="text-xs font-black uppercase tracking-widest text-emerald-100 mb-1 opacity-80">Turno Asignado</p>
                    <p className="text-2xl font-black">{currentPerson?.assignedShift || 'No asignado'}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center text-center group transition-colors">
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Días de Vacaciones</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white">
                        {currentPerson?.vacationDays?.toFixed(2) || '0'}
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center text-center group transition-colors">
                    <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Banknote className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Sueldo Base Mensual</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">
                        ${currentPerson?.baseSalary?.toLocaleString() || '0'}
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center text-center group transition-colors">
                    <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Última Liquidación</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">
                        {latestPayslip ? `$${latestPayslip.netSalary.toLocaleString()}` : 'N/A'}
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center text-center group transition-colors">
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Turnos Realizados</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white">
                        {completedShifts}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-indigo-500" />
                            Mis Liquidaciones
                        </h3>
                        <Link to="/liquidaciones" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Ver todas</Link>
                    </div>

                    <div className="space-y-3">
                        {myPayslips.length === 0 ? (
                            <div className="p-8 text-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                                <p className="text-sm font-bold text-gray-400">No hay liquidaciones generadas aún.</p>
                            </div>
                        ) : (
                            myPayslips.slice(0, 3).map(p => (
                                <div key={p.id} className="p-4 bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-2xl flex items-center justify-between">
                                    <div>
                                        <p className="font-black text-indigo-900 dark:text-indigo-100 text-sm">Liquidación Folio #{p.folio}</p>
                                        <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70 font-bold mt-1">
                                            Emitida: {new Date(p.generatedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-indigo-600 dark:text-indigo-400 text-lg">${p.netSalary.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                            <History className="w-5 h-5 text-indigo-500" />
                            Mi Historial de Turnos
                        </h3>
                        <Link to="/bitacora-turnos" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Ver bitácora</Link>
                    </div>

                    <div className="space-y-3">
                        {myReports.length === 0 ? (
                            <div className="p-8 text-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                                <p className="text-sm font-bold text-gray-400">Aún no has registrado turnos en el sistema.</p>
                            </div>
                        ) : (
                            myReports.slice(0, 4).map(r => (
                                <div key={r.id} className="p-4 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${r.status === 'closed' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600'}`}>
                                            <Clock className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="font-black text-gray-900 dark:text-white text-sm">Turno {r.shiftType}</p>
                                            <p className="text-xs text-gray-500 font-bold">
                                                {new Date(r.shiftDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${r.status === 'closed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'}`}>
                                        {r.status === 'closed' ? 'Cerrado' : 'Abierto'}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

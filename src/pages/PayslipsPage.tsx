import React, { useState, useMemo } from 'react';
import { usePersonnel } from '../context/PersonnelContext';
import { useHealthProviders } from '../context/HealthProviderContext';
import { usePensionFunds } from '../context/PensionFundContext';
import { usePayslips } from '../context/PayslipContext';
import { useSettings } from '../context/SettingsContext';
import { useCommonExpenses } from '../context/CommonExpenseContext';
import { Button } from '../components/Button';
import {
    Banknote,
    History,
    Search,
    User,
    Calculator,
    Trash2,
    Eye,
    FileText,
    Printer,
    X,
    CheckCircle2,
    DollarSign
} from 'lucide-react';
import { PayslipDocument } from '../components/PayslipDocument';
import { AdvanceReceipt } from '../components/AdvanceReceipt';
import type { Payslip, Advance } from '../types';

export const PayslipsPage: React.FC = () => {
    const { personnel } = usePersonnel();
    const { providers } = useHealthProviders();
    const { funds } = usePensionFunds();
    const { payslips, advances, addPayslip, deletePayslip, addAdvance, deleteAdvance, updateAdvanceStatus } = usePayslips();
    const { settings } = useSettings();
    const { addCommunityExpense } = useCommonExpenses();

    const [view, setView] = useState<'generate' | 'advances' | 'history'>('generate');
    const [selectedPersonId, setSelectedPersonId] = useState<string>('');
    const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
    const [year, setYear] = useState<number>(new Date().getFullYear());

    // Advance State
    const [advanceData, setAdvanceData] = useState({
        personId: '',
        amount: 0,
        description: 'Adelanto de sueldo'
    });

    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [viewingPayslip, setViewingPayslip] = useState<Payslip | null>(null);
    const [viewingAdvance, setViewingAdvance] = useState<Advance | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [historyType, setHistoryType] = useState<'payslips' | 'advances'>('payslips');

    const selectedPerson = useMemo(() =>
        personnel.find(p => p.id === selectedPersonId),
        [personnel, selectedPersonId]);

    const pendingAdvances = useMemo(() => {
        if (!selectedPersonId) return 0;
        return advances
            .filter(a => a.personnelId === selectedPersonId && a.status === 'pending')
            .reduce((sum, a) => sum + a.amount, 0);
    }, [advances, selectedPersonId]);

    // Calculation logic
    const calculateDeductions = () => {
        if (!selectedPerson) return { health: 0, pension: 0, total: 0 };

        const healthProvider = providers.find(p => p.id === selectedPerson.healthInsuranceId);
        const pensionFund = funds.find(f => f.id === selectedPerson.pensionFundId);

        const healthRate = healthProvider?.discountRate || 7; // Default Fonasa 7%
        const pensionRate = pensionFund?.discountRate || 10; // Default 10%

        const healthDiscount = Math.round(selectedPerson.baseSalary * (healthRate / 100));
        const pensionDiscount = Math.round(selectedPerson.baseSalary * (pensionRate / 100));

        return {
            health: healthDiscount,
            pension: pensionDiscount,
            total: healthDiscount + pensionDiscount
        };
    };

    const handleGenerate = async () => {
        if (!selectedPerson) return;

        const deductions = calculateDeductions();
        const totalAdvances = pendingAdvances;
        const totalDeductions = deductions.total + totalAdvances;
        const netSalary = selectedPerson.baseSalary - totalDeductions;

        const newPayslip = await addPayslip({
            personnelId: selectedPerson.id,
            month,
            year,
            baseSalary: selectedPerson.baseSalary,
            grossSalary: selectedPerson.baseSalary, // Simple model for now
            healthDiscount: deductions.health,
            pensionDiscount: deductions.pension,
            apvDiscount: 0,
            insuranceDiscount: 0,
            advancesDiscount: totalAdvances,
            totalDeductions,
            netSalary,
        });

        // Registrar Egreso de Sueldo en Gastos Comunes
        await addCommunityExpense({
            description: `Sueldo Líquido ${selectedPerson.names} ${selectedPerson.lastNames} (${monthNames[month - 1]} ${year})`,
            category: 'Sueldos',
            amount: netSalary,
            date: new Date().toISOString().split('T')[0]
        });

        // Mark advances as deducted
        advances
            .filter(a => a.personnelId === selectedPersonId && a.status === 'pending')
            .forEach(a => updateAdvanceStatus(a.id, 'deducted', newPayslip.id));

        setViewingPayslip(newPayslip);
        setIsPreviewOpen(true);
    };

    const handleAddAdvance = async () => {
        if (!advanceData.personId || advanceData.amount <= 0) return;
        const newAdvance = {
            personnelId: advanceData.personId,
            amount: advanceData.amount,
            date: new Date().toISOString(),
            description: advanceData.description
        };
        const id = await addAdvance(newAdvance);

        const thePerson = personnel.find(p => p.id === advanceData.personId);
        if (thePerson) {
            await addCommunityExpense({
                description: `Adelanto de Sueldo: ${thePerson.names} ${thePerson.lastNames} - ${advanceData.description}`,
                category: 'Sueldos',
                amount: advanceData.amount,
                date: new Date().toISOString().split('T')[0]
            });
        }

        setAdvanceData({ personId: '', amount: 0, description: 'Adelanto de sueldo' });

        // Show receipt automatically
        setViewingAdvance({ ...newAdvance, id: id || Math.random().toString(), status: 'pending' });
        setViewingPayslip(null);
        setIsPreviewOpen(true);
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);

    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];


    const filteredHistory = useMemo(() => {
        return payslips.filter(p => {
            const person = personnel.find(pers => pers.id === p.personnelId);
            const nameMatch = person ? (person.names + ' ' + person.lastNames).toLowerCase().includes(searchTerm.toLowerCase()) : false;
            const folioMatch = p.folio.includes(searchTerm);
            return nameMatch || folioMatch;
        });
    }, [payslips, personnel, searchTerm]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <Banknote className="w-8 h-8 text-emerald-500" />
                        Remuneraciones y Adelantos
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 font-bold italic lowercase first-letter:uppercase">Gestión de sueldos, descuentos previsionales y adelantos de efectivo.</p>
                </div>

                <div className="flex bg-white dark:bg-gray-800 p-1 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <button
                        onClick={() => setView('generate')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'generate' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-gray-500 hover:text-indigo-600'}`}
                    >
                        <Calculator className="w-4 h-4" /> Liquidar
                    </button>
                    <button
                        onClick={() => setView('advances')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'advances' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-gray-500 hover:text-amber-500'}`}
                    >
                        <DollarSign className="w-4 h-4" /> Adelantos
                    </button>
                    <button
                        onClick={() => setView('history')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'history' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-gray-500 hover:text-indigo-600'}`}
                    >
                        <History className="w-4 h-4" /> Historial
                    </button>
                </div>
            </div>

            {view === 'generate' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Form */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-xl space-y-6">
                            <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-sm flex items-center gap-2">
                                <User className="w-5 h-5 text-indigo-600" /> Selección de Personal
                            </h3>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Trabajador</label>
                                    <select
                                        value={selectedPersonId}
                                        onChange={(e) => setSelectedPersonId(e.target.value)}
                                        className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all font-sans"
                                    >
                                        <option value="">Seleccione un trabajador...</option>
                                        {personnel.length === 0 ? (
                                            <option disabled>No hay personal registrado en el maestro</option>
                                        ) : personnel.filter(p => p.status === 'active').length === 0 ? (
                                            <option disabled>No hay trabajadores activos</option>
                                        ) : personnel.filter(p => p.status === 'active').map(p => (
                                            <option key={p.id} value={p.id}>{p.names} {p.lastNames}</option>
                                        ))}
                                    </select>
                                    {personnel.length === 0 && (
                                        <p className="text-[10px] text-red-500 font-bold mt-2 animate-pulse">
                                            ⚠️ Debe registrar personal en el "Maestro Personal" primero.
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Mes</label>
                                        <select
                                            value={month}
                                            onChange={(e) => setMonth(Number(e.target.value))}
                                            className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                                        >
                                            {monthNames.map((m, i) => (
                                                <option key={i} value={i + 1}>{m}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Año</label>
                                        <input
                                            type="number"
                                            value={year}
                                            onChange={(e) => setYear(Number(e.target.value))}
                                            className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {selectedPerson && (
                                <div className="pt-6 border-t border-gray-100 dark:border-gray-800 space-y-4 animate-in fade-in zoom-in-95">
                                    <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-black text-indigo-600 uppercase">Sueldo Base</span>
                                            <span className="text-lg font-black text-gray-900 dark:text-white">{formatCurrency(selectedPerson.baseSalary)}</span>
                                        </div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-gray-500 uppercase">Adelantos Pendientes</span>
                                            <span className="text-sm font-black text-red-500">-{formatCurrency(pendingAdvances)}</span>
                                        </div>
                                    </div>

                                    <Button
                                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20"
                                        onClick={handleGenerate}
                                    >
                                        Generar Liquidación <Calculator className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Preview Area */}
                    <div className="lg:col-span-7">
                        <div className="bg-gray-50 dark:bg-gray-950 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-800 h-full flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-20 h-20 bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm flex items-center justify-center mb-6">
                                <FileText className="w-10 h-10 text-gray-200" />
                            </div>
                            <h4 className="text-lg font-black text-gray-400 uppercase tracking-tight">Previsualización de Documento</h4>
                            <p className="text-sm text-gray-400 mt-2 max-w-xs">Selecciona un trabajador y presiona generar para ver el desglose detallado.</p>
                        </div>
                    </div>
                </div>
            )}

            {view === 'advances' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Advance Form */}
                    <div className="lg:col-span-4">
                        <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-xl space-y-6 sticky top-24">
                            <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-sm flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-amber-500" /> Registrar Adelanto
                            </h3>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Trabajador</label>
                                    <select
                                        value={advanceData.personId}
                                        onChange={(e) => setAdvanceData({ ...advanceData, personId: e.target.value })}
                                        className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                                    >
                                        <option value="">Seleccione...</option>
                                        {personnel.filter(p => p.status === 'active').map(p => (
                                            <option key={p.id} value={p.id}>{p.names} {p.lastNames}</option>
                                        ))}
                                    </select>
                                    {personnel.length === 0 && (
                                        <p className="text-[10px] text-red-500 font-bold mt-2">
                                            ⚠️ Registre personal primero.
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Monto en Efectivo</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="number"
                                            value={advanceData.amount}
                                            onChange={(e) => setAdvanceData({ ...advanceData, amount: Number(e.target.value) })}
                                            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none text-sm font-bold focus:ring-2 focus:ring-amber-500 transition-all font-sans"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Glosa / Observación</label>
                                    <input
                                        type="text"
                                        value={advanceData.description}
                                        onChange={(e) => setAdvanceData({ ...advanceData, description: e.target.value })}
                                        className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none text-sm font-bold focus:ring-2 focus:ring-amber-500 transition-all"
                                        placeholder="ej. Anticipo Quincena"
                                    />
                                </div>

                                <Button
                                    className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest shadow-xl shadow-amber-500/20"
                                    onClick={handleAddAdvance}
                                    disabled={!advanceData.personId || advanceData.amount <= 0}
                                >
                                    Confirmar Entrega <CheckCircle2 className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* History of Advances */}
                    <div className="lg:col-span-8 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {advances.map(adv => {
                                const person = personnel.find(p => p.id === adv.personnelId);
                                return (
                                    <div key={adv.id} className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/20 rounded-xl flex items-center justify-center text-amber-500">
                                                    <DollarSign className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-gray-900 dark:text-white uppercase leading-none">{person?.names} {person?.lastNames}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">{new Date(adv.date).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${adv.status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                                                {adv.status === 'pending' ? 'Pendiente' : 'Descontado'}
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-end">
                                            <p className="text-xs font-bold text-gray-500 max-w-[150px] truncate">{adv.description}</p>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className="text-lg font-black text-gray-900 dark:text-white">{formatCurrency(adv.amount)}</span>
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => {
                                                            setViewingAdvance(adv);
                                                            setViewingPayslip(null);
                                                            setIsPreviewOpen(true);
                                                        }}
                                                        className="text-[10px] text-indigo-500 font-bold uppercase"
                                                    >
                                                        Comprobante
                                                    </button>
                                                    {adv.status === 'pending' && (
                                                        <button onClick={() => deleteAdvance(adv.id)} className="text-[10px] text-red-500 font-bold uppercase">Eliminar</button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {view === 'history' && (
                <div className="space-y-6">
                    <div className="flex-1 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                                <button
                                    onClick={() => setHistoryType('payslips')}
                                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${historyType === 'payslips' ? 'bg-white text-indigo-600 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Liquidaciones
                                </button>
                                <button
                                    onClick={() => setHistoryType('advances')}
                                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${historyType === 'advances' ? 'bg-white text-emerald-600 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Adelantos
                                </button>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder={`Buscar ${historyType === 'payslips' ? 'folio o trabajador' : 'trabajador'}...`}
                                    className="pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 shadow-sm w-64"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {historyType === 'payslips' ? (
                                filteredHistory.map(payslip => {
                                    const person = personnel.find(p => p.id === payslip.personnelId);
                                    return (
                                        <div key={payslip.id} className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between group hover:border-indigo-500 transition-all">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest pl-1 mb-1">Folio #{payslip.folio}</p>
                                                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase leading-tight">{person?.names} {person?.lastNames}</h3>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{monthNames[payslip.month - 1]} {payslip.year}</p>
                                                </div>
                                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600">
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Monto Líquido</p>
                                                    <p className="text-lg font-black text-gray-900 dark:text-white">{formatCurrency(payslip.netSalary)}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setViewingPayslip(payslip);
                                                            setViewingAdvance(null);
                                                            setIsPreviewOpen(true);
                                                        }}
                                                        className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-indigo-600 hover:text-white transition-all text-gray-400"
                                                        title="Ver Liquidación"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm('¿Eliminar esta liquidación?')) deletePayslip(payslip.id);
                                                        }}
                                                        className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-red-500 hover:text-white transition-all text-gray-400"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                advances.filter(a => {
                                    if (!searchTerm) return true;
                                    const person = personnel.find(p => p.id === a.personnelId);
                                    return `${person?.names} ${person?.lastNames}`.toLowerCase().includes(searchTerm.toLowerCase());
                                }).map(adv => {
                                    const person = personnel.find(p => p.id === adv.personnelId);
                                    return (
                                        <div key={adv.id} className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between group hover:border-emerald-500 transition-all">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1 pl-1">
                                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${adv.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                                            {adv.status === 'pending' ? 'PENDIENTE' : 'DESCONTADO'}
                                                        </span>
                                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{new Date(adv.date).toLocaleDateString()}</p>
                                                    </div>
                                                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase leading-tight">{person?.names} {person?.lastNames}</h3>
                                                    <p className="text-[10px] text-gray-400 font-bold max-w-[150px] truncate">{adv.description}</p>
                                                </div>
                                                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600">
                                                    <DollarSign className="w-4 h-4" />
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Monto Adelanto</p>
                                                    <p className="text-lg font-black text-gray-900 dark:text-white">{formatCurrency(adv.amount)}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setViewingAdvance(adv);
                                                            setViewingPayslip(null);
                                                            setIsPreviewOpen(true);
                                                        }}
                                                        className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-emerald-600 hover:text-white transition-all text-gray-400"
                                                        title="Ver Comprobante"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {adv.status === 'pending' && (
                                                        <button
                                                            onClick={() => {
                                                                if (window.confirm('¿Eliminar este adelanto?')) deleteAdvance(adv.id);
                                                            }}
                                                            className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-red-500 hover:text-white transition-all text-gray-400"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            {((historyType === 'payslips' && filteredHistory.length === 0) || (historyType === 'advances' && advances.length === 0)) && (
                                <div className="col-span-full py-12 text-center bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                                    <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-sm font-bold text-gray-400">No se encontraron registros de {historyType === 'payslips' ? 'liquidaciones' : 'adelantos'}.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Previsualización */}
            {isPreviewOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="w-full h-full p-6 sm:p-10 flex flex-col items-center overflow-hidden">
                        <div className="w-full max-w-[800px] flex justify-between items-center mb-8 print:hidden">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-white/10 rounded-2xl text-white">
                                    <Banknote className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-white font-black uppercase tracking-[0.2em] leading-none">Documento de Remuneración</h3>
                                    <p className="text-indigo-400 text-[10px] font-bold uppercase mt-1">Vista Oficial de Impresión</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button className="bg-indigo-600 hover:bg-indigo-700 font-black text-xs uppercase px-8" onClick={() => window.print()}>
                                    <Printer className="w-4 h-4 mr-2" /> Imprimir
                                </Button>
                                <Button variant="secondary" className="bg-white/10 hover:bg-white/20 border-white/20 text-white font-black text-xs uppercase" onClick={() => setIsPreviewOpen(false)}>
                                    <X className="w-4 h-4 mr-2" /> Cerrar
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto w-full pb-20 print:p-0 print:m-0 print:overflow-visible custom-scrollbar-white">
                            {viewingPayslip && (
                                <PayslipDocument
                                    payslip={viewingPayslip}
                                    person={personnel.find(p => p.id === viewingPayslip.personnelId)}
                                    health={providers.find(p => p.id === personnel.find(px => px.id === viewingPayslip.personnelId)?.healthInsuranceId)}
                                    fund={funds.find(f => f.id === personnel.find(px => px.id === viewingPayslip.personnelId)?.pensionFundId)}
                                    settings={settings}
                                />
                            )}
                            {viewingAdvance && (
                                <AdvanceReceipt
                                    advance={viewingAdvance as any}
                                    person={personnel.find(p => p.id === viewingAdvance.personnelId)}
                                    settings={settings}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    nav, header, aside, .print\\:hidden, button {
                        display: none !important;
                    }
                    main {
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .fixed {
                        position: relative !important;
                        background: white !important;
                        z-index: auto !important;
                        display: block !important;
                    }
                    #print-payslip {
                        box-shadow: none !important;
                        border: none !important;
                        width: 100% !important;
                        max-width: none !important;
                        padding: 1.5cm !important;
                    }
                }
            ` }} />
        </div>
    );
};

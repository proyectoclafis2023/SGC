import React, { useState, useEffect } from 'react';
import { useCommonExpenses } from '../context/CommonExpenseContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Plus, Search, Landmark, Receipt, Trash2, X, Percent, Coins, ShieldOff, Settings2, MinusCircle } from 'lucide-react';
import type { SpecialFund, FundUnitTypeConfig } from '../types';
import { useUnitTypes } from '../context/UnitTypeContext';

import { useInfrastructure } from '../context/InfrastructureContext';
import { SecurityModal } from '../components/SecurityModal';

export const SpecialFundsPage: React.FC = () => {
    const { towers } = useInfrastructure();
    const { unitTypes } = useUnitTypes();
    const { payments, funds, addFund, updateFund, deleteFund, restoreFund, fetchFunds } = useCommonExpenses();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFund, setEditingFund] = useState<SpecialFund | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showArchived, setShowArchived] = useState(false);

    useEffect(() => {
        fetchFunds(showArchived);
    }, [showArchived, fetchFunds]);

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<'reserve' | 'extraordinary'>('extraordinary');
    const [totalAmountPerUnit, setTotalAmountPerUnit] = useState(0);
    const [totalProjectAmount, setTotalProjectAmount] = useState<number | undefined>(undefined);
    const [deadline, setDeadline] = useState('');
    const [unitConfigs, setUnitConfigs] = useState<FundUnitTypeConfig[]>([]);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    // @ts-ignore
    const [selectedFundForExpense, setSelectedFundForExpense] = useState<SpecialFund | null>(null);

    const [expenseAmount, setExpenseAmount] = useState(0);
    const [expenseDescription, setExpenseDescription] = useState('');
    const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

    // Delete confirmation state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [fundToDelete, setFundToDelete] = useState<SpecialFund | null>(null);

    const resetForm = () => {
        setName('');
        setDescription('');
        setType('extraordinary');
        setTotalAmountPerUnit(0);
        setTotalProjectAmount(undefined);
        setDeadline('');
        setUnitConfigs([]);
        setEditingFund(null);
    };

    const handleOpenModal = (fund?: SpecialFund) => {
        if (fund) {
            setEditingFund(fund);
            setName(fund.name);
            setDescription(fund.description);
            setType(fund.type);
            setTotalAmountPerUnit(fund.totalAmountPerUnit);
            setTotalProjectAmount(fund.totalProjectAmount);
            setDeadline(fund.deadline || '');
            setUnitConfigs(fund.unitConfigs || []);
        } else {
            resetForm();
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const fundData = {
            name,
            description,
            type,
            totalAmountPerUnit,
            totalProjectAmount,
            deadline,
            unitConfigs,
            isActive: true
        };

        if (editingFund) {
            await updateFund({ ...fundData, id: editingFund.id, createdAt: editingFund.createdAt });
        } else {
            await addFund(fundData);
        }

        setIsModalOpen(false);
        resetForm();
    };

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFundForExpense) return;

        const newExpense = {
            id: crypto.randomUUID(),
            amount: expenseAmount,
            description: expenseDescription,
            date: expenseDate
        };

        const updatedFund = {
            ...selectedFundForExpense,
            expenses: [...(selectedFundForExpense.expenses || []), newExpense]
        };

        await updateFund(updatedFund);
        setIsExpenseModalOpen(false);
        setExpenseAmount(0);
        setExpenseDescription('');
    };

    const filteredFunds = funds.map(fund => {
        let totalTarget = 0;
        let unitsCompleted = 0;
        let unitsPending = 0;

        const allDepts = towers.flatMap(t => t.departments).filter(d => !d.isArchived);

        allDepts.forEach(dept => {
            const config = fund.unitConfigs?.find(c => c.unitTypeId === dept.unitTypeId);
            const unitType = unitTypes.find(ut => ut.id === dept.unitTypeId);
            let targetForThisDept = fund.totalAmountPerUnit;

            if (config) {
                if (config.isExempt) {
                    targetForThisDept = 0;
                } else if (config.calculationType === 'percentage' && unitType) {
                    targetForThisDept = (unitType.baseCommonExpense * config.value) / 100;
                } else {
                    targetForThisDept = config.value;
                }
            }

            totalTarget += targetForThisDept;

            const paidToThisDept = payments
                .filter(p => p.departmentId === dept.id)
                .reduce((acc, p) => {
                    const contribution = p.fundContributions?.find(c => c.fundId === fund.id);
                    return acc + (contribution?.amount || 0);
                }, 0);

            if (targetForThisDept > 0) {
                if (paidToThisDept >= targetForThisDept) {
                    unitsCompleted++;
                } else {
                    unitsPending++;
                }
            }
        });

        const totalCollected = payments.reduce((acc, p) => {
            const contribution = p.fundContributions?.find(c => c.fundId === fund.id);
            return acc + (contribution?.amount || 0);
        }, 0);

        const totalExpenses = fund.expenses?.reduce((acc, e) => acc + e.amount, 0) || 0;
        const netAvailable = totalCollected - totalExpenses;

        const amountPending = totalTarget - totalCollected;

        return {
            ...fund,
            totalCollected,
            totalTarget,
            totalExpenses,
            netAvailable,
            unitsCompleted,
            unitsPending,
            amountPending
        };
    }).filter(f => {
        if (!showArchived && f.isArchived) return false;
        if (showArchived && !f.isArchived) return false;
        const name = f.name?.toLowerCase() || '';
        const description = f.description?.toLowerCase() || '';
        const search = searchTerm.toLowerCase();
        return name.includes(search) || description.includes(search);
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-indigo-900 dark:text-white">
                        <Landmark className="text-indigo-600" /> Fondos y Cuotas Especiales
                    </h1>
                    <p className="text-gray-500">Administración de fondos de reserva y cuotas extraordinarias proyectadas.</p>
                </div>
                <Button onClick={() => handleOpenModal()}>
                    <Plus className="w-4 h-4 mr-2" /> Crear Nuevo Fondo
                </Button>
            </div>

            {/* Barra de Búsqueda */}
            <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar fondos por nombre o descripción..."
                        className="w-full pl-12 pr-4 py-3 rounded-xl border-none bg-gray-50 dark:bg-gray-800 text-sm font-medium outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => setShowArchived(!showArchived)}
                    className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${showArchived ? 'bg-amber-600 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}
                >
                    <Settings2 className="w-4 h-4" /> {showArchived ? 'Ver Activos' : 'Ver Archivados'}
                </button>
            </div>

            {/* Listado de Fondos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFunds.length === 0 ? (
                    <div className="col-span-full py-12 text-center bg-gray-50 dark:bg-gray-800/20 rounded-[2rem] border-2 border-dashed border-gray-100 dark:border-gray-800">
                        <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-400 font-bold">No se registran fondos de reserva ni cuotas extraordinarias.</p>
                    </div>
                ) : (
                    filteredFunds.map(fund => (
                        <div key={fund.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all group relative">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-2xl ${fund.type === 'reserve' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600'}`}>
                                        <Landmark className="w-6 h-6" />
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${fund.type === 'reserve' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700' : 'bg-amber-100 dark:bg-amber-900/50 text-amber-700'}`}>
                                        {fund.type === 'reserve' ? 'Fondo Reserva' : 'Cuota Extraordinaria'}
                                    </span>
                                </div>

                                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">{fund.name}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-6">{fund.description}</p>

                                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl space-y-4">
                                    <div className="flex justify-between items-center bg-indigo-50/50 dark:bg-indigo-900/20 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Meta x Unidad</span>
                                        <span className="text-lg font-black text-gray-900 dark:text-white">${fund.totalAmountPerUnit.toLocaleString()}</span>
                                    </div>

                                    {fund.totalProjectAmount && (
                                        <div className="flex justify-between items-center text-[10px] px-1">
                                            <span className="text-gray-400 font-bold uppercase">Presupuesto Total</span>
                                            <span className="font-black text-gray-700 dark:text-gray-300">${fund.totalProjectAmount.toLocaleString()}</span>
                                        </div>
                                    )}

                                    {fund.deadline && (
                                        <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-700 pt-2 text-xs">
                                            <span className="text-gray-400 font-bold italic">Fecha Límite</span>
                                            <span className="font-black text-red-500">{new Date(fund.deadline).toLocaleDateString()}</span>
                                        </div>
                                    )}

                                    <div className="space-y-3 border-t border-gray-100 dark:border-gray-700 pt-4">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">Recaudado</p>
                                                <p className="text-sm font-black text-gray-900 dark:text-white">${fund.totalCollected.toLocaleString()}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[10px] font-black text-rose-600 uppercase tracking-tighter">Egresos</p>
                                                <p className="text-sm font-black text-rose-700">-${fund.totalExpenses.toLocaleString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-tighter">Pendiente</p>
                                                <p className="text-sm font-black text-gray-900 dark:text-white">${fund.amountPending.toLocaleString()}</p>
                                            </div>
                                        </div>

                                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30 flex justify-between items-center">
                                            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Disponible Neto</span>
                                            <span className="text-sm font-black text-emerald-800 dark:text-emerald-400">${fund.netAvailable.toLocaleString()}</span>
                                        </div>

                                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                                style={{ width: `${Math.min(100, (fund.totalCollected / (fund.totalTarget || 1)) * 100)}%` }}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 pt-2">
                                            <div className="bg-white dark:bg-gray-900 p-2 rounded-xl border border-gray-100 dark:border-gray-800 text-center">
                                                <p className="text-[9px] font-black text-gray-400 uppercase">Unid. Pagadas</p>
                                                <p className="text-xs font-black text-emerald-600">{fund.unitsCompleted}</p>
                                            </div>
                                            <div className="bg-white dark:bg-gray-900 p-2 rounded-xl border border-gray-100 dark:border-gray-800 text-center">
                                                <p className="text-[9px] font-black text-gray-400 uppercase">Unid. Pend.</p>
                                                <p className="text-xs font-black text-red-500">{fund.unitsPending}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex gap-2">
                                    {fund.isArchived ? (
                                        <Button
                                            onClick={() => {
                                                console.log('Restaurando fondo:', fund.id);
                                                restoreFund(fund.id);
                                            }}
                                            className="flex-1 bg-emerald-600 text-white text-xs font-black uppercase"
                                        >
                                            Restaurar Fondo
                                        </Button>
                                    ) : (
                                        <>
                                            <Button variant="secondary" className="flex-1 text-xs" onClick={() => handleOpenModal(fund)}>
                                                Editar
                                            </Button>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setFundToDelete(fund);
                                                    setIsDeleteModalOpen(true);
                                                }}
                                                className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal de Registro */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 max-h-[90vh]">
                        <div className="p-8 border-b dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                                    <Landmark className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-none">{editingFund ? 'Editar Fondo' : 'Nuevo Fondo'}</h2>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Definición de Meta Recaudación</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white dark:hover:bg-gray-800 rounded-2xl transition-colors text-gray-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <Input
                                            label="Nombre del Fondo"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Ej: Fondo Pintura 2024"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 ml-1">Tipo</label>
                                        <select
                                            className="w-full p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-bold outline-none"
                                            value={type}
                                            onChange={(e) => setType(e.target.value as 'reserve' | 'extraordinary')}
                                        >
                                            <option value="reserve">Fondo de Reserva</option>
                                            <option value="extraordinary">Cuota Extraordinaria</option>
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-1">
                                            <Input
                                                label="Monto Total Proyecto ($)"
                                                type="number"
                                                value={totalProjectAmount || ''}
                                                onChange={(e) => setTotalProjectAmount(Number(e.target.value))}
                                                placeholder="Ej: 1500000"
                                            />
                                        </div>
                                        <div className="col-span-1 flex items-end">
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                className="w-full text-[10px]"
                                                onClick={() => {
                                                    if (!totalProjectAmount) return;
                                                    // Obtener todos los departamentos activos
                                                    const depts = towers.flatMap(t => t.departments).filter(d => !d.isArchived);

                                                    // Filtrar solo departamentos no exentos según la configuración actual
                                                    const activeDepts = depts.filter(d => {
                                                        const config = unitConfigs.find(c => c.unitTypeId === d.unitTypeId);
                                                        return !config?.isExempt;
                                                    });

                                                    if (activeDepts.length === 0) return;

                                                    // Calcular peso total basado en el gasto común base de cada tipo de unidad
                                                    // Esto asegura un prorrateo equitativo según el tamaño/valor del depto
                                                    const totalWeight = activeDepts.reduce((acc, d) => {
                                                        const ut = unitTypes.find(u => u.id === d.unitTypeId);
                                                        return acc + (ut?.baseCommonExpense || 0);
                                                    }, 0);

                                                    if (totalWeight === 0) {
                                                        // Fallback: división simple si no hay pesos definidos
                                                        setTotalAmountPerUnit(Math.round(totalProjectAmount / activeDepts.length));
                                                    } else {
                                                        // Generar nuevas configuraciones proporcionales por tipo de unidad
                                                        const newConfigs = unitTypes.map(ut => {
                                                            const existing = unitConfigs.find(c => c.unitTypeId === ut.id);
                                                            if (existing?.isExempt) return existing;

                                                            const proportionalValue = Math.round((totalProjectAmount * ut.baseCommonExpense) / totalWeight);
                                                            return {
                                                                unitTypeId: ut.id,
                                                                calculationType: 'fixed' as const,
                                                                value: proportionalValue,
                                                                isExempt: false
                                                            };
                                                        });
                                                        setUnitConfigs(newConfigs);
                                                        // El promedio se mantiene como referencia visual general
                                                        setTotalAmountPerUnit(Math.round(totalProjectAmount / depts.length));
                                                    }
                                                }}
                                            >
                                                Prorratear Deptos
                                            </Button>
                                        </div>
                                    </div>

                                    <Input
                                        label="Meta por Defecto ($)"
                                        type="number"
                                        value={totalAmountPerUnit}
                                        onChange={(e) => setTotalAmountPerUnit(Number(e.target.value))}
                                        required
                                    />
                                    <Input
                                        label="Fecha Límite"
                                        type="date"
                                        value={deadline}
                                        onChange={(e) => setDeadline(e.target.value)}
                                    />
                                </div>

                                {/* Configuración por Tipo de Unidad */}
                                <div className="space-y-4 pt-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Settings2 className="w-4 h-4 text-indigo-600" />
                                        <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">Parametrización por Tipo de Unidad</h4>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        {unitTypes.map(ut => {
                                            const config = unitConfigs.find(c => c.unitTypeId === ut.id);
                                            const isExempt = config?.isExempt || false;
                                            const calcType = config?.calculationType || 'fixed';
                                            const val = config?.value || 0;

                                            const updateConfig = (newCfg: Partial<FundUnitTypeConfig>) => {
                                                const others = unitConfigs.filter(c => c.unitTypeId !== ut.id);
                                                const current = config || { unitTypeId: ut.id, calculationType: 'fixed', value: 0, isExempt: false };
                                                setUnitConfigs([...others, { ...current, ...newCfg }]);
                                            };

                                            return (
                                                <div key={ut.id} className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                                                    <div className="flex-1">
                                                        <p className="text-xs font-black text-gray-900 dark:text-white">{ut.name}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Base: ${ut.baseCommonExpense.toLocaleString()}</p>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => updateConfig({ isExempt: !isExempt })}
                                                            className={`p-2 rounded-xl border transition-all flex items-center gap-2 text-[10px] font-black uppercase ${isExempt ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-100 text-gray-400'}`}
                                                        >
                                                            <ShieldOff className="w-4 h-4" /> {isExempt ? 'Exento' : 'Paga'}
                                                        </button>

                                                        {!isExempt && (
                                                            <div className="flex bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateConfig({ calculationType: 'fixed' })}
                                                                    className={`p-2 transition-all ${calcType === 'fixed' ? 'bg-indigo-600 text-white' : 'text-gray-400'}`}
                                                                >
                                                                    <Coins className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateConfig({ calculationType: 'percentage' })}
                                                                    className={`p-2 transition-all ${calcType === 'percentage' ? 'bg-indigo-600 text-white' : 'text-gray-400'}`}
                                                                >
                                                                    <Percent className="w-4 h-4" />
                                                                </button>
                                                                <input
                                                                    type="number"
                                                                    className="w-20 px-2 py-2 text-xs font-black outline-none bg-transparent"
                                                                    value={val}
                                                                    onChange={(e) => updateConfig({ value: Number(e.target.value) })}
                                                                    placeholder={calcType === 'fixed' ? '$' : '%'}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 ml-1">Descripción / Uso</label>
                                    <textarea
                                        className="w-full p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-medium outline-none min-h-[100px]"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Describa el propósito de este fondo..."
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-sm font-black uppercase tracking-widest">
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 py-4 bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 text-sm font-black uppercase tracking-widest"
                                >
                                    {editingFund ? 'Guardar Cambios' : 'Crear Fondo'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Egresos */}
            {isExpenseModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b dark:border-gray-800 flex items-center justify-between bg-rose-50/30 dark:bg-rose-900/10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-500/30">
                                    <MinusCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-none">Registrar Egreso</h2>
                                    <p className="text-[10px] font-bold text-rose-600/60 uppercase tracking-widest mt-1">Salida de Capital del Fondo</p>
                                </div>
                            </div>
                            <button onClick={() => setIsExpenseModalOpen(false)} className="p-3 hover:bg-white dark:hover:bg-gray-800 rounded-2xl transition-colors text-gray-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleAddExpense} className="p-8 space-y-6">
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-3xl border border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fondo Origen</p>
                                    <Landmark className="w-3 h-3 text-gray-400" />
                                </div>
                                <p className="text-xl font-black text-indigo-900 dark:text-white truncate">{selectedFundForExpense?.name}</p>
                                <p className="text-xs font-bold text-gray-400 mt-1">Disponible: ${((selectedFundForExpense as any)?.netAvailable || 0).toLocaleString()}</p>
                            </div>

                            <div className="space-y-4">
                                <Input
                                    label="Monto del Egreso ($)"
                                    type="number"
                                    value={expenseAmount || ''}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        const available = (selectedFundForExpense as any)?.netAvailable || 0;
                                        setExpenseAmount(val > available ? available : val);
                                    }}
                                    required
                                    className="text-2xl font-black text-rose-600"
                                />

                                <Input
                                    label="Descripción / Motivo"
                                    value={expenseDescription}
                                    onChange={(e) => setExpenseDescription(e.target.value)}
                                    placeholder="Ej: Pago arreglo motobomba central"
                                    required
                                />

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 ml-1">Fecha del Gasto</label>
                                    <input
                                        type="date"
                                        className="w-full p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
                                        value={expenseDate}
                                        onChange={(e) => setExpenseDate(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button type="button" variant="secondary" className="flex-1 py-4 font-black uppercase tracking-widest text-xs" onClick={() => setIsExpenseModalOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" className="flex-1 py-4 bg-rose-600 text-white shadow-xl shadow-rose-600/20 font-black uppercase tracking-widest text-xs">
                                    Confirmar Egreso
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Modal de Confirmación de Eliminación */}
            <SecurityModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setFundToDelete(null);
                }}
                onConfirm={() => {
                    if (fundToDelete) {
                        deleteFund(fundToDelete.id);
                    }
                }}
                title="Confirmar Eliminación"
                description="¿Está seguro de archivar el fondo"
                itemName={fundToDelete?.name || ''}
                actionLabel="Eliminar Ahora"
            />
        </div>
    );
};

import React, { useState } from 'react';
import { useUnitTypes } from '../context/UnitTypeContext';
import { useCommonExpenses } from '../context/CommonExpenseContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Plus, Gavel, Calendar, Home, X, CheckCircle2 } from 'lucide-react';

export const CommonExpenseRulesPage: React.FC = () => {
    const { unitTypes } = useUnitTypes();
    const { rules, addRule } = useCommonExpenses();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [unitTypeId, setUnitTypeId] = useState('');
    const [amount, setAmount] = useState(0);
    const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await addRule({
            unitTypeId: unitTypeId || undefined,
            amount,
            effectiveFrom,
            description
        });
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black flex items-center gap-2">
                        <Gavel className="text-indigo-600 w-8 h-8" /> Reglas de Gastos Comunes
                    </h1>
                    <p className="text-gray-500 font-bold">Defina los montos base por tipo de unidad y fechas de vigencia.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Nueva Regla
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rules.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-gray-50 dark:bg-gray-800/20 rounded-[3rem] border-4 border-dashed border-gray-100 dark:border-gray-800">
                        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-400 font-black italic">No hay reglas de cobro definidas.</p>
                    </div>
                ) : (
                    rules.map(rule => (
                        <div key={rule.id} className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all group">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center">
                                    <Home className="text-indigo-600 w-7 h-7" />
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-black text-indigo-600">${rule.amount.toLocaleString()}</p>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Monto Base</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Aplica para</p>
                                    <p className="text-lg font-black text-gray-900 dark:text-white">
                                        {rule.unitTypeId ? unitTypes.find(ut => ut.id === rule.unitTypeId)?.name : 'Todas las Unidades (Global)'}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                                    <Calendar className="w-5 h-5 text-emerald-600" />
                                    <div>
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">Vigente desde</p>
                                        <p className="text-sm font-black text-gray-700 dark:text-gray-300">
                                            {new Date(rule.effectiveFrom).toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>

                                {rule.description && (
                                    <p className="text-sm text-gray-500 font-medium italic">"{rule.description}"</p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20 dark:border-gray-800">
                        <div className="p-8 border-b dark:border-gray-800 flex items-center justify-between">
                            <h2 className="text-2xl font-black">Configurar Nueva Regla</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-500 uppercase ml-1">Tipo de Unidad</label>
                                <select
                                    className="w-full p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-sm font-black outline-none focus:border-indigo-500"
                                    value={unitTypeId}
                                    onChange={(e) => setUnitTypeId(e.target.value)}
                                >
                                    <option value="">Todas (Global)</option>
                                    {unitTypes.map(ut => <option key={ut.id} value={ut.id}>{ut.name}</option>)}
                                </select>
                            </div>

                            <Input
                                label="Monto Mensual ($)"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                required
                            />

                            <Input
                                label="Vigente Desde"
                                type="date"
                                value={effectiveFrom}
                                onChange={(e) => setEffectiveFrom(e.target.value)}
                                required
                            />

                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-500 uppercase ml-1">Descripción / Motivo</label>
                                <textarea
                                    className="w-full p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-sm font-black outline-none focus:border-indigo-500 min-h-[100px]"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Ej: Reajuste anual IPC"
                                />
                            </div>

                            <Button type="submit" className="w-full py-5 text-xs font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3">
                                <CheckCircle2 className="w-5 h-5" /> Guardar Regla
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

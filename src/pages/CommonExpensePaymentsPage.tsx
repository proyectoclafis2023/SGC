import React, { useState, useEffect } from 'react';
import { useInfrastructure } from '../context/InfrastructureContext';
import { useCommonExpenses } from '../context/CommonExpenseContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import {
    Plus, Search, Wallet, Landmark, Receipt, Calendar,
    Trash2, AlertCircle, CheckCircle2, X, Printer, FileUp, Camera
} from 'lucide-react';
import { compressImage } from '../utils/imageCompression';


export const CommonExpensePaymentsPage: React.FC = () => {
    const { towers } = useInfrastructure();
    const { payments, funds, addPayment, deletePayment, calculateAmount } = useCommonExpenses();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form state
    const monthsNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const [selectedTowerId, setSelectedTowerId] = useState('');
    const [selectedDeptId, setSelectedDeptId] = useState('');
    const [periodMonth, setPeriodMonth] = useState(new Date().getMonth() + 1);
    const [periodYear, setPeriodYear] = useState(new Date().getFullYear());
    const [amountPaid, setAmountPaid] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('transfer');
    const [notes, setNotes] = useState('');
    const [isElectronic, setIsElectronic] = useState(true);
    const [evidenceImage, setEvidenceImage] = useState<string | undefined>(undefined);
    const [fundContributions, setFundContributions] = useState<{ fundId: string, amount: number }[]>([]);

    const resetForm = () => {
        setSelectedTowerId('');
        setSelectedDeptId('');
        setPeriodMonth(new Date().getMonth() + 1);
        setPeriodYear(new Date().getFullYear());
        setAmountPaid(0);
        setPaymentMethod('transfer');
        setNotes('');
        setIsElectronic(true);
        setEvidenceImage(undefined);
        setFundContributions([]);
    };

    const handleOpenModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const selectedTower = towers.find(t => t.id === selectedTowerId);

    // Fetch suggested amount when dept is selected
    useEffect(() => {
        if (selectedDeptId) {
            calculateAmount(selectedDeptId).then(res => {
                setAmountPaid(res.suggestedAmount);
            });
        }
    }, [selectedDeptId, calculateAmount]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const compressed = await compressImage(file);
                setEvidenceImage(compressed);
                setIsElectronic(false);
            } catch (err) {
                console.error('Error compressing image:', err);
            }
        }
    };

    const handleFundContributionChange = (fundId: string, amount: number) => {
        setFundContributions(prev => {
            const existing = prev.find(c => c.fundId === fundId);
            if (existing) {
                if (amount === 0) return prev.filter(c => c.fundId !== fundId);
                return prev.map(c => c.fundId === fundId ? { ...c, amount } : c);
            }
            if (amount === 0) return prev;
            return [...prev, { fundId, amount }];
        });
    };

    const totalAmount = amountPaid + fundContributions.reduce((acc, c) => acc + c.amount, 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDeptId) {
            alert('Por favor seleccione un departamento');
            return;
        }

        const data = {
            departmentId: selectedDeptId,
            periodMonth,
            periodYear,
            amountPaid: totalAmount,
            paymentMethod,
            evidenceImage,
            notes,
            isElectronic,
            fundContributions,
            status: 'paid' as const,
            paymentDate: new Date().toISOString()
        };

        await addPayment(data);
        setIsModalOpen(false);
    };

    const filteredPayments = payments.filter(p => {
        const dept = towers.flatMap(t => t.departments).find(d => d.id === p.departmentId);
        return dept?.number.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black flex items-center gap-2">
                        <Wallet className="text-indigo-600 w-8 h-8" /> Gestión de Gastos Comunes
                    </h1>
                    <p className="text-gray-500 font-bold">Registro histórico, reglas de precios y comprobantes.</p>
                </div>
                <Button onClick={handleOpenModal}>
                    <Plus className="w-4 h-4 mr-2" /> Registrar Pago
                </Button>
            </div>

            {/* Barra de Búsqueda */}
            <div className="bg-white dark:bg-gray-900 p-4 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por número de departamento..."
                        className="w-full pl-12 pr-4 py-3 rounded-xl border-none bg-gray-50 dark:bg-gray-800 text-sm font-bold outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Listado de Pagos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredPayments.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-gray-50 dark:bg-gray-800/10 rounded-[3rem] border-4 border-dashed border-gray-100 dark:border-gray-800/50">
                        <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-400 text-xl font-black italic">No se registran pagos aún.</p>
                    </div>
                ) : (
                    filteredPayments.map(payment => {
                        const dept = towers.flatMap(t => t.departments).find(d => d.id === payment.departmentId);
                        const tower = towers.find(t => t.departments.some(d => d.id === payment.departmentId));

                        return (
                            <div key={payment.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all group relative">
                                <div className="p-8">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center">
                                                <Landmark className="text-indigo-600 w-8 h-8" />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black text-gray-900 dark:text-white">Depto {dept?.number}</h3>
                                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{tower?.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => window.print()}
                                                    className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                    title="Imprimir Comprobante"
                                                >
                                                    <Printer className="w-5 h-5" />
                                                </button>
                                                {payment.evidenceImage && (
                                                    <a href={payment.evidenceImage} target="_blank" rel="noreferrer" className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                                                        <FileUp className="w-5 h-5" />
                                                    </a>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${payment.status === 'mora' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                                                    }`}>
                                                    {payment.status === 'mora' ? 'MOROSO' : 'AL DÍA'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Periodo</p>
                                            <p className="text-lg font-black">{monthsNames[payment.periodMonth - 1]} {payment.periodYear}</p>
                                        </div>
                                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Folio</p>
                                            <p className="text-lg font-black truncate">{payment.receiptFolio || 'MANUAL'}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end border-t border-gray-100 dark:border-gray-800 pt-6">
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Fecha de Pago</p>
                                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                                    {new Date(payment.paymentDate).toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' })}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Pagado</p>
                                                <p className="text-3xl font-black text-emerald-600">${payment.amountPaid.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => deletePayment(payment.id)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Modal de Registro */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-[3rem] w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 border border-white/20 dark:border-gray-800">
                        <div className="p-8 border-b dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/30">
                                    <Receipt className="w-7 h-7" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-gray-900 dark:text-white leading-none">Registrar Pago</h2>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">{isElectronic ? 'Emisión Electrónica' : 'Registro Manual'}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-4 hover:bg-white dark:hover:bg-gray-800 rounded-2xl transition-all text-gray-400 hover:text-red-500">
                                <X className="w-7 h-7" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <section className="space-y-6">
                                    <h3 className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Calendar className="w-4 h-4" /> Ubicación y Periodo
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-black text-gray-500 ml-1 uppercase">Torre</label>
                                                <select
                                                    className="w-full p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-black outline-none focus:border-indigo-500 transition-all shadow-sm"
                                                    value={selectedTowerId}
                                                    onChange={(e) => { setSelectedTowerId(e.target.value); setSelectedDeptId(''); }}
                                                    required
                                                >
                                                    <option value="">Seleccione...</option>
                                                    {towers.filter(t => !t.isArchived).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-black text-gray-500 ml-1 uppercase">Departamento</label>
                                                <select
                                                    className="w-full p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-black outline-none focus:border-indigo-500 transition-all shadow-sm"
                                                    value={selectedDeptId}
                                                    onChange={(e) => setSelectedDeptId(e.target.value)}
                                                    required
                                                    disabled={!selectedTowerId}
                                                >
                                                    <option value="">Seleccione...</option>
                                                    {selectedTower?.departments.filter(d => !d.isArchived).map(d => <option key={d.id} value={d.id}>Depto {d.number}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-black text-gray-500 ml-1 uppercase">Mes</label>
                                                <select
                                                    className="w-full p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-black outline-none focus:border-indigo-500 transition-all shadow-sm"
                                                    value={periodMonth}
                                                    onChange={(e) => setPeriodMonth(Number(e.target.value))}
                                                    required
                                                >
                                                    {monthsNames.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                                                </select>
                                            </div>
                                            <Input label="AÑO" type="number" value={periodYear} onChange={(e) => setPeriodYear(Number(e.target.value))} required />
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-6">
                                    <h3 className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Landmark className="w-4 h-4" /> Cobros y Fondos
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                                            <Input label="Gasto Común Suggested ($)" type="number" value={amountPaid} onChange={(e) => setAmountPaid(Number(e.target.value))} required className="text-xl font-black text-indigo-700" />
                                        </div>

                                        {funds.filter(f => !f.isArchived).length > 0 && (
                                            <div className="space-y-3">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cuotas Especiales / Fondos</p>
                                                <div className="space-y-2">
                                                    {funds.filter(f => !f.isArchived).map(fund => {
                                                        const contribution = fundContributions.find(c => c.fundId === fund.id);
                                                        return (
                                                            <div key={fund.id} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                                                <div className="flex-1">
                                                                    <p className="text-xs font-black text-gray-700 dark:text-gray-300">{fund.name}</p>
                                                                    <p className="text-[9px] text-gray-400 uppercase">Monto: ${fund.totalAmountPerUnit.toLocaleString()}</p>
                                                                </div>
                                                                <div className="w-32">
                                                                    <input
                                                                        type="number"
                                                                        className="w-full p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-black text-right"
                                                                        placeholder="0"
                                                                        value={contribution?.amount || ''}
                                                                        onChange={(e) => handleFundContributionChange(fund.id, Number(e.target.value))}
                                                                    />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        <div className="p-5 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border-2 border-emerald-100 dark:border-emerald-900/30">
                                            <div className="flex justify-between items-center mb-1">
                                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Total a Percibir</p>
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                            </div>
                                            <p className="text-3xl font-black text-emerald-700">${totalAmount.toLocaleString()}</p>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black text-gray-500 ml-1 uppercase">Método de Pago</label>
                                            <select
                                                className="w-full p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-black outline-none focus:border-emerald-500 transition-all shadow-sm"
                                                value={paymentMethod}
                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                                required
                                            >
                                                <option value="transfer">Transferencia Bancaria</option>
                                                <option value="cash">Efectivo / Caja</option>
                                                <option value="debit">Tarjeta Débito/Crédito</option>
                                            </select>
                                        </div>

                                        <div className="pt-2">
                                            <label className="text-xs font-black text-gray-500 ml-1 uppercase block mb-3">Documento Manual / Captura</label>
                                            <div className="flex items-center gap-4 p-5 bg-gray-50 dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                                <div
                                                    onClick={() => document.getElementById('evidence-upload')?.click()}
                                                    className="w-20 h-20 bg-white dark:bg-gray-700 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-sm cursor-pointer hover:scale-105 transition-all overflow-hidden relative border border-gray-100 dark:border-gray-600"
                                                >
                                                    {evidenceImage ? (
                                                        <img src={evidenceImage} className="w-full h-full object-cover" alt="Evidencia" />
                                                    ) : (
                                                        <>
                                                            <Camera className="w-6 h-6 text-indigo-600" />
                                                            <span className="text-[8px] font-black uppercase text-gray-400">Subir</span>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs font-black text-gray-700 dark:text-gray-300">Respaldo Manual</p>
                                                    <p className="text-[10px] text-gray-500 font-bold leading-tight">Suba la foto del comprobante físico si no es digital.</p>
                                                </div>
                                                <input id="evidence-upload" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-black text-gray-500 ml-1 uppercase">Observaciones Adicionales</label>
                                <textarea
                                    className="w-full p-5 rounded-3xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 font-bold text-sm outline-none focus:border-indigo-500 transition-all min-h-[100px] shadow-sm"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Ingrese cualquier nota relevante sobre este pago..."
                                />
                            </div>
                        </form>

                        <div className="p-10 bg-gray-50 dark:bg-gray-800/80 border-t dark:border-gray-800 flex items-center justify-between gap-8">
                            <div className="hidden md:block">
                                <div className="flex items-center gap-2 text-indigo-600 mb-1">
                                    <AlertCircle className="w-4 h-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Información de Sistema</p>
                                </div>
                                <p className="text-xs text-gray-500 font-bold max-w-[200px]">Este pago quedará registrado en el historial anual del departamento.</p>
                            </div>
                            <div className="flex gap-4 flex-1">
                                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 text-xs font-black uppercase tracking-widest rounded-2xl">
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    className="flex-1 py-5 bg-indigo-600 text-white shadow-2xl shadow-indigo-500/40 text-xs font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                                    disabled={!selectedDeptId}
                                >
                                    <CheckCircle2 className="w-5 h-5" />
                                    Finalizar y Emitir Comprobante
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
                @media print {
                    .no-print { display: none; }
                    body { background: white; }
                }
            `}</style>
        </div>
    );
};

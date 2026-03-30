import React, { useState } from 'react';
import { useCommonExpenses } from '../context/CommonExpenseContext';
import { Wallet, Plus, Trash2, Calendar, FileText, Search, Receipt, CircleDollarSign, X, ImageIcon } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { SecurityModal } from '../components/SecurityModal';
import type { CommunityExpense } from '../types';
import { compressImage } from '../utils/imageCompression';

export const CommunityExpensesPage: React.FC = () => {
    const { communityExpenses, addCommunityExpense, deleteCommunityExpense, funds } = useCommonExpenses();
    const { settings } = useSettings();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [expenseToDelete, setExpenseToDelete] = useState<CommunityExpense | null>(null);

    // Form state
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState<any>('Otros');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [fundId, setFundId] = useState<string>(''); // Vacio = Gasto Común
    const [receiptImages, setReceiptImages] = useState<string[]>([]);

    const filteredExpenses = communityExpenses.filter(e => {
        const search = searchTerm.toLowerCase();
        return !e.isArchived && (
            e.description.toLowerCase().includes(search) ||
            e.category.toLowerCase().includes(search)
        );
    });

    const pendingFunds = funds?.filter(f => !f.isArchived) || [];

    const handleOpenModal = () => {
        setDescription('');
        setAmount('');
        setCategory('Otros');
        setDate(new Date().toISOString().split('T')[0]);
        setFundId('');
        setReceiptImages([]);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        await addCommunityExpense({
            description: fundId ? `[Pago ${funds.find(f => f.id === fundId)?.name}] ${description}` : description,
            amount: Number(amount),
            category,
            date,
            receiptImages: receiptImages.length > 0 ? receiptImages : undefined,
            isArchived: false,
        });

        setIsModalOpen(false);
    };

    const handleDelete = async () => {
        if (expenseToDelete) {
            await deleteCommunityExpense(expenseToDelete.id);
            setExpenseToDelete(null);
            setIsDeleteModalOpen(false);
        }
    };

    const totalExpenses = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className={`text-2xl font-black flex items-center gap-3 ${settings.theme === 'modern' ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        <Wallet className="w-8 h-8 text-indigo-600" />
                        Registro de Egresos
                    </h1>
                    <p className={`text-sm font-bold mt-1 ${settings.theme === 'modern' ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'}`}>
                        Control de egresos operaciones, sueldos, mantenciones y uso de fondos.
                    </p>
                </div>
                <Button onClick={handleOpenModal} className="shrink-0 shadow-lg shadow-indigo-500/30">
                    <Plus className="w-4 h-4 mr-2" />
                    Registrar Egreso
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-[2rem] p-6 text-white shadow-lg shadow-indigo-500/30 flex items-center justify-between">
                    <div>
                        <p className="text-indigo-100 font-bold uppercase tracking-widest text-xs mb-1">Total Egresos</p>
                        <h3 className="text-3xl font-black">${totalExpenses.toLocaleString()}</h3>
                    </div>
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                        <CircleDollarSign className="w-7 h-7" />
                    </div>
                </div>
                {/* Agrega otras métricas si es necesario */}
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar pago, categoría o glosa..."
                            className="w-full pl-12 pr-4 py-4 rounded-2xl border-none bg-white dark:bg-gray-900 text-sm font-black text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-black uppercase tracking-widest text-[10px]">
                            <tr>
                                <th className="px-6 py-4 rounded-tl-3xl">Fecha</th>
                                <th className="px-6 py-4">Descripción General</th>
                                <th className="px-6 py-4">Categoría</th>
                                <th className="px-6 py-4 text-right">Monto</th>
                                <th className="px-6 py-4 text-center rounded-tr-3xl">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-bold">
                            {filteredExpenses.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                        <Wallet className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p className="uppercase tracking-widest font-black text-xs">No hay egresos registrados</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredExpenses.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-900 dark:text-white uppercase text-[11px] tracking-widest">{new Date(expense.date).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-gray-900 dark:text-white">{expense.description}</span>
                                                {expense.receiptImages && expense.receiptImages.length > 0 && (
                                                    <div className="flex gap-1 mt-1">
                                                        {expense.receiptImages.map((img, i) => (
                                                            <a key={i} href={img} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:text-indigo-700 font-bold flex items-center gap-1">
                                                                <FileText className="w-3 h-3" /> Ver Boleta {i + 1}
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-lg text-[10px] uppercase tracking-widest font-black border border-indigo-100 dark:border-indigo-800">
                                                {expense.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-rose-600 dark:text-rose-400 font-black">
                                                -${expense.amount.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => {
                                                    setExpenseToDelete(expense);
                                                    setIsDeleteModalOpen(true);
                                                }}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Nuevo Egreso */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto">
                    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
                        <div className={`p-8 border-b flex items-center justify-between sticky top-0 z-10 ${settings.theme === 'modern' ? 'bg-indigo-950/40 border-indigo-900/50 backdrop-blur-md' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'}`}>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                                    <Receipt className="w-6 h-6" />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-none">Registrar Egreso</h2>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-colors text-gray-400 group" type="button">
                                <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] md:max-h-[80vh] overflow-y-auto custom-scrollbar flex-1">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-gray-500 ml-1 uppercase tracking-widest">Fondo de Origen</label>
                                    <select
                                        value={fundId}
                                        onChange={(e) => setFundId(e.target.value)}
                                        className="w-full rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-black text-indigo-600"
                                    >
                                        <option value="">Gasto Común (Operacional)</option>
                                        {pendingFunds.map((f: any) => (
                                            <option key={f.id} value={f.id}>Fondo Especial: {f.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-gray-500 ml-1 uppercase tracking-widest">Categoría del Gasto</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                    >
                                        <option value="Servicios Básicos">Servicios Básicos (Agua, Luz)</option>
                                        <option value="Mantención">Mantención (Ascensores, Bombas)</option>
                                        <option value="Reparaciones">Reparaciones Urgentes</option>
                                        <option value="Sueldos">Sueldos y Remuneraciones</option>
                                        <option value="Administración">Gastos Administrativos</option>
                                        <option value="Seguros">Seguros</option>
                                        <option value="Otros">Gastos Varios</option>
                                    </select>
                                </div>

                                <Input
                                    label="Descripción de la Boleta / Glosa"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Ej: Pago ENEL, Compra materiales..."
                                    required
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Monto Requerido ($)"
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        required
                                        className="text-rose-600 font-black text-xl"
                                    />
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-gray-500 ml-1 uppercase tracking-widest">Fecha de Pago</label>
                                        <input
                                            type="date"
                                            className="w-full p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-black outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-gray-900 dark:text-white"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-gray-500 ml-1 uppercase tracking-widest">Boletas/Comprobantes (Opcional)</label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {receiptImages.map((img, index) => (
                                            <div key={index} className="relative group w-16 h-16 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
                                                <img src={img} alt={`Receipt ${index}`} className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => setReceiptImages(prev => prev.filter((_, i) => i !== index))}
                                                    className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={async (e) => {
                                                const files = Array.from(e.target.files || []);
                                                for (const file of files) {
                                                    try {
                                                        const compressed = await compressImage(file);
                                                        setReceiptImages(prev => [...prev, compressed]);
                                                    } catch (err) {
                                                        console.error('Error compressing image:', err);
                                                    }
                                                }
                                            }}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="w-full p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center bg-gray-50/50 dark:bg-gray-800/30 group-hover:border-indigo-400 dark:group-hover:border-indigo-500/50 transition-all">
                                            <ImageIcon className="w-8 h-8 text-gray-400 group-hover:text-indigo-500 mb-2 transition-colors" />
                                            <p className="text-xs font-black text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 uppercase tracking-widest">Subir Boletas</p>
                                            <p className="text-[10px] text-gray-400 mt-1 uppercase">PNG, JPG hasta 5MB (Auto-optimizado)</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Button type="submit" className="w-full flex justify-center py-4 bg-indigo-600 text-white font-black uppercase tracking-widest">
                                Registrar Salida de Dinero
                            </Button>
                        </form>
                    </div>
                </div>
            )}

            <SecurityModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Eliminar Registro de Egreso"
                description="¿Está seguro de eliminar permanentemente este egreso contable? Esto afectará los saldos mostrados."
                itemName={expenseToDelete?.description || ''}
                actionLabel="Eliminar Egreso"
            />
        </div>
    );
};

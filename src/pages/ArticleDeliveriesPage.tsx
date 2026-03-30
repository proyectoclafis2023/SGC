import React, { useState } from 'react';
import { usePersonnel } from '../context/PersonnelContext';
import { useArticles } from '../context/ArticleContext';
import { useArticleDeliveries } from '../context/ArticleDeliveryContext';
import { Button } from '../components/Button';
import {
    Plus, Search, ClipboardList, Printer, Upload, X, Trash2,
    User, Package, Calendar, CheckCircle2, ChevronLeft, AlertCircle, Eye
} from 'lucide-react';
import type { ArticleDelivery } from '../types';

export const ArticleDeliveriesPage: React.FC = () => {
    const { personnel } = usePersonnel();
    const { articles, decreaseStock } = useArticles();
    const { deliveries, addDelivery, updateDelivery, setDeliveries } = useArticleDeliveries();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'personnel' | 'history' | 'list' | 'pending'>('list');
    const [focusedPersonId, setFocusedPersonId] = useState<string | null>(null);

    // Preview states
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [selectedDelivery, setSelectedDelivery] = useState<ArticleDelivery | null>(null);

    // Form states
    const [selectedPersonId, setSelectedPersonId] = useState('');
    const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedArticles, setSelectedArticles] = useState<{ articleId: string, size?: string, quantity: number }[]>([{ articleId: '', quantity: 1 }]);
    const [notes, setNotes] = useState('');

    const handleAddArticle = () => {
        setSelectedArticles([...selectedArticles, { articleId: '', quantity: 1 }]);
    };

    const handleRemoveArticle = (index: number) => {
        setSelectedArticles(selectedArticles.filter((_, i) => i !== index));
    };

    const handleArticleChange = (index: number, field: string, value: any) => {
        const newArticles = [...selectedArticles];
        newArticles[index] = { ...newArticles[index], [field]: value };
        setSelectedArticles(newArticles);
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        const validArticles = selectedArticles.filter(a => a.articleId !== '');
        if (!selectedPersonId || validArticles.length === 0) {
            alert('Por favor seleccione un funcionario y al menos un artículo válido.');
            return;
        }

        try {
            const mappedArticles = validArticles.map(a => ({
                articleId: a.articleId,
                quantity: a.quantity,
                size: personnel.find(p => p.id === selectedPersonId)?.assignedArticles?.find(aa => aa.articleId === a.articleId)?.size || ''
            }));

            const deliveryId = await addDelivery({
                personnelId: selectedPersonId,
                deliveryDate,
                articles: mappedArticles,
                notes,
                status: 'active'
            });

            // Deduct stock
            for (const art of mappedArticles) {
                await decreaseStock(art.articleId, art.quantity);
            }

            // Redirect and show history
            setFocusedPersonId(selectedPersonId);
            setViewMode('history');

            alert('Entrega registrada exitosamente. Se abrirá el comprobante para impresión.');

            // Use immediate data for printing since deliveries state might not be updated yet
            const immediateDelivery: ArticleDelivery = {
                id: deliveryId,
                folio: `DEL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${deliveryId.slice(-4).toUpperCase()}`,
                personnelId: selectedPersonId,
                deliveryDate,
                articles: mappedArticles,
                notes,
                status: 'active',
                createdAt: new Date().toISOString()
            };
            handlePrint(immediateDelivery);

            setIsModalOpen(false);
            resetForm();
        } catch (error) {
            console.error(error);
            alert('Error al registrar la entrega.');
        }
    };

    const resetForm = () => {
        setSelectedPersonId('');
        setDeliveryDate(new Date().toISOString().split('T')[0]);
        setSelectedArticles([{ articleId: '', quantity: 1 }]);
        setNotes('');
    };

    const handlePrint = (delivery: ArticleDelivery) => {
        // Logic for printing/viewing voucher
        setSelectedDelivery(delivery);
        setIsPreviewModalOpen(true);
    };

    const handleFileUpload = (deliveryId: string, file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result as string;
            setDeliveries((prev: ArticleDelivery[]) => prev.map(d =>
                d.id === deliveryId ? { ...d, signedDocument: dataUrl } : d
            ));
            alert('Respaldo guardado exitosamente.');
        };
        reader.readAsDataURL(file);
    };

    const handleViewDocument = (document: string) => {
        const newWindow = window.open();
        if (newWindow) {
            newWindow.document.write(`<iframe src="${document}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
        }
    };

    const filteredPersonnel = personnel.filter(p => {
        const isNotArchived = !p.isArchived;
        const hasAssigned = p.assignedArticles && p.assignedArticles.length > 0;
        const nameMatch = `${p.names} ${p.lastNames}`.toLowerCase().includes(searchTerm.toLowerCase());
        return isNotArchived && hasAssigned && nameMatch;
    });

    const getPersonDeliveries = (personId: string) => {
        return deliveries.filter(d => d.personnelId === personId);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20">
                            <Package className="w-8 h-8 text-white" />
                        </div>
                        Control de Entregas Técnicas
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium ml-1">Registro de EPP, Suministros de Aseo y Material de Oficina.</p>
                </div>
                <Button
                    onClick={() => {
                        if (viewMode === 'history' && focusedPersonId) {
                            setSelectedPersonId(focusedPersonId);
                        }
                        setIsModalOpen(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-6 py-3 shadow-lg shadow-indigo-500/20"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Registrar Entrega
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Entregas</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white">{deliveries.length}</p>
                </div>
                <div
                    onClick={() => setViewMode('pending')}
                    className={`bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border ${viewMode === 'pending' ? 'border-amber-500 ring-4 ring-amber-500/10' : 'border-gray-100 dark:border-gray-800'} shadow-sm flex flex-col items-center justify-center text-center cursor-pointer hover:shadow-lg transition-all`}
                >
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Pendientes de Firma</p>
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                        <p className="text-3xl font-black text-amber-600 dark:text-amber-500">
                            {deliveries.filter(d => !d.signedDocument && d.status === 'active').length}
                        </p>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Respaldadas</p>
                    <p className="text-3xl font-black text-emerald-600 dark:text-emerald-500">
                        {deliveries.filter(d => d.signedDocument && d.status === 'active').length}
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row items-center gap-4">
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl w-full md:w-auto">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-900 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Todas las Entregas
                    </button>
                    <button
                        onClick={() => setViewMode('personnel')}
                        className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'personnel' ? 'bg-white dark:bg-gray-900 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Por Trabajador
                    </button>
                    <button
                        onClick={() => setViewMode('pending')}
                        className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'pending' ? 'bg-amber-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Pendientes ({deliveries.filter(d => !d.signedDocument && d.status === 'active').length})
                    </button>
                </div>
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder={viewMode === 'list' ? "Buscar por trabajador o folio..." : "Buscar por funcionario..."}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {(viewMode === 'list' || viewMode === 'pending') ? (
                    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Folio</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha Entrega</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Trabajador</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Artículos</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Estado</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                                {deliveries
                                    .filter(d => {
                                        const p = personnel.find(per => per.id === d.personnelId);
                                        const fullName = `${p?.names} ${p?.lastNames}`.toLowerCase();
                                        const searchMatch = fullName.includes(searchTerm.toLowerCase()) || d.id.toLowerCase().includes(searchTerm.toLowerCase());
                                        const pendingFilter = viewMode === 'pending' ? !d.signedDocument && d.status === 'active' : true;
                                        return searchMatch && pendingFilter;
                                    })
                                    .sort((a, b) => new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime())
                                    .map(delivery => {
                                        const person = personnel.find(p => p.id === delivery.personnelId);
                                        return (
                                            <tr key={delivery.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="text-[10px] font-black text-indigo-600 uppercase">#{delivery.id.substr(0, 8)}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-gray-400" />
                                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                                            {new Date(delivery.deliveryDate).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                                                            {person?.photo ? <img src={person.photo} className="w-full h-full object-cover" /> : <User className="w-4 h-4 m-2 text-gray-300" />}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900 dark:text-white capitalize">{person?.names} {person?.lastNames}</p>
                                                            <p className="text-[10px] text-gray-400 font-bold">{person?.dni}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1 max-w-xs">
                                                        {delivery.articles.map((a, i) => {
                                                            const art = articles.find(ar => ar.id === a.articleId);
                                                            return (
                                                                <span key={i} className="text-[9px] bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300 font-bold">
                                                                    {art?.name || 'Art.'} x{a.quantity}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`text-[9px] px-2 py-1 rounded-lg font-black uppercase ${delivery.status === 'active' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' : 'bg-red-50 text-red-600 dark:bg-red-900/30'}`}>
                                                        {delivery.status === 'active' ? 'Activo' : 'Anulado'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handlePrint(delivery)}
                                                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                                                            title="Ver Comprobante"
                                                        >
                                                            <Printer className="w-4 h-4" />
                                                        </button>
                                                        {delivery.status === 'active' && (
                                                            <button
                                                                onClick={() => {
                                                                    if (confirm('¿Está seguro de anular esta entrega?')) {
                                                                        updateDelivery({ ...delivery, status: 'voided' });
                                                                    }
                                                                }}
                                                                className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl transition-all"
                                                                title="Anular Entrega"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                        {deliveries.length === 0 && (
                            <div className="py-20 text-center bg-gray-50 dark:bg-gray-800/10">
                                <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 font-bold">No se registran entregas físicas.</p>
                            </div>
                        )}
                    </div>
                ) : viewMode === 'personnel' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPersonnel.length === 0 ? (
                            <div className="col-span-full py-20 text-center bg-gray-50 dark:bg-gray-800/20 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-gray-800">
                                <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 font-bold">No se encontraron funcionarios con artículos precargados.</p>
                                <p className="text-xs text-gray-400 mt-1">Configure los artículos requeridos en la ficha de personal primero.</p>
                            </div>
                        ) : (
                            filteredPersonnel.map(person => {
                                const personDeliveries = getPersonDeliveries(person.id);
                                return (
                                    <div
                                        key={person.id}
                                        onClick={() => {
                                            setFocusedPersonId(person.id);
                                            setViewMode('history');
                                        }}
                                        className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 shadow-sm hover:shadow-2xl transition-all cursor-pointer group active:scale-95"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl flex items-center justify-center relative">
                                                {person.photo ? (
                                                    <img src={person.photo} className="w-full h-full object-cover rounded-3xl" alt="" />
                                                ) : (
                                                    <User className="w-10 h-10 text-indigo-500" />
                                                )}
                                                <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[10px] font-black w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-900">
                                                    {personDeliveries.length}
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight">
                                                    {person.names} <br /> {person.lastNames}
                                                </h3>
                                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2">DNI: {person.dni}</p>
                                            </div>
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between">
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-gray-400 font-bold uppercase">Artículos Requeridos</p>
                                                <div className="flex -space-x-2">
                                                    {(person.assignedArticles || []).slice(0, 3).map((a, i) => (
                                                        <div key={i} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-white dark:border-gray-900 flex items-center justify-center text-[10px] font-black text-gray-600 dark:text-gray-300">
                                                            {articles.find(ar => ar.id === a.articleId)?.name.charAt(0)}
                                                        </div>
                                                    ))}
                                                    {(person.assignedArticles || []).length > 3 && (
                                                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 border-2 border-white dark:border-gray-900 flex items-center justify-center text-[8px] font-black text-indigo-600 dark:text-indigo-400">
                                                            +{(person.assignedArticles || []).length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                                <ChevronLeft className="w-6 h-6 rotate-180" />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        <button
                            onClick={() => setViewMode('personnel')}
                            className="flex items-center gap-2 text-sm font-black text-indigo-600 dark:text-indigo-400 hover:gap-4 transition-all"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            VOLVER AL LISTADO DE PERSONAL
                        </button>

                        <div className="bg-white dark:bg-gray-900 rounded-[3rem] p-10 border border-gray-100 dark:border-gray-800 shadow-sm">
                            <div className="flex items-center gap-8 mb-10">
                                {(() => {
                                    const person = personnel.find(p => p.id === focusedPersonId);
                                    return (
                                        <>
                                            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-[2rem] overflow-hidden shadow-xl">
                                                {person?.photo ? <img src={person.photo} className="w-full h-full object-cover" alt="" /> : <User className="w-12 h-12 m-6 text-gray-300" />}
                                            </div>
                                            <div>
                                                <h2 className="text-3xl font-black text-gray-900 dark:text-white">{person?.names} {person?.lastNames}</h2>
                                                <div className="flex gap-4 mt-2">
                                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">DNI: {person?.dni}</span>
                                                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-full">{person?.position}</span>
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {getPersonDeliveries(focusedPersonId || '').length === 0 ? (
                                    <div className="col-span-full py-12 text-center bg-gray-50 dark:bg-gray-800/10 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-800">
                                        <p className="text-gray-400 font-bold">Sin histórico de entregas físicas.</p>
                                    </div>
                                ) : (
                                    getPersonDeliveries(focusedPersonId || '').map(delivery => (
                                        <div key={delivery.id} className="bg-gray-50 dark:bg-gray-800/30 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-700 relative group overflow-hidden">
                                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
                                                {delivery.status === 'active' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (confirm('¿Está seguro de anular esta entrega?')) {
                                                                updateDelivery({ ...delivery, status: 'voided' });
                                                            }
                                                        }}
                                                        className="p-2 bg-white dark:bg-gray-900 text-amber-500 rounded-xl shadow-lg border border-amber-100/50"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>

                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        Entregado: {new Date(delivery.deliveryDate).toLocaleDateString()}
                                                    </p>
                                                    <p className="text-[8px] font-bold text-gray-400">REG: {new Date(delivery.createdAt).toLocaleDateString()} {new Date(delivery.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                                {delivery.status === 'voided' && (
                                                    <span className="text-[8px] px-2 py-1 bg-red-500 text-white rounded-lg font-black uppercase">ANULADA</span>
                                                )}
                                            </div>

                                            <div className="space-y-1.5 mb-6">
                                                {delivery.articles.map((a, idx) => {
                                                    const art = articles.find(ar => ar.id === a.articleId);
                                                    return (
                                                        <div key={idx} className="flex justify-between text-[11px] font-bold text-gray-700 dark:text-gray-300">
                                                            <span>{art?.name} {a.size && `(${a.size})`}</span>
                                                            <span className="text-indigo-600 font-black">x{a.quantity}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="flex justify-between items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/50">
                                                <button
                                                    onClick={() => handlePrint(delivery)}
                                                    className="flex-1 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-all shadow-sm"
                                                >
                                                    Ver Comprobante
                                                </button>
                                                {delivery.signedDocument && (
                                                    <button
                                                        onClick={() => handleViewDocument(delivery.signedDocument!)}
                                                        className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all"
                                                        title="Ver respaldo firmado"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <label className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all">
                                                    <Upload className="w-4 h-4 text-gray-500" />
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*,application/pdf"
                                                        onChange={(e) => e.target.files?.[0] && handleFileUpload(delivery.id, e.target.files[0])}
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Registro */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-[3rem] w-full max-w-2xl shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95">
                        <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                                <div className="p-2 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20">
                                    <Package className="w-6 h-6 text-white" />
                                </div>
                                Nueva Entrega
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all">
                                <X className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-600 dark:text-gray-400 ml-1">Para:</label>
                                    <select
                                        className="w-full p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                        value={selectedPersonId}
                                        onChange={(e) => setSelectedPersonId(e.target.value)}
                                        required
                                    >
                                        <option value="">Seleccionar funcionario...</option>
                                        {personnel.filter(p => !p.isArchived && p.assignedArticles && p.assignedArticles.length > 0).map(p => (
                                            <option key={p.id} value={p.id}>{p.names} {p.lastNames}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-600 dark:text-gray-400 ml-1">Fecha de Entrega</label>
                                    <div className="p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-sm font-bold text-gray-500 dark:text-gray-400 flex items-center justify-between">
                                        {new Date().toLocaleDateString('es-CL')}
                                        <Calendar className="w-4 h-4 opacity-50" />
                                    </div>
                                    <p className="text-[10px] text-gray-400 ml-1 italic">* La fecha se registra automáticamente al día de hoy.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between ml-1 py-4 border-b border-gray-100 dark:border-gray-800 mb-6">
                                    <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Artículos a Entregar:</p>
                                    <button
                                        type="button"
                                        onClick={handleAddArticle}
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Agregar Fila
                                    </button>
                                </div>

                                {selectedArticles.map((item, idx) => (
                                    <div key={`article-${idx}`} className="flex gap-4 animate-in slide-in-from-right-4 duration-300">
                                        <select
                                            className="flex-1 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-bold outline-none"
                                            value={item.articleId}
                                            onChange={(e) => handleArticleChange(idx, 'articleId', e.target.value)}
                                            required
                                        >
                                            <option value="">Artículo...</option>
                                            {articles.filter(a => a.isActive && !a.isArchived).map(a => (
                                                <option key={a.id} value={a.id}>
                                                    [{a.category.toUpperCase()}] {a.name}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="text"
                                            placeholder="Talla/Num"
                                            className="w-24 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-bold outline-none"
                                            value={item.size || ''}
                                            onChange={(e) => handleArticleChange(idx, 'size', e.target.value)}
                                        />
                                        <input
                                            type="number"
                                            className="w-20 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-bold outline-none"
                                            value={item.quantity}
                                            onChange={(e) => handleArticleChange(idx, 'quantity', parseInt(e.target.value) || 0)}
                                            min="1"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveArticle(idx)}
                                            className="p-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-colors shrink-0"
                                            disabled={selectedArticles.length === 1}
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-600 dark:text-gray-400 ml-1">Observaciones:</label>
                                <textarea
                                    className="w-full p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-medium outline-none min-h-[100px]"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Detalles adicionales..."
                                />
                            </div>

                            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-xs font-bold text-amber-700 dark:text-amber-400 leading-relaxed">
                                    IMPORTANTE: Una vez guardada, la entrega no podrá ser editada. Solo podrá ser marcada como "Nula" para mantener el registro histórico.
                                </p>
                            </div>
                        </form>

                        <div className="p-8 bg-gray-50 dark:bg-gray-800/50 flex gap-4">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 px-6 rounded-2xl border border-gray-200 dark:border-gray-700 text-sm font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                                Cancelar
                            </button>
                            <button type="button" onClick={() => handleSubmit()} className="flex-1 py-4 px-6 rounded-2xl bg-indigo-600 text-white text-sm font-bold shadow-lg shadow-indigo-500/20 hover:scale-[1.02] transition-all active:scale-95">
                                Registrar Entrega
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Comprobante (Preview/Print) */}
            {isPreviewModalOpen && selectedDelivery && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 no-print" onClick={() => setIsPreviewModalOpen(false)}>
                    <div className="bg-white rounded-[1rem] w-full max-w-[21cm] h-fit max-h-[90vh] shadow-2xl overflow-y-auto animate-in scale-95 origin-center relative" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setIsPreviewModalOpen(false)}
                            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors no-print text-gray-400"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <div className="p-12 print-container text-gray-900" id="voucher-print">
                            <div className="flex justify-between items-start mb-12 border-b-2 border-gray-100 pb-8">
                                <div>
                                    <h1 className="text-4xl font-black uppercase tracking-tighter">Comprobante de Entrega</h1>
                                    <p className="text-gray-500 font-bold tracking-widest uppercase text-xs mt-2">Sistema de Gestión Comunitaria • SGC</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-gray-400 tracking-widest">FECHA DE ENTREGA</p>
                                    <p className="text-xl font-black">{new Date(selectedDelivery.deliveryDate).toLocaleDateString('es-CL')}</p>
                                    <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase">REGISTRO: {new Date(selectedDelivery.createdAt).toLocaleDateString('es-CL')}</p>
                                    <p className="text-xs font-bold text-indigo-600 mt-1">Ref: #{selectedDelivery.id.toUpperCase()}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-12 mb-12 bg-gray-50 p-8 rounded-3xl">
                                <div className="space-y-4">
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Funcionario Receptor</p>
                                    {(() => {
                                        const p = personnel.find(per => per.id === selectedDelivery.personnelId);
                                        return (
                                            <div className="space-y-1">
                                                <p className="text-2xl font-black">{p?.names} {p?.lastNames}</p>
                                                <p className="text-sm font-bold text-gray-600">{p?.dni}</p>
                                                <p className="text-sm font-medium text-gray-500 capitalize">{p?.position}</p>
                                            </div>
                                        );
                                    })()}
                                </div>
                                <div className="space-y-4">
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Estado del Registro</p>
                                    <div className="flex items-center gap-2">
                                        {selectedDelivery.status === 'active' ? (
                                            <>
                                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                                <span className="text-lg font-black uppercase text-emerald-600">Entrega Efectuada</span>
                                            </>
                                        ) : (
                                            <>
                                                <X className="w-5 h-5 text-red-600" />
                                                <span className="text-lg font-black uppercase text-red-600">Entrega ANULADA</span>
                                            </>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                                        {selectedDelivery.status === 'active'
                                            ? 'Este documento certifica que el funcionario ha recibido conforme los artículos listados a continuación.'
                                            : 'Este documento corresponde a un registro ANULADO y carece de validez para la entrega de artículos.'}
                                    </p>
                                </div>
                            </div>

                            <table className="w-full mb-12 border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-gray-900">
                                        <th className="py-4 text-left text-xs font-black uppercase tracking-widest text-gray-400">Descripción del Artículo</th>
                                        <th className="py-4 text-center text-xs font-black uppercase tracking-widest text-gray-400 w-32">Talla/Num</th>
                                        <th className="py-4 text-right text-xs font-black uppercase tracking-widest text-gray-400 w-32">Cantidad</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedDelivery.articles.map((a: any, idx: number) => {
                                        const art = articles.find(ar => ar.id === a.articleId);
                                        return (
                                            <tr key={idx} className="border-b border-gray-100">
                                                <td className="py-5 font-black text-lg">{art?.name || 'Artículo'}</td>
                                                <td className="py-5 text-center font-bold text-gray-700">{a.size || '-'}</td>
                                                <td className="py-5 text-right font-black text-2xl">{a.quantity}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {selectedDelivery.notes && (
                                <div className="mb-12 p-6 border-l-4 border-gray-900 bg-gray-50">
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Observaciones</p>
                                    <p className="text-sm font-bold italic text-gray-700 leading-relaxed">"{selectedDelivery.notes}"</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-20 pt-20 mt-20">
                                <div className="border-t-2 border-gray-200 pt-6 text-center">
                                    <div className="h-1 bg-transparent mb-1" />
                                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Firma Administrador</p>
                                </div>
                                <div className="border-t-2 border-gray-200 pt-6 text-center">
                                    <div className="h-1 bg-transparent mb-1" />
                                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Firma Funcionario</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-gray-100 dark:bg-gray-800 flex gap-4 sticky bottom-0 border-t border-gray-200 dark:border-gray-700 no-print z-20">
                            <button
                                onClick={() => setIsPreviewModalOpen(false)}
                                className="flex-1 py-4 px-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-sm font-black text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-sm"
                            >
                                <ChevronLeft className="w-5 h-5" />
                                Volver al Listado
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="flex-1 py-4 px-6 rounded-2xl bg-indigo-600 text-white text-sm font-black shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-95"
                            >
                                <Printer className="w-5 h-5" />
                                Imprimir / Descargar PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @media print {
                    @page { size: portrait; margin: 10mm; }
                    body * { visibility: hidden !important; }
                    #voucher-print, #voucher-print * { visibility: visible !important; }
                    #voucher-print {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                        color: black !important;
                        display: block !important;
                    }
                    .no-print { display: none !important; }
                }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
            `}</style>
        </div>
    );
};

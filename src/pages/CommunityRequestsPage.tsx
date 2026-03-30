import React, { useState } from 'react';
import { useTickets } from '../context/TicketContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useInfrastructure } from '../context/InfrastructureContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import {
    MessageSquare, AlertTriangle, Lightbulb, Search, Plus, X, CheckCircle, Upload, Eye, RefreshCcw,
    History as HistoryIcon, FileText
} from 'lucide-react';

export const CommunityRequestsPage: React.FC = () => {
    const { user } = useAuth();
    const { settings } = useSettings();
    const { tickets, addTicket, updateTicketStatus } = useTickets();
    const { towers } = useInfrastructure();
    const [selectedTower, setSelectedTower] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [filterType, setFilterType] = useState<'all' | 'complaint' | 'suggestion'>('all');
    const [showHistory, setShowHistory] = useState(false);

    // Formulario de creación
    const [type, setType] = useState<'complaint' | 'suggestion'>('complaint');
    const [subject, setSubject] = useState('');
    const [unitId, setUnitId] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState<string | undefined>();
    const [isSolving, setIsSolving] = useState<string | null>(null);
    const [solutionNotes, setSolutionNotes] = useState('');

    const isAdmin = user?.role === 'admin' || user?.role === 'global_admin';
    const activeUserId = user?.name || '';

    // Filtrar los tickets (Carácter comunitario: todos ven todo)
    const displayedTickets = tickets.filter(t => {
        const matchesSearch = t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.description.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = filterType === 'all' || t.type === filterType;
        const matchesStatus = showHistory
            ? t.status === 'solved'
            : t.status !== 'solved';

        return matchesSearch && matchesType && matchesStatus;
    });

    const pendingCount = tickets.filter(t => t.status === 'pending').length;
    const solvedCount = tickets.filter(t => t.status === 'solved').length;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await addTicket({
            userId: activeUserId,
            unitId,
            type,
            subject,
            description,
            image
        });
        setIsModalOpen(false);
        setSubject('');
        setUnitId('');
        setSelectedTower('');
        setDescription('');
        setImage(undefined);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSolve = async (id: string) => {
        if (!solutionNotes.trim()) {
            alert('Por favor, detalle la solución antes de cerrar el ticket.');
            return;
        }
        await updateTicketStatus(id, 'solved', solutionNotes);
        setIsSolving(null);
        setSolutionNotes('');
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending': return 'Pendiente';
            case 'read': return 'Notificado/Leído';
            case 'attended': return 'En Revisión';
            case 'solved': return 'Solucionado';
            default: return status;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            case 'read': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'attended': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
            case 'solved': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className={`text-2xl font-black flex items-center gap-2 ${settings.theme === 'modern' ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        <MessageSquare className="w-8 h-8 text-indigo-600" />
                        SUGERENCIAS & RECLAMOS
                    </h1>
                    <p className={`text-sm mt-1 font-bold ${settings.theme === 'modern' ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'}`}>Buzón de atención al residente.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setShowHistory(!showHistory)} className={showHistory ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : ''}>
                        <HistoryIcon className="w-4 h-4 mr-2" />
                        {showHistory ? 'Ver Casos Activos' : 'Ver Historial (Cerrados)'}
                    </Button>
                    <Button onClick={() => setIsModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Nuevo Caso
                    </Button>
                </div>
            </div>

            {isAdmin && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-2xl flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pendientes</p>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white">{pendingCount}</h3>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl flex items-center justify-center">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Solucionados</p>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white">{solvedCount}</h3>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar caso por título o glosa..."
                            className="w-full pl-12 pr-4 py-4 rounded-2xl border-none bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2">
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as any)}
                            className="bg-gray-50 dark:bg-gray-800/50 border-none rounded-2xl px-4 py-4 text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 focus:ring-4 focus:ring-indigo-500/10"
                        >
                            <option value="all">Todos los Tipos</option>
                            <option value="complaint">Reclamos</option>
                            <option value="suggestion">Sugerencias</option>
                        </select>

                        <div className="flex bg-gray-50 dark:bg-gray-800/50 p-1 rounded-2xl border border-gray-100 dark:border-gray-700">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' : 'text-gray-400'}`}
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' : 'text-gray-400'}`}
                            >
                                <FileText className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2' : 'grid-cols-1'}`}>
                {displayedTickets.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white dark:bg-gray-900 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-gray-800">
                        <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-200" />
                        <h3 className="text-xl font-black text-gray-400 uppercase tracking-widest">No se encontraron casos</h3>
                        <p className="text-gray-400 font-bold mt-2">Pruebe con otros filtros o términos de búsqueda.</p>
                    </div>
                ) : (
                    displayedTickets.map((ticket) => (
                        <div key={ticket.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all relative">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-3 rounded-2xl ${ticket.type === 'complaint' ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600'}`}>
                                            {ticket.type === 'complaint' ? <AlertTriangle className="w-6 h-6" /> : <Lightbulb className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs font-black uppercase tracking-widest text-gray-400">{ticket.userId}</p>
                                                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-lg"># {ticket.folio}</span>
                                            </div>
                                            <span className={`inline-flex px-2 py-0.5 mt-1 text-[10px] font-black uppercase rounded-full ${getStatusColor(ticket.status)}`}>
                                                {getStatusText(ticket.status)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{ticket.subject}</h3>
                                {ticket.unitId && <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Unidad: {ticket.unitId}</p>}
                                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap mb-4">{ticket.description}</p>

                                {ticket.image && (
                                    <div className="mb-4 relative group w-fit">
                                        <img src={ticket.image} alt="Evidencia" className="max-h-48 rounded-2xl border dark:border-gray-800 shadow-sm" />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const win = window.open();
                                                win?.document.write(`
                                                <html>
                                                    <body style="margin:0; background:#000; display:flex; align-items:center; justify-content:center;">
                                                        <img src="${ticket.image}" style="max-width:100%; max-height:100vh;"/>
                                                    </body>
                                                </html>
                                            `);
                                            }}
                                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-2xl transition-all"
                                        >
                                            <Eye className="text-white w-6 h-6" />
                                        </button>
                                    </div>
                                )}

                                {ticket.adminNotes && (
                                    <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Resolución Actual</p>
                                        <p className="text-sm text-gray-900 dark:text-white font-bold italic">"{ticket.adminNotes}"</p>
                                    </div>
                                )}

                                {ticket.history && ticket.history.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Historial de Resoluciones</p>
                                        <div className="space-y-2">
                                            {ticket.history.map((h, i) => (
                                                <div key={i} className="p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 text-[11px]">
                                                    <div className="flex justify-between mb-1 opacity-70">
                                                        <span className="font-black uppercase">{getStatusText(h.status)}</span>
                                                        <span>{new Date(h.date).toLocaleString()}</span>
                                                    </div>
                                                    <p className="font-bold italic text-gray-600 dark:text-gray-400">"{h.notes}"</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {isSolving === ticket.id && (
                                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-3 animate-in fade-in slide-in-from-top-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Detalle de la Solución (Obligatorio)</label>
                                        <textarea
                                            value={solutionNotes}
                                            onChange={e => setSolutionNotes(e.target.value)}
                                            className="w-full bg-white dark:bg-gray-900 rounded-xl p-3 text-sm font-bold border border-gray-200 dark:border-gray-700"
                                            placeholder="Describa cómo se solucionó..."
                                            autoFocus
                                        />
                                        <div className="flex gap-2">
                                            <button onClick={() => handleSolve(ticket.id)} className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase">Guardar Solución</button>
                                            <button onClick={() => setIsSolving(null)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-black uppercase">Cancelar</button>
                                        </div>
                                    </div>
                                )}

                                {isAdmin && (
                                    <div className="mt-6 flex flex-wrap gap-2">
                                        {ticket.status !== 'solved' && (
                                            <>
                                                {ticket.status === 'pending' && (
                                                    <button
                                                        onClick={() => updateTicketStatus(ticket.id, 'read')}
                                                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold uppercase transition hover:bg-blue-600 hover:text-white"
                                                    >
                                                        Marcar como Leído
                                                    </button>
                                                )}
                                                {(ticket.status === 'pending' || ticket.status === 'read') && (
                                                    <button
                                                        onClick={() => updateTicketStatus(ticket.id, 'attended')}
                                                        className="px-4 py-2 bg-amber-50 text-amber-600 rounded-xl text-xs font-bold uppercase transition hover:bg-amber-600 hover:text-white"
                                                    >
                                                        En Revisión
                                                    </button>
                                                )}
                                                {isSolving !== ticket.id && (
                                                    <button
                                                        onClick={() => setIsSolving(ticket.id)}
                                                        className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold uppercase transition hover:bg-emerald-600 hover:text-white"
                                                    >
                                                        Marcar Solucionado
                                                    </button>
                                                )}
                                            </>
                                        )}
                                        {ticket.status === 'solved' && (
                                            <button
                                                onClick={() => updateTicketStatus(ticket.id, 'attended')}
                                                className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase transition hover:bg-indigo-600 hover:text-white flex items-center gap-2"
                                            >
                                                <RefreshCcw className="w-3.5 h-3.5" /> Volver a Abrir
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal de Nuevo Caso */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className={`p-8 border-b flex items-center justify-between ${settings.theme === 'modern' ? 'bg-indigo-950/40 border-indigo-900/50' : 'bg-gray-50/30'}`}>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                                    <MessageSquare className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-none mb-1">Registrar Nuevo Caso</h2>
                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Sugerencias y Reclamos</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-colors text-gray-400" type="button">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="flex bg-gray-50 dark:bg-gray-800 p-1.5 rounded-[1.5rem] border dark:border-gray-700">
                                    <button
                                        type="button"
                                        onClick={() => setType('complaint')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${type === 'complaint' ? 'bg-white dark:bg-gray-700 text-rose-600 shadow-xl' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        <AlertTriangle className="w-4 h-4" /> Reclamo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setType('suggestion')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${type === 'suggestion' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-xl' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        <Lightbulb className="w-4 h-4" /> Sugerencia
                                    </button>
                                </div>

                                <Input
                                    label="Título del Caso / Asunto"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Ej: Problema con ascensor, Sugerencia áreas verdes..."
                                    required
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Seleccionar Torre</label>
                                        <select
                                            required
                                            value={selectedTower}
                                            onChange={(e) => {
                                                setSelectedTower(e.target.value);
                                                setUnitId('');
                                            }}
                                            className="w-full bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 text-sm font-bold border-none focus:ring-4 focus:ring-indigo-500/10 text-gray-900 dark:text-white h-[58px]"
                                        >
                                            <option value="">-- Elija Torre --</option>
                                            {towers.map(t => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Unidad / Depto</label>
                                        <select
                                            required
                                            disabled={!selectedTower}
                                            value={unitId}
                                            onChange={(e) => setUnitId(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 text-sm font-bold border-none focus:ring-4 focus:ring-indigo-500/10 text-gray-900 dark:text-white h-[58px] disabled:opacity-50"
                                        >
                                            <option value="">-- Elija Unidad --</option>
                                            {towers.find(t => t.id === selectedTower)?.departments.map(d => (
                                                <option key={d.id} value={`${towers.find(t => t.id === selectedTower)?.name} - ${d.number}`}>{d.number}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Evidencia Fotográfica (Opcional)</label>
                                    <div className="flex gap-2">
                                        <label className="flex-1 flex items-center justify-center gap-2 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl cursor-pointer hover:border-indigo-400 transition-colors">
                                            <Upload className="w-4 h-4 text-gray-400" />
                                            <span className="text-[10px] font-black uppercase text-gray-400">Subir Imagen</span>
                                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                        </label>
                                        {image && (
                                            <div className="relative w-14 h-14">
                                                <img src={image} className="w-full h-full object-cover rounded-xl border border-gray-200" alt="Preview" />
                                                <button onClick={() => setImage(undefined)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descripción Detallada</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 text-sm font-bold border-none focus:ring-4 focus:ring-indigo-500/10 text-gray-900 dark:text-white min-h-[120px]"
                                        placeholder="Describa el problema o sugerencia con detalle..."
                                        required
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full py-4 text-sm font-black uppercase tracking-widest">
                                Enviar Caso
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

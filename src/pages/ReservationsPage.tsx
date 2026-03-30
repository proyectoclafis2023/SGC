import React, { useState } from 'react';
import { useCommonSpaces } from '../context/CommonSpaceContext';
import { useReservations } from '../context/ReservationContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import {
    Calendar, Plus, X, Search, Clock,
    Trash2, ShieldCheck, CreditCard, History, Info, AlertTriangle, Printer, FileUp
} from 'lucide-react';
import type { Reservation } from '../types';

export const ReservationsPage: React.FC = () => {
    const { user } = useAuth();
    const { spaces } = useCommonSpaces();
    const {
        reservations,
        reservationLogs,
        addReservation,
        deleteReservation,
        approveReservation,
        rejectReservation,
        confirmPayment,
        uploadSignedDocument
    } = useReservations();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);

    const [spaceId, setSpaceId] = useState('');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');

    const [selectedReservationForVoucher, setSelectedReservationForVoucher] = useState<Reservation | null>(null);

    const isAdmin = user?.role === 'admin' || user?.role === 'global_admin';

    const calculateEndTime = (start: string, duration?: number) => {
        if (!start) return '';
        const [hours, minutes] = start.split(':').map(Number);
        const endHours = (hours + (duration || 3)) % 24; // Default to 3 hours if not specified
        return `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    };

    const checkConflicts = (spaceId: string, date: string, start: string, end: string) => {
        return reservations.filter(r =>
            r.spaceId === spaceId &&
            r.date === date &&
            r.status !== 'rejected' &&
            (start < r.endTime && end > r.startTime)
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const space = spaces.find(s => s.id === spaceId);
        if (!space) return;

        const endTime = calculateEndTime(startTime, space.durationHours);

        // Validar fecha futura
        if (new Date(date) < new Date(new Date().setHours(0, 0, 0, 0))) {
            setError('La fecha no puede ser anterior a la actual.');
            return;
        }

        const conflicts = checkConflicts(spaceId, date, startTime, endTime);
        if (conflicts.length > 0) {
            setError(`Ya existe una reserva para este espacio en el horario ${conflicts[0].startTime} - ${conflicts[0].endTime}`);
            return;
        }

        await addReservation({
            spaceId,
            date,
            startTime,
            endTime,
            userId: user?.name || 'Sistema',
            notes: ''
        });

        setIsModalOpen(false);
        setSpaceId('');
        setDate('');
        setStartTime('');
    };

    const getSpaceName = (id: string) => spaces.find(s => s.id === id)?.name || 'Espacio no encontrado';

    const getStatusBadge = (status: string, paymentStatus: string) => {
        if (status === 'approved') {
            return (
                <div className="flex flex-col gap-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        Aprobada
                    </span>
                    {paymentStatus === 'paid' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            Pagada
                        </span>
                    ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            Pendiente Pago
                        </span>
                    )}
                </div>
            );
        }
        if (status === 'rejected') {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                    Rechazada
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 animate-pulse">
                Pendiente Aprobación
            </span>
        );
    };

    const totalRevenue = reservations
        .filter(r => r.paymentStatus === 'paid')
        .reduce((sum, r) => sum + (spaces.find(s => s.id === r.spaceId)?.rentalValue || 0), 0);

    const pendingRevenue = reservations
        .filter(r => r.status === 'approved' && r.paymentStatus === 'pending')
        .reduce((sum, r) => sum + (spaces.find(s => s.id === r.spaceId)?.rentalValue || 0), 0);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(value);
    };

    const filteredReservations = reservations.filter(r => {
        const matchesSearch = getSpaceName(r.spaceId).toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <Calendar className="w-8 h-8 text-indigo-600" />
                        Reservas de Espacios
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 font-bold">Gestiona el uso de las áreas comunes de la comunidad.</p>
                </div>
                <div className="flex gap-2">
                    {isAdmin && (
                        <Button variant="secondary" onClick={() => setIsLogsModalOpen(true)}>
                            <History className="w-4 h-4 mr-2" /> Historial
                        </Button>
                    )}
                    <Button onClick={() => setIsModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Nueva Solicitud
                    </Button>
                </div>
            </div>

            {isAdmin && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-[2rem] p-6 text-white shadow-lg shadow-indigo-500/30 flex items-center justify-between">
                        <div>
                            <p className="text-indigo-100 font-bold uppercase tracking-widest text-xs mb-1">Recaudación Consolidada</p>
                            <h3 className="text-3xl font-black">{formatCurrency(totalRevenue)}</h3>
                        </div>
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                            <CreditCard className="w-7 h-7" />
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-[2rem] p-6 text-white shadow-lg shadow-amber-500/30 flex items-center justify-between">
                        <div>
                            <p className="text-amber-100 font-bold uppercase tracking-widest text-xs mb-1">Pendiente de Pago (Aprobadas)</p>
                            <h3 className="text-3xl font-black">{formatCurrency(pendingRevenue)}</h3>
                        </div>
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                            <Clock className="w-7 h-7" />
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar por espacio..."
                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredReservations.map((res) => {
                    const isOwn = res.userId === user?.name;
                    const canViewDetails = isAdmin || isOwn;

                    return (
                        <div key={res.id} className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden group hover:shadow-xl transition-all relative">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl">
                                            <Calendar className="w-6 h-6 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Folio</p>
                                            <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 leading-none">{res.folio}</p>
                                        </div>
                                    </div>
                                    {getStatusBadge(res.status, res.paymentStatus)}
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight">
                                            {getSpaceName(res.spaceId)}
                                        </h3>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                                            {new Date(res.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-700">
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">Horario</p>
                                            <p className="text-sm font-black text-gray-900 dark:text-white">{res.startTime} - {res.endTime}</p>
                                        </div>
                                        <div className="flex-1 text-right">
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">Usuario</p>
                                            <p className="text-sm font-black text-gray-900 dark:text-white">{canViewDetails ? res.userId : 'Reservado'}</p>
                                        </div>
                                    </div>

                                    {res.status === 'rejected' && res.notes && (
                                        <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-100 dark:border-rose-900/30">
                                            <p className="text-[10px] font-black text-rose-600 uppercase mb-1">Motivo del Rechazo</p>
                                            <p className="text-xs text-rose-900 dark:text-rose-200">{res.notes}</p>
                                        </div>
                                    )}

                                    {isAdmin && res.status === 'pending' && (
                                        <div className="flex gap-2 pt-2">
                                            <button
                                                onClick={() => approveReservation(res.id, user?.name || 'admin')}
                                                className="flex-1 bg-emerald-50 text-emerald-600 py-3 rounded-xl text-xs font-black uppercase hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100"
                                            >
                                                Aprobar
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const reason = prompt('Motivo del rechazo (MANDATORIO):');
                                                    if (reason && reason.trim().length > 0) {
                                                        rejectReservation(res.id, user?.name || 'admin', reason);
                                                    } else {
                                                        alert("Debe ingresar un motivo para rechazar.");
                                                    }
                                                }}
                                                className="flex-1 bg-rose-50 text-rose-600 py-3 rounded-xl text-xs font-black uppercase hover:bg-rose-600 hover:text-white transition-all border border-rose-100"
                                            >
                                                Rechazar
                                            </button>
                                        </div>
                                    )}

                                    {isAdmin && res.status === 'approved' && res.paymentStatus === 'pending' && (
                                        <div className="flex gap-2 pt-2">
                                            <button
                                                onClick={() => confirmPayment(res.id, user?.name || 'admin')}
                                                className="flex-1 bg-blue-50 text-blue-600 py-3 rounded-xl text-xs font-black uppercase hover:bg-blue-600 hover:text-white transition-all border border-blue-100 flex items-center justify-center gap-2"
                                            >
                                                <CreditCard className="w-4 h-4" /> Confirmar Pago
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const reason = prompt('Motivo de la desaprobación (MANDATORIO):');
                                                    if (reason && reason.trim().length > 0) {
                                                        rejectReservation(res.id, user?.name || 'admin', reason);
                                                    } else {
                                                        alert("Debe ingresar un motivo para desaprobar.");
                                                    }
                                                }}
                                                className="flex-1 bg-rose-50 text-rose-600 py-3 rounded-xl text-xs font-black uppercase hover:bg-rose-600 hover:text-white transition-all border border-rose-100"
                                            >
                                                Desaprobar
                                            </button>
                                        </div>
                                    )}

                                    {res.status === 'approved' && (
                                        <div className="flex gap-2 pt-2">
                                            <button
                                                onClick={() => setSelectedReservationForVoucher(res)}
                                                className="flex-1 bg-indigo-50 text-indigo-600 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100 flex items-center justify-center gap-2"
                                            >
                                                <Printer className="w-4 h-4" /> Voucher
                                            </button>
                                            <label className="flex-1 bg-emerald-50 text-emerald-600 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 flex items-center justify-center gap-2 cursor-pointer">
                                                <FileUp className="w-4 h-4" />
                                                {res.signedDocumentUrl ? 'Actualizar' : 'Subir'}
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            alert(`Documento "${file.name}" cargado correctamente.`);
                                                            uploadSignedDocument(res.id, URL.createObjectURL(file));
                                                        }
                                                    }}
                                                />
                                            </label>
                                        </div>
                                    )}

                                    {isAdmin && (
                                        <button
                                            onClick={() => { if (confirm('¿Eliminar reserva?')) deleteReservation(res.id) }}
                                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal de Nueva Reserva */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] w-full max-w-md shadow-2xl border border-white/20 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b dark:border-gray-800 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-none">Nueva Reserva</h2>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-colors text-gray-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            {error && (
                                <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl flex gap-3 text-xs font-bold border border-rose-100 animate-in shake duration-500">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-gray-500 ml-1 uppercase tracking-widest">Espacio Común</label>
                                    <select
                                        value={spaceId}
                                        onChange={(e) => setSpaceId(e.target.value)}
                                        className="w-full rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                        required
                                    >
                                        <option value="">Seleccione un espacio...</option>
                                        {spaces.filter(s => !s.isArchived).map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.location})</option>
                                        ))}
                                    </select>
                                </div>

                                <Input
                                    label="Fecha del Evento"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                />

                                <div className="grid grid-cols-1 gap-4">
                                    <Input
                                        label="Hora de Inicio"
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        required
                                    />
                                    {spaceId && startTime && (
                                        <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/20">
                                            <div className="flex justify-between items-center mb-1">
                                                <p className="text-[10px] font-black text-amber-600 uppercase">Información de Reserva</p>
                                                <Info className="w-3 h-3 text-amber-600" />
                                            </div>
                                            <p className="text-sm font-bold text-amber-800 dark:text-amber-400">
                                                La reserva finalizará a las {calculateEndTime(startTime, spaces.find(s => s.id === spaceId)?.durationHours || 0)}
                                            </p>
                                            <p className="text-[10px] text-amber-600/80 mt-2 font-black uppercase">
                                                * Para garantizar la reserva debe consignar el pago en administración.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button type="button" variant="secondary" className="flex-1 py-4 font-black uppercase tracking-widest text-xs" onClick={() => setIsModalOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" className="flex-1 py-4 bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 font-black uppercase tracking-widest text-xs">
                                    Solicitar Reserva
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Log de Auditoría */}
            {isLogsModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] w-full max-w-2xl shadow-2xl border border-white/20 dark:border-gray-800 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b dark:border-gray-800 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-gray-500/30">
                                    <History className="w-6 h-6" />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-none">Registro de Auditoría</h2>
                            </div>
                            <button onClick={() => setIsLogsModalOpen(false)} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-colors text-gray-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 space-y-4">
                            {reservationLogs.map((log) => {
                                const res = reservations.find(r => r.id === log.reservationId);
                                return (
                                    <div key={log.id} className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                                        <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${log.action === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                                            log.action === 'rejected' ? 'bg-rose-100 text-rose-600' :
                                                'bg-blue-100 text-blue-600'
                                            }`}>
                                            <ShieldCheck className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                {log.details}
                                            </p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">
                                                {new Date(log.timestamp).toLocaleString()} • {log.userId} • {res ? getSpaceName(res.spaceId) : 'Espacio desconocido'}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal del Voucher */}
            {selectedReservationForVoucher && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-white/20 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-300 p-8">
                        <div className="flex justify-between items-start mb-6 print:hidden">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Comprobante de Reserva</h2>
                            <button onClick={() => setSelectedReservationForVoucher(null)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="print-area space-y-6">
                            <div className="text-center pb-6 border-b border-gray-100 dark:border-gray-800">
                                <Calendar className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
                                <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">VOUCHER</h1>
                                <p className="text-sm text-gray-500 uppercase tracking-widest font-bold mt-2">Reserva Confirmada</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Detalle del Espacio</p>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{getSpaceName(selectedReservationForVoucher.spaceId)}</h3>
                                    <p className="text-sm text-gray-600">{spaces.find(s => s.id === selectedReservationForVoucher.spaceId)?.location}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Fecha</p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{new Date(selectedReservationForVoucher.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Horario</p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedReservationForVoucher.startTime} - {selectedReservationForVoucher.endTime}</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl col-span-2">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Usuario</p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedReservationForVoucher.userId}</p>
                                    </div>
                                </div>
                            </div>

                            {spaces.find(s => s.id === selectedReservationForVoucher.spaceId)?.conditions && (
                                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Condiciones y Reglas del Espacio</p>
                                    <div className="text-xs text-gray-600 dark:text-gray-400 bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/20 whitespace-pre-wrap">
                                        {spaces.find(s => s.id === selectedReservationForVoucher.spaceId)?.conditions}
                                    </div>
                                </div>
                            )}

                            <div className="mt-12 pt-16 pb-8 border-t border-dashed border-gray-300 dark:border-gray-700 flex justify-center">
                                <div className="text-center">
                                    <div className="w-48 h-px bg-gray-400 dark:bg-gray-600 mb-2 mx-auto"></div>
                                    <p className="text-xs font-bold text-gray-500 uppercase">Firma del Residente</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 flex gap-4 print:hidden">
                            <Button className="w-full flex justify-center items-center gap-2" onClick={() => window.print()}>
                                <Printer className="w-4 h-4" /> Imprimir Documento
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

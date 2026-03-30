import React, { useState, useEffect } from 'react';
import { useSystemMessages } from '../context/SystemMessageContext';
import { useSettings } from '../context/SettingsContext';
import { useCommonSpaces } from '../context/CommonSpaceContext';
import { useReservations } from '../context/ReservationContext';
import { Bell, ShieldAlert, Info, CheckCircle2, AlertTriangle, Clock, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import type { SystemMessage } from '../types';

export const PublicCarouselPage: React.FC = () => {
    const { messages } = useSystemMessages();
    const { settings } = useSettings();
    const { spaces } = useCommonSpaces();
    const { reservations } = useReservations();

    const [currentTime, setCurrentTime] = useState(new Date());

    const upcomingReservations = [...reservations].filter(r => {
        if (r.status !== 'approved') return false;
        const resDate = new Date(`${r.date}T00:00:00`);
        const today = new Date(currentTime);
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        return resDate >= today && resDate <= nextWeek;
    }).sort((a, b) => new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime());

    const activeMessages = messages.filter(m => m.isActive && !m.isArchived);
    if (upcomingReservations.length > 0) {
        activeMessages.push({
            id: 'virtual-reservations',
            text: 'Reservas de la Semana',
            type: 'info',
            durationSeconds: 12,
            isActive: true,
            createdAt: new Date().toISOString()
        } as SystemMessage);
    }

    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        setCurrentIndex(0);
    }, [activeMessages.length]);

    useEffect(() => {
        if (activeMessages.length <= 1) {
            return;
        }

        const currentDuration = (activeMessages[currentIndex]?.durationSeconds || 8) * 1000;
        const timer = setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % activeMessages.length);
        }, currentDuration);

        return () => clearTimeout(timer);
    }, [activeMessages.length, currentIndex]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % activeMessages.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + activeMessages.length) % activeMessages.length);
    };

    const getMessageAssets = (type: SystemMessage['type']) => {
        switch (type) {
            case 'danger': return {
                icon: <ShieldAlert className="w-24 h-24 mb-6 animate-pulse" />,
                bg: 'bg-red-600',
                accent: 'bg-red-700',
                label: 'Aviso Crítico'
            };
            case 'warning': return {
                icon: <AlertTriangle className="w-24 h-24 mb-6" />,
                bg: 'bg-amber-500',
                accent: 'bg-amber-600',
                label: 'Advertencia'
            };
            case 'success': return {
                icon: <CheckCircle2 className="w-24 h-24 mb-6" />,
                bg: 'bg-emerald-600',
                accent: 'bg-emerald-700',
                label: 'Información Importante'
            };
            default: return {
                icon: <Info className="w-24 h-24 mb-6" />,
                bg: 'bg-blue-600',
                accent: 'bg-blue-700',
                label: 'Comunicado Personal'
            };
        }
    };

    const getYoutubeEmbedUrl = (url?: string) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}?autoplay=1&mute=1&controls=0&loop=1` : null;
    };

    if (activeMessages.length === 0) {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white px-6">
                <div className="text-center space-y-4">
                    <div className="w-24 h-24 bg-gray-800 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
                        <Bell className="w-12 h-12 text-gray-500" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tight">{settings.systemName}</h1>
                    <p className="text-xl text-gray-400">Sin avisos pendientes por mostrar en este momento.</p>
                </div>
            </div>
        );
    }

    const currentMsg = activeMessages[currentIndex];
    const assets = getMessageAssets(currentMsg.type);
    const ytUrl = getYoutubeEmbedUrl(currentMsg.youtubeUrl);

    return (
        <div className={`min-h-screen ${assets.bg} flex flex-col transition-colors duration-1000 text-white overflow-hidden relative`}>
            {/* Fondo Decorativo Dinámico */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-white opacity-20 blur-[150px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-black opacity-10 blur-[150px]" />
            </div>

            {/* Header del Carrusel */}
            <header className={`${assets.accent} px-12 py-8 flex items-center justify-between shadow-2xl relative z-20`}>
                <div className="flex items-center space-x-6">
                    {settings.systemLogo ? (
                        <img src={settings.systemLogo} alt="Logo" className="h-16 w-auto object-contain" />
                    ) : (
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-xl font-bold text-3xl shrink-0">
                            {settings.systemIcon}
                        </div>
                    )}
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase">{settings.systemName}</h1>
                        <p className="text-sm font-bold tracking-widest opacity-80 uppercase">Plataforma de Comunicación Comunitaria</p>
                    </div>
                </div>
                <div className="flex items-center bg-black/20 backdrop-blur-md px-8 py-4 rounded-3xl border border-white/20 shadow-inner">
                    <Clock className="w-8 h-8 mr-4 opacity-80" />
                    <div className="text-right">
                        <p className="text-3xl font-black tracking-widest leading-none">
                            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </p>
                        <p className="text-xs font-bold uppercase tracking-widest mt-1 opacity-70">
                            {currentTime.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                    </div>
                </div>
            </header>

            {/* Contenido Principal */}
            <main className="flex-1 flex items-center justify-center relative z-10 overflow-hidden">
                {currentMsg.id === 'virtual-reservations' ? (
                    <div className="max-w-7xl w-full flex flex-col items-center animate-in zoom-in-95 fade-in duration-700 px-6">
                        <div className="bg-white/10 backdrop-blur-xl p-10 rounded-[3rem] border border-white/20 shadow-2xl w-full">
                            <h2 className="text-4xl font-black uppercase tracking-widest text-center mb-8 flex items-center justify-center gap-4">
                                <Calendar className="w-10 h-10 text-indigo-300" /> Reservas Próximos 7 Días
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {upcomingReservations.slice(0, 6).map(res => (
                                    <div key={res.id} className="bg-black/20 p-6 rounded-3xl border border-white/10 flex flex-col items-start gap-4 hover:bg-black/30 transition-colors">
                                        <div className="w-full">
                                            <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-1">
                                                {new Date(res.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                            </p>
                                            <h3 className="text-xl font-black">{spaces.find(s => s.id === res.spaceId)?.name || 'Espacio'}</h3>
                                        </div>
                                        <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/5 w-full flex items-center gap-3">
                                            <Clock className="w-5 h-5 text-indigo-300" />
                                            <p className="text-lg font-bold tracking-widest">{res.startTime} - {res.endTime}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : currentMsg.isFullImage && currentMsg.image ? (
                    <div className="absolute inset-0 animate-in fade-in zoom-in-105 duration-1000">
                        <img src={currentMsg.image} alt="Full Screen" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 p-12 flex flex-col justify-end">
                            <div className="max-w-4xl space-y-4">
                                <span className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-[0.2em] border border-white/30">
                                    {assets.label}
                                </span>
                                <h2 className="text-6xl lg:text-7xl font-black drop-shadow-2xl leading-tight">{currentMsg.text}</h2>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-7xl w-full flex flex-col items-center text-center animate-in zoom-in-95 fade-in duration-700 px-6">
                        <div className="flex flex-col lg:flex-row items-center justify-center gap-12 w-full">
                            {(currentMsg.image || ytUrl) && (
                                <div className="w-full lg:w-1/2 rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white/20 shadow-black/40 aspect-video">
                                    {ytUrl ? (
                                        <iframe src={ytUrl} className="w-full h-full" frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen />
                                    ) : (
                                        <img src={currentMsg.image} className="w-full h-full object-cover" alt="Announcement" />
                                    )}
                                </div>
                            )}
                            <div className={`${(currentMsg.image || ytUrl) ? 'lg:w-1/2 lg:text-left' : 'w-full text-center'} space-y-8`}>
                                <div className={`${(currentMsg.image || ytUrl) ? 'lg:mx-0' : 'mx-auto'} ${assets.accent} p-8 lg:p-10 rounded-[4rem] shadow-2xl inline-block border border-white/10 mb-4`}>
                                    {assets.icon}
                                </div>
                                <div className="space-y-6">
                                    <span className="inline-block px-6 py-2 bg-white/20 backdrop-blur-md rounded-full text-sm font-black uppercase tracking-[0.3em] border border-white/30">
                                        {assets.label}
                                    </span>
                                    <p className={`${(currentMsg.image || ytUrl) ? 'text-5xl lg:text-6xl' : 'text-7xl lg:text-8xl'} font-black leading-tight tracking-tight drop-shadow-2xl`}>
                                        {currentMsg.text}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Controles de Navegación Manual */}
            {activeMessages.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        className="absolute left-6 top-1/2 transform -translate-y-1/2 z-30 p-4 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white/70 hover:text-white transition-all border border-white/10"
                    >
                        <ChevronLeft className="w-8 h-8" />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-6 top-1/2 transform -translate-y-1/2 z-30 p-4 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white/70 hover:text-white transition-all border border-white/10"
                    >
                        <ChevronRight className="w-8 h-8" />
                    </button>
                </>
            )}

            {/* Indicadores de Progreso / Footer */}
            <footer className="px-12 py-12 flex items-center justify-between relative z-10 shrink-0">
                <div className="flex space-x-4">
                    {activeMessages.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-4 rounded-full transition-all duration-500 border border-white/20 ${idx === currentIndex ? 'w-24 bg-white shadow-[0_0_20px_rgba(255,255,255,0.5)]' : 'w-4 bg-white/30'}`}
                        />
                    ))}
                </div>

                <div className="flex items-center bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 text-sm font-bold tracking-widest uppercase">
                    <span className="opacity-60 mr-4">Aviso</span>
                    <span className="text-2xl mr-4">{currentIndex + 1}</span>
                    <span className="opacity-30 mr-4">/</span>
                    <span className="opacity-60 mr-4">Total</span>
                    <span className="text-2xl">{activeMessages.length}</span>
                </div>
            </footer>

            {/* Barra de Tiempo para el siguiente cambio */}
            {activeMessages.length > 1 && (
                <div
                    key={`${currentIndex}-${activeMessages.length}`}
                    className="absolute bottom-0 left-0 h-2 bg-white/40 z-20"
                    style={{
                        animation: `progressLoop ${activeMessages[currentIndex]?.durationSeconds || 8}s linear forwards`
                    }}
                />
            )}

            <style>{`
                @keyframes progressLoop {
                    from { width: 0%; }
                    to { width: 100%; }
                }
            `}</style>
        </div>
    );
};

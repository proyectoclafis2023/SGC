import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Reservation, ReservationContextType, ReservationLog } from '../types';

const ReservationContext = createContext<ReservationContextType | undefined>(undefined);

const STORAGE_KEY = 'reservations_data';
const LOGS_STORAGE_KEY = 'reservation_logs_data';

export const ReservationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [reservations, setReservations] = useState<Reservation[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return [];
            const storedSpaces = localStorage.getItem('common_spaces_data');
            const spaces = storedSpaces ? JSON.parse(storedSpaces) : [];
            const parsed = JSON.parse(stored);

            return (parsed as Reservation[]).map((res) => {
                const updated = { ...res };
                if (!updated.folio) {
                    const dateStr = (updated.createdAt || new Date().toISOString()).slice(0, 10).replace(/-/g, '');
                    updated.folio = `RES-${dateStr}-${updated.id.slice(0, 4).toUpperCase()}`;
                }
                if (!updated.endTime || updated.endTime.includes('NaN')) {
                    if (updated.startTime) {
                        const space = spaces.find((s: any) => s.id === updated.spaceId);
                        const [hours, minutes] = updated.startTime.split(':').map(Number);
                        const duration = space?.durationHours || 3;
                        const endHours = (hours + duration) % 24;
                        updated.endTime = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                    }
                }
                return updated;
            });
        } catch (e) {
            console.error('Error loading reservations:', e);
            return [];
        }
    });

    const [reservationLogs, setReservationLogs] = useState<ReservationLog[]>(() => {
        try {
            const stored = localStorage.getItem(LOGS_STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Error loading logs:', e);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));
    }, [reservations]);

    useEffect(() => {
        localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(reservationLogs));
    }, [reservationLogs]);

    const addLog = (resId: string, userId: string, action: ReservationLog['action'], details: string) => {
        const newLog: ReservationLog = {
            id: Math.random().toString(36).substr(2, 9),
            reservationId: resId,
            userId,
            action,
            timestamp: new Date().toISOString(),
            details
        };
        setReservationLogs((prev: ReservationLog[]) => [newLog, ...prev]);
    };

    const generateFolio = (prefix: string) => {
        const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        return `${prefix}-${date}-${rand}`;
    };

    const addReservation = async (reservation: Omit<Reservation, 'id' | 'folio' | 'createdAt' | 'status' | 'paymentStatus'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newRes: Reservation = {
            ...reservation,
            id,
            folio: generateFolio('RES'),
            status: 'pending',
            paymentStatus: 'pending',
            createdAt: new Date().toISOString(),
        };
        setReservations((prev: Reservation[]) => [newRes, ...prev]);
        addLog(id, reservation.userId, 'created', 'Reserva solicitada por el usuario');
    };

    const updateReservation = async (reservation: Reservation) => {
        setReservations((prev: Reservation[]) => prev.map((r: Reservation) => r.id === reservation.id ? reservation : r));
    };

    const deleteReservation = async (id: string) => {
        setReservations((prev: Reservation[]) => prev.filter((r: Reservation) => r.id !== id));
    };

    const approveReservation = async (id: string, adminId: string) => {
        setReservations((prev: Reservation[]) => prev.map((r: Reservation) => r.id === id ? {
            ...r,
            status: 'approved',
            approvalUserId: adminId,
            approvalDate: new Date().toISOString()
        } : r));
        addLog(id, adminId, 'approved', 'Reserva aprobada por administración');
    };

    const rejectReservation = async (id: string, adminId: string, reason: string) => {
        setReservations((prev: Reservation[]) => prev.map((r: Reservation) => r.id === id ? {
            ...r,
            status: 'rejected',
            notes: reason
        } : r));
        addLog(id, adminId, 'rejected', `Reserva rechazada: ${reason}`);
    };

    const confirmPayment = async (id: string, adminId: string) => {
        setReservations((prev: Reservation[]) => prev.map((r: Reservation) => r.id === id ? {
            ...r,
            paymentStatus: 'paid'
        } : r));
        addLog(id, adminId, 'payment_confirmed', 'Pago registrado por administración');
    };

    const uploadSignedDocument = async (id: string, url: string) => {
        setReservations((prev: Reservation[]) => prev.map((r: Reservation) => r.id === id ? {
            ...r,
            signedDocumentUrl: url
        } : r));
    };

    return (
        <ReservationContext.Provider value={{
            reservations,
            reservationLogs,
            addReservation,
            updateReservation,
            deleteReservation,
            approveReservation,
            rejectReservation,
            confirmPayment,
            uploadSignedDocument
        }}>
            {children}
        </ReservationContext.Provider>
    );
};

export const useReservations = () => {
    const context = useContext(ReservationContext);
    if (!context) throw new Error('useReservations must be used within ReservationProvider');
    return context;
};

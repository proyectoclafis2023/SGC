import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Ticket, TicketContextType } from '../types';

const TicketContext = createContext<TicketContextType | undefined>(undefined);

export const TicketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tickets, setTickets] = useState<Ticket[]>(() => {
        const saved = localStorage.getItem('sgc_tickets');
        if (!saved) return [];
        try {
            const parsed = JSON.parse(saved);
            return (parsed as Ticket[]).map(t => {
                if (!t.folio) {
                    const dateStr = (t.createdAt || new Date().toISOString()).slice(0, 10).replace(/-/g, '');
                    return { ...t, folio: `TCK-${dateStr}-${t.id.slice(-4).toUpperCase()}` };
                }
                return t;
            });
        } catch (e) {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('sgc_tickets', JSON.stringify(tickets));
    }, [tickets]);

    // Escuchar cambios en otras pestañas
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'sgc_tickets' && e.newValue) {
                setTickets(JSON.parse(e.newValue));
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const generateFolio = (prefix: string) => {
        const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        return `${prefix}-${date}-${rand}`;
    };

    const addTicket = async (ticketData: Omit<Ticket, 'id' | 'folio' | 'status' | 'createdAt' | 'updatedAt'>) => {
        const id = `TCK-${Date.now()}`;
        const newTicket: Ticket = {
            ...ticketData,
            id,
            folio: generateFolio('TCK'),
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        setTickets(prev => [newTicket, ...prev]);
    };

    const updateTicketStatus = async (id: string, status: Ticket['status'], adminNotes?: string) => {
        setTickets(prev => prev.map(t => {
            if (t.id === id) {
                const historyEntry = {
                    status: t.status,
                    notes: t.adminNotes || 'Sin notas',
                    date: new Date().toISOString(),
                    user: 'Sistema/Administrador' // Simplified for context
                };

                return {
                    ...t,
                    status,
                    updatedAt: new Date().toISOString(),
                    adminNotes: adminNotes !== undefined ? adminNotes : t.adminNotes,
                    history: [...(t.history || []), historyEntry]
                };
            }
            return t;
        }));
    };

    const deleteTicket = async (id: string) => {
        setTickets(prev => prev.filter(t => t.id !== id));
    };

    return (
        <TicketContext.Provider value={{
            tickets,
            addTicket,
            updateTicketStatus,
            deleteTicket
        }}>
            {children}
        </TicketContext.Provider>
    );
};

export const useTickets = () => {
    const context = useContext(TicketContext);
    if (context === undefined) {
        throw new Error('useTickets must be used within a TicketProvider');
    }
    return context;
};

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { SystemMessage, SystemMessageContextType } from '../types';

const SystemMessageContext = createContext<SystemMessageContextType | undefined>(undefined);

const STORAGE_KEY = 'system_messages_data';

export const SystemMessageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [messages, setMessages] = useState<SystemMessage[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [
                { id: '1', text: 'Portón principal en reparación - Acceso por lateral', type: 'warning', isActive: true, createdAt: new Date().toISOString() },
                { id: '2', text: 'Corte de agua programado - Miércoles 10:00 AM', type: 'danger', isActive: true, createdAt: new Date().toISOString() },
                { id: '3', text: 'Mantenimiento de piscinas finalizado', type: 'success', isActive: true, createdAt: new Date().toISOString() },
                { id: '4', text: 'Proton malo o con fallas. Operar de forma manual.', type: 'danger', isActive: false, createdAt: new Date(Date.now() - 86400000).toISOString() },
                { id: '5', text: 'Problemas con hidropack, se está gestionando servicio técnico.', type: 'warning', isActive: false, createdAt: new Date(Date.now() - 172800000).toISOString() },
                { id: '6', text: 'Corte de servicio eléctrico programado - Viernes 14:00 PM', type: 'warning', isActive: false, createdAt: new Date(Date.now() - 259200000).toISOString() }
            ];
        } catch (e) {
            console.error('Error loading system messages:', e);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }, [messages]);

    // Escuchar cambios desde otras pestañas (ej: Master de Mensajes -> Visor)
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY && e.newValue) {
                setMessages(JSON.parse(e.newValue));
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const addMessage = async (message: Omit<SystemMessage, 'id' | 'createdAt'>) => {
        const newMessage: SystemMessage = {
            ...message,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString(),
        };
        setMessages(prev => [newMessage, ...prev]);
    };

    const updateMessage = async (message: SystemMessage) => {
        setMessages(prev => prev.map(m => m.id === message.id ? message : m));
    };

    const deleteMessage = async (id: string) => {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, isArchived: true } : m));
    };

    const toggleMessageStatus = async (id: string) => {
        setMessages(prev => prev.map(m =>
            m.id === id ? { ...m, isActive: !m.isActive } : m
        ));
    };

    return (
        <SystemMessageContext.Provider value={{ messages, addMessage, updateMessage, deleteMessage, toggleMessageStatus }}>
            {children}
        </SystemMessageContext.Provider>
    );
};

export const useSystemMessages = () => {
    const context = useContext(SystemMessageContext);
    if (!context) throw new Error('useSystemMessages must be used within SystemMessageProvider');
    return context;
};

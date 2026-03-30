import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { HistoryLog } from '../types';

interface HistoryLogContextType {
    logs: HistoryLog[];
    addLog: (log: Omit<HistoryLog, 'id' | 'timestamp'>) => Promise<void>;
    getLogsByEntity: (entityType: HistoryLog['entityType'], entityId: string) => HistoryLog[];
}

const HistoryLogContext = createContext<HistoryLogContextType | undefined>(undefined);

const STORAGE_KEY = 'sgc_history_logs';

export const HistoryLogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [logs, setLogs] = useState<HistoryLog[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Error loading history logs:', e);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    }, [logs]);

    const addLog = async (log: Omit<HistoryLog, 'id' | 'timestamp'>) => {
        const newLog: HistoryLog = {
            ...log,
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString()
        };
        setLogs(prev => [newLog, ...prev]);
    };

    const getLogsByEntity = (entityType: HistoryLog['entityType'], entityId: string) => {
        return logs.filter(l => l.entityType === entityType && l.entityId === entityId);
    };

    return (
        <HistoryLogContext.Provider value={{ logs, addLog, getLogsByEntity }}>
            {children}
        </HistoryLogContext.Provider>
    );
};

export const useHistoryLogs = () => {
    const context = useContext(HistoryLogContext);
    if (!context) throw new Error('useHistoryLogs must be used within HistoryLogProvider');
    return context;
};

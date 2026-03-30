import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Visitor, VisitorContextType } from '../types';

const VisitorContext = createContext<VisitorContextType | undefined>(undefined);

const STORAGE_KEY = 'sgc_visitors_data';

export const VisitorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [visitors, setVisitors] = useState<Visitor[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return [];
            const parsed = JSON.parse(stored);

            // Retrocompatibility for folios
            return (parsed as Visitor[]).map(v => {
                if (!v.folio) {
                    const dateStr = (v.createdAt || new Date().toISOString()).slice(0, 10).replace(/-/g, '');
                    return { ...v, folio: `VIS-${dateStr}-${v.id.slice(-4).toUpperCase()}` };
                }
                return v;
            });
        } catch (e) {
            console.error('Error loading visitors:', e);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(visitors));
    }, [visitors]);

    const generateFolio = (prefix: string) => {
        const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        return `${prefix}-${dateStr}-${rand}`;
    };

    const addVisitor = async (visitor: Omit<Visitor, 'id' | 'folio' | 'createdAt'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newRecord: Visitor = {
            ...visitor,
            id,
            folio: generateFolio('VIS'),
            createdAt: new Date().toISOString()
        };
        setVisitors(prev => [newRecord, ...prev]);
    };

    const updateVisitorStatus = async (id: string, status: Visitor['status'], time?: string) => {
        setVisitors(prev => prev.map(v => {
            if (v.id === id) {
                const updated = { ...v, status };
                if (status === 'entered') updated.entryTime = time || new Date().toLocaleTimeString();
                if (status === 'exited') updated.exitTime = time || new Date().toLocaleTimeString();
                return updated;
            }
            return v;
        }));
    };

    const deleteVisitor = async (id: string) => {
        setVisitors(prev => prev.filter(v => v.id !== id));
    };

    return (
        <VisitorContext.Provider value={{ visitors, addVisitor, updateVisitorStatus, deleteVisitor }}>
            {children}
        </VisitorContext.Provider>
    );
};

export const useVisitors = () => {
    const context = useContext(VisitorContext);
    if (!context) throw new Error('useVisitors must be used within VisitorProvider');
    return context;
};

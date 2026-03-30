import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { ContractorVisit, ContractorVisitContextType } from '../types';

const ContractorVisitContext = createContext<ContractorVisitContextType | undefined>(undefined);

const STORAGE_KEY = 'sgc_contractor_visits_data';

export const ContractorVisitProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [visits, setVisits] = useState<ContractorVisit[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Error loading contractor visits:', e);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(visits));
    }, [visits]);

    const generateFolio = (prefix: string) => {
        const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        return `${prefix}-${dateStr}-${rand}`;
    };

    const addVisit = async (visit: Omit<ContractorVisit, 'id' | 'folio' | 'createdAt' | 'status'>) => {
        const newRecord: ContractorVisit = {
            ...visit,
            id: Math.random().toString(36).substr(2, 9),
            folio: generateFolio('CTR'),
            status: 'entered',
            createdAt: new Date().toISOString()
        };
        setVisits(prev => [newRecord, ...prev]);
    };

    const updateVisitStatus = async (id: string, status: ContractorVisit['status']) => {
        setVisits(prev => prev.map(v =>
            v.id === id
                ? { ...v, status, exitTime: status === 'exited' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : v.exitTime }
                : v
        ));
    };

    return (
        <ContractorVisitContext.Provider value={{ visits, addVisit, updateVisitStatus }}>
            {children}
        </ContractorVisitContext.Provider>
    );
};

export const useContractorVisits = () => {
    const context = useContext(ContractorVisitContext);
    if (!context) throw new Error('useContractorVisits must be used within ContractorVisitProvider');
    return context;
};

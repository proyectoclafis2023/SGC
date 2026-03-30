import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Contractor, ContractorContextType } from '../types';

const ContractorContext = createContext<ContractorContextType | undefined>(undefined);

const STORAGE_KEY = 'sgc_contractors_data';

export const ContractorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [contractors, setContractors] = useState<Contractor[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return [];
            const parsed = JSON.parse(stored);

            // Retrocompatibility for folios
            return (parsed as Contractor[]).map(c => {
                if (!c.folio) {
                    const dateStr = (c.createdAt || new Date().toISOString()).slice(0, 10).replace(/-/g, '');
                    return { ...c, folio: `CON-${dateStr}-${c.id.slice(-4).toUpperCase()}` };
                }
                return c;
            });
        } catch (e) {
            console.error('Error loading contractors:', e);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(contractors));
    }, [contractors]);

    const generateFolio = (prefix: string) => {
        const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        return `${prefix}-${dateStr}-${rand}`;
    };

    const addContractor = async (contractor: Omit<Contractor, 'id' | 'folio' | 'createdAt'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newRecord: Contractor = {
            ...contractor,
            id,
            folio: generateFolio('CON'),
            createdAt: new Date().toISOString()
        };
        setContractors(prev => [newRecord, ...prev]);
    };

    const updateContractor = async (contractor: Contractor) => {
        setContractors(prev => prev.map(c => c.id === contractor.id ? contractor : c));
    };

    const deleteContractor = async (id: string) => {
        setContractors(prev => prev.filter(c => c.id !== id));
    };

    return (
        <ContractorContext.Provider value={{ contractors, addContractor, updateContractor, deleteContractor }}>
            {children}
        </ContractorContext.Provider>
    );
};

export const useContractors = () => {
    const context = useContext(ContractorContext);
    if (!context) throw new Error('useContractors must be used within ContractorProvider');
    return context;
};

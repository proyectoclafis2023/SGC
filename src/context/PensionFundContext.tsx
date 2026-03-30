import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { PensionFund, PensionFundContextType } from '../types';

const PensionFundContext = createContext<PensionFundContextType | undefined>(undefined);

const STORAGE_KEY = 'pension_funds_data';

const DEFAULT_FUNDS: PensionFund[] = [
    { id: '1', name: 'AFP Capital', discountRate: 11.44 },
    { id: '2', name: 'AFP Cuprum', discountRate: 11.44 },
    { id: '3', name: 'AFP Habitat', discountRate: 11.27 },
    { id: '4', name: 'AFP Modelo', discountRate: 10.58 },
    { id: '5', name: 'AFP PlanVital', discountRate: 11.16 },
    { id: '6', name: 'AFP ProVida', discountRate: 11.45 },
    { id: '7', name: 'AFP Uno', discountRate: 10.69 }
];

export const PensionFundProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [funds, setFunds] = useState<PensionFund[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : DEFAULT_FUNDS;
        } catch (e) {
            console.error('Error loading pension funds:', e);
            return DEFAULT_FUNDS;
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(funds));
    }, [funds]);

    const addFund = async (fund: Omit<PensionFund, 'id'>) => {
        const newFund: PensionFund = {
            ...fund,
            id: Math.random().toString(36).substr(2, 9),
        };
        setFunds(prev => [...prev, newFund]);
    };

    const updateFund = async (fund: PensionFund) => {
        setFunds(prev => prev.map(f => f.id === fund.id ? fund : f));
    };

    const deleteFund = async (id: string) => {
        setFunds(prev => prev.map(f => f.id === id ? { ...f, isArchived: true } : f));
    };

    return (
        <PensionFundContext.Provider value={{ funds, addFund, updateFund, deleteFund }}>
            {children}
        </PensionFundContext.Provider>
    );
};

export const usePensionFunds = () => {
    const context = useContext(PensionFundContext);
    if (!context) throw new Error('usePensionFunds must be used within PensionFundProvider');
    return context;
};

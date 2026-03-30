import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Bank, BankContextType } from '../types';

const BankContext = createContext<BankContextType | undefined>(undefined);

const STORAGE_KEY = 'banks_data';
const API_URL = 'http://localhost:3001/api/banks';

export const BankProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [banks, setBanks] = useState<Bank[]>([]);

    useEffect(() => {
        const fetchBanks = async () => {
            try {
                const response = await fetch(API_URL);
                if (response.ok) setBanks(await response.json());
                else {
                    const stored = localStorage.getItem(STORAGE_KEY);
                    if (stored) setBanks(JSON.parse(stored));
                }
            } catch (e) {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) setBanks(JSON.parse(stored));
            }
        };
        fetchBanks();
    }, []);

    useEffect(() => {
        if (banks.length > 0) localStorage.setItem(STORAGE_KEY, JSON.stringify(banks));
    }, [banks]);

    const addBank = async (bank: Omit<Bank, 'id'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        setBanks(prev => [{ ...bank, id }, ...prev]);
        return id;
    };

    const updateBank = async (bank: Bank) => {
        setBanks(prev => prev.map(b => b.id === bank.id ? bank : b));
    };

    const deleteBank = async (id: string) => {
        setBanks(prev => prev.map(b => b.id === id ? { ...b, isArchived: true } : b));
    };

    return (
        <BankContext.Provider value={{ banks, addBank, updateBank, deleteBank }}>
            {children}
        </BankContext.Provider>
    );
};

export const useBanks = () => {
    const context = useContext(BankContext);
    if (!context) throw new Error('useBanks must be used within BankProvider');
    return context;
};

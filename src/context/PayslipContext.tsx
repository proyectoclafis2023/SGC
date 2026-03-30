import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Payslip, Advance, PayslipContextType } from '../types';

const PayslipContext = createContext<PayslipContextType | undefined>(undefined);

const PAYSLIP_STORAGE_KEY = 'condo_payslips';
const ADVANCE_STORAGE_KEY = 'condo_advances';

const generateId = () => Math.random().toString(36).substring(2, 15);

export const PayslipProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [payslips, setPayslips] = useState<Payslip[]>(() => {
        const stored = localStorage.getItem(PAYSLIP_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    });

    const [advances, setAdvances] = useState<Advance[]>(() => {
        const stored = localStorage.getItem(ADVANCE_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    });

    useEffect(() => {
        localStorage.setItem(PAYSLIP_STORAGE_KEY, JSON.stringify(payslips));
    }, [payslips]);

    useEffect(() => {
        localStorage.setItem(ADVANCE_STORAGE_KEY, JSON.stringify(advances));
    }, [advances]);

    const addPayslip = async (data: Omit<Payslip, 'id' | 'folio' | 'generatedAt'>): Promise<Payslip> => {
        const lastFolio = payslips.length > 0 ? parseInt(payslips[0].folio) : 5000;
        const newPayslip: Payslip = {
            ...data,
            id: generateId(),
            folio: (lastFolio + 1).toString(),
            generatedAt: new Date().toISOString(),
        };

        setPayslips(prev => [newPayslip, ...prev]);

        // Auto-mark pending advances as deducted if they match the person and period?
        // For now, the UI will handle selecting which advances to deduct.
        return newPayslip;
    };

    const deletePayslip = async (id: string) => {
        setPayslips(prev => prev.filter(p => p.id !== id));
        // Reset advances that were linked to this payslip
        setAdvances(prev => prev.map(adv =>
            adv.payslipId === id ? { ...adv, status: 'pending', payslipId: undefined } : adv
        ));
    };

    const addAdvance = async (data: Omit<Advance, 'id' | 'status'>) => {
        const id = generateId();
        const newAdvance: Advance = {
            ...data,
            id,
            status: 'pending'
        };
        setAdvances(prev => [newAdvance, ...prev]);
        return id;
    };

    const updateAdvanceStatus = async (id: string, status: Advance['status'], payslipId?: string) => {
        setAdvances(prev => prev.map(adv =>
            adv.id === id ? { ...adv, status, payslipId } : adv
        ));
    };

    const deleteAdvance = async (id: string) => {
        setAdvances(prev => prev.filter(adv => adv.id !== id));
    };

    return (
        <PayslipContext.Provider value={{
            payslips,
            advances,
            addPayslip,
            deletePayslip,
            addAdvance,
            updateAdvanceStatus,
            deleteAdvance
        }}>
            {children}
        </PayslipContext.Provider>
    );
};

export const usePayslips = () => {
    const context = useContext(PayslipContext);
    if (!context) {
        throw new Error('usePayslips must be used within a PayslipProvider');
    }
    return context;
};

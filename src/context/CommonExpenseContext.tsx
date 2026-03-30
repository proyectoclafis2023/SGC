import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { CommonExpensePayment, CommonExpenseContextType, SpecialFund, CommonExpenseRule, CommunityExpense } from '../types';

const CommonExpenseContext = createContext<CommonExpenseContextType | undefined>(undefined);

const API_URL = 'http://localhost:3001/api/common-expenses';

export const CommonExpenseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [payments, setPayments] = useState<CommonExpensePayment[]>([]);
    const [rules, setRules] = useState<CommonExpenseRule[]>([]);
    const [funds, setFunds] = useState<SpecialFund[]>([]);
    const [communityExpenses, setCommunityExpenses] = useState<CommunityExpense[]>([]);

    /**
     * Obtiene el historial de pagos desde el backend.
     */
    const fetchPayments = React.useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/payments`);
            if (response.ok) {
                const data = await response.json();
                setPayments(data);
            }
        } catch (e) { console.error('Error fetching payments:', e); }
    }, []);

    /**
     * Obtiene las reglas de precios vigentes.
     */
    const fetchRules = React.useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/rules`);
            if (response.ok) {
                const data = await response.json();
                setRules(data);
            }
        } catch (e) { console.error('Error fetching rules:', e); }
    }, []);

    /**
     * Obtiene los fondos especiales (activos y archivados según API).
     */
    const fetchFunds = React.useCallback(async (includeArchived = false) => {
        try {
            const response = await fetch(`${API_URL}/funds?includeArchived=${includeArchived}`);
            if (response.ok) setFunds(await response.json());
        } catch (e) { console.error('Error fetching funds:', e); }
    }, []);

    /**
     * Obtiene los egresos de la comunidad (gastos operacionales).
     */
    const fetchCommunityExpenses = React.useCallback(async (includeArchived = false) => {
        try {
            const response = await fetch(`${API_URL}/community-expenses?includeArchived=${includeArchived}`);
            if (response.ok) setCommunityExpenses(await response.json());
        } catch (e) {
            console.error('Error fetching community expenses:', e);
            // Fallback to localStorage if API fails (useful for development)
            const local = localStorage.getItem('sgc_community_expenses');
            if (local) setCommunityExpenses(JSON.parse(local));
        }
    }, []);

    useEffect(() => {
        fetchPayments();
        fetchRules();
        fetchFunds();
        fetchCommunityExpenses();
    }, [fetchPayments, fetchRules, fetchFunds, fetchCommunityExpenses]);

    /**
     * Registra un nuevo pago de gasto común.
     */
    const addPayment = React.useCallback(async (payment: Omit<CommonExpensePayment, 'id' | 'createdAt'>) => {
        try {
            const response = await fetch(`${API_URL}/payments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payment)
            });
            if (response.ok) fetchPayments();
        } catch (e) { console.error('Error adding payment:', e); }
    }, [fetchPayments]);

    const updatePayment = React.useCallback(async (_payment: CommonExpensePayment) => {
        // Implementar PUT si es necesario
    }, []);

    const deletePayment = React.useCallback(async (_id: string) => {
        // Implementar DELETE si es necesario
    }, []);

    const addRule = React.useCallback(async (rule: Omit<CommonExpenseRule, 'id' | 'createdAt'>) => {
        try {
            const response = await fetch(`${API_URL}/rules`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(rule)
            });
            if (response.ok) fetchRules();
        } catch (e) { console.error('Error adding rule:', e); }
    }, [fetchRules]);

    const calculateAmount = React.useCallback(async (deptId: string) => {
        try {
            const response = await fetch(`${API_URL}/calculate/${deptId}`);
            if (response.ok) return await response.json();
        } catch (e) { console.error('Error calculating amount:', e); }
        return { suggestedAmount: 0, ruleUsed: null };
    }, []);

    const addFund = React.useCallback(async (fund: Omit<SpecialFund, 'id' | 'createdAt'>) => {
        try {
            const response = await fetch(`${API_URL}/funds`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fund)
            });
            if (response.ok) fetchFunds();
        } catch (e) { console.error('Error adding fund:', e); }
    }, [fetchFunds]);

    const updateFund = React.useCallback(async (fund: SpecialFund) => {
        try {
            const response = await fetch(`${API_URL}/funds/${fund.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fund)
            });
            if (response.ok) fetchFunds();
        } catch (e) { console.error('Error updating fund:', e); }
    }, [fetchFunds]);

    /**
     * Elimina (archiva) un fondo especial.
     */
    const deleteFund = React.useCallback(async (id: string) => {
        try {
            const response = await fetch(`${API_URL}/funds/${id}`, { method: 'DELETE' });
            if (response.ok) fetchFunds();
        } catch (e) { console.error('Error deleting fund:', e); }
    }, [fetchFunds]);

    /**
     * Restaura un fondo especial archivado.
     */
    const restoreFund = React.useCallback(async (id: string) => {
        try {
            const response = await fetch(`${API_URL}/funds/restore/${id}`, { method: 'POST' });
            if (response.ok) fetchFunds();
        } catch (e) { console.error('Error restoring fund:', e); }
    }, [fetchFunds]);

    /**
     * Agrega un gasto de la comunidad.
     */
    const addCommunityExpense = React.useCallback(async (expense: Omit<CommunityExpense, 'id' | 'createdAt'>) => {
        try {
            const response = await fetch(`${API_URL}/community-expenses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(expense)
            });
            if (response.ok) {
                fetchCommunityExpenses();
                return;
            }
        } catch (e) { console.error('Error adding community expense:', e); }

        // Fallback to localStorage
        const newExpense: CommunityExpense = {
            ...expense,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString()
        };
        const updated = [newExpense, ...communityExpenses];
        setCommunityExpenses(updated);
        localStorage.setItem('sgc_community_expenses', JSON.stringify(updated));
    }, [communityExpenses, fetchCommunityExpenses]);

    /**
     * Elimina un gasto de la comunidad.
     */
    const deleteCommunityExpense = React.useCallback(async (id: string) => {
        try {
            const response = await fetch(`${API_URL}/community-expenses/${id}`, { method: 'DELETE' });
            if (response.ok) {
                fetchCommunityExpenses();
                return;
            }
        } catch (e) { console.error('Error deleting community expense:', e); }

        const updated = communityExpenses.filter(e => e.id !== id);
        setCommunityExpenses(updated);
        localStorage.setItem('sgc_community_expenses', JSON.stringify(updated));
    }, [communityExpenses, fetchCommunityExpenses]);

    return (
        <CommonExpenseContext.Provider value={{
            payments, funds, rules, communityExpenses, fetchPayments, fetchFunds, fetchCommunityExpenses,
            addPayment, updatePayment, deletePayment,
            addFund, updateFund, deleteFund, restoreFund, addRule, calculateAmount,
            addCommunityExpense, deleteCommunityExpense
        }}>
            {children}
        </CommonExpenseContext.Provider>
    );
};

export const useCommonExpenses = () => {
    const context = useContext(CommonExpenseContext);
    if (!context) throw new Error('useCommonExpenses must be used within CommonExpenseProvider');
    return context;
};

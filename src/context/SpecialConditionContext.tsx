import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { SpecialCondition, SpecialConditionContextType } from '../types';

const SpecialConditionContext = createContext<SpecialConditionContextType | undefined>(undefined);

const STORAGE_KEY = 'special_conditions_data';

const INITIAL_CONDITIONS: SpecialCondition[] = [
    { id: '1', name: 'Electrodependiente', description: 'Persona que requiere suministro eléctrico continuo.' },
    { id: '2', name: 'Oxígeno dependiente', description: 'Persona que requiere apoyo de oxígeno.' },
    { id: '3', name: 'Residente mayor sin compañía', description: 'Adulto mayor que vive solo.' },
];

export const SpecialConditionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [conditions, setConditions] = useState<SpecialCondition[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : INITIAL_CONDITIONS;
        } catch (e) {
            console.error('Error loading special conditions:', e);
            return INITIAL_CONDITIONS;
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(conditions));
    }, [conditions]);

    const addCondition = async (condition: Omit<SpecialCondition, 'id'>) => {
        const newCondition: SpecialCondition = {
            ...condition,
            id: Math.random().toString(36).substr(2, 9),
        };
        setConditions(prev => [...prev, newCondition]);
    };

    const updateCondition = async (updatedCondition: SpecialCondition) => {
        setConditions(prev => prev.map(c => c.id === updatedCondition.id ? updatedCondition : c));
    };

    const deleteCondition = async (id: string) => {
        setConditions(prev => prev.map(c => c.id === id ? { ...c, isArchived: true } : c));
    };

    return (
        <SpecialConditionContext.Provider value={{ conditions, addCondition, updateCondition, deleteCondition }}>
            {children}
        </SpecialConditionContext.Provider>
    );
};

export const useSpecialConditions = () => {
    const context = useContext(SpecialConditionContext);
    if (!context) throw new Error('useSpecialConditions must be used within SpecialConditionProvider');
    return context;
};

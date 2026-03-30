import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { UnitType, UnitTypeContextType } from '../types';

const UnitTypeContext = createContext<UnitTypeContextType | undefined>(undefined);

const STORAGE_KEY = 'unit_types_data';

const INITIAL_TYPES: UnitType[] = [
    { id: 't1', name: 'Departamento Estándar', baseCommonExpense: 55000 },
    { id: 't2', name: 'Departamento Duplex', baseCommonExpense: 85000 },
    { id: 't3', name: 'Penthouse', baseCommonExpense: 120000 },
    { id: 't4', name: 'Estacionamiento', baseCommonExpense: 15000 },
    { id: 't5', name: 'Bodega', baseCommonExpense: 8000 },
];

export const UnitTypeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [unitTypes, setUnitTypes] = useState<UnitType[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : INITIAL_TYPES;
        } catch (e) {
            console.error('Error loading unit types:', e);
            return INITIAL_TYPES;
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(unitTypes));
    }, [unitTypes]);

    const addUnitType = async (unitType: Omit<UnitType, 'id'>) => {
        const newType: UnitType = {
            ...unitType,
            id: Math.random().toString(36).substr(2, 9),
        };
        setUnitTypes(prev => [...prev, newType]);
    };

    const updateUnitType = async (updatedType: UnitType) => {
        setUnitTypes(prev => prev.map(t => t.id === updatedType.id ? updatedType : t));
    };

    const deleteUnitType = async (id: string) => {
        setUnitTypes(prev => prev.map(t => t.id === id ? { ...t, isArchived: true } : t));
    };

    return (
        <UnitTypeContext.Provider value={{ unitTypes, addUnitType, updateUnitType, deleteUnitType }}>
            {children}
        </UnitTypeContext.Provider>
    );
};

export const useUnitTypes = () => {
    const context = useContext(UnitTypeContext);
    if (!context) throw new Error('useUnitTypes must be used within UnitTypeProvider');
    return context;
};

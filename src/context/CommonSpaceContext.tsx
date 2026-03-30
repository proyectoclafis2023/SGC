import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { CommonSpace, CommonSpaceContextType } from '../types';

const CommonSpaceContext = createContext<CommonSpaceContextType | undefined>(undefined);

const STORAGE_KEY = 'common_spaces_data';

const INITIAL_SPACES: CommonSpace[] = [
    { id: '1', name: 'Quincho Principal', location: 'Azotea Torre A', rentalValue: 15000, durationHours: 4 },
    { id: '2', name: 'Sala de Eventos', location: 'Primer Piso', rentalValue: 25000, durationHours: 6 },
    { id: '3', name: 'Gimnasio', location: 'Subsuelo', rentalValue: 0, durationHours: 1 },
];

export const CommonSpaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [spaces, setSpaces] = useState<CommonSpace[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : INITIAL_SPACES;
        } catch (e) {
            console.error('Error loading spaces:', e);
            return INITIAL_SPACES;
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(spaces));
    }, [spaces]);

    const addSpace = async (space: Omit<CommonSpace, 'id'>) => {
        const newSpace: CommonSpace = {
            ...space,
            id: Math.random().toString(36).substr(2, 9),
        };
        setSpaces(prev => [...prev, newSpace]);
    };

    const updateSpace = async (space: CommonSpace) => {
        setSpaces(prev => prev.map(s => s.id === space.id ? space : s));
    };

    const deleteSpace = async (id: string) => {
        setSpaces(prev => prev.map(s => s.id === id ? { ...s, isArchived: true } : s));
    };

    return (
        <CommonSpaceContext.Provider value={{ spaces, addSpace, updateSpace, deleteSpace }}>
            {children}
        </CommonSpaceContext.Provider>
    );
};

export const useCommonSpaces = () => {
    const context = useContext(CommonSpaceContext);
    if (!context) throw new Error('useCommonSpaces must be used within CommonSpaceProvider');
    return context;
};

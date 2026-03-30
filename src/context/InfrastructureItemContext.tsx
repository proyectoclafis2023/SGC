import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { InfrastructureItem, InfrastructureItemContextType } from '../types';

const InfrastructureItemContext = createContext<InfrastructureItemContextType | undefined>(undefined);

const STORAGE_KEY = 'infrastructure_items_data';

const INITIAL_ITEMS: InfrastructureItem[] = [
    { id: '1', name: 'Cerco Eléctrico', createdAt: new Date().toISOString() },
    { id: '2', name: 'Edificios', createdAt: new Date().toISOString() },
    { id: '3', name: 'Locales Comerciales', createdAt: new Date().toISOString() },
    { id: '4', name: 'Caseta', createdAt: new Date().toISOString() },
    { id: '5', name: 'Oficina Administración', createdAt: new Date().toISOString() },
    { id: '6', name: 'Bodega', createdAt: new Date().toISOString() },
    { id: '7', name: 'Hidropack', createdAt: new Date().toISOString() },
    { id: '8', name: 'Luminarias', createdAt: new Date().toISOString() },
    { id: '9', name: 'Cámaras', createdAt: new Date().toISOString() },
    { id: '10', name: 'Citofonia', createdAt: new Date().toISOString() },
];

export const InfrastructureItemProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<InfrastructureItem[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : INITIAL_ITEMS;
        } catch (e) {
            console.error('Error loading infrastructure items:', e);
            return INITIAL_ITEMS;
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }, [items]);

    const addItem = async (item: Omit<InfrastructureItem, 'id' | 'createdAt'>) => {
        const newItem: InfrastructureItem = {
            ...item,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString(),
        };
        setItems(prev => [...prev, newItem]);
    };

    const updateItem = async (updatedItem: InfrastructureItem) => {
        setItems(prev => prev.map(c => c.id === updatedItem.id ? updatedItem : c));
    };

    const deleteItem = async (id: string) => {
        setItems(prev => prev.map(c => c.id === id ? { ...c, isArchived: true } : c));
    };

    return (
        <InfrastructureItemContext.Provider value={{ items, addItem, updateItem, deleteItem }}>
            {children}
        </InfrastructureItemContext.Provider>
    );
};

export const useInfrastructureItems = () => {
    const context = useContext(InfrastructureItemContext);
    if (!context) throw new Error('useInfrastructureItems must be used within InfrastructureItemProvider');
    return context;
};

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { EquipmentItem, EquipmentItemContextType } from '../types';

const EquipmentItemContext = createContext<EquipmentItemContextType | undefined>(undefined);

const STORAGE_KEY = 'equipment_items_data';

const INITIAL_ITEMS: EquipmentItem[] = [
    { id: '1', name: 'Celular', createdAt: new Date().toISOString() },
    { id: '2', name: 'Llaves', createdAt: new Date().toISOString() },
    { id: '3', name: 'Linterna', createdAt: new Date().toISOString() },
    { id: '4', name: 'Televisor', createdAt: new Date().toISOString() },
    { id: '5', name: 'Cargador', createdAt: new Date().toISOString() },
    { id: '6', name: 'Panel', createdAt: new Date().toISOString() },
];

export const EquipmentItemProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<EquipmentItem[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : INITIAL_ITEMS;
        } catch (e) {
            console.error('Error loading equipment items:', e);
            return INITIAL_ITEMS;
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }, [items]);

    const addItem = async (item: Omit<EquipmentItem, 'id' | 'createdAt'>) => {
        const newItem: EquipmentItem = {
            ...item,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString(),
        };
        setItems(prev => [...prev, newItem]);
    };

    const updateItem = async (updatedItem: EquipmentItem) => {
        setItems(prev => prev.map(c => c.id === updatedItem.id ? updatedItem : c));
    };

    const deleteItem = async (id: string) => {
        setItems(prev => prev.map(c => c.id === id ? { ...c, isArchived: true } : c));
    };

    return (
        <EquipmentItemContext.Provider value={{ items, addItem, updateItem, deleteItem }}>
            {children}
        </EquipmentItemContext.Provider>
    );
};

export const useEquipmentItems = () => {
    const context = useContext(EquipmentItemContext);
    if (!context) throw new Error('useEquipmentItems must be used within EquipmentItemProvider');
    return context;
};

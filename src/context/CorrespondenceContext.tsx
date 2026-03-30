import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Correspondence } from '../types';

export interface CorrespondenceContextType {
    items: Correspondence[];
    addItem: (item: Omit<Correspondence, 'id' | 'folio' | 'createdAt'>) => Promise<void>;
    updateItemStatus: (id: string, status: Correspondence['status'], deliveredAt?: string) => Promise<void>;
    deleteItem: (id: string) => Promise<void>;
}

const CorrespondenceContext = createContext<CorrespondenceContextType | undefined>(undefined);

const STORAGE_KEY = 'correspondence_data';
const API_URL = 'http://localhost:3001/api/correspondence';

export const CorrespondenceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<Correspondence[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) return JSON.parse(stored);
            return [];
        } catch (e) {
            return [];
        }
    });

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const response = await fetch(API_URL);
                if (response.ok) setItems(await response.json());
            } catch (e) { }
        };
        fetchItems();
    }, []);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }, [items]);

    // Cross-tab synchronization
    useEffect(() => {
        const handleSync = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY && e.newValue) {
                setItems(JSON.parse(e.newValue));
            }
        };
        window.addEventListener('storage', handleSync);
        return () => window.removeEventListener('storage', handleSync);
    }, []);

    const addItem = async (item: Omit<Correspondence, 'id' | 'folio' | 'createdAt'>) => {
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
        const folio = `COR-${date}-${rand}`;

        const resp = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...item, folio })
        });

        if (resp.ok) {
            const fresh = await fetch(API_URL);
            if (fresh.ok) setItems(await fresh.json());
        }
    };

    const updateItemStatus = async (id: string, status: Correspondence['status'], deliveredAt?: string) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, status, deliveredAt: deliveredAt || item.deliveredAt } : item
        ));
    };

    const deleteItem = async (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    return (
        <CorrespondenceContext.Provider value={{ items, addItem, updateItemStatus, deleteItem }}>
            {children}
        </CorrespondenceContext.Provider>
    );
};

export const useCorrespondence = () => {
    const context = useContext(CorrespondenceContext);
    if (!context) throw new Error('useCorrespondence must be used within CorrespondenceProvider');
    return context;
};

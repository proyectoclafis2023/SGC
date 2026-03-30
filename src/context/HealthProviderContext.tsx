import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { HealthProvider, HealthProviderContextType } from '../types';

const HealthProviderContext = createContext<HealthProviderContextType | undefined>(undefined);

const STORAGE_KEY = 'health_providers_data';

const DEFAULT_PROVIDERS: HealthProvider[] = [
    { id: '1', name: 'Fonasa', type: 'fonasa', discountRate: 7 },
    { id: '2', name: 'Banmédica', type: 'isapre', discountRate: 7 },
    { id: '3', name: 'Colmena', type: 'isapre', discountRate: 7 },
    { id: '4', name: 'Consalud', type: 'isapre', discountRate: 7 },
    { id: '5', name: 'Cruz Blanca', type: 'isapre', discountRate: 7 },
    { id: '6', name: 'Nueva Masvida', type: 'isapre', discountRate: 7 },
    { id: '7', name: 'Vida Tres', type: 'isapre', discountRate: 7 }
];

export const HealthProviderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [providers, setProviders] = useState<HealthProvider[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                return parsed.map((p: HealthProvider) => {
                    const isDefault = DEFAULT_PROVIDERS.some(dp => dp.id === p.id);
                    if (isDefault) return { ...p, discountRate: 7 };
                    return p;
                });
            }
            return DEFAULT_PROVIDERS;
        } catch (e) {
            console.error('Error loading health providers:', e);
            return DEFAULT_PROVIDERS;
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(providers));
    }, [providers]);

    const addProvider = async (provider: Omit<HealthProvider, 'id'>) => {
        const newProvider: HealthProvider = {
            ...provider,
            id: Math.random().toString(36).substr(2, 9),
        };
        setProviders(prev => [...prev, newProvider]);
    };

    const updateProvider = async (provider: HealthProvider) => {
        setProviders(prev => prev.map(p => p.id === provider.id ? provider : p));
    };

    const deleteProvider = async (id: string) => {
        setProviders(prev => prev.map(p => p.id === id ? { ...p, isArchived: true } : p));
    };

    return (
        <HealthProviderContext.Provider value={{ providers, addProvider, updateProvider, deleteProvider }}>
            {children}
        </HealthProviderContext.Provider>
    );
};

export const useHealthProviders = () => {
    const context = useContext(HealthProviderContext);
    if (!context) throw new Error('useHealthProviders must be used within HealthProviderProvider');
    return context;
};

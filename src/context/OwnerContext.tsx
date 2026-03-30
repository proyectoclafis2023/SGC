import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Owner, OwnerContextType } from '../types';
import { useHistoryLogs } from './HistoryLogContext';

const OwnerContext = createContext<OwnerContextType | undefined>(undefined);

const STORAGE_KEY = 'owners_data';

export const OwnerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { addLog } = useHistoryLogs();
    const [owners, setOwners] = useState<Owner[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) return parsed;
            }
            return [
                {
                    id: 'o1',
                    names: 'Marcelo',
                    lastNames: 'Salas',
                    dni: '11.111.111-1',
                    phone: '+56988888888',
                    email: 'matador@example.com',
                    status: 'active',
                    createdAt: new Date().toISOString()
                }
            ];
        } catch (e) {
            console.error('Error loading owners:', e);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(owners));
    }, [owners]);

    useEffect(() => {
        const handleSync = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY && e.newValue) setOwners(JSON.parse(e.newValue));
        };
        window.addEventListener('storage', handleSync);
        return () => window.removeEventListener('storage', handleSync);
    }, []);

    const addOwner = async (owner: Omit<Owner, 'id' | 'createdAt' | 'status'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newRecord: Owner = {
            ...owner,
            id,
            status: 'active',
            createdAt: new Date().toISOString(),
        };
        setOwners(prev => [newRecord, ...prev]);

        await addLog({
            entityType: 'owner',
            entityId: id,
            action: 'created',
            details: `Propietario ${owner.names} ${owner.lastNames} registrado.`
        });

        return id;
    };

    const updateOwner = async (owner: Owner) => {
        const previous = owners.find(o => o.id === owner.id);
        setOwners(prev => prev.map(o => o.id === owner.id ? owner : o));

        await addLog({
            entityType: 'owner',
            entityId: owner.id,
            action: 'updated',
            previousValue: previous,
            newValue: owner,
            details: `Datos del propietario ${owner.names} ${owner.lastNames} actualizados.`
        });
    };

    const deleteOwner = async (id: string) => {
        const owner = owners.find(o => o.id === id);
        setOwners(prev => prev.map(o => o.id === id ? { ...o, status: 'inactive' as const, isArchived: true } : o));

        if (owner) {
            await addLog({
                entityType: 'owner',
                entityId: id,
                action: 'deleted',
                details: `Propietario ${owner.names} ${owner.lastNames} eliminado.`
            });
        }
    };

    return (
        <OwnerContext.Provider value={{ owners, addOwner, updateOwner, deleteOwner }}>
            {children}
        </OwnerContext.Provider>
    );
};

export const useOwners = () => {
    const context = useContext(OwnerContext);
    if (!context) throw new Error('useOwners must be used within OwnerProvider');
    return context;
};

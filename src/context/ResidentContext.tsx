import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Resident } from '../types';
import { useHistoryLogs } from './HistoryLogContext';

export interface ResidentContextType {
    residents: Resident[];
    addResident: (resident: Omit<Resident, 'id' | 'createdAt' | 'status'>) => Promise<string>;
    updateResident: (resident: Resident) => Promise<void>;
    deleteResident: (id: string) => Promise<void>;
    uploadResidents: (file: File) => Promise<{ message: string }>;
}

const ResidentContext = createContext<ResidentContextType | undefined>(undefined);

const STORAGE_KEY = 'residents_data';
const API_URL = 'http://localhost:3001/api/residents';

export const ResidentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { addLog } = useHistoryLogs();
    const [residents, setResidents] = useState<Resident[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) return parsed;
            }
            return [];
        } catch (e) {
            console.error('Error loading residents:', e);
            return [];
        }
    });

    // Fetch from backend on mount
    useEffect(() => {
        const fetchResidents = async () => {
            try {
                const response = await fetch(API_URL);
                if (response.ok) {
                    const data = await response.json();
                    setResidents(data);
                }
            } catch (error) {
                console.error('Failed to fetch from backend, using local storage.');
            }
        };
        fetchResidents();
    }, []);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(residents));
    }, [residents]);

    useEffect(() => {
        const handleSync = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY && e.newValue) setResidents(JSON.parse(e.newValue));
        };
        window.addEventListener('storage', handleSync);
        return () => window.removeEventListener('storage', handleSync);
    }, []);

    const uploadResidents = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al subir archivo');
        }

        const result = await response.json();

        // Refresh local state after upload
        const refreshResp = await fetch(API_URL);
        if (refreshResp.ok) {
            const freshData = await refreshResp.json();
            setResidents(freshData);
        }

        return result;
    };

    const addResident = async (resident: Omit<Resident, 'id' | 'createdAt' | 'status'>) => {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...resident,
                status: 'active'
            })
        });

        if (response.ok) {
            const newRes = await response.json();
            setResidents(prev => [newRes, ...prev]);

            await addLog({
                entityType: 'resident',
                entityId: newRes.id,
                action: 'created',
                details: `Residente ${newRes.names} ${newRes.lastNames} registrado vía API.`
            });
            return newRes.id;
        }

        const id = Math.random().toString(36).substr(2, 9);
        const newRecord: Resident = {
            ...resident,
            id,
            status: 'active',
            createdAt: new Date().toISOString(),
        };
        setResidents(prev => [newRecord, ...prev]);
        return id;
    };

    const updateResident = async (resident: Resident) => {
        const previous = residents.find(r => r.id === resident.id);
        setResidents(prev => prev.map(r => r.id === resident.id ? resident : r));

        await addLog({
            entityType: 'resident',
            entityId: resident.id,
            action: 'updated',
            previousValue: previous,
            newValue: resident,
            details: `Datos del residente ${resident.names} ${resident.lastNames} actualizados.`
        });
    };

    const deleteResident = async (id: string) => {
        const resident = residents.find(r => r.id === id);
        setResidents(prev => prev.map(r => r.id === id ? { ...r, status: 'inactive' as const, isArchived: true } : r));

        if (resident) {
            await addLog({
                entityType: 'resident',
                entityId: id,
                action: 'deleted',
                details: `Residente ${resident.names} ${resident.lastNames} eliminado.`
            });
        }
    };

    return (
        <ResidentContext.Provider value={{ residents, addResident, updateResident, deleteResident, uploadResidents }}>
            {children}
        </ResidentContext.Provider>
    );
};

export const useResidents = () => {
    const context = useContext(ResidentContext);
    if (!context) throw new Error('useResidents must be used within ResidentProvider');
    return context;
};

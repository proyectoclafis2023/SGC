import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Personnel } from '../types';
import { useHistoryLogs } from './HistoryLogContext';
import { useSettings } from './SettingsContext';

export interface PersonnelContextType {
    personnel: Personnel[];
    addPersonnel: (person: Omit<Personnel, 'id' | 'createdAt' | 'status'>) => Promise<string>;
    updatePersonnel: (person: Personnel) => Promise<void>;
    deletePersonnel: (id: string) => Promise<void>;
    uploadPersonnel: (file: File) => Promise<{ message: string }>;
}

const PersonnelContext = createContext<PersonnelContextType | undefined>(undefined);

const STORAGE_KEY = 'personnel_data';
const API_URL = 'http://localhost:3001/api/personnel';

export const PersonnelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { addLog } = useHistoryLogs();
    const { settings } = useSettings();
    const [personnel, setPersonnel] = useState<Personnel[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const data = JSON.parse(stored);
                if (Array.isArray(data)) return data;
            }
            return [];
        } catch (e) {
            console.error('Error loading personnel:', e);
            return [];
        }
    });

    // Fetch from backend on mount
    useEffect(() => {
        const fetchPersonnel = async () => {
            try {
                const response = await fetch(API_URL);
                if (response.ok) {
                    const data = await response.json();
                    setPersonnel(data);
                }
            } catch (error) {
                console.error('Failed to fetch personnel from backend.');
            }
        };
        fetchPersonnel();
    }, []);

    // Accrue vacations based on the last update time
    useEffect(() => {
        if (personnel.length === 0) return;
        const now = new Date();
        const accrualRate = settings.vacationAccrualRate || 1.25;

        let requiresUpdate = false;
        const updatedPersonnel = personnel.map(p => {
            if (p.status === 'inactive' || p.isArchived) return p;

            const lastUpdateStr = p.vacationLastUpdate || p.createdAt || now.toISOString();
            const lastUpdate = new Date(lastUpdateStr);
            const diffMonths = (now.getFullYear() - lastUpdate.getFullYear()) * 12 + (now.getMonth() - lastUpdate.getMonth());

            if (diffMonths >= 1) {
                requiresUpdate = true;
                const addedDays = diffMonths * accrualRate;
                // Move the lastUpdate forward by the full months processed
                const newUpdateDate = new Date(lastUpdate);
                newUpdateDate.setMonth(newUpdateDate.getMonth() + diffMonths);

                addLog({
                    entityType: 'personnel',
                    entityId: p.id,
                    action: 'updated',
                    details: `Incremento automático de ${addedDays.toFixed(2)} días de vacaciones (${diffMonths} meses a tasa ${accrualRate}).`
                });

                return {
                    ...p,
                    vacationDays: (Number(p.vacationDays) || 0) + addedDays,
                    vacationLastUpdate: newUpdateDate.toISOString()
                };
            }
            return p;
        });

        if (requiresUpdate) {
            setPersonnel(updatedPersonnel);
        }
    }, [personnel, settings.vacationAccrualRate]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(personnel));
    }, [personnel]);

    useEffect(() => {
        const handleSync = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY && e.newValue) setPersonnel(JSON.parse(e.newValue));
        };
        window.addEventListener('storage', handleSync);
        return () => window.removeEventListener('storage', handleSync);
    }, []);

    const uploadPersonnel = async (file: File) => {
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
        // Refresh
        const refreshResp = await fetch(API_URL);
        if (refreshResp.ok) setPersonnel(await refreshResp.json());
        return result;
    };

    const addPersonnel = async (person: Omit<Personnel, 'id' | 'createdAt' | 'status'>) => {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...person, status: 'active' })
        });

        if (response.ok) {
            const newPerson = await response.json();
            setPersonnel(prev => [newPerson, ...prev]);
            await addLog({
                entityType: 'personnel',
                entityId: newPerson.id,
                action: 'created',
                details: `Personal ${newPerson.names} registrado en BD.`
            });
            return newPerson.id;
        }

        // Fallback
        const id = Math.random().toString(36).substr(2, 9);
        const newRecord: Personnel = { ...person, id, status: 'active', createdAt: new Date().toISOString() };
        setPersonnel(prev => [newRecord, ...prev]);
        return id;
    };

    const updatePersonnel = async (person: Personnel) => {
        setPersonnel(prev => {
            const oldPerson = prev.find(p => p.id === person.id);
            if (oldPerson && oldPerson.vacationDays !== person.vacationDays) {
                // If vacations were manually updated, log it and set lastUpdate
                person.vacationLastUpdate = new Date().toISOString();
                addLog({
                    entityType: 'personnel',
                    entityId: person.id,
                    action: 'updated',
                    details: `Días de vacaciones actualizados manualmente de ${oldPerson.vacationDays} a ${person.vacationDays}.`
                });
            }
            return prev.map(p => p.id === person.id ? person : p);
        });
        await addLog({
            entityType: 'personnel',
            entityId: person.id,
            action: 'updated',
            newValue: person,
            details: `Personal ${person.names} actualizado.`
        });
    };

    const deletePersonnel = async (id: string | number) => {
        setPersonnel(prev => prev.map(p => p.id === id ? { ...p, status: 'inactive' as const, isArchived: true } : p));
    };

    return (
        <PersonnelContext.Provider value={{ personnel, addPersonnel, updatePersonnel, deletePersonnel, uploadPersonnel }}>
            {children}
        </PersonnelContext.Provider>
    );
};

export const usePersonnel = () => {
    const context = useContext(PersonnelContext);
    if (!context) throw new Error('usePersonnel must be used within PersonnelProvider');
    return context;
};

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Parking, ParkingContextType } from '../types';

const ParkingContext = createContext<ParkingContextType | undefined>(undefined);

const STORAGE_KEY = 'parkings_data';

export const ParkingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [parkings, setParkings] = useState<Parking[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) return parsed;
            }
            return [
                { id: 'p1', number: 'E-01', location: 'Piso 1', createdAt: new Date().toISOString() },
                { id: 'p2', number: 'E-02', location: 'Piso 1', createdAt: new Date().toISOString() },
                { id: 'p3', number: 'E-03', location: 'Piso -1', createdAt: new Date().toISOString() }
            ];
        } catch (e) {
            console.error('Error loading parkings:', e);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parkings));
    }, [parkings]);

    const addParking = async (parking: Omit<Parking, 'id' | 'createdAt'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newRecord: Parking = {
            ...parking,
            id,
            createdAt: new Date().toISOString(),
        };
        setParkings(prev => [newRecord, ...prev]);
    };

    const updateParking = async (parking: Parking) => {
        setParkings(prev => prev.map(p => p.id === parking.id ? parking : p));
    };

    const deleteParking = async (id: string) => {
        setParkings(prev => prev.map(p => p.id === id ? { ...p, isArchived: true } : p));
    };

    return (
        <ParkingContext.Provider value={{ parkings, addParking, updateParking, deleteParking }}>
            {children}
        </ParkingContext.Provider>
    );
};

export const useParkings = () => {
    const context = useContext(ParkingContext);
    if (!context) throw new Error('useParkings must be used within ParkingProvider');
    return context;
};

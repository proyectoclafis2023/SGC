import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import type { Tower, InfrastructureContextType } from '../types';

const InfrastructureContext = createContext<InfrastructureContextType | undefined>(undefined);

const STORAGE_KEY = 'infrastructure_data';
const API_URL = 'http://localhost:3001/api/towers';

export const InfrastructureProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [towers, setTowers] = useState<Tower[]>([]);

    useEffect(() => {
        const fetchTowers = async () => {
            try {
                const response = await fetch(API_URL);
                if (response.ok) setTowers(await response.json());
            } catch (e) {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) setTowers(JSON.parse(stored));
            }
        };
        fetchTowers();
    }, []);

    const departments = useMemo(() => {
        return towers.flatMap(tower =>
            (tower.departments || []).map(dept => ({ ...dept, towerId: tower.id }))
        );
    }, [towers]);

    useEffect(() => {
        if (towers.length > 0) localStorage.setItem(STORAGE_KEY, JSON.stringify(towers));
    }, [towers]);

    const addTower = async (tower: Omit<Tower, 'id'>) => {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tower)
            });
            if (response.ok) {
                const newTower = await response.json();
                setTowers(prev => [...prev, newTower]);
            }
        } catch (e) {
            console.error('Error adding tower:', e);
        }
    };

    const updateTower = async (updatedTower: Tower) => {
        try {
            const response = await fetch(`${API_URL}/${updatedTower.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedTower)
            });
            if (response.ok) {
                const data = await response.json();
                setTowers(prev => prev.map(t => t.id === data.id ? data : t));
            }
        } catch (e) { console.error('Error updating tower:', e); }
    };

    const deleteTower = async (id: string) => {
        try {
            const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            if (response.ok) {
                setTowers(prev => prev.map(t => t.id === id ? { ...t, isArchived: true } : t));
            }
        } catch (e) { console.error('Error deleting tower:', e); }
    };

    const duplicateTower = async (id: string, newName: string) => {
        const sourceTower = towers.find(t => t.id === id);
        if (!sourceTower) return;
        setTowers(prev => [...prev, { ...sourceTower, id: Math.random().toString(36).substr(2, 9), name: newName }]);
    };

    const deleteDepartment = async (towerId: string, deptId: string) => {
        setTowers(prev => prev.map(t => {
            if (t.id === towerId) {
                return { ...t, departments: t.departments.map(d => d.id === deptId ? { ...d, isArchived: true } : d) };
            }
            return t;
        }));
    };

    return (
        <InfrastructureContext.Provider value={{ towers, departments, addTower, updateTower, deleteTower, duplicateTower, deleteDepartment }}>
            {children}
        </InfrastructureContext.Provider>
    );
};

export const useInfrastructure = () => {
    const context = useContext(InfrastructureContext);
    if (!context) throw new Error('useInfrastructure must be used within InfrastructureProvider');
    return context;
};

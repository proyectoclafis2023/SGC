import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { EmergencyNumber, EmergencyNumberContextType } from '../types';

const EmergencyNumberContext = createContext<EmergencyNumberContextType | undefined>(undefined);

const STORAGE_KEY = 'sgc_emergency_numbers_data';

const INITIAL_DATA: Omit<EmergencyNumber, 'id' | 'createdAt'>[] = [
    { category: 'SEGURIDAD', name: 'Seguridad Pública', phone: '+56 9 7386 7772', description: 'Atención 24/7' },
    { category: 'SEGURIDAD', name: 'Plan Cuadrante N°9', phone: '+56 9 9265 5480', description: '5ta Comisaria Miraflores' },
    { category: 'EMERGENCIA', name: 'SAMU', phone: '131', description: 'Servicio de Atención Médico de Urgencias' },
    { category: 'EMERGENCIA', name: 'PDI', phone: '134', description: 'Policía de Investigaciones' },
    { category: 'EMERGENCIA', name: 'Bomberos', phone: '132', description: 'Cuerpo de Bomberos' },
    { category: 'SERVICIOS_BASICOS', name: 'GasValpo', phone: '600 600 7000', description: 'Opción 1' },
    { category: 'SERVICIOS_BASICOS', name: 'Chilquinta', phone: '600 600 5000', webUrl: 'https://www.chilquinta.cl/reportar-corte' },
    { category: 'SERVICIOS_BASICOS', name: 'Esval', phone: '600 600 6060', webUrl: 'https://www.esval.cl/personas/ayuda/problemas-agua-calle/' }
];

export const EmergencyNumberProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [numbers, setNumbers] = useState<EmergencyNumber[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) {
                return INITIAL_DATA.map(n => ({
                    ...n,
                    id: Math.random().toString(36).substr(2, 9),
                    createdAt: new Date().toISOString()
                }));
            }
            return JSON.parse(stored);
        } catch (e) {
            console.error('Error loading emergency numbers:', e);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(numbers));
    }, [numbers]);

    const addNumber = async (number: Omit<EmergencyNumber, 'id' | 'createdAt'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newRecord: EmergencyNumber = {
            ...number,
            id,
            createdAt: new Date().toISOString()
        };
        setNumbers(prev => [...prev, newRecord]);
    };

    const updateNumber = async (id: string, number: Omit<EmergencyNumber, 'id' | 'createdAt'>) => {
        setNumbers(prev => prev.map(n => n.id === id ? { ...n, ...number } : n));
    };

    const deleteNumber = async (id: string) => {
        setNumbers(prev => prev.filter(n => n.id !== id));
    };

    return (
        <EmergencyNumberContext.Provider value={{ numbers, addNumber, updateNumber, deleteNumber }}>
            {children}
        </EmergencyNumberContext.Provider>
    );
};

export const useEmergencyNumbers = () => {
    const context = useContext(EmergencyNumberContext);
    if (!context) throw new Error('useEmergencyNumbers must be used within EmergencyNumberProvider');
    return context;
};

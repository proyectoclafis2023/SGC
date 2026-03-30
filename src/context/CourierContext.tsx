import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Courier {
    id: string;
    name: string;
    isArchived: boolean;
}

interface CourierContextType {
    couriers: Courier[];
    addCourier: (name: string) => Promise<void>;
    updateCourier: (id: string, name: string) => Promise<void>;
    deleteCourier: (id: string) => Promise<void>;
}

const CourierContext = createContext<CourierContextType | undefined>(undefined);

const DEFAULT_COURIERS = [
    { id: '1', name: 'Rappi', isArchived: false },
    { id: '2', name: 'UberEats', isArchived: false },
    { id: '3', name: 'Starken', isArchived: false },
    { id: '4', name: 'Chilexpress', isArchived: false },
    { id: '5', name: 'Correos de Chile', isArchived: false },
    { id: '6', name: 'BlueExpress', isArchived: false },
    { id: '7', name: 'PedidosYa', isArchived: false },
];

export const CourierProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [couriers, setCouriers] = useState<Courier[]>(() => {
        const saved = localStorage.getItem('sgc_couriers');
        return saved ? JSON.parse(saved) : DEFAULT_COURIERS;
    });

    useEffect(() => {
        localStorage.setItem('sgc_couriers', JSON.stringify(couriers));
    }, [couriers]);

    const addCourier = async (name: string) => {
        const newCourier: Courier = {
            id: Date.now().toString(),
            name,
            isArchived: false
        };
        setCouriers(prev => [...prev, newCourier]);
    };

    const updateCourier = async (id: string, name: string) => {
        setCouriers(prev => prev.map(c => c.id === id ? { ...c, name } : c));
    };

    const deleteCourier = async (id: string) => {
        setCouriers(prev => prev.map(c => c.id === id ? { ...c, isArchived: true } : c));
    };

    return (
        <CourierContext.Provider value={{ couriers, addCourier, updateCourier, deleteCourier }}>
            {children}
        </CourierContext.Provider>
    );
};

export const useCouriers = () => {
    const context = useContext(CourierContext);
    if (!context) throw new Error('useCouriers must be used within CourierProvider');
    return context;
};

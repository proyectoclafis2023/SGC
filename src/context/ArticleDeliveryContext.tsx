import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { ArticleDelivery, ArticleDeliveryContextType } from '../types';

const ArticleDeliveryContext = createContext<ArticleDeliveryContextType | undefined>(undefined);

const STORAGE_KEY = 'article_deliveries_data';

export const ArticleDeliveryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [deliveries, setDeliveries] = useState<ArticleDelivery[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return [];
            const parsed = JSON.parse(stored);
            return (parsed as ArticleDelivery[]).map(d => {
                if (!d.folio) {
                    const dateStr = (d.createdAt || new Date().toISOString()).slice(0, 10).replace(/-/g, '');
                    return { ...d, folio: `DEL-${dateStr}-${d.id.slice(-4).toUpperCase()}` };
                }
                return d;
            });
        } catch (e) {
            console.error('Error loading deliveries:', e);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(deliveries));
    }, [deliveries]);

    const generateFolio = (prefix: string) => {
        const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        return `${prefix}-${date}-${rand}`;
    };

    const addDelivery = async (delivery: Omit<ArticleDelivery, 'id' | 'folio' | 'createdAt'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newRecord: ArticleDelivery = {
            ...delivery,
            id,
            folio: generateFolio('DEL'),
            createdAt: new Date().toISOString()
        };
        setDeliveries(prev => [newRecord, ...prev]);
        return id;
    };

    const updateDelivery = async (delivery: ArticleDelivery) => {
        setDeliveries(prev => prev.map(d => d.id === delivery.id ? delivery : d));
    };

    const deleteDelivery = async (id: string) => {
        setDeliveries(prev => prev.filter(d => d.id !== id));
    };

    return (
        <ArticleDeliveryContext.Provider value={{ deliveries, addDelivery, updateDelivery, deleteDelivery, setDeliveries }}>
            {children}
        </ArticleDeliveryContext.Provider>
    );
};

export const useArticleDeliveries = () => {
    const context = useContext(ArticleDeliveryContext);
    if (!context) throw new Error('useArticleDeliveries must be used within ArticleDeliveryProvider');
    return context;
};

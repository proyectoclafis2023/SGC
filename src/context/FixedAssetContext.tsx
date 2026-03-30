import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { FixedAsset, FixedAssetContextType } from '../types';

const FixedAssetContext = createContext<FixedAssetContextType | undefined>(undefined);

const STORAGE_KEY = 'fixed_assets_data';

export const FixedAssetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [assets, setAssets] = useState<FixedAsset[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return [];
            const parsed = JSON.parse(stored);
            return (parsed as FixedAsset[]).map(asset => {
                if (asset.maintenanceHistory) {
                    asset.maintenanceHistory = asset.maintenanceHistory.map(record => {
                        if (!record.folio) {
                            const dateStr = (record.date || new Date().toISOString()).slice(0, 10).replace(/-/g, '');
                            return { ...record, folio: `MNT-${dateStr}-${record.id.slice(-4).toUpperCase()}` };
                        }
                        return record;
                    });
                }
                return asset;
            });
        } catch (e) {
            console.error('Error loading fixed assets:', e);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
    }, [assets]);

    const addAsset = async (asset: Omit<FixedAsset, 'id' | 'createdAt'>) => {
        const newRecord: FixedAsset = {
            ...asset,
            id: `AF-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            createdAt: new Date().toISOString()
        };
        setAssets(prev => [newRecord, ...prev]);
    };

    const updateAsset = async (asset: FixedAsset) => {
        setAssets(prev => prev.map(a => a.id === asset.id ? asset : a));
    };

    const deleteAsset = async (id: string) => {
        setAssets(prev => prev.map(a => a.id === id ? { ...a, isArchived: true } : a));
    };

    return (
        <FixedAssetContext.Provider value={{ assets, addAsset, updateAsset, deleteAsset }}>
            {children}
        </FixedAssetContext.Provider>
    );
};

export const useFixedAssets = () => {
    const context = useContext(FixedAssetContext);
    if (!context) throw new Error('useFixedAssets must be used within FixedAssetProvider');
    return context;
};

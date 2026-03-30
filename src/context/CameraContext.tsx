import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Camera, CameraContextType } from '../types';

const CameraContext = createContext<CameraContextType | undefined>(undefined);

export const CameraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cameras, setCameras] = useState<Camera[]>(() => {
        const saved = localStorage.getItem('sgc_cameras');
        if (!saved) return [
            { id: '1', name: 'Acceso Principal', backupHours: 720, createdAt: new Date().toISOString() },
            { id: '2', name: 'Estacionamiento -1', backupHours: 720, createdAt: new Date().toISOString() },
            { id: '3', name: 'Piscina', backupHours: 480, createdAt: new Date().toISOString() },
        ];
        try {
            return JSON.parse(saved);
        } catch (e) {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('sgc_cameras', JSON.stringify(cameras));
    }, [cameras]);

    useEffect(() => {
        const handleSync = (e: StorageEvent) => {
            if (e.key === 'sgc_cameras' && e.newValue) {
                setCameras(JSON.parse(e.newValue));
            }
        };
        window.addEventListener('storage', handleSync);
        return () => window.removeEventListener('storage', handleSync);
    }, []);

    const addCamera = async (cameraData: Omit<Camera, 'id' | 'createdAt'>) => {
        const newCamera: Camera = {
            ...cameraData,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
        };
        setCameras(prev => [...prev, newCamera]);
    };

    const updateCamera = async (camera: Camera) => {
        setCameras(prev => prev.map(c => c.id === camera.id ? camera : c));
    };

    const deleteCamera = async (id: string) => {
        setCameras(prev => prev.map(c => c.id === id ? { ...c, isArchived: true } : c));
    };

    return (
        <CameraContext.Provider value={{
            cameras,
            addCamera,
            updateCamera,
            deleteCamera
        }}>
            {children}
        </CameraContext.Provider>
    );
};

export const useCameras = () => {
    const context = useContext(CameraContext);
    if (context === undefined) {
        throw new Error('useCameras must be used within a CameraProvider');
    }
    return context;
};

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CameraRequest, CameraRequestContextType } from '../types';

const CameraRequestContext = createContext<CameraRequestContextType | undefined>(undefined);

export const CameraRequestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [requests, setRequests] = useState<CameraRequest[]>(() => {
        const saved = localStorage.getItem('sgc_camera_requests');
        if (!saved) return [];
        try {
            const parsed = JSON.parse(saved);
            return (parsed as CameraRequest[]).map(r => {
                if (!r.folio) {
                    const dateStr = (r.createdAt || new Date().toISOString()).slice(0, 10).replace(/-/g, '');
                    return { ...r, folio: `CAM-${dateStr}-${r.id.slice(-4).toUpperCase()}` };
                }
                return r;
            });
        } catch (e) {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('sgc_camera_requests', JSON.stringify(requests));
    }, [requests]);

    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'sgc_camera_requests' && e.newValue) {
                setRequests(JSON.parse(e.newValue));
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const generateFolio = (prefix: string) => {
        const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        return `${prefix}-${date}-${rand}`;
    };

    const addRequest = async (requestData: Omit<CameraRequest, 'id' | 'folio' | 'status' | 'createdAt'>) => {
        const id = `CAMREQ-${Date.now()}`;
        const newRequest: CameraRequest = {
            ...requestData,
            id,
            folio: generateFolio('CAM'),
            status: 'pending',
            createdAt: new Date().toISOString(),
        };
        setRequests(prev => [newRequest, ...prev]);
    };

    const updateRequestStatus = async (id: string, status: CameraRequest['status'], adminNotes?: string) => {
        setRequests(prev => prev.map(r =>
            r.id === id
                ? { ...r, status, adminNotes: adminNotes !== undefined ? adminNotes : r.adminNotes }
                : r
        ));
    };

    const deleteRequest = async (id: string) => {
        setRequests(prev => prev.filter(r => r.id !== id));
    };

    return (
        <CameraRequestContext.Provider value={{
            requests,
            addRequest,
            updateRequestStatus,
            deleteRequest
        }}>
            {children}
        </CameraRequestContext.Provider>
    );
};

export const useCameraRequests = () => {
    const context = useContext(CameraRequestContext);
    if (context === undefined) {
        throw new Error('useCameraRequests must be used within a CameraRequestProvider');
    }
    return context;
};

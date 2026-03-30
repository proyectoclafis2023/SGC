import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { ShiftReport, ShiftReportContextType } from '../types';

const ShiftReportContext = createContext<ShiftReportContextType | undefined>(undefined);

const STORAGE_KEY = 'sgc_shift_reports_data';

export const ShiftReportProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [reports, setReports] = useState<ShiftReport[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return [];
            const parsed = JSON.parse(stored);

            // Retrocompatibility for folios
            return (parsed as ShiftReport[]).map(r => {
                if (!r.folio) {
                    const dateStr = (r.createdAt || new Date().toISOString()).slice(0, 10).replace(/-/g, '');
                    return { ...r, folio: `SHR-${dateStr}-${r.id.slice(-4).toUpperCase()}` };
                }
                return r;
            });
        } catch (e) {
            console.error('Error loading shift reports:', e);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    }, [reports]);

    const generateFolio = (prefix: string) => {
        const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        return `${prefix}-${dateStr}-${rand}`;
    };

    const addReport = async (report: Omit<ShiftReport, 'id' | 'folio' | 'createdAt' | 'status' | 'hasIncidents' | 'hasInfrastructureIssues' | 'hasEquipmentIssues'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newRecord: ShiftReport = {
            ...report,
            id,
            status: 'open',
            hasIncidents: false,
            hasInfrastructureIssues: false,
            hasEquipmentIssues: false,
            folio: generateFolio('SHR'),
            createdAt: new Date().toISOString()
        };
        setReports(prev => [newRecord, ...prev]);
    };

    const updateReport = async (id: string, data: Partial<ShiftReport>) => {
        setReports(prev => prev.map(r =>
            r.id === id ? { ...r, ...data } : r
        ));
    };

    const closeShift = async (id: string, data: Partial<ShiftReport>) => {
        setReports(prev => prev.map(r =>
            r.id === id ? {
                ...r,
                ...data,
                status: 'closed',
                closedAt: new Date().toISOString()
            } : r
        ));
    };

    const reopenShift = async (id: string, adminName: string, reason: string) => {
        setReports(prev => prev.map(r =>
            r.id === id ? {
                ...r,
                status: 'open',
                adminReopenedBy: adminName,
                adminReopenReason: reason,
                closedAt: undefined
            } : r
        ));
    };

    const deleteReport = (id: string) => {
        setReports(prev => prev.filter(r => r.id !== id));
    };

    const clearAllReports = () => {
        if (window.confirm('¿Está seguro de que desea eliminar TODO el historial de turnos? Esta acción no se puede deshacer.')) {
            setReports([]);
            localStorage.removeItem(STORAGE_KEY);
        }
    };

    return (
        <ShiftReportContext.Provider value={{ reports, addReport, updateReport, closeShift, reopenShift, deleteReport, clearAllReports }}>
            {children}
        </ShiftReportContext.Provider>
    );
};

export const useShiftReport = () => {
    const context = useContext(ShiftReportContext);
    if (!context) throw new Error('useShiftReport must be used within ShiftReportProvider');
    return context;
};

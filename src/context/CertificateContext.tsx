import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Certificate, CertificateContextType } from '../types';

const generateId = () => Math.random().toString(36).substring(2, 15);

const CertificateContext = createContext<CertificateContextType | undefined>(undefined);

const STORAGE_KEY = 'condo_certificates_history';

export const CertificateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [certificates, setCertificates] = useState<Certificate[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Error parsing certificates:', e);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(certificates));
    }, [certificates]);

    const addCertificate = async (certData: Omit<Certificate, 'id' | 'folio' | 'generatedAt'>): Promise<Certificate> => {
        const lastFolio = certificates.length > 0
            ? parseInt(certificates[0].folio)
            : 1000;

        const newCert: Certificate = {
            ...certData,
            id: generateId(),
            folio: (lastFolio + 1).toString(),
            generatedAt: new Date().toISOString(),
        };

        setCertificates(prev => [newCert, ...prev]);
        return newCert;
    };

    const deleteCertificate = async (id: string) => {
        setCertificates(prev => prev.filter(c => c.id !== id));
    };

    return (
        <CertificateContext.Provider value={{ certificates, addCertificate, deleteCertificate }}>
            {children}
        </CertificateContext.Provider>
    );
};

export const useCertificates = () => {
    const context = useContext(CertificateContext);
    if (!context) {
        throw new Error('useCertificates must be used within a CertificateProvider');
    }
    return context;
};

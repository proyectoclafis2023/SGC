import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Profile, ProfileContextType, ProfilePermissions } from '../types';

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const STORAGE_KEY = 'profiles_data';

const DEFAULT_PERMISSIONS: ProfilePermissions = {
    // Maestros y Configuración
    canViewPersonnel: true,
    canManagePersonnel: true,
    canViewPrevisiones: true,
    canManagePrevisiones: true,
    canViewAFPs: true,
    canManageAFPs: true,
    canViewUsers: true,
    canManageUsers: true,
    canViewProfiles: true,
    canManageProfiles: true,
    canViewSettings: true,
    canManageSettings: true,
    canViewInfrastructure: true,
    canManageInfrastructure: true,
    canViewResidents: true,
    canManageResidents: true,
    canViewOwners: true,
    canManageOwners: true,
    canViewUnitTypes: true,
    canManageUnitTypes: true,
    canViewParking: true,
    canManageParking: true,
    canViewCommonSpaces: true,
    canManageCommonSpaces: true,
    canViewArticles: true,
    canManageArticles: true,
    canViewContractors: true,
    canManageContractors: true,
    canViewFixedAssets: true,
    canManageFixedAssets: true,
    canViewEmergencyNumbers: true,
    canManageEmergencyNumbers: true,
    canViewOperationalMasters: true,
    canManageOperationalMasters: true,

    // Operativa y Gestión
    canViewCommonExpenses: true,
    canManageCommonExpenses: true,
    canViewCertificates: true,
    canManageCertificates: true,
    canViewVisitors: true,
    canManageVisitors: true,
    canViewShiftReports: true,
    canManageShiftReports: true,
    canViewCorrespondence: true,
    canManageCorrespondence: true,
    canViewTickets: true,
    canManageTickets: true,
    canViewCameraRequests: true,
    canManageCameraRequests: true,
    canViewReservations: true,
    canManageReservations: true,
    canViewSystemMessages: true,
    canManageSystemMessages: true,
    canViewArticleDeliveries: true,
    canManageArticleDeliveries: true,
    canViewPayslips: true,
    canManagePayslips: true,
};

const INITIAL_PROFILES: Profile[] = [
    {
        id: '1',
        name: 'Administrador Total',
        permissions: { ...DEFAULT_PERMISSIONS }
    },
    {
        id: '2',
        name: 'Gestor de Personal',
        permissions: {
            ...DEFAULT_PERMISSIONS,
            canViewSettings: false,
            canManageSettings: false,
            canViewUsers: false,
            canManageUsers: false,
        }
    }
];

export const ProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [profiles, setProfiles] = useState<Profile[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : INITIAL_PROFILES;
        } catch (e) {
            console.error('Error loading profiles:', e);
            return INITIAL_PROFILES;
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    }, [profiles]);

    const addProfile = async (profile: Omit<Profile, 'id'>) => {
        const newProfile: Profile = {
            ...profile,
            id: Math.random().toString(36).substr(2, 9),
        };
        setProfiles(prev => [...prev, newProfile]);
    };

    const updateProfile = async (profile: Profile) => {
        setProfiles(prev => prev.map(p => p.id === profile.id ? profile : p));
    };

    const deleteProfile = async (id: string) => {
        setProfiles(prev => prev.map(p => p.id === id ? { ...p, isArchived: true } : p));
    };

    return (
        <ProfileContext.Provider value={{ profiles, addProfile, updateProfile, deleteProfile }}>
            {children}
        </ProfileContext.Provider>
    );
};

export const useProfiles = () => {
    const context = useContext(ProfileContext);
    if (!context) throw new Error('useProfiles must be used within ProfileProvider');
    return context;
};

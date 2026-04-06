import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { SystemSettings, SettingsContextType } from '../types';
import { API_BASE_URL } from '../config/api';

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const DEFAULT_SETTINGS: SystemSettings = {
    system_name: 'SGC - Gestión de Condominios',
    systemIcon: 'S',
    cameraBackupDays: 7,
    darkMode: false,
    theme: 'light',
    admin_name: '',
    adminRut: '',
    condo_rut: '',
    condo_address: '',
    adminPhone: '',
    adminSignature: '',
    deletionPassword: '',
    vacationAccrualRate: 1.25
};

const API_URL = `${API_BASE_URL}/system_settings`;

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);

    const fetchSettings = async () => {
        try {
            const response = await fetch(API_URL);
            if (response.ok) {
                const data = await response.json();
                if (data && data.length > 0) {
                    setSettings({ ...DEFAULT_SETTINGS, ...data[0] });
                }
            }
        } catch (e) {
            console.error('Error fetching settings:', e);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        document.title = settings.system_name;
        if (settings.theme === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('modern');
        } else if (settings.theme === 'modern') {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('modern');
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.remove('modern');
        }

        if (settings.systemFavicon) {
            let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.getElementsByTagName('head')[0].appendChild(link);
            }
            link.href = settings.systemFavicon;
        }
    }, [settings]);

    const updateSettings = async (newSettings: SystemSettings) => {
        // Optimistic update
        setSettings(newSettings);
        
        try {
            const method = (newSettings as any).id ? 'PUT' : 'POST';
            const url = (newSettings as any).id ? `${API_URL}/${(newSettings as any).id}` : API_URL;
            
            const response = await fetch(url, {
                method,
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token'), 'Content-Type': 'application/json' },
                body: JSON.stringify(newSettings)
            });
            
            if (response.ok) {
                const updatedData = await response.json();
                setSettings(prev => ({ ...prev, ...updatedData }));
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al guardar la configuración');
            }
        } catch (e) {
            console.error('Error saving settings:', e);
            // Revert or just keep the optimistic state? 
            // Better to keep it for UX unless it's critical.
        }
    };

    const toggleTheme = () => {
        const currentTheme = settings.theme || 'light';
        const nextTheme: 'light' | 'dark' = currentTheme === 'light' ? 'dark' : 'light';

        updateSettings({
            ...settings,
            theme: nextTheme,
            darkMode: nextTheme === 'dark'
        });
    };

    const setTheme = (theme: 'light' | 'dark' | 'modern') => {
        updateSettings({
            ...settings,
            theme,
            darkMode: theme === 'dark'
        });
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, toggleTheme, setTheme }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

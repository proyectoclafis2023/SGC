import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { SystemSettings, SettingsContextType } from '../types';

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const DEFAULT_SETTINGS: SystemSettings = {
    systemName: 'Administración GAG',
    systemIcon: 'G',
    cameraBackupDays: 7,
    darkMode: false,
    theme: 'light',
    adminName: '',
    adminRut: '',
    condoRut: '',
    condoAddress: '',
    adminPhone: '',
    adminSignature: '',
    deletionPassword: '',
    vacationAccrualRate: 1.25
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<SystemSettings>(() => {
        try {
            const stored = localStorage.getItem('system_settings');
            if (stored) {
                const parsed = JSON.parse(stored);
                // Aseguramos que campos nuevos no definidos en versiones previas de localStorage se incluyan
                return { ...DEFAULT_SETTINGS, ...parsed };
            }
            return DEFAULT_SETTINGS;
        } catch (e) {
            console.error('Error parsing settings:', e);
            return DEFAULT_SETTINGS;
        }
    });

    useEffect(() => {
        localStorage.setItem('system_settings', JSON.stringify(settings));
        document.title = settings.systemName;

        // Apply theme to document
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

        // Apply favicon on initial load and settings change
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

    const updateSettings = (newSettings: SystemSettings) => {
        setSettings(newSettings);
        localStorage.setItem('system_settings', JSON.stringify(newSettings)); // Explicitly update localStorage here as well

        // Actualizar Favicon dinámicamente
        if (newSettings.systemFavicon) {
            let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.getElementsByTagName('head')[0].appendChild(link);
            }
            link.href = newSettings.systemFavicon;
        }
    };

    const toggleTheme = () => {
        setSettings(prev => {
            const currentTheme = prev.theme || 'light';
            let nextTheme: 'light' | 'dark' | 'modern';

            if (currentTheme === 'light') nextTheme = 'dark';
            else if (currentTheme === 'dark') nextTheme = 'modern';
            else nextTheme = 'light';

            return {
                ...prev,
                theme: nextTheme,
                darkMode: nextTheme === 'dark'
            };
        });
    };

    const setTheme = (theme: 'light' | 'dark' | 'modern') => {
        setSettings(prev => ({
            ...prev,
            theme,
            darkMode: theme === 'dark'
        }));
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

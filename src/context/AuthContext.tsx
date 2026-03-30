import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AuthContextType, AuthState } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [auth, setAuth] = useState<AuthState>(() => {
        try {
            const stored = localStorage.getItem('auth');
            return stored ? JSON.parse(stored) : { isAuthenticated: false, user: null };
        } catch (e) {
            console.error('Error parsing auth state:', e);
            localStorage.removeItem('auth');
            return { isAuthenticated: false, user: null };
        }
    });

    const updateUserAuthData = (data: Partial<NonNullable<AuthState['user']>>) => {
        setAuth(prev => {
            if (!prev.user) return prev;
            return { ...prev, user: { ...prev.user, ...data } };
        });
    };

    useEffect(() => {
        localStorage.setItem('auth', JSON.stringify(auth));
    }, [auth]);

    const login = async (username: string, pass: string) => {
        // Hardcoded admin/admin
        if (username === 'admin' && pass === 'admin') {
            const adminUser = {
                isAuthenticated: true,
                user: {
                    id: '1',
                    name: 'Admin User',
                    email: 'admin@example.com',
                    role: 'admin',
                    status: 'active'
                }
            };
            setAuth(adminUser);
            return true;
        }

        // Try to find in localStorage users
        try {
            const storedUsers = localStorage.getItem('users');
            const usersList = storedUsers ? JSON.parse(storedUsers) : [];
            const userFound = usersList.find((u: any) => (u.email === username || u.id === username) && u.password === pass && !u.isArchived);

            if (userFound) {
                const userData = {
                    isAuthenticated: true,
                    user: {
                        id: userFound.id,
                        name: userFound.name,
                        email: userFound.email,
                        role: userFound.role,
                        status: userFound.status,
                        relatedId: userFound.relatedId,
                        profileId: userFound.profileId,
                        mustChangePassword: userFound.mustChangePassword
                    }
                };
                setAuth(userData);
                return true;
            }
        } catch (e) {
            console.error('Error in local login:', e);
        }

        try {
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password: pass }),
            });

            if (response.ok) {
                const data = await response.json();
                setAuth(data);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    };

    const changePassword = async (newPassword: string) => {
        if (!auth.user) return;

        // Update in localStorage users
        try {
            const storedUsers = localStorage.getItem('users');
            const usersList = storedUsers ? JSON.parse(storedUsers) : [];
            const updatedUsers = usersList.map((u: any) =>
                u.id === auth.user?.id ? { ...u, password: newPassword, mustChangePassword: false } : u
            );
            localStorage.setItem('users', JSON.stringify(updatedUsers));

            // Update current auth state
            setAuth(prev => ({
                ...prev,
                user: prev.user ? { ...prev.user, mustChangePassword: false } : null
            }));
        } catch (e) {
            console.error('Error changing password:', e);
        }
    };

    const loginWithGoogle = async (email: string, name: string, photoUrl?: string) => {
        try {
            // Simulated login: Check if user already exists in users DB
            const storedUsers = localStorage.getItem('users');
            const usersList = storedUsers ? JSON.parse(storedUsers) : [];
            let existingUser = usersList.find((u: any) => u.email === email);

            if (!existingUser) {
                existingUser = {
                    id: `G-${Date.now()}`,
                    name,
                    email,
                    role: 'pending',
                    status: 'setting_up',
                    createdAt: new Date().toISOString()
                };
                usersList.push(existingUser);
                localStorage.setItem('users', JSON.stringify(usersList));
            }

            setAuth({
                isAuthenticated: true,
                user: {
                    name: existingUser.name,
                    role: existingUser.role,
                    email: existingUser.email,
                    status: existingUser.status,
                    id: existingUser.id,
                    photo: photoUrl,
                    mustChangePassword: existingUser.mustChangePassword
                } as any
            });

            return true;
        } catch (error) {
            console.error("Error signing in with Google:", error);
            return false;
        }
    };

    const logout = () => {
        setAuth({ isAuthenticated: false, user: null });
        localStorage.removeItem('auth');
    };

    return (
        <AuthContext.Provider value={{ ...auth, login, loginWithGoogle, logout, updateUserAuthData, changePassword }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

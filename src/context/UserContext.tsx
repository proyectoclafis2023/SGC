import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, UserContextType } from '../types';

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [users, setUsers] = useState<User[]>(() => {
        const defaultUsers: User[] = [
            { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'admin', status: 'active', createdAt: new Date().toISOString() },
            { id: '2', name: 'Jane Doe', email: 'jane@example.com', role: 'user', status: 'active', createdAt: new Date().toISOString() },
            { id: '3', name: 'John Smith', email: 'john@example.com', role: 'user', status: 'inactive', createdAt: new Date().toISOString() }
        ];

        try {
            const stored = localStorage.getItem('users');
            return stored ? JSON.parse(stored) : defaultUsers;
        } catch (e) {
            console.error('Error loading users:', e);
            return defaultUsers;
        }
    });

    useEffect(() => {
        localStorage.setItem('users', JSON.stringify(users));
    }, [users]);

    const addUser = async (userData: Omit<User, 'id' | 'createdAt'>) => {
        const newUser: User = {
            ...userData,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString(),
        };
        setUsers(prev => [newUser, ...prev]);
    };

    const updateUser = async (id: string, userData: Omit<User, 'id' | 'createdAt'>) => {
        setUsers(prev => prev.map(user =>
            user.id === id ? { ...user, ...userData } : user
        ));
    };

    const deleteUser = async (id: string) => {
        setUsers(prev => prev.map(user => user.id === id ? { ...user, status: 'inactive', isArchived: true } : user));
    };

    const resetPassword = async (id: string, newPassword: string) => {
        setUsers(prev => prev.map(user =>
            user.id === id ? { ...user, password: newPassword, mustChangePassword: true } : user
        ));
    };

    return (
        <UserContext.Provider value={{ users, addUser, updateUser, deleteUser, resetPassword }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUsers = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUsers must be used within a UserProvider');
    }
    return context;
};

import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { Input } from './Input';
import { Button } from './Button';
import { X } from 'lucide-react';
import { useProfiles } from '../context/ProfileContext';

interface UserFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (user: Omit<User, 'id' | 'createdAt'>, id?: string) => void;
    initialData?: User | null;
}

export const UserForm: React.FC<UserFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
    const { profiles } = useProfiles();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<User['role']>('user');
    const [profileId, setProfileId] = useState('');
    const [status, setStatus] = useState<User['status']>('active');

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setEmail(initialData.email);
            setRole(initialData.role);
            setProfileId(initialData.profileId || '');
            setStatus(initialData.status);
        } else {
            setName('');
            setEmail('');
            setRole('user');
            setProfileId('');
            setStatus('active');
        }
    }, [initialData, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ name, email, role, profileId, status }, initialData?.id);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border dark:border-gray-800 transition-colors">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {initialData ? 'Editar Usuario' : 'Añadir Nuevo Usuario'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <Input
                        label="Nombre Completo"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="ej. Juan Pérez"
                    />
                    <Input
                        label="Correo Electrónico"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="juan@ejemplo.com"
                    />

                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Perfil de Acceso</label>
                        <select
                            value={profileId}
                            onChange={(e) => setProfileId(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                            required
                        >
                            <option value="">Seleccione un perfil...</option>
                            {profiles.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Nivel Global</label>
                        <div className="flex gap-4 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                            <label className="flex items-center space-x-2 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="role"
                                    value="user"
                                    checked={role === 'user'}
                                    onChange={() => setRole('user')}
                                    className="w-4 h-4 text-indigo-600"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Usuario</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="role"
                                    value="admin"
                                    checked={role === 'admin'}
                                    onChange={() => setRole('admin')}
                                    className="w-4 h-4 text-indigo-600"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Admin</span>
                            </label>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Estado</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as User['status'])}
                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer shadow-sm"
                        >
                            <option value="active">Activo</option>
                            <option value="inactive">Inactivo</option>
                            <option value="setting_up">Configurando</option>
                            <option value="pending_approval">Pendiente Aprobación</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="ghost" onClick={onClose} className="dark:text-gray-300 dark:hover:bg-gray-800">
                            Cancelar
                        </Button>
                        <Button type="submit">
                            {initialData ? 'Guardar Cambios' : 'Crear Usuario'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

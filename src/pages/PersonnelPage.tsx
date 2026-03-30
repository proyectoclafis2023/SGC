import React, { useState } from 'react';
import { usePersonnel } from '../context/PersonnelContext';
import { PersonnelList } from '../components/PersonnelList';
import { PersonnelForm } from '../components/PersonnelForm';
import { Button } from '../components/Button';
import { useUsers } from '../context/UserContext';
import { Plus, Search, Users as UsersIcon, Download } from 'lucide-react';
import type { Personnel, AssignedArticle } from '../types';
import { SecurityModal } from '../components/SecurityModal';
import { useArticleDeliveries } from '../context/ArticleDeliveryContext';
import { useArticles } from '../context/ArticleContext';

export const PersonnelPage: React.FC = () => {
    const { personnel, addPersonnel, updatePersonnel, deletePersonnel, uploadPersonnel } = usePersonnel();
    const { users, deleteUser } = useUsers();
    const { addDelivery } = useArticleDeliveries();
    const { decreaseStock } = useArticles();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPerson, setEditingPerson] = useState<Personnel | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [personToDelete, setPersonToDelete] = useState<Personnel | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleAddPerson = () => {
        setEditingPerson(null);
        setIsModalOpen(true);
    };

    const handleEditPerson = (person: Personnel) => {
        setEditingPerson(person);
        setIsModalOpen(true);
    };

    const handleDeletePerson = (id: string, _name: string) => {
        const person = personnel.find(p => p.id === id);
        if (person) {
            setPersonToDelete(person);
            setIsDeleteModalOpen(true);
        }
    };

    const confirmDelete = async () => {
        if (personToDelete) {
            const user = users.find(u => u.relatedId === personToDelete.id);
            if (user) {
                await deleteUser(user.id);
            }
            await deletePersonnel(personToDelete.id);
            setPersonToDelete(null);
            setIsDeleteModalOpen(false);
        }
    };

    const handleSubmit = async (data: Omit<Personnel, 'id' | 'createdAt' | 'status'>, id?: string) => {
        let finalPersonnelId = id;

        // Determinar qué artículos son nuevos o incrementados para el historial
        const newArticlesForHistory: { articleId: string; quantity: number; size?: string }[] = [];

        if (id && editingPerson) {
            // Caso edición: comparar con lo que tenía antes
            (data.assignedArticles || []).forEach((newItem: AssignedArticle) => {
                const oldItem = editingPerson.assignedArticles?.find(a => a.articleId === newItem.articleId);
                if (!oldItem) {
                    // Completamente nuevo
                    newArticlesForHistory.push({
                        articleId: newItem.articleId,
                        quantity: newItem.quantity,
                        size: newItem.size
                    });
                } else if (newItem.quantity > oldItem.quantity) {
                    // Cantidad incrementada
                    newArticlesForHistory.push({
                        articleId: newItem.articleId,
                        quantity: newItem.quantity - oldItem.quantity,
                        size: newItem.size
                    });
                }
            });
            await updatePersonnel({ ...data, id, createdAt: editingPerson.createdAt, status: editingPerson.status });
        } else {
            // Caso nuevo: todos los artículos asignados van al historial
            finalPersonnelId = await addPersonnel(data);
            if (data.assignedArticles && data.assignedArticles.length > 0) {
                data.assignedArticles.forEach((item: AssignedArticle) => {
                    newArticlesForHistory.push({
                        articleId: item.articleId,
                        quantity: item.quantity,
                        size: item.size
                    });
                });
            }
        }

        // Si hay artículos nuevos, registrar la entrega en el historial
        if (newArticlesForHistory.length > 0 && finalPersonnelId) {
            await addDelivery({
                personnelId: finalPersonnelId,
                deliveryDate: new Date().toISOString(),
                articles: newArticlesForHistory,
                status: 'active',
                notes: id ? 'Actualización desde ficha de personal' : 'Entrega inicial al registrar personal'
            });

            // Deduct stock
            for (const art of newArticlesForHistory) {
                await decreaseStock(art.articleId, art.quantity);
            }
        }

        alert(id ? 'Cambios guardados exitosamente.' : 'Personal registrado exitosamente.');
        setIsModalOpen(false);
    };

    const filteredPersonnel = personnel.filter(p => {
        if (p.isArchived) return false;

        const cleanSearch = searchTerm.toLowerCase().trim();
        const cleanDniSearch = searchTerm.replace(/[^0-9kK]/g, '').toLowerCase();

        const matchName = `${p.names} ${p.lastNames}`.toLowerCase().includes(cleanSearch);
        const matchDni = p.dni.replace(/[^0-9kK]/g, '').toLowerCase().includes(cleanDniSearch);

        return matchName || (cleanDniSearch.length > 0 && matchDni);
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <UsersIcon className="w-8 h-8 text-indigo-600" />
                        Maestro de Personal
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Gestión de fichas, contratos y previsión del personal.</p>
                </div>
                <div className="flex gap-2">
                    <input
                        type="file"
                        accept=".csv"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                try {
                                    const result = await uploadPersonnel(file);
                                    alert(result.message);
                                } catch (err: any) {
                                    alert(err.message);
                                }
                            }
                        }}
                    />
                    <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Carga Masiva
                    </Button>
                    <Button variant="secondary" onClick={() => window.print()}>
                        <Download className="w-4 h-4 mr-2" />
                        Exportar
                    </Button>
                    <Button onClick={handleAddPerson} className="shadow-indigo-500/20">
                        <Plus className="w-4 h-4 mr-2" />
                        Nuevo Trabajador
                    </Button>
                </div>
            </div>

            {/* Buscador */}
            <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4 transition-colors">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o DNI..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="text-sm text-gray-500 ml-auto hidden md:block">
                    Total personal: <span className="font-bold text-indigo-600">{filteredPersonnel.length}</span>
                </div>
            </div>

            <PersonnelList
                personnel={filteredPersonnel}
                onEdit={handleEditPerson}
                onDelete={handleDeletePerson}
            />

            <PersonnelForm
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                initialData={editingPerson}
            />

            <SecurityModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setPersonToDelete(null);
                }}
                onConfirm={confirmDelete}
                title="Eliminar Personal"
                description="¿Está seguro de eliminar la ficha de"
                itemName={personToDelete ? `${personToDelete.names} ${personToDelete.lastNames}` : ''}
                actionLabel="Eliminar Ficha"
            />
        </div>
    );
};

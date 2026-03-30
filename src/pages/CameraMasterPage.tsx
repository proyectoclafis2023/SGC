import React, { useState } from 'react';
import { useCameras } from '../context/CameraContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import {
    Camera, Plus, Trash2,
    Save, X, LayoutGrid, CheckCircle2,
    Search, Clock, Edit2
} from 'lucide-react';

export const CameraMasterPage: React.FC = () => {
    const { cameras, addCamera, updateCamera, deleteCamera } = useCameras();

    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    const [newItemName, setNewItemName] = useState('');
    const [newCameraDays, setNewCameraDays] = useState('30');

    const filteredCameras = cameras.filter(c => !c.isArchived && c.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleAddItem = async () => {
        if (!newItemName.trim()) return;
        await addCamera({ name: newItemName, backupHours: (parseInt(newCameraDays) || 30) * 24 });
        setNewItemName('');
        setNewCameraDays('30');
        setIsAddModalOpen(false);
    };

    const handleUpdateItem = async () => {
        if (!editingItem.name.trim()) return;

        let finalItem = { ...editingItem };
        if (editingItem.backupDays) {
            finalItem.backupHours = (parseInt(editingItem.backupDays) || 30) * 24;
            delete finalItem.backupDays;
        }

        await updateCamera(finalItem);
        setIsEditModalOpen(false);
        setEditingItem(null);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <Camera className="w-8 h-8 text-indigo-600" />
                        Maestro de Cámaras
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 font-bold italic text-sm">Gestiona el listado y respaldo del sistema CCTV.</p>
                </div>
                <Button onClick={() => setIsAddModalOpen(true)} className="relative z-10 shadow-lg shadow-indigo-600/20">
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Cámara
                </Button>
            </div>

            <div className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar en cámaras..."
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCameras.map((item) => (
                    <div key={item.id} className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 translate-x-4 -translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 transition-all">
                            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center text-indigo-200">
                                <Camera className="w-6 h-6" />
                            </div>
                        </div>

                        <div className="relative z-10">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 pr-8">{item.name}</h3>
                            <p className="text-sm font-bold text-gray-400 mb-6 flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/10 w-fit px-3 py-1.5 rounded-xl border border-indigo-100/50 dark:border-indigo-900/20">
                                <Clock className="w-4 h-4 text-indigo-500" />
                                {Math.round((item as any).backupHours / 24)} días de respaldo
                            </p>

                            <div className="flex items-center justify-between border-t dark:border-gray-800 pt-6">
                                <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-full">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Activo
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setEditingItem({ ...item, backupDays: Math.round((item as any).backupHours / 24) });
                                            setIsEditModalOpen(true);
                                        }}
                                        className="p-3 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-2xl transition-all"
                                        title="Editar cámara"
                                    >
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => deleteCamera(item.id)}
                                        className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-2xl transition-all"
                                        title="Archivar cámara"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal de Agregar */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-[3rem] w-full max-w-md shadow-2xl border border-white/20 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b dark:border-gray-800 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                                    <Plus className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white leading-none mb-1">Nueva Cámara</h2>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        Cámara CCTV
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <Input
                                label="Nombre / Ubicación"
                                value={newItemName}
                                onChange={e => setNewItemName(e.target.value)}
                                placeholder="ej. Cámara Calle Principal"
                                autoFocus
                            />
                            <Input
                                label="Días de Respaldo"
                                type="number"
                                value={newCameraDays}
                                onChange={e => setNewCameraDays(e.target.value)}
                                placeholder="30"
                            />
                            <div className="flex gap-3 pt-2">
                                <Button variant="secondary" className="flex-1 rounded-2xl" onClick={() => setIsAddModalOpen(false)}>Cancelar</Button>
                                <Button className="flex-1 rounded-2xl shadow-lg shadow-indigo-600/20" onClick={handleAddItem}>
                                    <Save className="w-4 h-4 mr-2" />
                                    Guardar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Editar */}
            {isEditModalOpen && editingItem && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-[3rem] w-full max-w-md shadow-2xl border border-white/20 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b dark:border-gray-800 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
                                    <Edit2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white leading-none mb-1">Editar Cámara</h2>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        Cámara CCTV
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => { setIsEditModalOpen(false); setEditingItem(null); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <Input
                                label="Nombre / Ubicación"
                                value={editingItem.name}
                                onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                                autoFocus
                            />
                            <Input
                                label="Días de Respaldo"
                                type="number"
                                value={editingItem.backupDays || 30}
                                onChange={e => setEditingItem({ ...editingItem, backupDays: e.target.value })}
                            />
                            <div className="flex gap-3 pt-2">
                                <Button variant="secondary" className="flex-1 rounded-2xl" onClick={() => { setIsEditModalOpen(false); setEditingItem(null); }}>Cancelar</Button>
                                <Button className="flex-1 rounded-2xl shadow-lg shadow-indigo-600/20 bg-amber-600 hover:bg-amber-700" onClick={handleUpdateItem}>
                                    <Save className="w-4 h-4 mr-2" />
                                    Actualizar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

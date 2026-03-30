import React, { useState } from 'react';
import { useInfrastructureItems } from '../context/InfrastructureItemContext';
import { useEquipmentItems } from '../context/EquipmentItemContext';
import { useCameras } from '../context/CameraContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import {
    Building2, Smartphone, Plus, Trash2,
    Save, X, LayoutGrid, CheckCircle2,
    Search, Clock, Camera, Edit2
} from 'lucide-react';

export const OperationalMastersPage: React.FC = () => {
    const { items: infraItems, addItem: addInfra, updateItem: updateInfra, deleteItem: deleteInfra } = useInfrastructureItems();
    const { items: equipItems, addItem: addEquip, updateItem: updateEquip, deleteItem: deleteEquip } = useEquipmentItems();
    const { cameras, addCamera, updateCamera, deleteCamera } = useCameras();

    const [activeTab, setActiveTab] = useState<'infra' | 'equip' | 'cameras'>('infra');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    const [newItemName, setNewItemName] = useState('');
    const [newCameraDays, setNewCameraDays] = useState('30');

    const filteredInfra = infraItems.filter(i => !i.isArchived && i.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredEquip = equipItems.filter(i => !i.isArchived && i.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredCameras = cameras.filter(c => !c.isArchived && c.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleAddItem = async () => {
        if (!newItemName.trim()) return;
        if (activeTab === 'infra') {
            await addInfra({ name: newItemName });
        } else if (activeTab === 'equip') {
            await addEquip({ name: newItemName });
        } else {
            await addCamera({ name: newItemName, backupHours: (parseInt(newCameraDays) || 30) * 24 });
        }
        setNewItemName('');
        setNewCameraDays('30');
        setIsAddModalOpen(false);
    };

    const handleUpdateItem = async () => {
        if (!editingItem.name.trim()) return;

        let finalItem = { ...editingItem };
        if (activeTab === 'cameras' && editingItem.backupDays) {
            finalItem.backupHours = (parseInt(editingItem.backupDays) || 30) * 24;
            delete finalItem.backupDays;
        }

        if (activeTab === 'infra') {
            await updateInfra(finalItem);
        } else if (activeTab === 'equip') {
            await updateEquip(finalItem);
        } else {
            await updateCamera(finalItem);
        }
        setIsEditModalOpen(false);
        setEditingItem(null);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <LayoutGrid className="w-8 h-8 text-indigo-600" />
                        Maestros Operativos
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 font-bold italic text-sm">Gestiona los ítems de control para las bitácoras de turno.</p>
                </div>
                <Button onClick={() => setIsAddModalOpen(true)} className="relative z-10 shadow-lg shadow-indigo-600/20">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Ítem
                </Button>
            </div>

            <div className="flex p-1.5 bg-gray-100 dark:bg-gray-800 rounded-3xl w-fit border border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('infra')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'infra' ? 'bg-white dark:bg-gray-900 text-indigo-600 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <Building2 className="w-4 h-4" />
                    Instalaciones
                </button>
                <button
                    onClick={() => setActiveTab('equip')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'equip' ? 'bg-white dark:bg-gray-900 text-indigo-600 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <Smartphone className="w-4 h-4" />
                    Equipamiento
                </button>
                <button
                    onClick={() => setActiveTab('cameras')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'cameras' ? 'bg-white dark:bg-gray-900 text-indigo-600 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <Camera className="w-4 h-4" />
                    Cámaras
                </button>
            </div>

            <div className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder={`Buscar en ${activeTab === 'infra' ? 'instalaciones' : activeTab === 'equip' ? 'equipamiento' : 'cámaras'}...`}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(activeTab === 'infra' ? filteredInfra : activeTab === 'equip' ? filteredEquip : filteredCameras).map((item) => (
                    <div key={item.id} className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 translate-x-4 -translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 transition-all">
                            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center text-indigo-200">
                                {activeTab === 'infra' ? <Building2 className="w-6 h-6" /> : activeTab === 'equip' ? <Smartphone className="w-6 h-6" /> : <Camera className="w-6 h-6" />}
                            </div>
                        </div>

                        <div className="relative z-10">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 pr-8">{item.name}</h3>
                            {activeTab === 'cameras' && (
                                <p className="text-sm font-bold text-gray-400 mb-6 flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/10 w-fit px-3 py-1.5 rounded-xl border border-indigo-100/50 dark:border-indigo-900/20">
                                    <Clock className="w-4 h-4 text-indigo-500" />
                                    {Math.round((item as any).backupHours / 24)} días de respaldo
                                </p>
                            )}

                            <div className="flex items-center justify-between border-t dark:border-gray-800 pt-6">
                                <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-full">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Activo
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setEditingItem(activeTab === 'cameras' ? { ...item, backupDays: Math.round((item as any).backupHours / 24) } : item);
                                            setIsEditModalOpen(true);
                                        }}
                                        className="p-3 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-2xl transition-all"
                                        title="Editar ítem"
                                    >
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (activeTab === 'infra') deleteInfra(item.id);
                                            else if (activeTab === 'equip') deleteEquip(item.id);
                                            else deleteCamera(item.id);
                                        }}
                                        className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-2xl transition-all"
                                        title="Archivar ítem"
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
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white leading-none mb-1">Nuevo Ítem</h2>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        {activeTab === 'infra' ? 'Instalación' : activeTab === 'equip' ? 'Equipamiento' : 'Cámara'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <Input
                                label="Nombre del Ítem"
                                value={newItemName}
                                onChange={e => setNewItemName(e.target.value)}
                                placeholder={activeTab === 'cameras' ? 'ej. Cámara Calle Principal' : 'ej. Ascensores, Radios...'}
                                autoFocus
                            />
                            {activeTab === 'cameras' && (
                                <Input
                                    label="Días de Respaldo"
                                    type="number"
                                    value={newCameraDays}
                                    onChange={e => setNewCameraDays(e.target.value)}
                                    placeholder="30"
                                />
                            )}
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
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white leading-none mb-1">Editar Ítem</h2>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        {activeTab === 'infra' ? 'Instalación' : activeTab === 'equip' ? 'Equipamiento' : 'Cámara'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => { setIsEditModalOpen(false); setEditingItem(null); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <Input
                                label="Nombre del Ítem"
                                value={editingItem.name}
                                onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                                placeholder="ej. Ascensores, Radios..."
                                autoFocus
                            />
                            {activeTab === 'cameras' && (
                                <Input
                                    label="Días de Respaldo"
                                    type="number"
                                    value={editingItem.backupDays || 30}
                                    onChange={e => setEditingItem({ ...editingItem, backupDays: e.target.value })}
                                />
                            )}
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

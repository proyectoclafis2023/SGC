import React, { useState, useMemo } from 'react';
import { useInfrastructure } from '../context/InfrastructureContext';
import { useOwners } from '../context/OwnerContext';
import { useResidents } from '../context/ResidentContext';
import { useUnitTypes } from '../context/UnitTypeContext';
import { useSpecialConditions } from '../context/SpecialConditionContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import {
    Building2, Plus, Copy, Trash2, Edit2, Dog,
    AlertTriangle, Save, X, Home, Droplets, Zap,
    Flame, UserCheck, Clock, Search, UserPlus
} from 'lucide-react';
import { formatRUT } from '../utils/formatters';
import { useSettings } from '../context/SettingsContext';
import type { Department, Tower } from '../types';

export const InfrastructurePage: React.FC = () => {
    const { towers, addTower, deleteTower, updateTower, duplicateTower, deleteDepartment } = useInfrastructure();
    const { owners, addOwner } = useOwners();
    const { residents, addResident } = useResidents();
    const { unitTypes } = useUnitTypes();
    const { conditions } = useSpecialConditions();
    const { settings } = useSettings();

    const handleDeleteDept = (towerId: string, deptId: string, number: string) => {
        if (window.confirm(`¿Está seguro de eliminar la unidad ${number}?`)) {
            deleteDepartment(towerId, deptId);
        }
    };

    const [isTowerModalOpen, setIsTowerModalOpen] = useState(false);
    const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isQuickCreateOwnerOpen, setIsQuickCreateOwnerOpen] = useState(false);
    const [isQuickCreateResidentOpen, setIsQuickCreateResidentOpen] = useState(false);

    const [currentTower, setCurrentTower] = useState<Tower | null>(null);
    const [editingDept, setEditingDept] = useState<{ towerId: string; dept: Department } | null>(null);
    const [historyDept, setHistoryDept] = useState<Department | null>(null);
    const [towerName, setTowerName] = useState('');

    const [ownerSearch, setOwnerSearch] = useState('');
    const [residentSearch, setResidentSearch] = useState('');

    const [deptNumber, setDeptNumber] = useState('');
    const [unitTypeId, setUnitTypeId] = useState('');
    const [propertyRole, setPropertyRole] = useState('');
    const [m2, setM2] = useState(0);
    const [waterClientId, setWaterClientId] = useState('');
    const [electricityClientId, setElectricityClientId] = useState('');
    const [gasClientId, setGasClientId] = useState('');
    const [ownerId, setOwnerId] = useState('');
    const [residentId, setResidentId] = useState('');

    const [quickNames, setQuickNames] = useState('');
    const [quickLastNames, setQuickLastNames] = useState('');
    const [quickDni, setQuickDni] = useState('');
    const [quickPhone, setQuickPhone] = useState('');
    const [quickEmail, setQuickEmail] = useState('');

    const filteredOwners = useMemo(() => {
        const activeOwners = owners.filter(o => !o.isArchived);
        if (!ownerSearch) return activeOwners;
        const q = ownerSearch.toLowerCase();
        return activeOwners.filter(o =>
            o.names.toLowerCase().includes(q) ||
            o.lastNames.toLowerCase().includes(q) ||
            o.dni.toLowerCase().includes(q)
        );
    }, [owners, ownerSearch]);

    const filteredResidents = useMemo(() => {
        const activeResidents = residents.filter(r => !r.isArchived);
        if (!residentSearch) return activeResidents;
        const q = residentSearch.toLowerCase();
        return activeResidents.filter(r =>
            r.names.toLowerCase().includes(q) ||
            r.lastNames.toLowerCase().includes(q) ||
            r.dni.toLowerCase().includes(q)
        );
    }, [residents, residentSearch]);

    const handleOpenTowerModal = (tower?: Tower) => {
        if (tower) {
            setCurrentTower(tower);
            setTowerName(tower.name);
        } else {
            setCurrentTower(null);
            setTowerName('');
        }
        setIsTowerModalOpen(true);
    };

    const handleSaveTower = async (e: React.FormEvent) => {
        e.preventDefault();
        if (currentTower) {
            await updateTower({ ...currentTower, name: towerName });
        } else {
            await addTower({ name: towerName, departments: [] });
        }
        setIsTowerModalOpen(false);
    };

    const handleOpenDeptModal = (towerId: string, dept?: Department) => {
        setOwnerSearch('');
        setResidentSearch('');
        if (dept) {
            setEditingDept({ towerId, dept });
            setDeptNumber(dept.number);
            setUnitTypeId(dept.unitTypeId || '');
            setPropertyRole(dept.propertyRole || '');
            setM2(dept.m2 || 0);
            setWaterClientId(dept.waterClientId || '');
            setElectricityClientId(dept.electricityClientId || '');
            setGasClientId(dept.gasClientId || '');
            setOwnerId(dept.ownerId || '');
            setResidentId(dept.residentId || '');
        } else {
            setCurrentTower(towers.find(t => t.id === towerId) || null);
            setEditingDept(null);
            setDeptNumber('');
            setUnitTypeId('');
            setPropertyRole('');
            setM2(0);
            setWaterClientId('');
            setElectricityClientId('');
            setGasClientId('');
            setOwnerId('');
            setResidentId('');
        }
        setIsDeptModalOpen(true);
    };

    const handleSaveDept = async (e: React.FormEvent) => {
        e.preventDefault();
        if (m2 < 0) {
            alert('Los metros cuadrados no pueden ser negativos.');
            return;
        }
        const towerId = editingDept ? editingDept.towerId : currentTower?.id;
        if (!towerId) return;

        const tower = towers.find(t => t.id === towerId);
        if (!tower) return;

        const deptData: Department = {
            id: editingDept ? editingDept.dept.id : Math.random().toString(36).substr(2, 9),
            number: deptNumber,
            unitTypeId,
            propertyRole,
            m2: Number(m2),
            waterClientId,
            electricityClientId,
            gasClientId,
            ownerId: ownerId || undefined,
            residentId: residentId || undefined,
            history: editingDept ? editingDept.dept.history : []
        };

        const updatedDepts = editingDept
            ? tower.departments.map(d => d.id === deptData.id ? deptData : d)
            : [...tower.departments, deptData];

        await updateTower({ ...tower, departments: updatedDepts });
        setIsDeptModalOpen(false);
    };

    const handleQuickCreateOwner = async (e: React.FormEvent) => {
        e.preventDefault();
        const id = await addOwner({
            names: quickNames,
            lastNames: quickLastNames,
            dni: quickDni,
            phone: quickPhone,
            email: quickEmail,
            notes: 'Creado desde InfrastructurePage'
        });
        setOwnerId(id);
        setIsQuickCreateOwnerOpen(false);
    };

    const handleQuickCreateResident = async (e: React.FormEvent) => {
        e.preventDefault();
        const id = await addResident({
            names: quickNames,
            lastNames: quickLastNames,
            dni: quickDni,
            phone: quickPhone,
            email: quickEmail,
            familyCount: 1,
            hasPets: false,
            conditionIds: [],
            isTenant: false,
            notes: 'Creado desde InfrastructurePage'
        });
        setResidentId(id);
        setIsQuickCreateResidentOpen(false);
    };

    const handleDuplicateOwnerToResident = async () => {
        if (!ownerId) return;
        const owner = owners.find(o => o.id === ownerId);
        if (!owner) return;
        const id = await addResident({
            names: owner.names,
            lastNames: owner.lastNames,
            dni: owner.dni,
            phone: owner.phone,
            email: owner.email,
            familyCount: 1,
            hasPets: false,
            conditionIds: [],
            isTenant: false,
            notes: 'Duplicado automáticamente del propietario.'
        });
        setResidentId(id);
    };

    const getOwnerName = (id?: string) => owners.find(o => o.id === id) ? `${owners.find(o => o.id === id)?.names} ${owners.find(o => o.id === id)?.lastNames}` : 'Sin asignar';
    const getResidentName = (id?: string) => residents.find(r => r.id === id) ? `${residents.find(r => r.id === id)?.names} ${residents.find(r => r.id === id)?.lastNames}` : 'Sin asignar';
    const getUnitTypeName = (id?: string) => unitTypes.find(t => t.id === id)?.name || 'Sin tipo';

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className={`text-2xl font-black flex items-center gap-2 ${settings.theme === 'modern' ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        <Building2 className="w-8 h-8 text-indigo-600" />
                        Maestro Edificios y Unidades
                    </h1>
                    <p className={`text-sm mt-1 font-bold ${settings.theme === 'modern' ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'}`}>Gestión de edificios, unidades y tipos de unidad.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => window.location.href = '/propietarios'}>
                        <UserCheck className="w-4 h-4 mr-2" />
                        Maestro Propietarios
                    </Button>
                    <Button variant="secondary" onClick={() => handleOpenDeptModal('')}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva Unidad
                    </Button>
                    <Button onClick={() => handleOpenTowerModal()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nuevo Edificio
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {towers.filter(t => !t.isArchived).map((tower) => (
                    <div key={tower.id} className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-500">
                        <div className="p-8 border-b border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                    <Building2 className="w-8 h-8 text-indigo-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{tower.name}</h2>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                                        ID: {tower.id} • {tower.departments.filter(d => !d.isArchived).length} UNIDADES REGISTRADAS
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => duplicateTower(tower.id, `${tower.name} (Copia)`)}
                                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm flex items-center gap-2"
                                >
                                    <Copy className="w-3.5 h-3.5" /> Duplicar
                                </button>
                                <button
                                    onClick={() => handleOpenTowerModal(tower)}
                                    className="p-3 text-gray-400 hover:text-indigo-600 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-indigo-100 shadow-sm transition-all"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => {
                                        if (window.confirm(`¿Está seguro de eliminar la ${tower.name}? Se perderán todos sus departamentos.`)) {
                                            deleteTower(tower.id);
                                        }
                                    }}
                                    className="p-3 text-red-300 hover:text-red-500 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-red-100 shadow-sm transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="p-8">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {tower.departments.filter(d => !d.isArchived).map((dept) => {
                                    const resInfo = residents.find(r => r.id === dept.residentId);
                                    return (
                                        <div key={dept.id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:shadow-md transition-all group relative">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300">
                                                        <Home className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-gray-900 dark:text-white block text-sm">Unidad {dept.number}</span>
                                                        <span className="text-[9px] px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded font-bold uppercase tracking-tighter">{getUnitTypeName(dept.unitTypeId)}</span>
                                                    </div>
                                                </div>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                    <button onClick={() => { setHistoryDept(dept); setIsHistoryModalOpen(true); }} className="p-1 text-gray-400 hover:text-indigo-600"><Clock className="w-3.5 h-3.5" /></button>
                                                    <button onClick={() => handleOpenDeptModal(tower.id, dept)} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"><Edit2 className="w-3.5 h-3.5" /></button>
                                                    <button onClick={() => handleDeleteDept(tower.id, dept.id, dept.number)} className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                                                </div>
                                            </div>

                                            <div className="space-y-2 mt-3 text-[11px]">
                                                <div className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg space-y-1">
                                                    <p className="truncate text-gray-700 dark:text-gray-300 transition-colors"><span className="text-gray-400 font-bold uppercase mr-1">Dueño:</span> {getOwnerName(dept.ownerId)}</p>
                                                    <p className="truncate text-gray-700 dark:text-gray-300 transition-colors"><span className="text-gray-400 font-bold uppercase mr-1">Res:</span> {getResidentName(dept.residentId)}</p>
                                                </div>
                                                <div className="flex items-center gap-1.5 px-1">
                                                    {resInfo && resInfo.conditionIds.length > 0 && (
                                                        <div className="flex gap-0.5">
                                                            {resInfo.conditionIds.map(cid => (
                                                                <span key={cid} title={conditions.find(c => c.id === cid)?.name}><AlertTriangle className="w-3 h-3 text-red-500" /></span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {resInfo?.hasPets && <Dog className="w-3 h-3 text-amber-500" />}
                                                    <span className="ml-auto text-[10px] text-gray-500 font-bold">{dept.m2} m²</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <button onClick={() => handleOpenDeptModal(tower.id)} className="p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-indigo-500 hover:text-indigo-500 h-32">
                                    <Plus className="w-6 h-6" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Nueva Unidad</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tower Modal */}
            {isTowerModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                            <h2 className="text-xl font-bold flex items-center gap-2"><Building2 className="w-5 h-5 text-indigo-600" /> {currentTower ? 'Editar Edificio' : 'Nuevo Edificio'}</h2>
                            <button onClick={() => setIsTowerModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><X /></button>
                        </div>
                        <form onSubmit={handleSaveTower} className="p-6 space-y-4">
                            <Input label="Nombre del Edificio" value={towerName} onChange={(e) => setTowerName(e.target.value)} required placeholder="Ej: Torre A" />
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <Button type="button" variant="secondary" onClick={() => setIsTowerModalOpen(false)}>Cancelar</Button>
                                <Button type="submit">Guardar Edificio</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Department Modal */}
            {isDeptModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-2xl shadow-2xl border border-white/10 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-indigo-600">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Home className="w-6 h-6" />
                                {editingDept ? `Unidad ${editingDept.dept.number}` : 'Añadir Nueva Unidad'}
                            </h2>
                            <button onClick={() => setIsDeptModalOpen(false)} className="p-2 hover:bg-white/20 rounded-full text-white"><X className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={handleSaveDept} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em]">Ficha Técnica</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Número" value={deptNumber} onChange={(e) => setDeptNumber(e.target.value)} required />
                                        <div className="space-y-1.5">
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Edificio</label>
                                            <select
                                                value={editingDept ? editingDept.towerId : currentTower?.id || ''}
                                                onChange={(e) => setCurrentTower(towers.find(t => t.id === e.target.value) || null)}
                                                className="w-full h-[42px] px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none transition-all"
                                                disabled={!!editingDept}
                                                required
                                            >
                                                <option value="">Seleccionar Edificio...</option>
                                                {towers.filter(t => !t.isArchived).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Tipo de Unidad</label>
                                            <select value={unitTypeId} onChange={(e) => setUnitTypeId(e.target.value)} className="w-full h-[42px] px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none transition-all" required>
                                                <option value="">Seleccionar...</option>
                                                {unitTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Metros²" type="number" value={m2} onChange={(e) => setM2(Number(e.target.value))} required min="0" />
                                        <Input label="Rol SII" value={propertyRole} onChange={(e) => setPropertyRole(e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em]">Servicios Básicos</h3>
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <Droplets className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                                            <input
                                                type="text"
                                                placeholder="N° Cliente Agua"
                                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-mono dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                value={waterClientId}
                                                onChange={(e) => setWaterClientId(e.target.value)}
                                            />
                                        </div>
                                        <div className="relative">
                                            <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-500" />
                                            <input
                                                type="text"
                                                placeholder="N° Cliente Electricidad"
                                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-mono dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
                                                value={electricityClientId}
                                                onChange={(e) => setElectricityClientId(e.target.value)}
                                            />
                                        </div>
                                        <div className="relative">
                                            <Flame className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500" />
                                            <input
                                                type="text"
                                                placeholder="N° Cliente Gas"
                                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-mono dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                                value={gasClientId}
                                                onChange={(e) => setGasClientId(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[11px] font-bold uppercase text-gray-400">Propietario</label>
                                        <button type="button" onClick={() => setIsQuickCreateOwnerOpen(true)} className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 hover:underline">
                                            <Plus className="w-3 h-3" /> Crear Nuevo
                                        </button>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Buscar..."
                                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm outline-none dark:text-gray-200"
                                                value={ownerSearch}
                                                onChange={(e) => setOwnerSearch(e.target.value)}
                                            />
                                        </div>
                                        <select
                                            value={ownerId}
                                            onChange={(e) => setOwnerId(e.target.value)}
                                            className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm h-10 outline-none dark:text-gray-200 px-3"
                                        >
                                            <option value="">Seleccione...</option>
                                            {filteredOwners.map(o => <option key={o.id} value={o.id}>{o.names} {o.lastNames}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[11px] font-bold uppercase text-gray-400">Residente</label>
                                        <div className="flex gap-3 items-center">
                                            {ownerId && (
                                                <button type="button" onClick={handleDuplicateOwnerToResident} className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 hover:underline">
                                                    <UserCheck className="w-3 h-3" /> Es el mismo Dueño
                                                </button>
                                            )}
                                            <button type="button" onClick={() => setIsQuickCreateResidentOpen(true)} className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 hover:underline">
                                                <Plus className="w-3 h-3" /> Crear Nuevo
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Buscar..."
                                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm outline-none dark:text-gray-200"
                                                value={residentSearch}
                                                onChange={(e) => setResidentSearch(e.target.value)}
                                            />
                                        </div>
                                        <select
                                            value={residentId}
                                            onChange={(e) => setResidentId(e.target.value)}
                                            className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm h-10 outline-none dark:text-gray-200 px-3"
                                        >
                                            <option value="">Seleccione...</option>
                                            {filteredResidents.map(r => <option key={r.id} value={r.id}>{r.names} {r.lastNames}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                                <Button type="button" variant="secondary" onClick={() => setIsDeptModalOpen(false)}>Cancelar</Button>
                                <Button type="submit" className="bg-indigo-600">
                                    <Save className="w-4 h-4 mr-2" /> Guardar Unidad
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Quick Create Modals */}
            {(isQuickCreateOwnerOpen || isQuickCreateResidentOpen) && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in zoom-in-95 duration-200 transition-all">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md shadow-2xl border border-white/20">
                        <div className="p-6 border-b flex items-center justify-between"><h2 className="text-lg font-bold flex items-center gap-2"><UserPlus className="w-5 h-5 text-indigo-600" />{isQuickCreateOwnerOpen ? 'Nuevo Propietario' : 'Nuevo Residente'}</h2><button onClick={() => { setIsQuickCreateOwnerOpen(false); setIsQuickCreateResidentOpen(false); }} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full"><X className="w-5 h-5" /></button></div>
                        <form onSubmit={isQuickCreateOwnerOpen ? handleQuickCreateOwner : handleQuickCreateResident} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4"><Input label="Nombres" value={quickNames} onChange={(e) => setQuickNames(e.target.value)} required /><Input label="Apellidos" value={quickLastNames} onChange={(e) => setQuickLastNames(e.target.value)} required /></div>
                            <Input label="RUT / DNI" value={quickDni} onChange={(e) => setQuickDni(formatRUT(e.target.value))} required />
                            <div className="grid grid-cols-2 gap-4"><Input label="Teléfono" value={quickPhone} onChange={(e) => setQuickPhone(e.target.value)} required /><Input label="Email" type="email" value={quickEmail} onChange={(e) => setQuickEmail(e.target.value)} required /></div>
                            <div className="flex justify-end gap-3 pt-4"><Button type="button" variant="secondary" onClick={() => { setIsQuickCreateOwnerOpen(false); setIsQuickCreateResidentOpen(false); }}>Cancelar</Button><Button type="submit" className="bg-emerald-600 text-white">Crear y Seleccionar</Button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {isHistoryModalOpen && historyDept && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300 transition-all">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-xl shadow-2xl border border-white/20">
                        <div className="p-6 border-b flex items-center justify-between"><h2 className="text-xl font-bold flex items-center gap-2"><Clock className="w-5 h-5 text-indigo-600" /> Historial Depto {historyDept.number}</h2><button onClick={() => setIsHistoryModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><X /></button></div>
                        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                            {!historyDept.history || historyDept.history.length === 0 ? <p className="text-center text-gray-500 py-10">Sin registros históricos.</p> :
                                historyDept.history.slice().reverse().map(log => (
                                    <div key={log.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 flex justify-between items-center">
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold uppercase text-indigo-600">
                                                {log.action === 'owner_change' ? 'Propietario' : 'Residente'}
                                            </p>
                                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{log.details}</p>
                                        </div>
                                        <span className="text-[10px] text-gray-400 font-mono">
                                            {new Date(log.timestamp).toLocaleDateString()}
                                        </span>
                                    </div>
                                ))
                            }
                        </div>
                        <div className="p-6 border-t flex justify-end"><Button onClick={() => setIsHistoryModalOpen(false)}>Cerrar</Button></div>
                    </div>
                </div>
            )}
        </div>
    );
};

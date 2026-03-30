import React, { useState, useRef } from 'react';
import { useFixedAssets } from '../context/FixedAssetContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import {
    Plus, Search, Trash2, Edit2, Package,
    X, Printer, Camera, CheckCircle2, Wrench, ShieldAlert
} from 'lucide-react';
import type { FixedAsset, MaintenanceRecord } from '../types';

export const FixedAssetsPage: React.FC = () => {
    const { assets, addAsset, updateAsset, deleteAsset } = useFixedAssets();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<FixedAsset | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Form states
    const [description, setDescription] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [purchasePrice, setPurchasePrice] = useState(0);
    const [depreciatedValue, setDepreciatedValue] = useState(0);
    const [model, setModel] = useState('');
    const [details, setDetails] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [image, setImage] = useState<string | undefined>(undefined);
    const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
    const [requiresMaintenance, setRequiresMaintenance] = useState(false);
    const [nextMaintenanceDate, setNextMaintenanceDate] = useState('');
    const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceRecord[]>([]);

    // maintenance record form (inside modal)
    const [maintDate, setMaintDate] = useState(new Date().toISOString().split('T')[0]);
    const [maintDescription, setMaintDescription] = useState('');
    const [maintTechnician, setMaintTechnician] = useState('');
    const [maintCost, setMaintCost] = useState(0);
    const [maintObservations, setMaintObservations] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleOpenModal = (asset?: FixedAsset) => {
        if (asset) {
            setEditingAsset(asset);
            setDescription(asset.description);
            setQuantity(asset.quantity);
            setPurchasePrice(asset.purchasePrice);
            setDepreciatedValue(asset.depreciatedValue);
            setModel(asset.model);
            setDetails(asset.details);
            setIsActive(asset.isActive);
            setImage(asset.image);
            setPurchaseDate(asset.purchaseDate);
            setRequiresMaintenance(asset.requiresMaintenance || false);
            setNextMaintenanceDate(asset.nextMaintenanceDate || '');
            setMaintenanceHistory(asset.maintenanceHistory || []);
        } else {
            setEditingAsset(null);
            setDescription('');
            setQuantity(1);
            setPurchasePrice(0);
            setDepreciatedValue(0);
            setModel('');
            setDetails('');
            setIsActive(true);
            setImage(undefined);
            setPurchaseDate(new Date().toISOString().split('T')[0]);
            setRequiresMaintenance(false);
            setNextMaintenanceDate('');
            setMaintenanceHistory([]);
        }

        // reset maintenance form
        setMaintDate(new Date().toISOString().split('T')[0]);
        setMaintDescription('');
        setMaintTechnician('');
        setMaintCost(0);
        setMaintObservations('');

        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = {
            description,
            quantity: Number(quantity),
            purchasePrice: Number(purchasePrice),
            depreciatedValue: Number(depreciatedValue),
            model,
            details,
            isActive,
            image,
            purchaseDate,
            requiresMaintenance,
            nextMaintenanceDate: requiresMaintenance ? nextMaintenanceDate : undefined,
            maintenanceHistory: requiresMaintenance ? maintenanceHistory : undefined
        };

        if (editingAsset) {
            await updateAsset({ ...editingAsset, ...data });
        } else {
            await addAsset(data);
        }
        setIsModalOpen(false);
    };

    const handleAddMaintenance = () => {
        if (!maintDate || !maintDescription || !maintTechnician) return;

        const generateFolio = (prefix: string) => {
            const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            return `${prefix}-${dateStr}-${rand}`;
        };

        const newRecord: MaintenanceRecord = {
            id: `MNT-${Math.random().toString(36).substring(2, 9)}`,
            folio: generateFolio('MNT'),
            date: maintDate,
            description: maintDescription,
            technicianName: maintTechnician,
            cost: maintCost || undefined,
            observations: maintObservations || undefined
        };

        setMaintenanceHistory(prev => [newRecord, ...prev]);

        // reset maint form
        setMaintDate(new Date().toISOString().split('T')[0]);
        setMaintDescription('');
        setMaintTechnician('');
        setMaintCost(0);
        setMaintObservations('');
    };

    const handleDeleteMaintenance = (id: string) => {
        setMaintenanceHistory(prev => prev.filter(m => m.id !== id));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePrintDetail = (asset: FixedAsset) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Detalle de Activo Fijo - ${asset.id}</title>
                    <style>
                        body { font-family: sans-serif; padding: 40px; color: #333; }
                        .header { border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
                        .id { color: #4f46e5; font-weight: bold; font-size: 1.2em; }
                        .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; }
                        .label { font-weight: bold; font-size: 0.9em; color: #666; text-transform: uppercase; }
                        .value { font-size: 1.1em; margin-bottom: 15px; }
                        .image { max-width: 300px; border-radius: 10px; margin-top: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        .footer { margin-top: 50px; font-size: 0.8em; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Detalle de Activo Fijo</h1>
                        <div class="id">ID: ${asset.id}</div>
                    </div>
                    <div class="grid">
                        <div>
                            <div class="label">Descripción</div>
                            <div class="value">${asset.description}</div>
                            
                            <div class="label">Modelo</div>
                            <div class="value">${asset.model || 'N/A'}</div>

                            <div class="label">Cantidad</div>
                            <div class="value">${asset.quantity}</div>
                        </div>
                        <div>
                            <div class="label">Precio de Compra</div>
                            <div class="value">$${asset.purchasePrice.toLocaleString('es-CL')}</div>

                            <div class="label">Valor Depreciado</div>
                            <div class="value">$${asset.depreciatedValue.toLocaleString('es-CL')}</div>

                            <div class="label">Fecha de Compra</div>
                            <div class="value">${new Date(asset.purchaseDate).toLocaleDateString()}</div>
                        </div>
                    </div>
                    <div class="label">Detalles Adicionales</div>
                    <div class="value">${asset.details || 'Sin detalles adicionales.'}</div>
                    
                    ${asset.image ? `<img src="${asset.image}" class="image" />` : ''}

                    ${asset.requiresMaintenance ? `
                        <div style="margin-top: 40px;">
                            <h3>Historial de Mantenciones</h3>
                            <p><strong>Próxima Mantención:</strong> ${asset.nextMaintenanceDate ? new Date(asset.nextMaintenanceDate).toLocaleDateString() : 'No programada'}</p>
                            ${asset.maintenanceHistory && asset.maintenanceHistory.length > 0 ? `
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Técnico</th>
                                            <th>Descripción</th>
                                            <th>Costo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${asset.maintenanceHistory.map(record => `
                                            <tr>
                                                <td>${new Date(record.date).toLocaleDateString()}</td>
                                                <td>${record.technicianName}</td>
                                                <td>${record.description}</td>
                                                <td>${record.cost ? '$' + record.cost.toLocaleString('es-CL') : '-'}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            ` : '<p>No hay registros de mantenciones.</p>'}
                        </div>
                    ` : ''}

                    <div class="footer">
                        Documento generado el ${new Date().toLocaleString()} - Sistema de Gestión de Copropiedad SGC
                    </div>
                    <script>window.onload = () => { window.print(); window.close(); }</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const filteredAssets = assets.filter(a => {
        if (a.isArchived) return false;
        return a.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.model.toLowerCase().includes(searchTerm.toLowerCase())
    });

    const totalQuantity = assets.reduce((acc, curr) => acc + curr.quantity, 0);
    const totalInvested = assets.reduce((acc, curr) => acc + (curr.purchasePrice * curr.quantity), 0);
    const totalDepreciation = assets.reduce((acc, curr) => acc + (curr.depreciatedValue * curr.quantity), 0);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-500/20">
                            <Package className="w-8 h-8 text-white" />
                        </div>
                        Maestro Activo Fijo
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium ml-1">Control de inventario, valorización y depreciación del activo.</p>
                </div>
                <Button onClick={() => handleOpenModal()} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-lg shadow-emerald-500/20">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Activo
                </Button>
            </div>

            {/* Indicadores */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Items Existentes</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white">{totalQuantity}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Inversión Total</p>
                    <p className="text-3xl font-black text-emerald-600 dark:text-emerald-500">${totalInvested.toLocaleString('es-CL')}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Depreciación Acum.</p>
                    <p className="text-3xl font-black text-amber-600 dark:text-amber-500">${totalDepreciation.toLocaleString('es-CL')}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-4 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por descripción, ID o modelo..."
                        className="w-full pl-12 pr-4 py-3 rounded-2xl border-none bg-transparent text-gray-900 dark:text-white focus:outline-none text-sm font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAssets.map((asset) => (
                    <div key={asset.id} className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-300">
                        {asset.image && (
                            <div className="h-48 w-full overflow-hidden relative">
                                <img src={asset.image} alt={asset.description} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                                    <p className="text-white font-black uppercase text-xs tracking-widest">ID: {asset.id}</p>
                                </div>
                            </div>
                        )}
                        <div className="p-6">
                            {!asset.image && (
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">ID: {asset.id}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${asset.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                        {asset.isActive ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                            )}
                            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1 leading-tight">{asset.description}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-4">{asset.model}</p>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl">
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter mb-1">Precio Compra</p>
                                    <p className="text-sm font-black text-gray-900 dark:text-white truncate">${asset.purchasePrice.toLocaleString('es-CL')}</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl">
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter mb-1">Depreciado</p>
                                    <p className="text-sm font-black text-amber-600 truncate">${asset.depreciatedValue.toLocaleString('es-CL')}</p>
                                </div>
                            </div>

                            {asset.requiresMaintenance && asset.nextMaintenanceDate && (
                                <div className="mb-6 flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
                                    <Wrench className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                                    <div>
                                        <p className="text-[10px] uppercase font-black tracking-widest text-indigo-400">Próxima Mantención</p>
                                        <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                                            {new Date(asset.nextMaintenanceDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                                <div className="flex gap-2">
                                    <button onClick={() => handleOpenModal(asset)} className="p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-indigo-600 rounded-xl transition-all">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handlePrintDetail(asset)} className="p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-emerald-600 rounded-xl transition-all">
                                        <Printer className="w-4 h-4" />
                                    </button>
                                </div>
                                <button onClick={() => deleteAsset(asset.id)} className="p-2.5 bg-red-50 dark:bg-red-900/10 text-red-400 hover:text-red-600 rounded-xl transition-all">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-[3rem] w-full max-w-2xl shadow-2xl border border-white/20 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                                <Package className="w-6 h-6 text-emerald-600" />
                                {editingAsset ? 'Editar Activo' : 'Nuevo Activo Fijo'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl text-gray-500">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <Input label="Descripción del Activo" value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="ej. Generador Eléctrico Trifásico" />
                                </div>
                                <Input label="Modelo" value={model} onChange={(e) => setModel(e.target.value)} required placeholder="ej. SDMO J220" />
                                <Input label="Cantidad" type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} required min="1" />
                                <Input label="Precio de Compra ($)" type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(Number(e.target.value))} required min="0" />
                                <Input label="Valor Depreciado ($)" type="number" value={depreciatedValue} onChange={(e) => setDepreciatedValue(Number(e.target.value))} required min="0" />
                                <Input label="Fecha de Compra" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} required />
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Detalles Adicionales</label>
                                    <textarea
                                        value={details}
                                        onChange={(e) => setDetails(e.target.value)}
                                        className="w-full h-24 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-sm outline-none transition-all focus:ring-4 focus:ring-emerald-500/10"
                                        placeholder="Bitácora, mantenimientos, ubicación..."
                                    />
                                </div>

                                <div className="md:col-span-2 space-y-4">
                                    <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest ml-1">Imagen del Activo</p>
                                    <div className="flex items-center gap-6">
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-32 h-32 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all overflow-hidden"
                                        >
                                            {image ? (
                                                <img src={image} className="w-full h-full object-cover" />
                                            ) : (
                                                <>
                                                    <Camera className="w-6 h-6 text-gray-400" />
                                                    <span className="text-[10px] font-black text-gray-400 uppercase">Subir</span>
                                                </>
                                            )}
                                        </div>
                                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                                        <div className="flex-1">
                                            <p className="text-[11px] text-gray-500 font-medium italic">Sube una fotografía real del activo para respaldo y auditoría visual.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="md:col-span-2 flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-[2rem]">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${isActive ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">Estado del Activo</p>
                                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{isActive ? 'En uso / Operativo' : 'Disponible / Bodega'}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsActive(!isActive)}
                                        className={`w-12 h-6 rounded-full transition-all relative ${isActive ? 'bg-emerald-600' : 'bg-gray-300'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isActive ? 'right-1' : 'left-1'}`} />
                                    </button>
                                </div>

                                <div className="md:col-span-2 flex items-center justify-between p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/30">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${requiresMaintenance ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                            <Wrench className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">Requiere Mantenimientos</p>
                                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Activar bitácora de chequeos</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setRequiresMaintenance(!requiresMaintenance)}
                                        className={`w-12 h-6 rounded-full transition-all relative ${requiresMaintenance ? 'bg-indigo-600' : 'bg-gray-300'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${requiresMaintenance ? 'right-1' : 'left-1'}`} />
                                    </button>
                                </div>

                                {requiresMaintenance && (
                                    <div className="md:col-span-2 space-y-6 animate-in slide-in-from-top-4">
                                        <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-indigo-100 dark:border-indigo-900/50 shadow-sm">
                                            <h3 className="text-sm font-black text-indigo-800 dark:text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <ShieldAlert className="w-4 h-4" />
                                                Gestión de Mantenciones
                                            </h3>

                                            <Input
                                                label="Fecha próximo chequeo programado"
                                                type="date"
                                                value={nextMaintenanceDate}
                                                onChange={(e) => setNextMaintenanceDate(e.target.value)}
                                            />

                                            <div className="mt-8 border-t border-gray-100 dark:border-gray-700 pt-6">
                                                <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4">Registro de Chequeos Anteriores</h4>

                                                {/* Form Adding New Record */}
                                                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 border border-gray-200 dark:border-gray-800">
                                                    <Input type="date" label="Fecha de Mantención" value={maintDate} onChange={(e) => setMaintDate(e.target.value)} />
                                                    <Input label="Técnico / Taller" value={maintTechnician} onChange={(e) => setMaintTechnician(e.target.value)} placeholder="Ej. Juan Mecánico" />
                                                    <div className="sm:col-span-2">
                                                        <Input label="Descripción del trabajo" value={maintDescription} onChange={(e) => setMaintDescription(e.target.value)} placeholder="Ej. Cambio de Aceite y Filtros" />
                                                    </div>
                                                    <Input label="Costo ($)" type="number" value={maintCost} onChange={(e) => setMaintCost(Number(e.target.value))} />
                                                    <div className="sm:col-span-2">
                                                        <Input label="Observaciones (Opcional)" value={maintObservations} onChange={(e) => setMaintObservations(e.target.value)} placeholder="Ej. El motor tiene un sonido extraño..." />
                                                    </div>
                                                    <div className="sm:col-span-2 flex justify-end">
                                                        <Button type="button" size="sm" onClick={handleAddMaintenance} disabled={!maintDate || !maintDescription || !maintTechnician} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                                            <Plus className="w-4 h-4 mr-2" /> Agregar al Historial
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* History List */}
                                                {maintenanceHistory.length > 0 ? (
                                                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                                        {maintenanceHistory.map(record => (
                                                            <div key={record.id} className="relative p-4 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 group">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteMaintenance(record.id)}
                                                                    className="absolute top-3 right-3 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                                <div className="flex justify-between items-start mb-2 pr-6">
                                                                    <div>
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className="text-[10px] font-black uppercase text-indigo-500">{new Date(record.date).toLocaleDateString()}</span>
                                                                            <span className="text-[9px] font-black text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded"># {record.folio}</span>
                                                                        </div>
                                                                        <h5 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{record.description}</h5>
                                                                    </div>
                                                                    {record.cost && <span className="text-sm font-black text-amber-600">${record.cost.toLocaleString('es-CL')}</span>}
                                                                </div>
                                                                <p className="text-xs text-gray-500 mb-1"><strong>Técnico:</strong> {record.technicianName}</p>
                                                                {record.observations && <p className="text-xs text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg mt-2">"{record.observations}"</p>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-gray-500 italic">No hay registros de mantenimiento previos.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20">
                                    {editingAsset ? 'Guardar Cambios' : 'Registrar Activo'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div >
            )}
        </div >
    );
};

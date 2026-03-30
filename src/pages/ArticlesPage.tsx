import React, { useState } from 'react';
import { useArticles } from '../context/ArticleContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Plus, Trash2, Edit2, X, Shirt, Search, ShieldCheck, Eraser, Briefcase, Filter, AlertTriangle, Download } from 'lucide-react';
import type { Article } from '../types';

export const ArticlesPage: React.FC = () => {
    const { articles, addArticle, updateArticle, deleteArticle, uploadArticles } = useArticles();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingArticle, setEditingArticle] = useState<Article | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<Article['category'] | 'all' | 'low-stock'>('all');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<Article['category']>('EPP');
    const [price, setPrice] = useState(0);
    const [stock, setStock] = useState(0);
    const [minStock, setMinStock] = useState(0);
    const [isActive, setIsActive] = useState(true);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleOpenModal = (art?: Article) => {
        if (art) {
            setEditingArticle(art);
            setName(art.name);
            setDescription(art.description || '');
            setCategory(art.category);
            setPrice(art.price || 0);
            setStock(art.stock || 0);
            setMinStock(art.minStock || 0);
            setIsActive(art.isActive !== undefined ? art.isActive : true);
        } else {
            setEditingArticle(null);
            setName('');
            setDescription('');
            setCategory('EPP');
            setPrice(0);
            setStock(0);
            setMinStock(0);
            setIsActive(true);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = { name, description, category, price: Number(price), stock: Number(stock), minStock: Number(minStock), isActive };
        if (editingArticle) {
            await updateArticle({ ...editingArticle, ...data });
        } else {
            await addArticle(data);
        }
        setIsModalOpen(false);
    };

    const handleExportCSV = () => {
        const headers = ['ID', 'Nombre', 'Categoria', 'Stock', 'Stock Minimo', 'Precio', 'Activo', 'Archivado'];
        const rows = articles.map(a => [
            a.id,
            a.name,
            a.category,
            a.stock,
            a.minStock,
            a.price,
            a.isActive ? 'SI' : 'NO',
            a.isArchived ? 'SI' : 'NO'
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "reporte_articulos.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredArticles = articles.filter(a => {
        if (a.isArchived) return false;
        const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const isLowStock = a.minStock > 0 && a.stock <= a.minStock;
        const matchesCategory = categoryFilter === 'all' ||
            (categoryFilter === 'low-stock' ? isLowStock : a.category === categoryFilter);
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20">
                            <ShieldCheck className="w-8 h-8 text-white" />
                        </div>
                        Maestro EPP
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium ml-1">E.P.P, Artículos de Aseo y Materiales de Oficina.</p>
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
                                    const result = await uploadArticles(file);
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
                    <Button variant="secondary" onClick={handleExportCSV}>
                        <Download className="w-4 h-4 mr-2" />
                        Exportar CSV
                    </Button>
                    <Button onClick={() => handleOpenModal()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nuevo Artículo
                    </Button>
                </div>
            </div>

            {/* Dash resumido de Stock */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">Total Unidades</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">
                        {articles.reduce((acc, a) => acc + (a.stock || 0), 0)}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/10 rounded-bl-3xl flex items-center justify-center">
                        <AlertTriangle className={`w-5 h-5 ${articles.some(a => a.minStock > 0 && a.stock <= a.minStock) ? 'text-amber-500 animate-pulse' : 'text-gray-300'}`} />
                    </div>
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none mb-2">Reposición Necesaria</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">
                        {articles.filter(a => a.minStock > 0 && a.stock <= a.minStock).length} <span className="text-sm font-bold text-gray-400">items</span>
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mb-2">Valor Estimado Cargo</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">
                        ${articles.reduce((acc, a) => acc + (a.stock * a.price), 0).toLocaleString('es-CL')}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-2">Artículos Activos</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">
                        {articles.filter(a => a.isActive).length}
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-2 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row items-center gap-4">
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto no-scrollbar">
                    {[
                        { id: 'all', label: 'Todos', icon: Filter },
                        { id: 'low-stock', label: 'Crítico', icon: AlertTriangle },
                        { id: 'EPP', label: 'E.P.P', icon: ShieldCheck },
                        { id: 'Aseo', label: 'Aseo', icon: Eraser },
                        { id: 'Oficina', label: 'Oficina', icon: Briefcase }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setCategoryFilter(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${categoryFilter === tab.id ? 'bg-white dark:bg-gray-900 text-indigo-600 shadow-sm scale-105' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <tab.icon className={`w-3.5 h-3.5 ${tab.id === 'low-stock' ? 'text-amber-500' : ''}`} />
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="relative flex-1 w-full px-2">
                    <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o descripción..."
                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-none bg-transparent text-gray-900 dark:text-white focus:outline-none transition-all text-sm font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArticles.map((a) => (
                    <div key={a.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden group hover:shadow-md transition-all">
                        <div className="p-5 flex items-start justify-between">
                            <div className="flex gap-4">
                                <div className={`p-4 rounded-2xl ${a.category === 'EPP' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' :
                                    a.category === 'Aseo' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' :
                                        'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'
                                    }`}>
                                    {a.category === 'EPP' ? <ShieldCheck className="w-8 h-8" /> :
                                        a.category === 'Aseo' ? <Eraser className="w-8 h-8" /> :
                                            <Briefcase className="w-8 h-8" />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">{a.name}</h3>
                                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-black mt-0.5">${(a.price || 0).toLocaleString('es-CL')}</p>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{a.category}</p>
                                        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${a.isActive ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}>
                                            {a.isActive ? 'Activo' : 'Inactivo'}
                                        </span>
                                        {a.minStock > 0 && a.stock <= a.minStock && (
                                            <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded-lg text-[8px] font-black uppercase tracking-widest animate-pulse">
                                                <AlertTriangle className="w-2.5 h-2.5" />
                                                Reposición Necesaria
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-3 flex items-center gap-4">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Stock Actual</span>
                                            <span className={`text-sm font-black ${a.minStock > 0 && a.stock <= a.minStock ? 'text-amber-600' : 'text-gray-900 dark:text-white'}`}>{a.stock} un.</span>
                                        </div>
                                        <div className="flex flex-col border-l border-gray-100 dark:border-gray-800 pl-4">
                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Stock Mínimo</span>
                                            <span className="text-sm font-black text-gray-500 dark:text-gray-400">{a.minStock} un.</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleOpenModal(a)} className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => deleteArticle(a.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        {a.description && (
                            <div className="px-5">
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-xl italic line-clamp-2">
                                    {a.description}
                                </p>
                            </div>
                        )}
                        <div className="p-5 pt-2">
                            <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-1000 ${a.minStock > 0 && a.stock <= a.minStock ? 'bg-amber-500' : 'bg-indigo-500'}`}
                                    style={{ width: `${Math.min(100, (a.stock / (a.minStock > 0 ? a.minStock * 3 : 100)) * 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md shadow-2xl border border-white/20 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Shirt className="w-5 h-5 text-indigo-600" />
                                {editingArticle ? 'Editar Artículo' : 'Nuevo Artículo'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <Input label="Nombre del Artículo" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ej: Zapatos de Seguridad" />
                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Categoría</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value as Article['category'])}
                                    className="w-full h-[42px] px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none transition-all"
                                >
                                    <option value="EPP">E.P.P / Uniforme</option>
                                    <option value="Aseo">Artículos de Aseo</option>
                                    <option value="Oficina">Material de Oficina</option>
                                    <option value="otro">Otros</option>
                                </select>
                            </div>
                            <Input
                                label="Precio Unitario ($)"
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(Number(e.target.value))}
                                required
                                min="0"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Stock Actual"
                                    type="number"
                                    value={stock}
                                    onChange={(e) => setStock(Number(e.target.value))}
                                    required
                                    min="0"
                                />
                                <Input
                                    label="Stock Mínimo"
                                    type="number"
                                    value={minStock}
                                    onChange={(e) => setMinStock(Number(e.target.value))}
                                    required
                                    min="0"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Descripción</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full h-24 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm outline-none transition-all focus:ring-4 focus:ring-indigo-500/10"
                                    placeholder="Detalles adicionales..."
                                />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isActive ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">Estado del Artículo</p>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{isActive ? 'Disponible' : 'No disponible'}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsActive(!isActive)}
                                    className={`w-12 h-6 rounded-full transition-all relative ${isActive ? 'bg-indigo-600' : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isActive ? 'right-1' : 'left-1'}`} />
                                </button>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                                <Button type="submit">Guardar Artículo</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

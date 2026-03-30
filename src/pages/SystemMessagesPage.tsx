import React, { useState } from 'react';
import { useSystemMessages } from '../context/SystemMessageContext';
import { Button } from '../components/Button';
import { Plus, Trash2, Edit2, X, Bell, Eye, EyeOff, MessageSquare, Bookmark, Camera, Youtube } from 'lucide-react';
import type { SystemMessage } from '../types';

export const SystemMessagesPage: React.FC = () => {
    const { messages, addMessage, updateMessage, deleteMessage, toggleMessageStatus } = useSystemMessages();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMessage, setEditingMessage] = useState<SystemMessage | null>(null);

    const [text, setText] = useState('');
    const [type, setType] = useState<SystemMessage['type']>('info');
    const [expiresAt, setExpiresAt] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>([]);

    // Novedades
    const [image, setImage] = useState<string | undefined>(undefined);
    const [youtubeUrl, setYoutubeUrl] = useState<string | undefined>(undefined);
    const [durationSeconds, setDurationSeconds] = useState<number>(5);
    const [isFullImage, setIsFullImage] = useState(false);

    const quickTemplates = [
        { label: 'Hidropack', text: 'Problemas con sistema Hidropack - Técnicos en camino.', type: 'danger' as const },
        { label: 'Portón', text: 'Portón principal en mantención - Acceso restringido.', type: 'warning' as const },
        { label: 'Corte Luz', text: 'Corte de luz programado para este [FECHA] de [HORA] a [HORA].', type: 'danger' as const },
        { label: 'Piscina', text: 'Mantenimiento de piscinas finalizado. Habilitada para uso.', type: 'success' as const },
    ];

    const handleOpenModal = (msg?: SystemMessage) => {
        if (msg) {
            setEditingMessage(msg);
            setText(msg.text);
            setType(msg.type);
            setExpiresAt(msg.expiresAt || '');
            setTags(msg.tags || []);
            setImage(msg.image);
            setYoutubeUrl(msg.youtubeUrl);
            setDurationSeconds(msg.durationSeconds || 5);
            setIsFullImage(msg.isFullImage || false);
        } else {
            setEditingMessage(null);
            setText('');
            setType('info');
            setExpiresAt('');
            setTags([]);
            setImage(undefined);
            setYoutubeUrl(undefined);
            setDurationSeconds(5);
            setIsFullImage(false);
        }
        setIsModalOpen(true);
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

    const handleQuickTemplate = (template: typeof quickTemplates[0]) => {
        setText(template.text);
        setType(template.type);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = {
            text,
            type,
            expiresAt,
            tags,
            isActive: true,
            image,
            youtubeUrl,
            durationSeconds,
            isFullImage
        };
        if (editingMessage) {
            await updateMessage({ ...editingMessage, ...data });
        } else {
            await addMessage(data);
        }
        setIsModalOpen(false);
    };

    const addTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const removeTag = (t: string) => {
        setTags(tags.filter(tag => tag !== t));
    };

    const getTypeColor = (type: SystemMessage['type']) => {
        switch (type) {
            case 'danger': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
            case 'warning': return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400';
            case 'success': return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400';
            default: return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <MessageSquare className="w-8 h-8 text-indigo-600" />
                        Maestro Avisos Sistema
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Gestiona los avisos que se mostrarán en el carrusel público.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => window.open('/visor-mensajes', '_blank')}>
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Visor
                    </Button>
                    <Button onClick={() => handleOpenModal()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nuevo Mensaje
                    </Button>
                </div>
            </div>

            {/* Quick Templates Bar */}
            <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Plantillas Rápidas</p>
                <div className="flex flex-wrap gap-2">
                    {quickTemplates.map((t, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                handleOpenModal();
                                handleQuickTemplate(t);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:border-indigo-500 hover:text-indigo-600 transition-all flex items-center gap-2"
                        >
                            <Bookmark className="w-3 h-3" />
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {messages.filter(m => !m.isArchived).map((msg) => (
                    <div key={msg.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                        <div className="flex items-center gap-4 flex-1">
                            <div className={`p-3 rounded-xl shrink-0 ${getTypeColor(msg.type)}`}>
                                <Bell className="w-6 h-6" />
                            </div>
                            <div className="min-w-0">
                                <p className={`text-lg font-medium leading-tight ${msg.isActive ? 'text-gray-900 dark:text-white' : 'text-gray-400 line-through'}`}>
                                    {msg.text}
                                </p>
                                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                                    <span className="capitalize font-bold px-2 py-0.5 rounded-full border border-current opacity-70">{msg.type}</span>
                                    <span>Creado el {new Date(msg.createdAt).toLocaleDateString()}</span>
                                    {msg.expiresAt && <span className="text-red-500 font-bold">Vence: {new Date(msg.expiresAt).toLocaleDateString()}</span>}
                                    {msg.tags?.map((t, idx) => (
                                        <span key={idx} className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 px-2 py-0.5 rounded-md">#{t}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                            <button
                                onClick={() => toggleMessageStatus(msg.id)}
                                className={`p-2 rounded-lg transition-colors ${msg.isActive ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                title={msg.isActive ? 'Desactivar' : 'Activar'}
                            >
                                {msg.isActive ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                            </button>
                            <button
                                onClick={() => handleOpenModal(msg)}
                                className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                            >
                                <Edit2 className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => deleteMessage(msg.id)}
                                className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg shadow-2xl border border-white/20 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-300 transition-colors">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-indigo-600" />
                                {editingMessage ? 'Editar Mensaje' : 'Nuevo Mensaje'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Contenido del Mensaje</label>
                                <textarea
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="ej. Corte de luz programado para el domingo de 08:00 a 12:00"
                                    className="w-full min-h-[100px] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Tipo de Aviso</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(['info', 'warning', 'danger', 'success'] as const).map((t) => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => setType(t)}
                                                className={`py-2 px-1 rounded-xl border transition-all text-[10px] font-black capitalize ${type === t
                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                                                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-500'
                                                    }`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Duración (segundos)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="60"
                                        value={durationSeconds}
                                        onChange={(e) => setDurationSeconds(parseInt(e.target.value) || 5)}
                                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Imagen del Aviso (Opcional)</label>
                                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                                    {image ? (
                                        <div className="relative w-20 h-20 rounded-xl overflow-hidden shadow-md">
                                            <img src={image} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => setImage(undefined)}
                                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-lg"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-indigo-500 transition-colors">
                                            <Camera className="w-6 h-6 text-gray-400" />
                                            <span className="text-[8px] font-bold text-gray-400">SUBIR</span>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                        </label>
                                    )}
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase">Ocupar gran parte del aviso</span>
                                            <button
                                                type="button"
                                                onClick={() => setIsFullImage(!isFullImage)}
                                                className={`w-10 h-5 rounded-full transition-all relative ${isFullImage ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                                            >
                                                <button
                                                    type="button"
                                                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${isFullImage ? 'translate-x-5.5' : 'translate-x-0.5'}`}
                                                />
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-gray-400 italic">Si se marca, la imagen ocupará el fondo o un lateral prominente.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Link de YouTube (Opcional)</label>
                                <div className="relative">
                                    <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-600" />
                                    <input
                                        type="url"
                                        value={youtubeUrl || ''}
                                        onChange={(e) => setYoutubeUrl(e.target.value)}
                                        placeholder="https://www.youtube.com/watch?v=..."
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Fecha de Expiración (Opcional)</label>
                                <input
                                    type="date"
                                    value={expiresAt}
                                    onChange={(e) => setExpiresAt(e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Etiquetas (Tags)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                        placeholder="ej. Mantenimiento"
                                        className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                                    />
                                    <Button type="button" onClick={addTag} variant="secondary">Add</Button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {tags.map((t, i) => (
                                        <span key={i} className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 px-2 py-1 rounded-lg text-xs font-bold">
                                            {t}
                                            <button type="button" onClick={() => removeTag(t)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                                <Button type="submit">Guardar Notificación</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

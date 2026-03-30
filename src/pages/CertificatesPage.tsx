import React, { useState, useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useCertificates } from '../context/CertificateContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { formatRUT } from '../utils/formatters';
import {
    Award,
    Printer,
    Eye,
    Plus,
    FileText,
    Building,
    ShieldCheck,
    X,
    Search,
    History,
    Download,
    Trash2,
    Filter,
    Landmark,
    Banknote
} from 'lucide-react';
import type { Certificate } from '../types';
import { useInfrastructure } from '../context/InfrastructureContext';
import { useCommonExpenses } from '../context/CommonExpenseContext';
import { useResidents } from '../context/ResidentContext';
import { usePersonnel } from '../context/PersonnelContext';

interface ResidentData {
    name: string;
    rut: string;
    address: string;
}

export const CertificatesPage: React.FC = () => {
    const { settings } = useSettings();
    const { towers } = useInfrastructure();
    const { payments } = useCommonExpenses();
    const { residents } = useResidents();
    const { certificates, addCertificate, deleteCertificate } = useCertificates();
    const { personnel } = usePersonnel();

    const [selectedType, setSelectedType] = useState<'residencia' | 'gastos' | 'estado_cuenta' | 'liquidacion' | null>(null);
    const [view, setView] = useState<'generate' | 'history'>('generate');
    const [resident, setResident] = useState<ResidentData>({ name: '', rut: '', address: '' });
    const [selectedTower, setSelectedTower] = useState('');
    const [selectedUnit, setSelectedUnit] = useState('');
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [historyFilter, setHistoryFilter] = useState('');
    const [viewingCertificate, setViewingCertificate] = useState<Certificate | null>(null);

    // Date formatting helper for preview
    const today = new Date();
    const months = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    const certificateTypes = [
        {
            id: 'residencia',
            name: 'Certificado de Residencia',
            description: 'Acredita que una persona reside actualmente en el condominio.',
            icon: Building,
            color: 'bg-indigo-600'
        },
        {
            id: 'estado_cuenta',
            name: 'Estado de Cuenta / Fondos',
            description: 'Detalle de gastos comunes, cuotas extraordinarias y fondos pendientes por unidad.',
            icon: Landmark,
            color: 'bg-emerald-600'
        },
        {
            id: 'liquidacion',
            name: 'Certificado Liquidación de Sueldo',
            description: 'Certifica la remuneración y descuentos legales de un trabajador.',
            icon: Banknote,
            color: 'bg-blue-600'
        },
        {
            id: 'gastos',
            name: 'Al Día (Sólo Informativo)',
            description: 'Acredita que el residente no tiene deudas pendientes.',
            icon: ShieldCheck,
            color: 'bg-gray-400',
            disabled: true
        }
    ];

    const filteredHistory = useMemo(() => {
        const lowerFilter = historyFilter.toLowerCase().trim();
        if (!lowerFilter) return certificates;

        const cleanFilter = lowerFilter.replace(/[^0-9kK]/g, '');

        return certificates.filter((c: any) => {
            const cleanCertRut = c.residentRut.replace(/[^0-9kK]/g, '').toLowerCase();
            const matchesRut = cleanFilter !== '' && cleanCertRut.includes(cleanFilter);
            const matchesName = lowerFilter !== '' && c.residentName.toLowerCase().includes(lowerFilter);

            return matchesRut || matchesName;
        });
    }, [certificates, historyFilter]);

    // Helper logic to find resident name and rut by unit
    const handleUnitSelect = (uId: string) => {
        setSelectedUnit(uId);
        const residentFound = residents.find(r => r.unitId === uId && !r.isArchived);
        const tower = towers.find(t => t.id === selectedTower);
        const unit = tower?.departments.find(d => d.id === uId);

        const newAddress = `${tower?.name || ''} - N° ${unit?.number || ''}`;

        if (selectedType === 'estado_cuenta') {
            if (residentFound) {
                setResident({
                    name: `${residentFound.names} ${residentFound.lastNames}`,
                    rut: residentFound.dni,
                    address: newAddress
                });
            } else {
                setResident({ name: '', rut: '', address: newAddress });
            }
        } else if (selectedType === 'residencia') {
            setResident(prev => ({ ...prev, address: newAddress }));
        }
    };

    const handleGenerate = async () => {
        if (!selectedType) return;

        let financialData: any = undefined;

        if (selectedType === 'estado_cuenta' && selectedUnit) {
            // Snapshot simple of debt
            const unitTypeDebt = 55000;
            const extraDebt = 25000;
            const resDebt = 10000;

            financialData = {
                commonExpenseDebt: unitTypeDebt,
                extraordinaryDebt: extraDebt,
                reserveDebt: resDebt,
                totalDebt: unitTypeDebt + extraDebt + resDebt,
                lastPaymentDate: payments.filter(p => p.departmentId === selectedUnit).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]?.paymentDate
            };
        }

        const cert = await addCertificate({
            type: selectedType,
            residentName: resident.name,
            residentRut: resident.rut,
            residentAddress: resident.address,
            adminName: settings.adminName || '',
            adminRut: settings.adminRut || '',
            condoName: settings.systemName || '',
            condoRut: settings.condoRut || '',
            condoAddress: settings.condoAddress || '',
            financialData
        });

        setViewingCertificate(cert);
        setIsPreviewOpen(true);
    };

    const handlePrint = () => {
        window.print();
    };

    const CertificatePreview = ({ cert, previewData }: { cert?: Certificate, previewData?: ResidentData }) => {
        const data = cert ? {
            name: cert.residentName,
            rut: cert.residentRut,
            address: cert.residentAddress,
            date: new Date(cert.generatedAt),
            folio: cert.folio,
            admin: cert.adminName,
            adminRut: cert.adminRut,
            condo: cert.condoName,
            condoRut: cert.condoRut,
            condoAddress: cert.condoAddress
        } : {
            name: previewData?.name || '',
            rut: previewData?.rut || '',
            address: previewData?.address || '',
            date: today,
            folio: 'PREVIEW',
            admin: settings.adminName || '',
            adminRut: settings.adminRut || '',
            condo: settings.systemName || '',
            condoRut: settings.condoRut || '',
            condoAddress: settings.condoAddress || ''
        };

        const d = data.date.getDate();
        const m = months[data.date.getMonth()];
        const y = data.date.getFullYear();

        return (
            <div id="print-section" className="bg-white p-12 shadow-2xl min-h-[1000px] w-full max-w-[800px] mx-auto text-gray-900 font-serif leading-relaxed print:shadow-none print:m-0 print:p-8 relative">
                {!cert && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none overflow-hidden h-full">
                        <p className="text-[10rem] font-black uppercase rotate-[-45deg] whitespace-nowrap">Borrador</p>
                    </div>
                )}

                <div className="flex justify-between items-start border-b-2 border-indigo-600 pb-8 mb-12">
                    <div className="flex items-center gap-4">
                        {settings.systemLogo ? (
                            <img src={settings.systemLogo} alt="Logo" className="h-16 w-auto object-contain" />
                        ) : (
                            <div className="w-16 h-16 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-3xl">
                                {settings.systemIcon?.charAt(0) || 'C'}
                            </div>
                        )}
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-widest">{data.condo || 'CONDOMINIO'}</h2>
                            <p className="text-xs text-gray-700 font-sans font-bold">RUT: {data.condoRut || '76.XXX.XXX-X'}</p>
                            <p className="text-[10px] text-gray-500 font-sans font-bold uppercase">{data.condoAddress || 'Dirección no especificada'}</p>
                            <p className="text-[10px] text-indigo-600 font-bold font-sans">{settings.adminPhone || 'Teléfono no especificado'}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-bold uppercase tracking-widest text-indigo-600 font-sans">CERTIFICADO N° {data.folio}</p>
                        <p className="text-xs text-gray-500 font-sans mt-1">{d} de {m} de {y}</p>
                    </div>
                </div>

                <div className="text-center mb-16 px-4">
                    <h1 className="text-3xl font-black uppercase tracking-[0.2em] underline underline-offset-8 decoration-indigo-600">
                        {cert?.type === 'estado_cuenta' ? 'Estado de Cuenta / Situación Financiera' : cert?.type === 'liquidacion' ? 'Certificado de Liquidación de Sueldo' : 'Certificado de Residencia'}
                    </h1>
                </div>

                {(!cert || cert?.type === 'residencia' || cert?.type === 'liquidacion') && (
                    <div className="space-y-8 text-lg text-justify px-8">
                        <p>
                            La Administración del <strong>{data.condo || 'Condominio'}</strong>, a través del presente documento, certifica y acredita fehacientemente que:
                        </p>

                        <div className="bg-gray-50 p-8 rounded-2xl space-y-4 border-l-4 border-indigo-600 font-sans">
                            <p className="flex justify-between border-b border-gray-200 pb-2">
                                <span className="text-gray-500 font-bold uppercase text-xs tracking-widest">{cert?.type === 'liquidacion' ? 'Nombre del Trabajador:' : 'Nombre Completo:'}</span>
                                <span className="font-black text-gray-900">{data.name || '--------------------------'}</span>
                            </p>
                            <p className="flex justify-between border-b border-gray-200 pb-2">
                                <span className="text-gray-500 font-bold uppercase text-xs tracking-widest">{cert?.type === 'liquidacion' ? 'RUT del Trabajador:' : 'RUT:'}</span>
                                <span className="font-black text-gray-900">{data.rut || '---------'}</span>
                            </p>
                            <p className="flex justify-between">
                                <span className="text-gray-500 font-bold uppercase text-xs tracking-widest">{cert?.type === 'liquidacion' ? 'Cargo / Función:' : 'Dirección / Unidad:'}</span>
                                <span className="font-black text-gray-900">{data.address || '---------'}</span>
                            </p>
                        </div>

                        <p>
                            El titular antes mencionado reside actualmente en nuestras dependencias, manteniendo a la fecha un registro activo en el maestro de residentes de esta comunidad.
                        </p>

                        <p>
                            Se extiende la presente certificación a petición del interesado para los fines que estime convenientes, sin que esto constituya una acreditación de antecedentes comerciales o financieros.
                        </p>
                    </div>
                )}

                {(cert?.type === 'estado_cuenta') && (
                    <div className="space-y-8 text-lg text-justify px-8">
                        <p>
                            A solicitud del interesado, se certifica el estado de obligaciones financieras correspondientes a la siguiente unidad inmobiliaria:
                        </p>

                        <div className="bg-gray-50 p-8 rounded-2xl space-y-4 border-l-4 border-emerald-600 font-sans mb-8">
                            <p className="flex justify-between border-b border-gray-200 pb-2">
                                <span className="text-gray-500 font-bold uppercase text-xs tracking-widest">Unidad Inmobiliaria:</span>
                                <span className="font-black text-gray-900">{data.address}</span>
                            </p>
                            <p className="flex justify-between">
                                <span className="text-gray-500 font-bold uppercase text-xs tracking-widest">Titular Registrado:</span>
                                <span className="font-black text-gray-900">{data.name} (RUT: {data.rut})</span>
                            </p>
                        </div>

                        <h3 className="text-xl font-black uppercase text-gray-800 tracking-widest border-b-2 border-emerald-100 pb-2">Detalle de Obligaciones</h3>

                        <div className="font-sans space-y-4">
                            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100 italic">
                                <span>Gastos Comunes Pendientes:</span>
                                <span className="font-black text-red-600">${cert.financialData?.commonExpenseDebt.toLocaleString() || '0'}</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100 italic">
                                <span>Cuotas Extraordinarias Vigentes:</span>
                                <span className="font-black text-red-600">${cert.financialData?.extraordinaryDebt.toLocaleString() || '0'}</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100 italic">
                                <span>Contribución Fondos de Reserva:</span>
                                <span className="font-black text-red-600">${cert.financialData?.reserveDebt.toLocaleString() || '0'}</span>
                            </div>
                            <div className="flex justify-between items-center p-6 bg-emerald-50 rounded-2xl border-2 border-emerald-200">
                                <span className="text-xl font-black uppercase text-emerald-900">Total Deuda a la Fecha:</span>
                                <span className="text-2xl font-black text-emerald-900">${cert.financialData?.totalDebt.toLocaleString() || '0'}</span>
                            </div>
                        </div>

                        <p className="text-sm font-medium text-gray-600">
                            * Último pago registrado: {cert.financialData?.lastPaymentDate ? new Date(cert.financialData.lastPaymentDate).toLocaleDateString() : 'Sin registros previos'}.
                        </p>

                        <p className="text-xs text-gray-500 italic">
                            Nota: Este documento refleja el estado de cuenta almacenado en nuestro sistema central al momento de la emisión. Cualquier pago realizado con posterioridad a la fecha de este certificado deberá acreditarse con el comprobante de transferencia o recibo correspondiente.
                        </p>
                    </div>
                )}

                <div className="mt-24 flex flex-col items-center justify-center text-center">
                    <div className="w-64 h-32 flex flex-col items-center justify-center border-b-2 border-gray-300 relative mb-4">
                        {settings.adminSignature ? (
                            <img src={settings.adminSignature} alt="Signature" className="h-24 w-auto object-contain absolute bottom-2" />
                        ) : (
                            <p className="text-[10px] text-gray-400 font-sans italic mb-4">Espacio para timbre y firma</p>
                        )}
                    </div>
                    <div>
                        <p className="text-lg font-black text-gray-900 uppercase tracking-widest leading-none mb-1">
                            {data.admin || 'NOMBRE DEL ADMINISTRADOR'}
                        </p>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest leading-none mb-1">RUT: {data.adminRut || 'XX.XXX.XXX-X'}</p>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Administrador Condominio</p>
                    </div>
                </div>

                <div className="mt-16 pt-8 border-t border-gray-100 text-[10px] text-gray-400 text-center font-sans tracking-widest uppercase">
                    Este documento es una copia autorizada generada digitalmente. | {data.condo}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className={`text-2xl font-black flex items-center gap-2 ${settings.theme === 'modern' ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        <Award className="w-8 h-8 text-indigo-600" />
                        Certificados
                    </h1>
                    <p className={`text-sm mt-1 font-bold italic lowercase first-letter:uppercase ${settings.theme === 'modern' ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'}`}>Generación de documentación oficial y acreditaciones para residentes.</p>
                </div>

                <div className="flex bg-white dark:bg-gray-800 p-1 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <button
                        onClick={() => setView('generate')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'generate' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-gray-500 hover:text-indigo-600'}`}
                    >
                        <Plus className="w-4 h-4" /> Generar
                    </button>
                    <button
                        onClick={() => setView('history')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'history' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-gray-500 hover:text-indigo-600'}`}
                    >
                        <History className="w-4 h-4" /> Historial
                    </button>
                </div>
            </div>

            {view === 'generate' ? (
                <>
                    {!selectedType ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
                            {certificateTypes.map((type) => (
                                <button
                                    key={type.id}
                                    disabled={type.disabled}
                                    onClick={() => setSelectedType(type.id as any)}
                                    className={`group relative overflow-hidden p-8 rounded-[3rem] border transition-all duration-500 text-left bg-white dark:bg-gray-900 hover:shadow-2xl hover:-translate-y-2 ${type.disabled ? 'opacity-50 grayscale cursor-not-allowed border-gray-200' : 'border-gray-100 dark:border-gray-800 shadow-sm hover:border-indigo-200'}`}
                                >
                                    <div className={`w-16 h-16 ${type.color} rounded-2xl flex items-center justify-center text-white mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-xl`}>
                                        <type.icon className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 leading-tight uppercase tracking-tight">{type.name}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{type.description}</p>

                                    {!type.disabled && (
                                        <div className="mt-8 flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest translate-x-0 group-hover:translate-x-2 transition-transform">
                                            Seleccionar <Plus className="w-4 h-4" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto space-y-8 animate-in zoom-in-95 duration-500 pt-6">
                            <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden">
                                <div className="p-8 border-b dark:border-gray-800 flex items-center justify-between bg-indigo-50/50 dark:bg-indigo-950/20">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => setSelectedType(null)}
                                            className="p-3 bg-white dark:bg-gray-800 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 text-indigo-600 hover:bg-indigo-50 transition-all"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                        <div>
                                            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase">Generar Certificado</h2>
                                            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest italic">{certificateTypes.find(t => t.id === selectedType)?.name}</p>
                                        </div>
                                    </div>
                                    <Award className="w-8 h-8 text-indigo-600 opacity-20" />
                                </div>

                                <div className="p-10 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {selectedType === 'liquidacion' && (
                                            <>
                                                <div className="md:col-span-2 space-y-1.5">
                                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Seleccionar Trabajador</label>
                                                    <select
                                                        onChange={(e) => {
                                                            const p = personnel.find(per => per.id === e.target.value);
                                                            if (p) {
                                                                setResident({
                                                                    name: `${p.names} ${p.lastNames}`,
                                                                    rut: p.dni,
                                                                    address: p.position || ''
                                                                });
                                                            }
                                                        }}
                                                        className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm transition-all focus:ring-4 focus:ring-indigo-500/10"
                                                    >
                                                        <option value="">-- Elige un funcionario --</option>
                                                        {personnel.map(p => <option key={p.id} value={p.id}>{p.names} {p.lastNames} ({p.dni})</option>)}
                                                    </select>
                                                </div>
                                            </>
                                        )}
                                        {(selectedType === 'estado_cuenta' || selectedType === 'residencia') && (
                                            <>
                                                <div className="space-y-1.5">
                                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Seleccionar Torre</label>
                                                    <select
                                                        value={selectedTower}
                                                        onChange={(e) => {
                                                            setSelectedTower(e.target.value);
                                                            setSelectedUnit('');
                                                        }}
                                                        className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm transition-all focus:ring-4 focus:ring-indigo-500/10"
                                                    >
                                                        <option value="">-- Elige una torre --</option>
                                                        {towers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                    </select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Seleccionar Unidad</label>
                                                    <select
                                                        value={selectedUnit}
                                                        onChange={(e) => handleUnitSelect(e.target.value)}
                                                        disabled={!selectedTower}
                                                        className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm transition-all focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50"
                                                    >
                                                        <option value="">-- Elige un departamento --</option>
                                                        {towers.find(t => t.id === selectedTower)?.departments.map(u => (
                                                            <option key={u.id} value={u.id}>Depto {u.number}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </>
                                        )}
                                        {selectedType !== 'estado_cuenta' && selectedType !== 'liquidacion' && (
                                            <>
                                                <Input
                                                    label="Nombre Completo"
                                                    value={resident.name}
                                                    onChange={e => setResident({ ...resident, name: e.target.value })}
                                                    placeholder="ej. Alan Brito Delgadillo"
                                                />
                                                <Input
                                                    label="RUT"
                                                    value={resident.rut}
                                                    onChange={e => setResident({ ...resident, rut: formatRUT(e.target.value) })}
                                                    placeholder="ej. 12.345.678-9"
                                                />
                                            </>
                                        )}
                                        {selectedType === 'liquidacion' && (
                                            <>
                                                <Input
                                                    label="Trabajador Cargado"
                                                    value={resident.name}
                                                    onChange={e => setResident({ ...resident, name: e.target.value })}
                                                    placeholder="Seleccione un funcionario arriba..."
                                                    required
                                                />
                                                <Input
                                                    label="RUT Trabajador"
                                                    value={resident.rut}
                                                    onChange={e => setResident({ ...resident, rut: formatRUT(e.target.value) })}
                                                    placeholder="RUT se cargará automático"
                                                    required
                                                />
                                            </>
                                        )}
                                        {selectedType === 'liquidacion' && (
                                            <div className="md:col-span-2">
                                                <Input
                                                    label="Cargo / Función"
                                                    value={resident.address}
                                                    onChange={e => setResident({ ...resident, address: e.target.value })}
                                                    placeholder="ej. Conserje, Guardia..."
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4 pt-6">
                                        <Button
                                            className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20"
                                            onClick={handleGenerate}
                                            disabled={!resident.name || !resident.rut || !resident.address}
                                        >
                                            <Plus className="w-4 h-4 mr-2" /> Generar y Guardar
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            className="flex-1 py-4 border-gray-200 text-gray-600 font-black uppercase tracking-widest"
                                            onClick={() => {
                                                setViewingCertificate(null);
                                                setIsPreviewOpen(true);
                                            }}
                                            disabled={!resident.name || !resident.rut || !resident.address}
                                        >
                                            <Eye className="w-4 h-4 mr-2" /> Previsualizar
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-950/20 p-6 rounded-[2rem] border border-amber-200 dark:border-amber-900/30 flex items-start gap-4">
                                <FileText className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
                                <div className="space-y-1">
                                    <p className="text-sm font-black text-amber-900 dark:text-amber-400 uppercase tracking-widest">Información de Sistema:</p>
                                    <p className="text-xs text-amber-700 dark:text-amber-500 font-medium leading-relaxed">
                                        Al presionar "Generar y Guardar", el certificado se añadirá al historial para futuras consultas. Los datos de la administración provienen de la configuración general.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Filtrar por RUT o Nombre de residente..."
                                value={historyFilter}
                                onChange={e => setHistoryFilter(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                            />
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl text-xs font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-900/50">
                            <Filter className="w-4 h-4" /> {filteredHistory.length} Registros
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredHistory.map((cert: any) => (
                            <div key={cert.id} className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 p-6 shadow-sm hover:shadow-xl transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl text-indigo-600">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-tighter bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-full">FOLIO #{cert.folio}</p>
                                </div>

                                <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase leading-tight mb-1 truncate">{cert.residentName}</h4>
                                <p className="text-xs font-bold text-indigo-600 mb-4">{cert.residentRut}</p>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-2 text-[11px] text-gray-500 font-bold uppercase">
                                        <Building className="w-3.5 h-3.5" /> {cert.residentAddress}
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium">
                                        <History className="w-3.5 h-3.5" /> {new Date(cert.generatedAt).toLocaleDateString()} {new Date(cert.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-4 border-t border-gray-50 dark:border-gray-800">
                                    <button
                                        onClick={() => {
                                            setViewingCertificate(cert);
                                            setIsPreviewOpen(true);
                                        }}
                                        className="flex-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2"
                                    >
                                        <Download className="w-3.5 h-3.5" /> Ver / Imprimir
                                    </button>
                                    <button
                                        onClick={() => deleteCertificate(cert.id)}
                                        className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {filteredHistory.length === 0 && (
                            <div className="md:col-span-2 lg:col-span-3 py-20 text-center">
                                <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                                    <Search className="w-10 h-10 text-gray-200" />
                                </div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">No se encontraron certificados</h3>
                                <p className="text-gray-500 font-medium mt-2">Intenta filtrar por otro RUT o genera un nuevo documento.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {isPreviewOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="w-full h-full p-4 sm:p-10 flex flex-col items-center overflow-hidden">
                        <div className="w-full max-w-[800px] flex justify-between items-center mb-6 print:hidden">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/10 rounded-2xl text-white">
                                    <Award className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-white font-black uppercase tracking-[0.2em] leading-none">
                                        {viewingCertificate ? 'Certificado Oficial' : 'Previsualización'}
                                    </h3>
                                    <p className="text-indigo-400 text-[10px] font-bold uppercase mt-1">
                                        {viewingCertificate ? `Folio #${viewingCertificate.folio}` : 'Borrador sin validez'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button className="bg-indigo-600 hover:bg-indigo-700 font-black text-xs uppercase" onClick={handlePrint}>
                                    <Printer className="w-4 h-4 mr-2" /> Imprimir / PDF
                                </Button>
                                <Button variant="secondary" className="bg-white/10 hover:bg-white/20 border-white/20 text-white font-black text-xs uppercase" onClick={() => setIsPreviewOpen(false)}>
                                    <X className="w-4 h-4 mr-2" /> Cerrar
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto w-full pb-20 print:p-0 print:m-0 print:overflow-visible custom-scrollbar-white">
                            <CertificatePreview
                                cert={viewingCertificate === null ? undefined : viewingCertificate}
                                previewData={viewingCertificate === null ? resident : undefined}
                            />
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    nav, header, aside, .print\\:hidden, button {
                        display: none !important;
                    }
                    main {
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .fixed {
                        position: relative !important;
                        background: white !important;
                        z-index: auto !important;
                        display: block !important;
                        height: auto !important;
                        width: 100% !important;
                        inset: 0 !important;
                    }
                    #print-section {
                        box-shadow: none !important;
                        border: none !important;
                        width: 100% !important;
                        max-width: none !important;
                        padding: 2cm !important;
                        background: white !important;
                        color: black !important;
                    }
                    .custom-scrollbar-white {
                        overflow: visible !important;
                    }
                }
            ` }} />
        </div>
    );
};

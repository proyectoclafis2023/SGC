import React, { useState } from 'react';
import { Button } from '../components/Button';
import { useArticles } from '../context/ArticleContext';
import { usePersonnel } from '../context/PersonnelContext';
import { useResidents } from '../context/ResidentContext';
import { useOwners } from '../context/OwnerContext';
import { useBanks } from '../context/BankContext';
import { useFixedAssets } from '../context/FixedAssetContext';
import { useHealthProviders } from '../context/HealthProviderContext';
import { usePensionFunds } from '../context/PensionFundContext';
import { useSpecialConditions } from '../context/SpecialConditionContext';
import { useUnitTypes } from '../context/UnitTypeContext';
import { Upload, FileText, CheckCircle2, AlertCircle, Info, Download } from 'lucide-react';

type EntityType = 'articles' | 'personnel' | 'residents' | 'owners' | 'banks' | 'assets' | 'health' | 'afp' | 'conditions' | 'units';

export const MassiveUploadPage: React.FC = () => {
    const [selectedEntity, setSelectedEntity] = useState<EntityType>('articles');
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const { addArticle, articles } = useArticles();
    const { addPersonnel, personnel } = usePersonnel();
    const { addResident, residents } = useResidents();
    const { addOwner, owners } = useOwners();
    const { addBank, banks } = useBanks();
    const { addAsset, assets } = useFixedAssets();
    const { addProvider, providers } = useHealthProviders();
    const { addFund, funds } = usePensionFunds();
    const { addCondition, conditions } = useSpecialConditions();
    const { addUnitType, unitTypes } = useUnitTypes();

    const entities: { value: EntityType; label: string; icon: any }[] = [
        { value: 'articles', label: 'Artículos / Stock', icon: FileText },
        { value: 'personnel', label: 'Maestro Personal', icon: FileText },
        { value: 'residents', label: 'Residentes', icon: FileText },
        { value: 'owners', label: 'Propietarios', icon: FileText },
        { value: 'units', label: 'Tipos de Unidad', icon: FileText },
        { value: 'banks', label: 'Bancos', icon: FileText },
        { value: 'assets', label: 'Activo Fijo', icon: FileText },
        { value: 'health', label: 'Previsiones / Salud', icon: FileText },
        { value: 'afp', label: 'AFPs', icon: FileText },
        { value: 'conditions', label: 'Condiciones Especiales', icon: FileText },
    ];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus('idle');
            setMessage('');
        }
    };

    const processCSV = async () => {
        if (!file) return;

        setStatus('processing');
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                const lines = text.split('\n').filter(line => line.trim() !== '');
                if (lines.length < 2) throw new Error('El archivo está vacío o le faltan datos.');

                const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                const dataLines = lines.slice(1);

                let count = 0;

                for (const line of dataLines) {
                    const values = line.split(',').map(v => v.trim());
                    const obj: any = {};
                    headers.forEach((header, index) => {
                        obj[header] = values[index];
                    });

                    // Basic mapping logic for each entity
                    try {
                        switch (selectedEntity) {
                            case 'articles':
                                await addArticle({
                                    name: obj.nombre || '',
                                    description: obj.descripcion || '',
                                    category: (obj.categoria || 'EPP') as any,
                                    price: Number(obj.precio || 0),
                                    stock: Number(obj.stock || 0),
                                    minStock: Number(obj.stock_minimo || 0),
                                    isActive: obj.activo === 'SI'
                                });
                                break;
                            case 'personnel':
                                await addPersonnel({
                                    names: obj.nombres || '',
                                    lastNames: obj.apellidos || '',
                                    dni: obj.rut || '',
                                    position: obj.cargo || '',
                                    address: obj.direccion || '',
                                    isHonorary: obj.honorario === 'SI',
                                    baseSalary: Number(obj.sueldo_base || 0),
                                    vacationDays: Number(obj.dias_vacaciones || 0),
                                    hasEmergencyContact: false,
                                    phone: obj.telefono || '',
                                    email: obj.email || ''
                                });
                                break;
                            case 'residents':
                                await addResident({
                                    names: obj.nombres || '',
                                    lastNames: obj.apellidos || '',
                                    dni: obj.rut || '',
                                    email: obj.email || '',
                                    phone: obj.telefono || '',
                                    familyCount: Number(obj.integrantes || 1),
                                    hasPets: obj.mascotas === 'SI',
                                    conditionIds: [],
                                    isTenant: obj.arrendatario === 'SI'
                                });
                                break;
                            case 'owners':
                                await addOwner({
                                    names: obj.nombres || '',
                                    lastNames: obj.apellidos || '',
                                    dni: obj.rut || '',
                                    email: obj.email || '',
                                    phone: obj.telefono || ''
                                });
                                break;
                            case 'units':
                                await addUnitType({
                                    name: obj.nombre || '',
                                    baseCommonExpense: Number(obj.gasto_base || 0)
                                });
                                break;
                            case 'banks':
                                await addBank({
                                    name: obj.nombre || ''
                                });
                                break;
                            case 'assets':
                                await addAsset({
                                    description: obj.descripcion || '',
                                    model: obj.modelo || '',
                                    purchasePrice: Number(obj.precio_compra || 0),
                                    depreciatedValue: Number(obj.valor_depreciado || 0),
                                    purchaseDate: obj.fecha_compra || new Date().toISOString().split('T')[0],
                                    details: obj.detalles || '',
                                    quantity: Number(obj.cantidad || 1),
                                    isActive: true
                                });
                                break;
                            case 'health':
                                await addProvider({
                                    name: obj.nombre || '',
                                    type: (obj.tipo || 'isapre') as any,
                                    discountRate: Number(obj.tasa || 7)
                                });
                                break;
                            case 'afp':
                                await addFund({
                                    name: obj.nombre || '',
                                    discountRate: Number(obj.tasa || 0)
                                });
                                break;
                            case 'conditions':
                                await addCondition({
                                    name: obj.nombre || '',
                                    description: obj.descripcion || ''
                                });
                                break;
                        }
                        count++;
                    } catch (err) {
                        console.error('Error processing row:', err);
                    }
                }

                setStatus('success');
                setMessage(`Se cargaron ${count} registros exitosamente.`);
                setFile(null);
            } catch (err: any) {
                setStatus('error');
                setMessage(err.message || 'Error al procesar el archivo.');
            }
        };

        reader.onerror = () => {
            setStatus('error');
            setMessage('Error al leer el archivo.');
        };

        reader.readAsText(file);
    };

    const escapeCSV = (val: any) => {
        if (val === undefined || val === null) return '';
        const s = String(val);
        if (s.includes(',') || s.includes('"') || s.includes('\n')) {
            return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
    };

    const downloadCSV = (headers: string, data: string, filename: string) => {
        const csvContent = headers + "\n" + data;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const downloadTemplate = () => {
        let headers = '';
        switch (selectedEntity) {
            case 'articles': headers = 'nombre,descripcion,categoria,precio,stock,stock_minimo,activo'; break;
            case 'personnel': headers = 'nombres,apellidos,rut,cargo,direccion,honorario,sueldo_base,dias_vacaciones,telefono,email'; break;
            case 'residents': headers = 'nombres,apellidos,rut,email,telefono,integrantes,mascotas,arrendatario'; break;
            case 'owners': headers = 'nombres,apellidos,rut,email,telefono'; break;
            case 'units': headers = 'nombre,gasto_base'; break;
            case 'banks': headers = 'nombre'; break;
            case 'assets': headers = 'descripcion,modelo,precio_compra,valor_depreciado,fecha_compra,detalles,cantidad'; break;
            case 'health': headers = 'nombre,tipo,tasa'; break;
            case 'afp': headers = 'nombre,tasa'; break;
            case 'conditions': headers = 'nombre,descripcion'; break;
        }

        downloadCSV(headers, "", `plantilla_${selectedEntity}.csv`);
    };

    const downloadCurrentData = () => {
        let headers = '';
        let dataLines: string[] = [];

        switch (selectedEntity) {
            case 'articles':
                headers = 'nombre,descripcion,categoria,precio,stock,stock_minimo,activo';
                dataLines = articles.map(a => [
                    escapeCSV(a.name),
                    escapeCSV(a.description),
                    escapeCSV(a.category),
                    a.price,
                    a.stock,
                    a.minStock,
                    a.isActive ? 'SI' : 'NO'
                ].join(','));
                break;
            case 'personnel':
                headers = 'nombres,apellidos,rut,cargo,direccion,honorario,sueldo_base,dias_vacaciones,telefono,email';
                dataLines = personnel.map(p => [
                    escapeCSV(p.names),
                    escapeCSV(p.lastNames),
                    escapeCSV(p.dni),
                    escapeCSV(p.position),
                    escapeCSV(p.address),
                    p.isHonorary ? 'SI' : 'NO',
                    p.baseSalary,
                    p.vacationDays,
                    escapeCSV(p.phone),
                    escapeCSV(p.email)
                ].join(','));
                break;
            case 'residents':
                headers = 'nombres,apellidos,rut,email,telefono,integrantes,mascotas,arrendatario';
                dataLines = residents.map(r => [
                    escapeCSV(r.names),
                    escapeCSV(r.lastNames),
                    escapeCSV(r.dni),
                    escapeCSV(r.email),
                    escapeCSV(r.phone),
                    r.familyCount,
                    r.hasPets ? 'SI' : 'NO',
                    r.isTenant ? 'SI' : 'NO'
                ].join(','));
                break;
            case 'owners':
                headers = 'nombres,apellidos,rut,email,telefono';
                dataLines = owners.map(o => [
                    escapeCSV(o.names),
                    escapeCSV(o.lastNames),
                    escapeCSV(o.dni),
                    escapeCSV(o.email),
                    escapeCSV(o.phone)
                ].join(','));
                break;
            case 'units':
                headers = 'nombre,gasto_base';
                dataLines = unitTypes.map(u => [
                    escapeCSV(u.name),
                    u.baseCommonExpense
                ].join(','));
                break;
            case 'banks':
                headers = 'nombre';
                dataLines = banks.map(b => escapeCSV(b.name));
                break;
            case 'assets':
                headers = 'descripcion,modelo,precio_compra,valor_depreciado,fecha_compra,detalles,cantidad';
                dataLines = assets.map(a => [
                    escapeCSV(a.description),
                    escapeCSV(a.model),
                    a.purchasePrice,
                    a.depreciatedValue,
                    escapeCSV(a.purchaseDate),
                    escapeCSV(a.details),
                    a.quantity
                ].join(','));
                break;
            case 'health':
                headers = 'nombre,tipo,tasa';
                dataLines = providers.map(p => [
                    escapeCSV(p.name),
                    escapeCSV(p.type),
                    p.discountRate
                ].join(','));
                break;
            case 'afp':
                headers = 'nombre,tasa';
                dataLines = funds.map(f => [
                    escapeCSV(f.name),
                    f.discountRate
                ].join(','));
                break;
            case 'conditions':
                headers = 'nombre,descripcion';
                dataLines = conditions.map(c => [
                    escapeCSV(c.name),
                    escapeCSV(c.description)
                ].join(','));
                break;
        }

        downloadCSV(headers, dataLines.join('\n'), `maestro_${selectedEntity}_actual.csv`);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3 italic">
                        <Upload className="w-8 h-8 text-indigo-600" />
                        Carga Masiva de Datos
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium ml-11 uppercase text-[10px] tracking-widest font-black">
                        Actualización de maestros mediante archivos CSV
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Selector */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider mb-4">Paso 1: Seleccionar Maestro</h3>
                        <div className="space-y-2">
                            {entities.map((entity) => (
                                <button
                                    key={entity.value}
                                    onClick={() => setSelectedEntity(entity.value)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all ${selectedEntity === entity.value
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-gray-950'
                                        : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <entity.icon className="w-4 h-4" />
                                    <span className="text-sm font-bold">{entity.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-3xl border border-amber-100 dark:border-amber-900/20">
                        <div className="flex gap-3">
                            <Info className="w-5 h-5 text-amber-600 shrink-0" />
                            <div>
                                <h4 className="text-xs font-black text-amber-800 dark:text-amber-400 uppercase tracking-wider">Instrucciones</h4>
                                <p className="text-[11px] text-amber-700 dark:text-amber-500 mt-1 leading-relaxed">
                                    Asegúrese de que el archivo CSV tenga los encabezados correctos. Puede descargar la plantilla para cada maestro.
                                </p>
                                <button
                                    onClick={downloadTemplate}
                                    className="mt-3 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-black hover:underline"
                                >
                                    <Download className="w-3 h-3" /> Descargar Plantilla (.csv)
                                </button>
                                <button
                                    onClick={downloadCurrentData}
                                    className="mt-2 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-black hover:underline"
                                >
                                    <Download className="w-3 h-3" /> Descargar Maestro Actual (.csv)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upload Area */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-900 p-8 rounded-[40px] border border-gray-100 dark:border-gray-800 shadow-xl flex flex-col items-center justify-center min-h-[400px]">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-all ${status === 'success' ? 'bg-emerald-100 text-emerald-600' :
                            status === 'error' ? 'bg-red-100 text-red-600' :
                                file ? 'bg-indigo-100 text-indigo-600 animate-bounce' : 'bg-gray-100 text-gray-400'
                            }`}>
                            {status === 'success' ? <CheckCircle2 className="w-12 h-12" /> :
                                status === 'error' ? <AlertCircle className="w-12 h-12" /> :
                                    <Upload className="w-12 h-12" />}
                        </div>

                        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">
                            {status === 'success' ? '¡Carga Exitosa!' :
                                status === 'error' ? 'Error en la Carga' :
                                    file ? file.name : 'Arrastre su archivo CSV aquí'}
                        </h2>

                        <p className="text-gray-500 text-sm text-center max-w-sm mb-8 font-medium">
                            {status === 'success' ? message :
                                status === 'error' ? message :
                                    file ? `Archivo listo para procesar en el maestro: ${entities.find(e => e.value === selectedEntity)?.label}` :
                                        'Haga clic para seleccionar o suelte el archivo directamente en esta área.'}
                        </p>

                        {!file && status !== 'success' && status !== 'error' && (
                            <label className="cursor-pointer">
                                <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                                <div className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-500/20 hover:scale-105 transition-transform active:scale-95">
                                    Seleccionar Archivo
                                </div>
                            </label>
                        )}

                        {file && status === 'processing' && (
                            <div className="flex gap-4">
                                <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></span>
                                <span className="font-bold text-gray-600">Procesando registros...</span>
                            </div>
                        )}

                        {file && status === 'idle' && (
                            <div className="flex gap-4">
                                <Button variant="secondary" onClick={() => setFile(null)}>Cancelar</Button>
                                <Button onClick={processCSV}>
                                    Comenzar Carga
                                </Button>
                            </div>
                        )}

                        {(status === 'success' || status === 'error') && (
                            <Button onClick={() => { setStatus('idle'); setFile(null); setMessage(''); }}>
                                Cargar otro archivo
                            </Button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Maestro Destino</p>
                            <p className="text-lg font-black text-gray-900 dark:text-white italic">
                                {entities.find(e => e.value === selectedEntity)?.label}
                            </p>
                        </div>
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Formato</p>
                            <p className="text-lg font-black text-gray-900 dark:text-white uppercase">
                                Archivo CSV (.csv)
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

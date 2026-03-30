import { Edit2, Trash2, User as UserIcon, Calendar, ShieldCheck, Home, PhoneCall, AlertCircle, Banknote, Landmark, ShieldPlus, TrendingUp, Shirt } from 'lucide-react';
import { useHealthProviders } from '../context/HealthProviderContext';
import { usePensionFunds } from '../context/PensionFundContext';
import { useBanks } from '../context/BankContext';
import { useArticles } from '../context/ArticleContext';
import type { Personnel } from '../types';

interface PersonnelListProps {
    personnel: Personnel[];
    onEdit: (person: Personnel) => void;
    onDelete: (id: string, name: string) => void;
}

export const PersonnelList: React.FC<PersonnelListProps> = ({ personnel, onEdit, onDelete }) => {
    const { providers } = useHealthProviders();
    const { funds } = usePensionFunds();
    const { banks } = useBanks();
    const { articles } = useArticles();

    if (personnel.length === 0) {
        return (
            <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-colors">
                <div className="bg-gray-50 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">No hay registros de personal</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Registra al primer trabajador para comenzar.</p>
            </div>
        );
    }

    const getHealthProviderName = (id: string) => {
        const provider = providers.find(p => p.id === id);
        return provider ? `${provider.name} (${provider.type.toUpperCase()})` : 'No asignada';
    };

    const getPensionFundName = (id: string) => {
        const fund = funds.find(f => f.id === id);
        return fund ? fund.name : 'No asignada';
    };

    const getBankName = (id: string) => {
        const bank = banks.find(b => b.id === id);
        return bank ? bank.name : 'No registrado';
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0
        }).format(value);
    };

    return (
        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6 pb-20">
            {personnel.map((person) => (
                <div key={person.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col hover:shadow-md transition-all group overflow-hidden">
                    <div className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-6 flex-1">
                                <div className="h-20 w-20 md:h-28 md:w-28 flex-shrink-0 bg-gray-50 dark:bg-gray-800 rounded-[1.5rem] border-2 border-gray-100 dark:border-gray-800 flex items-center justify-center text-gray-400 font-bold overflow-hidden shadow-sm group-hover:border-indigo-500 transition-colors">
                                    {person.photo ? (
                                        <img src={person.photo} alt={person.names} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-2xl">{person.names.charAt(0)}{person.lastNames.charAt(0)}</span>
                                    )}
                                </div>

                                <div className="min-w-0 flex-1 pt-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white leading-tight">{person.names} <br /> {person.lastNames}</h3>
                                        {person.isHonorary && (
                                            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[9px] font-black rounded-lg uppercase tracking-widest">Honorarios</span>
                                        )}
                                    </div>
                                    <p className="text-xs md:text-sm font-black text-indigo-600 dark:text-indigo-400 mt-2 uppercase tracking-widest">DNI: {person.dni}</p>

                                    <div className="flex mt-4 gap-2">
                                        <button
                                            onClick={() => onEdit(person)}
                                            className="p-1 px-3 text-[10px] font-black uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg transition-all hover:bg-indigo-600 hover:text-white flex items-center gap-1.5"
                                        >
                                            <Edit2 className="w-3 h-3" />
                                            Editar Ficha
                                        </button>
                                        <button
                                            onClick={() => onDelete(person.id, `${person.names} ${person.lastNames}`)}
                                            className="p-1 px-3 text-[10px] font-black uppercase tracking-widest bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-all hover:bg-red-600 hover:text-white flex items-center gap-1.5"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            Borrar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                            <div className="flex items-center space-x-3 text-sm">
                                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                    <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-gray-400">Sueldo Base</p>
                                    <p className="font-bold text-gray-900 dark:text-gray-100">{formatCurrency(person.baseSalary)}</p>
                                </div>
                            </div>

                            {!person.isHonorary ? (
                                <>
                                    <div className="flex items-center space-x-3 text-sm">
                                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-gray-400">Previsión / Seguro</p>
                                            <p className="font-medium text-gray-900 dark:text-gray-100 leading-tight text-xs">
                                                {getHealthProviderName(person.healthInsuranceId || '')}
                                                {person.hasComplementaryInsurance && (
                                                    <span className="ml-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center mt-0.5">
                                                        <ShieldPlus className="w-3 h-3 mr-0.5" />
                                                        + Complementario ({person.complementaryInsuranceType === 'percentage' ? `${person.complementaryInsuranceValue}%` : formatCurrency(person.complementaryInsuranceValue || 0)})
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3 text-sm">
                                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                            <Landmark className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-gray-400">AFP / APV</p>
                                            <p className="font-medium text-gray-900 dark:text-gray-100 leading-tight text-xs">
                                                {getPensionFundName(person.pensionFundId || '')}
                                                {person.hasAPV && (
                                                    <span className="ml-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center mt-0.5">
                                                        <TrendingUp className="w-3 h-3 mr-0.5" />
                                                        + APV ({person.apvType === 'percentage' ? `${person.apvValue}%` : formatCurrency(person.apvValue || 0)})
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="col-span-1 sm:col-span-2 p-3 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/30">
                                    <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">Contrato a honorarios: Exento de cotizaciones previsionales en planillas SGC.</p>
                                </div>
                            )}

                            <div className="flex items-center space-x-3 text-sm">
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                                    <Banknote className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-gray-400">Datos Bancarios</p>
                                    <p className="font-medium text-gray-900 dark:text-gray-100 uppercase text-[10px]">
                                        {person.bankId ? `${getBankName(person.bankId)} - ${person.accountNumber}` : 'No registrados'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 text-sm">
                                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                    <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-gray-400">Vacaciones</p>
                                    <p className="font-medium text-gray-900 dark:text-gray-100 text-xs">{person.vacationDays} días disponibles</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 text-sm">
                                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <Home className="w-4 h-4 text-gray-400" />
                                </div>
                                <div className="truncate">
                                    <p className="text-[10px] uppercase font-bold text-gray-400">Dirección</p>
                                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate text-xs" title={person.address}>{person.address}</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 text-sm">
                                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <PhoneCall className="w-4 h-4 text-gray-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-gray-400">Emergencia</p>
                                    <p className="font-medium text-gray-900 dark:text-gray-100 text-xs">
                                        {person.hasEmergencyContact && person.emergencyContact
                                            ? `${person.emergencyContact.names} (${person.emergencyContact.phone})`
                                            : 'No registra'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                            <p className="text-[10px] uppercase font-black text-gray-500 dark:text-gray-400 mb-3 tracking-widest flex items-center gap-2">
                                <Shirt className="w-3 h-3 text-indigo-500" />
                                Dotación Requerida / Artículos Pre-cargados
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {articles.filter(a => a.isActive).map(art => {
                                    const assignment = person.assignedArticles?.find(a => a.articleId === art.id);
                                    const isAssigned = !!assignment;

                                    return (
                                        <div key={art.id} className={`p-2 rounded-xl border text-[9px] flex flex-col justify-between transition-all ${isAssigned
                                            ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 shadow-sm'
                                            : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 opacity-40 grayscale'}`}>
                                            <p className="font-bold text-gray-700 dark:text-gray-300 leading-tight truncate">{art.name}</p>
                                            {isAssigned && (
                                                <div className="mt-1 flex items-center justify-between">
                                                    <span className="bg-indigo-600 text-white px-1 rounded-sm font-black uppercase text-[8px]">
                                                        {assignment.size || 'S.T'}
                                                    </span>
                                                    {assignment.quantity > 1 && (
                                                        <span className="text-indigo-600 dark:text-indigo-400 font-black">X {assignment.quantity}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {person.medicalInfo && (
                            <div className="mt-4 p-3 bg-red-50/50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30 flex items-start gap-3">
                                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-red-500/70 dark:text-red-400/70">Información Médica</p>
                                    <p className="text-xs text-gray-700 dark:text-gray-300 font-medium leading-relaxed">{person.medicalInfo}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

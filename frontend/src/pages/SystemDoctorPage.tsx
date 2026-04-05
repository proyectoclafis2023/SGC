import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE_URL } from '../config/api';
import { ShieldCheck, AlertTriangle, XCircle, CheckCircle2, Activity, BarChart3, Fingerprint, Database, Zap, RefreshCw, Layers, Eye, EyeOff, Info as InfoIcon, Search } from 'lucide-react';
import { Button } from '../components/Button';
import { t } from '../i18n/es';

type Severity = 'INFO' | 'WARNING' | 'ERROR';
type IssueType = 'schema' | 'data' | 'mapping' | 'system';

interface Issue {
    type: IssueType;
    severity: Severity;
    module: string;
    message: string;
    action: string;
}

interface Check {
    name: string;
    description: string;
    severity: string;
    issues: Issue[];
}

export const SystemDoctorPage: React.FC = () => {
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // FILTERS
    const [showInfo, setShowInfo] = useState(false);
    const [severityFilter, setSeverityFilter] = useState<string>('ALL');
    const [typeFilter, setTypeFilter] = useState<string>('ALL');
    const [search, setSearch] = useState('');

    const fetchReport = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/system-doctor`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            if (response.ok) {
                setReport(data);
            } else {
                setError(data.error || 'Error al generar el diagnóstico.');
            }
        } catch (err: any) {
            setError(err.message || 'Error de conexión.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    // MEMOIZED FILTERING
    const filteredChecks = useMemo(() => {
        if (!report) return [];
        return report.checks.map((check: Check) => {
            const issues = check.issues.filter(issue => {
                const matchesSeverity = severityFilter === 'ALL' || issue.severity === severityFilter;
                const matchesType = typeFilter === 'ALL' || issue.type === typeFilter;
                const matchesSearch = !search || issue.message.toLowerCase().includes(search.toLowerCase()) || issue.module.toLowerCase().includes(search.toLowerCase());
                const isHiddenInfo = issue.severity === 'INFO' && !showInfo;
                
                return matchesSeverity && matchesType && matchesSearch && !isHiddenInfo;
            });
            return { ...check, issues };
        }).filter(() => {
             // Keep the check panel even if empty to show the "OK" status if that's the result
             return true; 
        });
    }, [report, showInfo, severityFilter, typeFilter, search]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin mb-6" />
            <h2 className="text-xl font-black uppercase italic tracking-tighter">{t('retry_diagnosis')}...</h2>
        </div>
    );

    if (error) return (
        <div className="p-20 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h2 className="text-2xl font-black uppercase italic mb-4">{error}</h2>
            <Button onClick={fetchReport}>{t('retry_diagnosis')}</Button>
        </div>
    );

    const getStatusColor = (status: string) => {
        if (status === 'OK') return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
        if (status === 'WARNING') return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
        return 'text-red-500 bg-red-500/10 border-red-500/20';
    };

    const getSeverityDetails = (sev: string) => {
        if (sev === 'INFO') return 'text-blue-500 bg-blue-500/10';
        if (sev === 'WARNING') return 'text-amber-500 bg-amber-500/10';
        return 'text-red-500 bg-red-500/10 font-bold';
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-20 max-w-7xl mx-auto px-4">
            {/* Header / ScoreCard */}
            <div className={`p-12 rounded-[5rem] shadow-2xl border-2 transition-all ${getStatusColor(report.system_status)}`}>
                 <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="text-center md:text-left flex-1">
                        <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
                             {report.system_status === 'OK' && <CheckCircle2 className="w-10 h-10" />}
                             {report.system_status === 'WARNING' && <Activity className="w-10 h-10 animate-pulse" />}
                             {report.system_status === 'ERROR' && <XCircle className="w-10 h-10 animate-bounce" />}
                             <h1 className="text-5xl font-black italic uppercase tracking-tighter">{t('doctor_report_title')}</h1>
                        </div>
                        <p className="text-lg font-bold uppercase tracking-widest opacity-80 mb-2">
                            {t('system_status')}: {t(`system_status_${report.system_status.toLowerCase()}`)}
                        </p>
                        <p className="text-xs font-mono opacity-60">{t('last_log')}: {new Date(report.timestamp).toLocaleString()} | Schema v{report.data_schema_version}</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 w-full max-w-2xl">
                         <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-md">
                             <span className="text-[10px] block opacity-60 uppercase font-black">{t('checks_label')}</span>
                             <span className="text-2xl font-black">{report.summary.total_checks}</span>
                         </div>
                         <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-md">
                             <span className="text-[10px] block opacity-60 uppercase font-black">{t('critical_label')}</span>
                             <span className="text-2xl font-black">{report.summary.critical}</span>
                         </div>
                         <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-md">
                             <span className="text-[10px] block opacity-60 uppercase font-black">{t('alerts_label')}</span>
                             <span className="text-2xl font-black">{report.summary.warning}</span>
                         </div>
                         <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-md flex items-center justify-center">
                             <Button variant="secondary" onClick={fetchReport} className="rounded-2xl h-12 w-12 p-0 bg-white/20 hover:bg-white/30 border-none">
                                <RefreshCw className="w-5 h-5" />
                             </Button>
                         </div>
                    </div>
                 </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-gray-900/40 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-lg flex flex-col lg:flex-row items-center gap-4">
                 <div className="flex-1 w-full relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Buscar por módulo o mensaje..." 
                      className="w-full bg-gray-50 dark:bg-gray-800/60 border-none rounded-2xl pl-12 pr-4 h-12 text-[10px] font-black uppercase tracking-widest placeholder:text-gray-400"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                 </div>
                 <div className="flex items-center gap-3 w-full lg:w-auto">
                    <select 
                      className="bg-gray-50 dark:bg-gray-800/60 border-none rounded-2xl h-12 px-6 text-[9px] font-black uppercase tracking-widest outline-none transition-all focus:ring-2 focus:ring-indigo-500"
                      value={severityFilter}
                      onChange={(e) => setSeverityFilter(e.target.value)}
                    >
                        <option value="ALL">Severidad: Todas</option>
                        <option value="ERROR">ERROR</option>
                        <option value="WARNING">ADVERTENCIA</option>
                        <option value="INFO">INFO</option>
                    </select>

                    <select 
                      className="bg-gray-50 dark:bg-gray-800/60 border-none rounded-2xl h-12 px-6 text-[9px] font-black uppercase tracking-widest outline-none transition-all focus:ring-2 focus:ring-indigo-500"
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                    >
                        <option value="ALL">Tipo: Todos</option>
                        <option value="schema">SCHEMA</option>
                        <option value="mapping">MAPPING</option>
                        <option value="data">DATA</option>
                        <option value="system">SYSTEM</option>
                    </select>

                    <Button 
                      variant="secondary" 
                      onClick={() => setShowInfo(!showInfo)}
                      className={`rounded-2xl h-12 px-5 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border-none transition-all ${showInfo ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-gray-50 dark:bg-gray-800/60'}`}
                    >
                        {showInfo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        {t('info_label')}
                    </Button>
                 </div>
            </div>

            {/* Detailed Checks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {filteredChecks.map((check: any, idx: number) => (
                    <div key={idx} className="bg-white dark:bg-gray-900/40 p-10 rounded-[3.5rem] border border-gray-100 dark:border-gray-800 shadow-xl relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 rounded-full blur-3xl opacity-20 ${check.severity === 'OK' ? 'bg-emerald-500' : (check.severity === 'WARNING' ? 'bg-amber-500' : 'bg-red-500')}`} />
                        
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                               <div className={`p-4 rounded-2xl ${getStatusColor(check.severity)}`}>
                                   {check.name === 'SCHEMA_ALIGNMENT' && <Database className="w-6 h-6" />}
                                   {check.name === 'MASTER_DEFINITION' && <Layers className="w-6 h-6" />}
                                   {check.name === 'DATASET_HEALTH' && <Fingerprint className="w-6 h-6" />}
                                   {check.name === 'EXECUTION_ANALYTICS' && <BarChart3 className="w-6 h-6" />}
                                   {check.name === 'SYSTEM_VERSION' && <Zap className="w-6 h-6" />}
                               </div>
                               <div>
                                  <h3 className="text-lg font-black italic uppercase tracking-tighter">{t(check.name.toLowerCase())}</h3>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">{t(`${check.name.toLowerCase()}_desc`)}</p>
                               </div>
                            </div>
                            <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(check.severity)}`}>
                                {check.severity}
                            </div>
                        </div>

                        <div className="mt-8 space-y-4">
                            {check.issues.length > 0 ? (
                                check.issues.map((issue: Issue, i: number) => (
                                    <div key={i} className="group/issue flex flex-col gap-3 p-6 bg-gray-50 dark:bg-gray-800/40 rounded-3xl border border-gray-100 dark:border-gray-800 relative overflow-hidden">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                               {issue.severity === 'ERROR' ? <XCircle className="w-4 h-4 text-red-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                                               <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${getSeverityDetails(issue.severity)}`}>
                                                   {issue.severity}
                                               </span>
                                               <span className="text-[9px] font-black uppercase text-indigo-500">{issue.module}</span>
                                            </div>
                                            <span className="text-[7px] font-mono opacity-30 uppercase">{issue.type}</span>
                                        </div>
                                        
                                        <p className="text-xs font-bold opacity-90">{issue.message}</p>
                                        
                                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700/50">
                                            <div className="flex items-center gap-2 mb-1">
                                                <InfoIcon className="w-3 h-3 text-indigo-400" />
                                                <span className="text-[8px] font-black opacity-40 uppercase tracking-widest">{t('action_required')}</span>
                                            </div>
                                            <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 italic">
                                                {issue.action}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/20 text-xs font-black uppercase text-emerald-600">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>{t('ok_status')}</span>
                                </div>
                            )}
                            
                            {/* Hidden Info Notification */}
                            {!showInfo && check.issues.length === 0 && report.summary.info > 0 && (
                                <p className="text-[9px] font-bold text-gray-400 uppercase italic text-center animate-pulse">
                                    {t('info_hidden_msg')}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* AI Onboarding Footnote */}
            <div className="bg-indigo-600 p-12 rounded-[5rem] text-white flex flex-col md:flex-row items-center gap-10 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 opacity-10 group-hover:scale-110 transition-transform duration-1000">
                    <ShieldCheck className="w-40 h-40" />
                </div>
                <div className="text-center md:text-left flex-1 relative z-10">
                    <h3 className="text-xl font-black uppercase italic tracking-tighter mb-2">{t('ai_protocol_active')}</h3>
                    <p className="text-sm opacity-80 max-w-lg leading-relaxed font-medium">
                        {t('ai_protocol_desc')} {t('onboarding_mode')}.
                    </p>
                </div>
                <div className="flex gap-3 relative z-10">
                    <div className="px-5 py-2 bg-white/10 rounded-xl border border-white/10 font-mono text-[10px] font-black">TRIPLE_ALIANZA_VALIDATED</div>
                    <div className="px-5 py-2 bg-white/20 rounded-xl border border-white/10 font-mono text-[10px] font-black">V3.2.0</div>
                </div>
            </div>
        </div>
    );
};

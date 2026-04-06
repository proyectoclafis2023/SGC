import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE_URL } from '../config/api';
import { 
    XCircle, 
    BarChart3, Zap, RefreshCw, 
    Search, Heart, 
    TrendingUp, TrendingDown, Bell, Mail, Globe, Cpu
} from 'lucide-react';
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

/**
 * SVG TREND CHART (SGC v3.5 — ROBUST)
 */
const HealthTrendChart: React.FC<{ data: any[] }> = ({ data }) => {
    if (!data || data.length < 2) return (
        <div className="h-32 flex items-center justify-center text-[10px] font-black uppercase opacity-40 italic">
            {t('no_history')}
        </div>
    );

    const reversed = [...data].reverse();
    const width = 400;
    const height = 100;
    
    // Safety check for health_score
    const points = reversed.map((d, i) => {
        const x = (i / (reversed.length - 1)) * width;
        const score = d.health_score ?? 100;
        const y = height - (score / 100) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="w-full h-32 relative group">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                <defs>
                   <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                       <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                   </linearGradient>
                </defs>
                <polyline
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                    className="drop-shadow-lg"
                />
                <polygon
                    fill="url(#lineGradient)"
                    points={`${width},${height} 0,${height} ${points}`}
                />
            </svg>
        </div>
    );
};

export const SystemDoctorPage: React.FC = () => {
    const [report, setReport] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [severityFilter, setSeverityFilter] = useState<string>('ALL');
    const [search, setSearch] = useState('');

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const [reportRes, historyRes] = await Promise.all([
                fetch(`${API_BASE_URL}/system-doctor`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_BASE_URL}/system-doctor/history`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            
            if (!reportRes.ok) {
                const errData = await reportRes.json();
                throw new Error(errData.error || 'Error al obtener diagnóstico');
            }

            const reportData = await reportRes.json();
            const historyData = historyRes.ok ? await historyRes.json() : [];
            
            setReport(reportData);
            setHistory(Array.isArray(historyData) ? historyData : []);
        } catch (err: any) {
            setError(err.message || 'Error de conexión.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const trend = useMemo(() => {
        if (!history || history.length < 2) return null;
        const current = history[0]?.health_score ?? 0;
        const previous = history[1]?.health_score ?? 0;
        return { val: current - previous, up: current >= previous };
    }, [history]);

    const topModules = useMemo(() => {
        if (!report || !report.grouped_issues) return [];
        return Object.entries(report.grouped_issues)
            .sort((a: any, b: any) => (b[1].count || 0) - (a[1].count || 0))
            .slice(0, 3);
    }, [report]);

    const filteredChecks = useMemo(() => {
        if (!report || !report.checks) return [];
        return report.checks.map((check: Check) => {
            const issues = (check.issues || []).filter(issue => {
                const matchesSeverity = severityFilter === 'ALL' || issue.severity === severityFilter;
                const matchesSearch = !search || issue.message.toLowerCase().includes(search.toLowerCase()) || issue.module.toLowerCase().includes(search.toLowerCase());
                return matchesSeverity && matchesSearch;
            });
            return { ...check, issues };
        });
    }, [report, severityFilter, search]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin mb-6" />
            <h2 className="text-xl font-black uppercase italic tracking-tighter">{t('loading')}...</h2>
        </div>
    );

    if (error || !report) return (
        <div className="p-20 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h2 className="text-2xl font-black uppercase italic mb-4">{error || 'No hay datos de diagnóstico disponibles'}</h2>
            <Button onClick={fetchData}>{t('retry_diagnosis')}</Button>
        </div>
    );

    const getStatusColor = (status: string) => {
        if (status === 'OK') return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
        if (status === 'WARNING') return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
        return 'text-red-500 bg-red-500/10 border-red-500/20';
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-emerald-500';
        if (score >= 70) return 'text-amber-500';
        return 'text-red-500';
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-20 max-w-7xl mx-auto px-4 mt-8">
            {/* Header / ScoreCard */}
            <div className={`p-12 rounded-[5rem] shadow-2xl border-2 transition-all ${getStatusColor(report.system_status || 'OK')}`}>
                 <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
                    <div className="text-center lg:text-left flex-1">
                        <h1 className="text-5xl font-black italic uppercase tracking-tighter mb-4">{t('doctor_report_title')}</h1>
                        <div className="flex items-center gap-4 mb-2 justify-center lg:justify-start">
                            <div className="flex items-center gap-2 bg-white/10 px-4 py-1 rounded-full border border-white/10">
                                <Heart className={`w-4 h-4 ${getScoreColor(report.health_score || 100)}`} />
                                <span className={`text-md font-black ${getScoreColor(report.health_score || 100)}`}>{report.health_score ?? 100}%</span>
                            </div>
                            {trend && (
                                <div className={`flex items-center gap-1 font-black text-xs uppercase tracking-widest ${trend.up ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {trend.up ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                    {Math.abs(trend.val)}%
                                </div>
                            )}
                        </div>
                        <p className="text-[10px] font-mono opacity-60">SGC v{report.sgc_version} | Schema v{report.data_schema_version}</p>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-8 rounded-[3rem] backdrop-blur-xl flex-1 w-full">
                         <HealthTrendChart data={history} />
                    </div>
                 </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-white dark:bg-gray-900/40 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-xl">
                    <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-6 flex items-center gap-2"><BarChart3 className="w-3 h-3" /> {t('top_modules')}</h4>
                    <div className="space-y-3">
                        {topModules.map(([mod, data]: any) => (
                            <div key={mod} className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase tracking-tight opacity-80">{mod}</span>
                                <div className={`px-3 py-1 rounded-full text-[9px] font-black ${data.severity === 'ERROR' ? 'bg-red-500 text-white' : 'bg-amber-100 text-amber-600'}`}>
                                    {data.count}
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>

                 <div className="md:col-span-2 bg-white dark:bg-gray-900/40 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden">
                    <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-6 px-2 flex items-center gap-2"><Bell className="w-3 h-3" /> Alertas del Sistema & Notificaciones</h4>
                    <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {report.events?.map((ev: any, i: number) => (
                            <div key={i} className={`p-5 rounded-3xl border flex items-center justify-between bg-white dark:bg-gray-800/60 shadow-sm ${getStatusColor(ev.severity)}`}>
                                <div className="flex items-center gap-4">
                                    <div className="p-2 rounded-xl bg-current opacity-10">
                                        <Zap className="w-4 h-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-tight">{ev.message}</span>
                                        {ev.alerts_sent && ev.alerts_sent.length > 0 && (
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[8px] font-black opacity-40 uppercase">Enviado vía:</span>
                                                {ev.alerts_sent.map((channel: string) => (
                                                    <div key={channel} className="flex items-center gap-1 bg-current opacity-20 px-2 py-0.5 rounded-full">
                                                        {channel === 'email' ? <Mail className="w-2 h-2" /> : <Globe className="w-2 h-2" />}
                                                        <span className="text-[8px] font-black uppercase">{channel}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <span className="text-[9px] font-mono opacity-40">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                            </div>
                        ))}
                        {(!report.events || report.events.length === 0) && (
                            <div className="flex flex-col items-center justify-center py-10 opacity-30">
                                <Cpu className="w-8 h-8 mb-2" />
                                <p className="text-[9px] font-black uppercase tracking-widest italic font-mono">Sin alertas activas</p>
                            </div>
                        )}
                    </div>
                 </div>
            </div>

            <div className="bg-white dark:bg-gray-900/40 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 flex items-center gap-4">
                 <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="Buscar por módulo o mensaje..." 
                      className="w-full bg-gray-50 dark:bg-gray-800/60 border-none rounded-2xl pl-12 pr-4 h-12 text-[10px] font-black uppercase outline-none"
                    />
                 </div>
                 <select 
                   className="bg-gray-50 dark:bg-gray-800/60 border-none rounded-2xl h-12 px-6 text-[9px] font-black uppercase"
                   value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}
                 >
                    <option value="ALL">Todas</option>
                    <option value="ERROR">ERROR</option>
                    <option value="WARNING">ADVERTENCIA</option>
                 </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {filteredChecks.map((check: any, idx: number) => (
                    <div key={idx} className="bg-white dark:bg-gray-900/40 p-10 rounded-[3.5rem] border border-gray-100 dark:border-gray-800 transition-all hover:shadow-2xl hover:shadow-indigo-500/5">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                               <h3 className="text-lg font-black uppercase italic tracking-tighter">{t(check.name.toLowerCase())}</h3>
                            </div>
                            <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${getStatusColor(check.severity)}`}>
                                {check.severity}
                            </div>
                        </div>
                        <div className="space-y-4">
                            {check.issues.length > 0 ? check.issues.map((issue: any, i: number) => (
                                <div key={i} className="p-6 bg-gray-50 dark:bg-gray-800/40 rounded-3xl border border-gray-100 dark:border-gray-700 transition-all hover:bg-white dark:hover:bg-gray-800">
                                    <p className="text-xs font-bold opacity-90">{issue.message}</p>
                                    <div className="mt-2 text-[10px] font-medium text-indigo-600 dark:text-indigo-400 italic font-mono flex items-center gap-2">
                                        <RefreshCw className="w-3 h-3" />
                                        {issue.action}
                                    </div>
                                </div>
                            )) : (
                                <div className="py-10 flex flex-center flex-col items-center justify-center bg-emerald-50/30 dark:bg-emerald-900/5 rounded-3xl border border-emerald-100 dark:border-emerald-900/20">
                                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mb-2" />
                                    <div className="text-xs font-black uppercase text-emerald-600">{t('ok_status')}</div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Re-defining CheckCircle2 for usage inside the loop
const CheckCircle2 = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
);

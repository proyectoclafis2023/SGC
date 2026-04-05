import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info, FileText, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from './Button';

interface RowError {
  module: string;
  row: number;
  field: string;
  error: string;
}

interface GlobalError {
  module: string;
  row: number;
  field: string;
  error: string;
  type: string;
}

interface StatsSummary {
  total_rows: number;
  valid_rows: number;
  error_rows: number;
  global_errors_count?: number;
}

interface DryRunResultProps {
  stats: StatsSummary;
  rowErrors: RowError[];
  globalErrors: GlobalError[];
  readyToExecute: boolean;
  onExecute?: () => void;
  loading?: boolean;
}

export const DryRunResultComponent: React.FC<DryRunResultProps> = ({
  stats,
  rowErrors,
  globalErrors,
  readyToExecute,
  onExecute,
  loading = false
}) => {
  const exportErrors = () => {
    const data = [
      ...globalErrors.map(e => ({ 
        Módulo: e.module.toUpperCase(), 
        Fila: e.row, 
        Campo: e.field, 
        Error: e.error, 
        Tipo: 'Relacional/Global',
        Sugerencia: 'Verificar integridad referencial o registros duplicados.' 
      })),
      ...rowErrors.map(e => ({ 
        Módulo: e.module.toUpperCase(), 
        Fila: e.row, 
        Campo: e.field, 
        Error: e.error, 
        Tipo: 'Fila/Estructural',
        Sugerencia: 'Corregir formato de celda o completar campo requerido.' 
      }))
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Detalle Errores SGC");
    XLSX.writeFile(wb, `SGC_Errores_Carga_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
      {/* 1. Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-xl text-center group transition-all hover:bg-gray-50 dark:hover:bg-gray-800/60">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 italic">Total Procesado</p>
          <h3 className="text-4xl font-black text-indigo-600 mb-1 leading-none">{stats.total_rows}</h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase">Filas registradas</p>
        </div>

        <div className="bg-emerald-600 p-8 rounded-[3.5rem] shadow-xl shadow-emerald-500/20 text-center text-white transition-transform hover:scale-105">
          <p className="text-[10px] font-black opacity-70 uppercase tracking-widest mb-2 italic">Filas Válidas</p>
          <h3 className="text-4xl font-black mb-1 leading-none">
            {stats.valid_rows}
          </h3>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <CheckCircle2 className="w-4 h-4 opacity-70" />
            <span className="text-[10px] font-bold uppercase">Listo para carga</span>
          </div>
        </div>

        <div className={`p-8 rounded-[3rem] shadow-xl text-center transition-all ${stats.error_rows > 0 || stats.global_errors_count ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-gray-50 dark:bg-gray-800 text-gray-400 opacity-50'}`}>
          <p className="text-[10px] font-black opacity-70 uppercase tracking-widest mb-2 italic">Errores Detectados</p>
          <h3 className="text-4xl font-black mb-1 leading-none">
            {stats.error_rows + (stats.global_errors_count || 0)}
          </h3>
          <p className="text-[10px] font-bold uppercase">Corregir para cargar</p>
        </div>
      </div>

      {/* 2. Error Detailed List */}
      {(rowErrors.length > 0 || globalErrors.length > 0) && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[3.5rem] shadow-2xl overflow-hidden transition-all hover:shadow-red-500/10">
          <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/40 backdrop-blur-md">
            <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-3 italic">
              <AlertCircle className="w-6 h-6 text-red-500" />
              DETALLE MÉTRICO DE ERRORES
            </h3>
            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                onClick={exportErrors}
                className="bg-white text-indigo-600 rounded-xl text-[10px] h-10 px-4 font-black shadow-sm"
              >
                <Download className="w-3 h-3 mr-2" /> Descargar Excel (.xlsx)
              </Button>
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[10px] font-black uppercase italic tracking-tighter flex items-center">
                {rowErrors.length + globalErrors.length} Conflictos
              </span>
            </div>
          </div>
          
          <div className="overflow-x-auto p-4 max-h-[500px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
                <tr className="border-b border-gray-100 dark:border-gray-800 transition-colors">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Tipo</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Módulo</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-center">Fila</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Campo/Relación</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {/* Global Errors First */}
                {globalErrors.map((error, idx) => (
                  <tr key={`global-${idx}`} className="group transition-colors hover:bg-amber-50/30 dark:hover:bg-amber-900/10 bg-amber-50/10 dark:bg-amber-900/5">
                    <td className="px-6 py-4 italic whitespace-nowrap">
                      <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase flex items-center gap-1.5 w-fit">
                        <Info className="w-3 h-3" /> Global
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-gray-900 dark:text-white uppercase text-[10px]">{error.module}</td>
                    <td className="px-6 py-4 font-bold text-gray-400 text-center text-xs">{error.row}</td>
                    <td className="px-6 py-4 font-black text-amber-600/70 text-[10px] uppercase">{error.field}</td>
                    <td className="px-6 py-4 text-xs font-bold text-amber-800/80 leading-snug">{error.error}</td>
                  </tr>
                ))}

                {/* Row Errors */}
                {rowErrors.map((error, idx) => (
                  <tr key={`row-${idx}`} className="group transition-colors hover:bg-red-50/40 dark:hover:bg-red-900/10">
                    <td className="px-6 py-4 italic whitespace-nowrap">
                      <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase flex items-center gap-1.5 w-fit shadow-sm shadow-red-500/10">
                        <XCircle className="w-3 h-3" /> Fila
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-gray-900 dark:text-white uppercase text-[10px]">{error.module}</td>
                    <td className="px-6 py-4 font-bold text-gray-400 text-center text-xs">{error.row}</td>
                    <td className="px-6 py-4 font-black text-indigo-500/70 text-[10px] uppercase">{error.field}</td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-600 leading-snug">{error.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-8 bg-gray-50/50 dark:bg-gray-800/40 backdrop-blur-md flex items-center gap-3">
             <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                 <FileText className="w-4 h-4" />
             </div>
             <p className="text-[10px] text-gray-500 font-bold uppercase italic tracking-tight">
               Por favor, corrija las filas indicadas en el archivo original y vuelva a realizar la simulación.
             </p>
          </div>
        </div>
      )}

      {/* 3. Action Logic */}
      {readyToExecute && onExecute && (
        <div className="bg-indigo-600 p-12 rounded-[5rem] shadow-2xl shadow-indigo-500/30 text-center text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform">
             <CheckCircle2 className="w-48 h-48" />
          </div>
          <h2 className="text-3xl font-black mb-4 italic uppercase tracking-tighter">Simulación Exitosa (0 Errores)</h2>
          <p className="text-sm opacity-80 max-w-lg mx-auto mb-10 leading-relaxed font-medium">
             El motor ha validado la estructura, mapeo y relaciones. 
             Los datos son consistentes con la base de datos actual.
          </p>
          <button
            onClick={onExecute}
            disabled={loading}
            className={`px-12 py-5 bg-white text-indigo-600 rounded-full font-black uppercase tracking-widest text-xs shadow-2xl hover:scale-105 transition-all shadow-white/30 border-4 border-white/20 active:scale-95 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'EFECTUANDO CARGA REAL...' : 'INICIAR PERSISTENCIA FINAL'}
          </button>
          <p className="mt-8 text-[10px] font-black opacity-40 uppercase tracking-widest italic group-hover:opacity-60 transition-opacity">
            ESTA ACCIÓN ES IRREVERSIBLE · SE REALIZARÁ UN SNAPSHOT ANTES DE PERSISTIR
          </p>
        </div>
      )}
    </div>
  );
};

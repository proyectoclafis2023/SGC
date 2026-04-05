import React, { useState, useEffect } from 'react';
import { AlertCircle, Edit3, RotateCcw, Zap, ZapOff, Check } from 'lucide-react';
import { Button } from './Button';

interface RowError {
  module: string;
  row: number; // 2-indexed
  field: string;
  error: string;
  suggestion?: string;
  autoFixed?: boolean;
  original?: any;
  corrected?: any;
}

interface EditableDataTableProps {
  data: Record<string, any[]>;
  errors: RowError[];
  onDataChange: (newData: Record<string, any[]>) => void;
  onRevalidate: () => void;
}

export const EditableDataTable: React.FC<EditableDataTableProps> = ({
  data,
  errors,
  onDataChange,
  onRevalidate
}) => {
  const [activeTab, setActiveTab] = useState<string>(Object.keys(data)[0] || '');
  const [localData, setLocalData] = useState<Record<string, any[]>>(data);
  const [editingCell, setEditingCell] = useState<{ rowIdx: number, field: string } | null>(null);
  const [tempValue, setTempValue] = useState<string>('');

  useEffect(() => {
    setLocalData(data);
    if ((!activeTab || !data[activeTab]) && Object.keys(data).length > 0) {
      setActiveTab(Object.keys(data)[0]);
    }
  }, [data]);

  const handleCellEdit = (rowIdx: number, field: string, value: any) => {
    setEditingCell({ rowIdx, field });
    setTempValue(String(value || ''));
  };

  const saveCell = () => {
    if (!editingCell) return;
    const { rowIdx, field } = editingCell;
    const updatedModuleData = [...localData[activeTab]];
    updatedModuleData[rowIdx] = { ...updatedModuleData[rowIdx], [field]: tempValue };
    
    const newData = { ...localData, [activeTab]: updatedModuleData };
    setLocalData(newData);
    onDataChange(newData);
    setEditingCell(null);
  };

  const toggleAutoFix = (rowIdx: number, field: string, apply: boolean, original: any, corrected: any) => {
    const updatedModuleData = [...localData[activeTab]];
    updatedModuleData[rowIdx] = { ...updatedModuleData[rowIdx], [field]: apply ? corrected : original };
    
    const newData = { ...localData, [activeTab]: updatedModuleData };
    setLocalData(newData);
    onDataChange(newData);
  };

  const getCellStatus = (rowIdx: number, field: string): any => {
    const rowIndex = rowIdx + 2; 
    const error = errors.find(e => e.module === activeTab && e.row === rowIndex && e.field === field);
    if (!error) return { type: 'valid' };
    if (error.autoFixed) return { type: 'autofixed', ...error };
    return { type: 'error', ...error };
  };

  const modules = Object.keys(localData);

  return (
    <div className="bg-white dark:bg-gray-950 rounded-[3.5rem] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-700">
      {/* Header & Tabs */}
      <div className="p-8 pb-0 border-b border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/40 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">Control de Calidad Premium</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Edición binaria y control de heurísticas en tiempo real</p>
          </div>
          <div className="flex gap-4">
               <Button onClick={onRevalidate} variant="secondary" className="rounded-2xl h-12 px-6 font-black text-[10px] uppercase italic">
                   <RotateCcw className="w-4 h-4 mr-2" /> REVALIDAR CAMBIOS
               </Button>
          </div>
        </div>

        <div className="flex gap-2 pb-4 overflow-x-auto no-scrollbar">
          {modules.map(mod => (
            <button
              key={mod}
              onClick={() => setActiveTab(mod)}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === mod 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 -translate-y-1' 
                  : 'bg-white dark:bg-gray-800 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {mod} ({localData[mod].length})
            </button>
          ))}
        </div>
      </div>

      {/* Grid Table */}
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-20 bg-gray-50 dark:bg-gray-900/90 backdrop-blur-md">
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="px-6 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center italic w-16">Fila</th>
              {activeTab && localData[activeTab]?.[0] && Object.keys(localData[activeTab][0]).map(key => (
                <th key={key} className="px-6 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest italic">{key}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {activeTab && localData[activeTab]?.map((row, rowIdx) => (
              <tr key={rowIdx} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                <td className="px-6 py-4 text-center font-black text-gray-400 text-[10px] bg-gray-50/20 dark:bg-gray-900/20">{rowIdx + 2}</td>
                {Object.keys(row).map(field => {
                  const status = getCellStatus(rowIdx, field);
                  const isEditing = editingCell?.rowIdx === rowIdx && editingCell?.field === field;

                  return (
                    <td 
                      key={field} 
                      className={`px-6 py-4 text-xs font-medium cursor-pointer relative min-w-[150px] transition-all ${
                        status.type === 'error' ? 'bg-red-50/30 dark:bg-red-900/10' : 
                        status.type === 'autofixed' ? 'bg-amber-50/30 dark:bg-amber-900/10' : ''
                      }`}
                      onClick={() => !isEditing && handleCellEdit(rowIdx, field, row[field])}
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-2 animate-in zoom-in-95 duration-200">
                          <input
                            autoFocus
                            className="bg-white dark:bg-gray-800 border-2 border-indigo-500 rounded-lg px-3 py-2 w-full text-xs font-bold outline-none shadow-xl"
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveCell()}
                          />
                          <button onClick={saveCell} className="p-2 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700">
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between group/cell">
                          <span className={`block truncate ${status.type === 'valid' ? 'text-gray-600 dark:text-gray-300' : 'font-bold'}`}>
                            {String(row[field] || '—')}
                          </span>
                          
                          {/* Status Indicators */}
                          <div className="flex items-center gap-2">
                             {status.type === 'error' && (
                               <div className="group/hint relative">
                                 <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />
                                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-gray-900 text-white text-[10px] rounded-xl opacity-0 group-hover/hint:opacity-100 transition-opacity z-50 pointer-events-none shadow-2xl font-bold italic">
                                    {status.error}
                                    {status.suggestion && <p className="mt-1 text-amber-400">💡 {status.suggestion}</p>}
                                 </div>
                               </div>
                             )}
                             {status.type === 'autofixed' && (
                               <div className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-lg">
                                 <Zap className="w-3 h-3 text-amber-600" />
                                 <span className="text-[9px] font-black text-amber-700 uppercase italic">Fix</span>
                                 
                                 {/* Autofix Control Toggles */}
                                 <div className="flex gap-1 ml-1 border-l border-amber-200 dark:border-amber-700 pl-1">
                                     <button 
                                        onClick={(e) => { e.stopPropagation(); toggleAutoFix(rowIdx, field, false, status.original, status.corrected); }}
                                        className={`p-0.5 rounded transition-all ${row[field] === status.original ? 'bg-amber-600 text-white' : 'text-amber-400 hover:text-amber-600'}`}
                                     >
                                         <ZapOff className="w-2.5 h-2.5" />
                                     </button>
                                     <button 
                                        onClick={(e) => { e.stopPropagation(); toggleAutoFix(rowIdx, field, true, status.original, status.corrected); }}
                                        className={`p-0.5 rounded transition-all ${row[field] === status.corrected ? 'bg-amber-600 text-white' : 'text-amber-400 hover:text-amber-600'}`}
                                     >
                                         <Check className="w-2.5 h-2.5" />
                                     </button>
                                 </div>
                               </div>
                             )}
                             <Edit3 className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Legend */}
      <div className="p-6 bg-gray-50/50 dark:bg-gray-900/40 border-t border-gray-100 dark:border-gray-800 flex items-center gap-8">
          <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-[9px] font-black text-gray-400 uppercase italic">Error Crítico</span>
          </div>
          <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-[9px] font-black text-gray-400 uppercase italic">Autocorrección IA</span>
          </div>
          <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-[9px] font-black text-gray-400 uppercase italic">Válido</span>
          </div>
          <div className="ml-auto flex items-center gap-2 text-indigo-600 font-bold italic text-xs">
              <Edit3 className="w-4 h-4" />
              Haz click en cualquier celda para editar manualmente
          </div>
      </div>
    </div>
  );
};

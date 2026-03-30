import React from 'react';
import type { Advance, Personnel, SystemSettings } from '../types';

interface Props {
    advance: Advance;
    person: Personnel | undefined;
    settings: SystemSettings;
}

export const AdvanceReceipt: React.FC<Props> = ({ advance, person, settings }) => {
    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);

    return (
        <div id="print-receipt" className="bg-white p-12 shadow-2xl w-full max-w-[600px] mx-auto text-gray-900 border-2 border-dashed border-gray-200 print:shadow-none print:border-none print:m-0">
            <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-6">
                <div>
                    <h2 className="text-lg font-black uppercase text-indigo-600">{settings.systemName}</h2>
                    <p className="text-[8px] font-bold text-gray-500 uppercase">{settings.condoAddress}</p>
                </div>
                <div className="text-right">
                    <h1 className="text-xl font-black uppercase tracking-tight">Comprobante de Egreso</h1>
                    <p className="text-[10px] font-bold text-gray-400">ADELANTO DE SUELDO</p>
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl">
                    <span className="text-xs font-bold text-gray-500 uppercase">Fecha de Entrega</span>
                    <span className="text-sm font-black text-gray-900">{new Date(advance.date).toLocaleDateString()}</span>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Trabajador Beneficiario</label>
                    <div className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-md font-black uppercase">{person?.names} {person?.lastNames}</p>
                        <p className="text-xs font-bold text-indigo-600">RUT: {person?.dni}</p>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Por Concepto De</label>
                    <div className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-sm font-medium">{advance.description}</p>
                    </div>
                </div>

                <div className="flex justify-between items-center bg-indigo-600 text-white p-6 rounded-2xl shadow-lg">
                    <span className="text-sm font-black uppercase tracking-widest">Monto Entregado</span>
                    <span className="text-2xl font-black">{formatCurrency(advance.amount)}</span>
                </div>

                <div className="mt-16 pt-8 border-t border-gray-200 text-center">
                    <div className="w-48 h-0.5 bg-gray-200 mx-auto mb-2"></div>
                    <p className="text-[10px] font-bold uppercase text-gray-400">Firma Trabajador</p>
                    <p className="text-[8px] text-gray-400 mt-4 leading-relaxed">
                        Declaro recibir conforme la suma indicada, la cual será descontada de mi próxima liquidación de sueldo.
                    </p>
                </div>
            </div>
        </div>
    );
};

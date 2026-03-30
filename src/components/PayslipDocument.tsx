import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { Payslip, Personnel, HealthProvider, PensionFund, SystemSettings } from '../types';

interface Props {
    payslip: Payslip;
    person: Personnel | undefined;
    health: HealthProvider | undefined;
    fund: PensionFund | undefined;
    settings: SystemSettings;
}

export const PayslipDocument: React.FC<Props> = ({ payslip, person, health, fund, settings }) => {
    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);

    return (
        <div id="print-payslip" className="bg-white p-10 shadow-2xl w-full max-w-[800px] mx-auto text-gray-900 border border-gray-100 print:shadow-none print:border-none print:m-0">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-indigo-600 pb-6 mb-8">
                <div className="space-y-1">
                    <h2 className="text-xl font-black uppercase text-indigo-600">{settings.systemName}</h2>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">RUT: {settings.condoRut}</p>
                    <p className="text-[10px] font-bold text-gray-500 truncate">{settings.condoAddress}</p>
                </div>
                <div className="text-right">
                    <h1 className="text-2xl font-black uppercase tracking-tighter">Liquidación de Sueldo</h1>
                    <p className="text-sm font-bold text-indigo-600">{monthNames[payslip.month - 1]} {payslip.year}</p>
                    <p className="text-[10px] text-gray-400 font-mono mt-1">FOLIO #{payslip.folio}</p>
                </div>
            </div>

            {/* Personnel Info */}
            <div className="grid grid-cols-2 gap-8 mb-8 bg-gray-50 p-6 rounded-2xl border border-gray-200">
                <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Trabajador</p>
                    <p className="text-lg font-black uppercase">{person?.names} {person?.lastNames}</p>
                    <p className="text-sm font-bold text-indigo-600">RUT: {person?.dni}</p>
                </div>
                <div className="space-y-2 text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cargo / Función</p>
                    <p className="text-md font-bold uppercase">{person?.position || 'Personal de Condominio'}</p>
                </div>
            </div>

            {/* Calculations */}
            <div className="grid grid-cols-2 gap-12">
                {/* Incomes */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase border-b border-gray-200 pb-2 flex items-center gap-2">
                        <ArrowUpRight className="w-4 h-4 text-green-500" /> Haberes Remunerativos
                    </h3>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Sueldo Base (30 días)</span>
                            <span className="font-bold">{formatCurrency(payslip.baseSalary)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-black pt-4 border-t border-gray-100">
                            <span>Total Haberes</span>
                            <span>{formatCurrency(payslip.grossSalary)}</span>
                        </div>
                    </div>
                </div>

                {/* Deductions */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase border-b border-gray-200 pb-2 flex items-center gap-2">
                        <ArrowDownRight className="w-4 h-4 text-red-500" /> Descuentos Previsionales
                    </h3>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Salud ({health?.name || 'Fonasa'})</span>
                            <span className="font-bold">{formatCurrency(payslip.healthDiscount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Previsión ({fund?.name || 'AFP'})</span>
                            <span className="font-bold">{formatCurrency(payslip.pensionDiscount)}</span>
                        </div>
                        {payslip.advancesDiscount > 0 && (
                            <div className="flex justify-between text-sm text-red-600 font-bold">
                                <span>Adelantos de Sueldo</span>
                                <span>-{formatCurrency(payslip.advancesDiscount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm font-black pt-4 border-t border-gray-100">
                            <span>Total Descuentos</span>
                            <span>{formatCurrency(payslip.totalDeductions)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Total Net */}
            <div className="mt-12 bg-indigo-600 text-white p-8 rounded-3xl flex justify-between items-center shadow-xl shadow-indigo-600/20">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-80">Alcance Líquido a Pago</p>
                    <p className="text-sm italic font-medium opacity-60">Son: {payslip.netSalary.toLocaleString('es-CL')} pesos chilenos</p>
                </div>
                <div className="text-4xl font-black">{formatCurrency(payslip.netSalary)}</div>
            </div>

            {/* Signatures */}
            <div className="mt-24 grid grid-cols-2 gap-20">
                <div className="border-t border-gray-300 pt-4 text-center">
                    <p className="text-xs font-bold uppercase">{person?.names} {person?.lastNames}</p>
                    <p className="text-[10px] text-gray-400 uppercase">Firma del Trabajador</p>
                </div>
                <div className="border-t border-gray-300 pt-4 text-center">
                    <p className="text-xs font-bold uppercase">{settings.adminName || 'Administración'}</p>
                    <p className="text-[10px] text-gray-400 uppercase">Firma Empleador</p>
                </div>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-100 text-[8px] text-gray-400 text-center uppercase tracking-widest">
                Certifico que he recibido de mi empleador a mi total satisfacción el saldo líquido indicado en esta liquidación, no teniendo reclamo alguno que formular.
            </div>
        </div>
    );
};

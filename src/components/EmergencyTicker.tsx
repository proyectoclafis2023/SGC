import React from 'react';
import { useEmergencyNumbers } from '../context/EmergencyNumberContext';
import { Phone, AlertTriangle } from 'lucide-react';

export const EmergencyTicker: React.FC = () => {
    const { numbers } = useEmergencyNumbers();

    // Solo mostramos los de Seguridad y Emergencia en el ticker para no saturar
    const criticalNumbers = numbers.filter(n => n.category === 'SEGURIDAD' || n.category === 'EMERGENCIA');

    if (criticalNumbers.length === 0) return null;

    return (
        <div className="bg-red-600 text-white overflow-hidden py-2 border-b border-red-700 shadow-lg relative z-20">
            <div className="flex animate-marquee whitespace-nowrap items-center">
                {[...criticalNumbers, ...criticalNumbers].map((num, i) => (
                    <div key={`${num.id}-${i}`} className="inline-flex items-center mx-12">
                        <AlertTriangle className="w-3.5 h-3.5 mr-2 text-rose-200 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{num.name}:</span>
                        <span className="ml-2 text-xs font-black drop-shadow-sm">{num.phone}</span>
                        <Phone className="w-3 h-3 ml-2 opacity-50" />
                    </div>
                ))}
            </div>

            {/* Estilos inline para el marquee si no están en index.css */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
            `}} />
        </div>
    );
};

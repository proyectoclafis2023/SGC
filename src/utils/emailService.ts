import type { SystemSettings } from '../types';

export type EmailType = 'expenses' | 'visits' | 'correspondence' | 'reservations' | 'systemAnnouncements' | 'suggestions';

export interface EmailData {
    to: string | string[];
    cc?: string | string[];
    subject: string;
    body: string;
    folio?: string; // Número de registro o reporte
}

/**
 * Función que genera el asunto dinámico del correo teniendo en cuenta si hay
 * folios de registro o reportes, lo que permite un fácil seguimiento.
 */
export const generateEmailSubject = (type: EmailType, settings: SystemSettings, folio?: string): string => {
    const condoName = settings.systemName || 'Nuestra Comunidad';
    const folioText = folio ? ` [Folio #${folio}]` : '';

    switch (type) {
        case 'expenses':
            return `Notificación de Gastos Comunes - ${condoName}${folioText}`;
        case 'visits':
            return `Aviso de Visita Registrada - ${condoName}${folioText}`;
        case 'correspondence':
            return `Recepción de Encomienda - ${condoName}${folioText}`;
        case 'reservations':
            return `Confirmación de Reserva - ${condoName}${folioText}`;
        case 'systemAnnouncements':
            return `Aviso Importante Comunidad - ${condoName}`;
        case 'suggestions':
            return `Actualización de Ticket / Sugerencia - ${condoName}${folioText}`;
        default:
            return `Notificación del Sistema - ${condoName}`;
    }
};

/**
 * Calcula a quiénes se les enviará el correo cuando un residente realiza una acción
 * (espera visita, reporta encomienda, hace reserva).
 * - Toma el correo principal del residente.
 * - Le suma a conserjería si existe.
 * - Verifica si el propietario configuró copias y las envía solo si no es la misma persona.
 */
export const getResidentActionEmails = (
    residentEmail: string,
    conciergeEmail?: string,
    ownerEmail?: string,
    ownerWantsNotifications: boolean = false
): { to: string; cc: string[] } => {
    const ccList: string[] = [];

    // Siempre notificamos a conserjería para tener un registro
    if (conciergeEmail) {
        ccList.push(conciergeEmail);
    }

    // Si el dueño quiere notificaciones y no es la misma persona que el residente
    if (ownerWantsNotifications && ownerEmail && ownerEmail.toLowerCase() !== residentEmail.toLowerCase()) {
        ccList.push(ownerEmail);
    }

    // Limpiamos duplicados y removes correos que ya sean el residente
    const uniqueCc = [...new Set(ccList)].filter(email => email.toLowerCase() !== residentEmail.toLowerCase());

    return {
        to: residentEmail,
        cc: uniqueCc
    };
};

/**
 * Función centralizada que simula el envío del correo electrónico.
 * Esta función evalúa los Triggers desde el SystemSettings y, en base a eso,
 * gatilla o detiene el envío. Añade el correo en copia oculta (BCC) si existe para auditoría.
 */
export const sendSystemEmail = async (type: EmailType, data: EmailData, settings: SystemSettings) => {
    // 1. Verificamos si este tipo de correo está encendido en el Maestro de Correos
    if (!settings.emailTriggers || !settings.emailTriggers[type]) {
        console.log(`[Email Service] Envío omitido. Opción de correo desactivada para: ${type}`);
        return false;
    }

    // 2. Revisamos si el servidor SMTP está configurado mínimamente
    if (!settings.smtpHost || !settings.smtpUser) {
        console.warn(`[Email Service] No se puede enviar correo: Servidor SMTP no configurado en Maestro.`);
        return false;
    }

    // 3. Generamos un Asunto enriquecido, tomando en cuenta si la data entregó un 'folio'
    const finalSubject = generateEmailSubject(type, settings, data.folio);

    // 4. Preparamos el Payload para el servidor
    const payload = {
        to: data.to,
        cc: data.cc || undefined,
        from: settings.smtpFrom || settings.smtpUser,
        bcc: settings.smtpBcc || null, // Se despacha una copia al Admin o auditor si se configuró
        subject: finalSubject,
        body: data.body
    };

    console.log(`[Email Service - TEST] Simulando envío a Backend:`);
    console.table(payload);

    // Integración futura en producción:
    // await fetch('/api/send-email', { method: 'POST', body: JSON.stringify(payload) });

    return true;
};

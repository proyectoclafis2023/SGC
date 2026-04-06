const nodemailer = require('nodemailer');
const axios = require('axios');
require('dotenv').config();

let lastAlertTime = 0;

/**
 * DOCTOR ALERT SERVICE (v3.5.0)
 * Handles external notifications via Email and Webhook.
 * Includes anti-spam (cooldown) and severity filtering.
 */
class DoctorAlertService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    /**
     * RESOLVE CONFIG (v3.5.0)
     * DB > ENV > Default
     */
    async getConfig() {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient(); // Dynamic import to avoid issues in some environments
        const db = await prisma.systemSettings.findFirst({ orderBy: { createdAt: 'desc' } });
        
        return {
            enabled: db?.doctorAlertEnabled ?? (process.env.DOCTOR_ALERT_EMAIL_ENABLED === 'true' || !!process.env.DOCTOR_ALERT_WEBHOOK_URL),
            threshold_warning: db?.doctorThresholdWarning ?? parseInt(process.env.DOCTOR_ALERT_THRESHOLD_WARNING || '90'),
            threshold_error: db?.doctorThresholdError ?? parseInt(process.env.DOCTOR_ALERT_THRESHOLD_ERROR || '70'),
            cooldown_min: db?.doctorCooldownMin ?? parseInt(process.env.DOCTOR_ALERT_COOLDOWN_MIN || '15'),
            webhook_url: db?.doctorWebhookUrl ?? process.env.DOCTOR_ALERT_WEBHOOK_URL
        };
    }

    /**
     * Checks thresholds and sends alerts if necessary.
     * Returns list of channels notified.
     */
    async processAlerts(report) {
        const now = Date.now();
        const channelsNotified = [];
        
        const config = await this.getConfig();
        const { enabled, threshold_warning, threshold_error, cooldown_min, webhook_url } = config;
        
        const COOLDOWN_MS = (cooldown_min || 15) * 60 * 1000;

        // Skip if alerts disabled
        if (!enabled) return [];

        // Only alert if below threshold
        if (report.health_score > threshold_warning) return [];

        // Check cooldown
        if (now - lastAlertTime < COOLDOWN_MS) {
            console.log('[DOCTOR_ALERT] Anti-spam: Skipping alert (Cooldown active).');
            return [];
        }

        const severity = report.health_score < threshold_error ? 'ERROR' : 'WARNING';
        
        // 1. EMAIL ALERT
        if (process.env.DOCTOR_ALERT_EMAIL_ENABLED === 'true' || (enabled && process.env.SMTP_USER)) {
            try {
                await this.sendEmail(report, severity);
                channelsNotified.push('email');
            } catch (err) {
                console.error('[DOCTOR_ALERT] Email failed:', err.message);
            }
        }

        // 2. WEBHOOK ALERT
        if (webhook_url) {
            try {
                await this.sendWebhook(report, severity, webhook_url);
                channelsNotified.push('webhook');
            } catch (err) {
                console.error('[DOCTOR_ALERT] Webhook failed:', err.message);
            }
        }

        if (channelsNotified.length > 0) {
            lastAlertTime = now;
        }

        return channelsNotified;
    }

    async sendEmail(report, severity) {
        const { health_score, system_status, summary, sgc_version } = report;
        const icon = severity === 'ERROR' ? '🚨' : '⚠️';
        
        await this.transporter.sendMail({
            from: `"SGC System Doctor" <${process.env.SMTP_USER}>`,
            to: process.env.SMTP_USER, // Default to admin email
            subject: `${icon} [SGC v${sgc_version}] Alerta de Salud: ${health_score}%`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h1 style="color: ${severity === 'ERROR' ? '#ef4444' : '#f59e0b'}">Alerta del Sistema</h1>
                    <p>Se ha detectado una degradación en la salud del sistema.</p>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="background: #f9fafb;">
                            <td style="padding: 10px; border: 1px solid #ddd;"><b>Health Score</b></td>
                            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">${health_score}%</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd;"><b>Status</b></td>
                            <td style="padding: 10px; border: 1px solid #ddd;">${system_status}</td>
                        </tr>
                        <tr style="background: #f9fafb;">
                            <td style="padding: 10px; border: 1px solid #ddd;"><b>Incidencias</b></td>
                            <td style="padding: 10px; border: 1px solid #ddd;">
                                Críticas: ${summary.critical}<br/>
                                Advertencias: ${summary.warning}
                            </td>
                        </tr>
                    </table>
                    <p style="margin-top: 20px;">Por favor, revise el panel de administración central para ver el diagnóstico completo.</p>
                    <hr/>
                    <small style="color: #666;">Enviado automáticamente por System Doctor v3.5.0</small>
                </div>
            `
        });
    }

    async sendWebhook(report, severity, url) {
        if (!url) return;
        await axios.post(url, {
            event: "HEALTH_ALERT",
            sgc_version: report.sgc_version,
            severity,
            health_score: report.health_score,
            issues_summary: {
                critical: report.summary.critical,
                warning: report.summary.warning
            },
            timestamp: new Date().toISOString()
        });
    }
}

module.exports = new DoctorAlertService();

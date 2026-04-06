const { PrismaClient } = require('@prisma/client');
const registry = require('../../core/mapping/registry');
const { MASTER_MODULES, DATA_SCHEMA_VERSION, SGC_VERSION } = require('../../config/masterModules');
const fs = require('fs');
const path = require('path');
const doctorAlert = require('./doctorAlert.service');
const prisma = new PrismaClient();

/**
 * SYSTEM DOCTOR SERVICE — ADVANCED v3.5.0
 * Health scoring, advanced grouping, alert system and AI-ready event structure.
 */
class SystemDoctorService {
    /**
     * Performs a global system diagnosis with SGC v3.5 criteria.
     */
    async diagnose() {
        const checks = [
            await this.checkSchemaVsRegistry(),
            await this.checkRegistryVsMasters(),
            await this.checkDatasetHealth(),
            await this.checkLogAnalysis(),
            await this.checkVersionConsistency(),
            await this.checkI18nHealth()
        ];

        const allIssues = checks.flatMap(c => c.issues);
        const criticalCount = allIssues.filter(i => i.severity === 'ERROR').length;
        const warningCount = allIssues.filter(i => i.severity === 'WARNING').length;
        const infoCount = allIssues.filter(i => i.severity === 'INFO').length;

        const healthScore = this.calculateHealthScore(allIssues);
        const groupedIssues = this.groupIssuesAdvanced(allIssues);

        const report = {
            system_status: criticalCount > 0 ? 'ERROR' : (warningCount > 0 ? 'WARNING' : 'OK'),
            timestamp: new Date().toISOString(),
            data_schema_version: DATA_SCHEMA_VERSION,
            sgc_version: SGC_VERSION,
            health_score: healthScore,
            grouped_issues: groupedIssues,
            summary: {
                total_checks: checks.length,
                total_issues: allIssues.length,
                critical: criticalCount,
                warning: warningCount,
                info: infoCount
            },
            checks
        };

        // Active Alerts & Events (Trigger external notifications if necessary)
        const channels = await doctorAlert.processAlerts(report);
        const events = this.generateEvents(report, channels);
        report.events = events;

        // Persist to history (AI-Ready structured logs)
        await this.persistResult(report);

        return report;
    }

    /**
     * HEALTH SCORE CALCULATION
     * ERROR = -20 | WARNING = -5 | INFO = -1
     */
    calculateHealthScore(allIssues) {
        let penalty = 0;
        allIssues.forEach(issue => {
            if (issue.severity === 'ERROR') penalty += 20;
            else if (issue.severity === 'WARNING') penalty += 5;
            else if (issue.severity === 'INFO') penalty += 1;
        });
        return Math.max(0, 100 - penalty);
    }

    /**
     * ADVANCED GROUPING (v3.4)
     * Groups counts and max severity per module.
     */
    groupIssuesAdvanced(allIssues) {
        const groups = {};
        allIssues.forEach(issue => {
            const mod = issue.module || 'global';
            if (!groups[mod]) {
                groups[mod] = { count: 0, severity: 'INFO' };
            }
            groups[mod].count++;
            
            // Priority: ERROR > WARNING > INFO
            if (issue.severity === 'ERROR') {
                groups[mod].severity = 'ERROR';
            } else if (issue.severity === 'WARNING' && groups[mod].severity !== 'ERROR') {
                groups[mod].severity = 'WARNING';
            }
        });
        return groups;
    }

    /**
     * RESOLVE DOCTOR CONFIG (v3.5.0)
     * Priority: DB (SystemSettings) > ENV > hardcoded
     */
    async getDoctorConfig() {
        const db = await prisma.systemSettings.findFirst({ orderBy: { createdAt: 'desc' } });
        
        let config = {
            enabled: db?.doctorAlertEnabled ?? (process.env.DOCTOR_ALERT_EMAIL_ENABLED === 'true' || !!process.env.DOCTOR_ALERT_WEBHOOK_URL),
            threshold_warning: db?.doctorThresholdWarning ?? parseInt(process.env.DOCTOR_ALERT_THRESHOLD_WARNING || '90'),
            threshold_error: db?.doctorThresholdError ?? parseInt(process.env.DOCTOR_ALERT_THRESHOLD_ERROR || '70'),
            cooldown_min: db?.doctorCooldownMin ?? parseInt(process.env.DOCTOR_ALERT_COOLDOWN_MIN || '15'),
            webhook_url: db?.doctorWebhookUrl ?? process.env.DOCTOR_ALERT_WEBHOOK_URL
        };

        // Fallback Seguro (v3.5.0 Hardening)
        const defaults = { warning: 90, error: 70, cooldown: 15 };
        
        if (config.threshold_warning < 0 || config.threshold_warning > 100) {
            console.warn(`[DOCTOR_CONFIG] Invalid Warning Threshold (${config.threshold_warning}). Using default: ${defaults.warning}`);
            config.threshold_warning = defaults.warning;
        }

        if (config.threshold_error < 0 || config.threshold_error > 100) {
            console.warn(`[DOCTOR_CONFIG] Invalid Error Threshold (${config.threshold_error}). Using default: ${defaults.error}`);
            config.threshold_error = defaults.error;
        }

        if (config.threshold_error >= config.threshold_warning) {
            console.warn(`[DOCTOR_CONFIG] Consistency Error (Error >= Warning). Resetting to defaults.`);
            config.threshold_warning = defaults.warning;
            config.threshold_error = defaults.error;
        }

        if (config.cooldown_min < 1) {
            console.warn(`[DOCTOR_CONFIG] Invalid Cooldown (${config.cooldown_min}). Using default: ${defaults.cooldown}`);
            config.cooldown_min = defaults.cooldown;
        }

        return config;
    }

    /**
     * EVENT SYSTEM (v3.5 — AI READY)
     * Detects health drops and records sent alerts.
     */
    async generateEvents(report, notifiedChannels = []) {
        const events = [];
        const config = await this.getDoctorConfig();
        const { threshold_warning, threshold_error } = config;

        if (report.health_score < threshold_error) {
            events.push({
                type: "HEALTH_CRITICAL",
                severity: "ERROR",
                message: `Puntaje de salud en nivel crítico: ${report.health_score}%`,
                timestamp: report.timestamp,
                alerts_sent: notifiedChannels
            });
            console.error(`🚨 [DOCTOR CRITICAL]: Health score is ${report.health_score}%`);
        } else if (report.health_score < threshold_warning) {
            events.push({
                type: "HEALTH_DROP",
                severity: "WARNING",
                message: `Puntaje de salud bajo parámetros normales: ${report.health_score}%`,
                timestamp: report.timestamp,
                alerts_sent: notifiedChannels
            });
            console.warn(`⚠️ [DOCTOR WARNING]: Health score is ${report.health_score}%`);
        }
        return events;
    }

    /**
     * Persists diagnostic result (Immutable).
     */
    async persistResult(report) {
        try {
            await prisma.systemDoctorLog.create({
                data: {
                    status: report.system_status,
                    schemaVersion: report.data_schema_version,
                    reportJson: JSON.stringify(report),
                    summary: JSON.stringify({ 
                        ...report.summary, 
                        health_score: report.health_score,
                        grouped_issues: report.grouped_issues 
                    })
                }
            });
        } catch (error) {
            console.error("[DOCTOR_LOG_ERROR]:", error);
        }
    }

    /**
     * Check A: SCHEMA vs REGISTRY
     */
    async checkSchemaVsRegistry() {
        const issues = [];
        for (const [key, config] of Object.entries(registry)) {
            if (!config.model) {
                issues.push({ type: 'mapping', severity: 'WARNING', module: key, message: `Módulo '${key}' no define un modelo Prisma.`, action: "Definir campo 'model' en registry.js." });
            }
            if (!config.fields || config.fields.length === 0) {
                issues.push({ type: 'mapping', severity: 'ERROR', module: key, message: `Módulo '${key}' no tiene mapeo de campos.`, action: "Configurar arreglo 'fields' en registry.js." });
            }
        }
        return { name: "SCHEMA_ALIGNMENT", description: "Checking sync between Prisma models and Registry", severity: issues.some(i => i.severity === 'ERROR') ? 'ERROR' : (issues.length > 0 ? 'WARNING' : 'OK'), issues };
    }

    /**
     * Check B: REGISTRY vs MASTER_MODULES
     */
    async checkRegistryVsMasters() {
        const issues = [];
        const registryKeys = Object.keys(registry);
        MASTER_MODULES.forEach(m => {
            if (!registryKeys.includes(m)) {
                issues.push({ type: 'system', severity: 'ERROR', module: m, message: `'${m}' está en la lista cañónica pero no en el Registry.`, action: "Agregar definición de mapping." });
            }
        });
        return { name: "MASTER_DEFINITION", description: "Alignment between Canonical Masters and Registry", severity: issues.length > 0 ? 'ERROR' : 'OK', issues };
    }

    /**
     * Check C: DATASET CHECK
     */
    async checkDatasetHealth() {
        const issues = [];
        try {
            const logs = await prisma.massUploadLog.findMany({ where: { status: 'success' }, select: { datasetHash: true } });
            const hashes = logs.map(l => l.datasetHash).filter(Boolean);
            const uniqueHashes = new Set(hashes);
            if (hashes.length > uniqueHashes.size) {
                issues.push({ type: 'data', severity: 'WARNING', module: 'mass_upload', message: `Se detectaron ${hashes.length - uniqueHashes.size} datasets idénticos cargados exitosamente.`, action: "Verificar duplicados." });
            }
        } catch (e) {
            issues.push({ type: 'system', severity: 'ERROR', module: 'mass_upload', message: 'Falla al acceder a logs de carga.', action: 'Verificar tabla.' });
        }
        return { name: "DATASET_HEALTH", description: "Data deduplication and hashing integrity", severity: issues.some(i => i.severity === 'ERROR') ? 'ERROR' : (issues.some(i => i.severity === 'WARNING') ? 'WARNING' : 'OK'), issues };
    }

    /**
     * Check D: LOG ANALYSIS
     */
    async checkLogAnalysis() {
        const issues = [];
        try {
            const recentLogs = await prisma.massUploadLog.findMany({ take: 100, orderBy: { timestamp: 'desc' } });
            const totalErrors = recentLogs.reduce((acc, log) => {
                try {
                    const logs = JSON.parse(log.summaryJson || '{}');
                    return acc + (logs.metrics?.total_errors || 0);
                } catch (e) { return acc; }
            }, 0);
            if (totalErrors > 50) {
                issues.push({ type: 'system', severity: 'WARNING', module: 'mass_upload', message: `Alta tasa de errores en las últimas 100 cargas (${totalErrors} errores).`, action: "Analizar logs." });
            }
        } catch (e) {}
        return { name: "EXECUTION_ANALYTICS", description: "Conflict trends analysis", severity: issues.length > 0 ? 'WARNING' : 'OK', issues };
    }

    /**
     * Check E: VERSION CHECK
     */
    async checkVersionConsistency() {
        const issues = [];
        if (DATA_SCHEMA_VERSION !== '3.2.0') {
            issues.push({ type: 'system', severity: 'ERROR', module: 'core', message: `Versión de esquema (${DATA_SCHEMA_VERSION}) desalineada con v3.2.0.`, action: "Actualizar masterModules.js." });
        }
        return { name: "SYSTEM_VERSION", description: "Standard version alignment", severity: issues.length > 0 ? 'ERROR' : 'OK', issues };
    }

    /**
     * Check F: I18N HEALTH
     */
    async checkI18nHealth() {
        const issues = [];
        const i18nPath = path.join(__dirname, '../../../frontend/src/i18n/es.ts');
        try {
            if (!fs.existsSync(i18nPath)) {
                issues.push({ type: 'system', severity: 'ERROR', module: 'i18n', message: 'Archivo es.ts no encontrado.', action: 'Restaurar archivo.' });
            } else {
                const buffer = fs.readFileSync(i18nPath);
                if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
                    issues.push({ type: 'system', severity: 'ERROR', module: 'i18n', message: 'Archivo es.ts contiene BOM.', action: 'Guardar sin BOM.' });
                }
                if (!buffer.toString('utf8').includes('export const es =')) {
                    issues.push({ type: 'system', severity: 'ERROR', module: 'i18n', message: 'Estructura de es.ts dañada.', action: 'Verificar sintaxis.' });
                }
            }
        } catch (e) {
            issues.push({ type: 'system', severity: 'ERROR', module: 'i18n', message: `Falla al leer I18N: ${e.message}`, action: 'Verificar permisos.' });
        }
        return { name: "I18N_HEALTH", description: "Localization files integrity", severity: issues.length > 0 ? 'ERROR' : 'OK', issues };
    }

    /**
     * Fetches historical logs (Read only, limited to 50).
     */
    async getHistory() {
        const rawHistory = await prisma.systemDoctorLog.findMany({
            orderBy: { timestamp: 'desc' },
            take: 50
        });

        return rawHistory.map(log => {
            let summary = {};
            try { summary = JSON.parse(log.summary); } catch(e) {}
            return {
                id: log.id,
                timestamp: log.timestamp,
                status: log.status,
                health_score: summary.health_score || 0,
                metrics: {
                    critical: summary.critical || 0,
                    warning: summary.warning || 0,
                    info: summary.info || 0
                }
            };
        });
    }
}

module.exports = new SystemDoctorService();

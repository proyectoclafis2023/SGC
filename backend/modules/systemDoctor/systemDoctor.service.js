const { PrismaClient } = require('@prisma/client');
const registry = require('../../core/mapping/registry');
const { MASTER_MODULES, DATA_SCHEMA_VERSION } = require('../../config/masterModules');
const prisma = new PrismaClient();

class SystemDoctorService {
    /**
     * Performs a global system diagnosis with issue classification and historical logging.
     */
    async diagnose() {
        const checks = [
            await this.checkSchemaVsRegistry(),
            await this.checkRegistryVsMasters(),
            await this.checkDatasetHealth(),
            await this.checkLogAnalysis(),
            await this.checkVersionConsistency()
        ];

        const allIssues = checks.flatMap(c => c.issues);
        const criticalCount = allIssues.filter(i => i.severity === 'ERROR').length;
        const warningCount = allIssues.filter(i => i.severity === 'WARNING').length;
        const infoCount = allIssues.filter(i => i.severity === 'INFO').length;

        const report = {
            system_status: criticalCount > 0 ? 'ERROR' : (warningCount > 0 ? 'WARNING' : 'OK'),
            timestamp: new Date().toISOString(),
            data_schema_version: DATA_SCHEMA_VERSION,
            summary: {
                total_checks: checks.length,
                total_issues: allIssues.length,
                critical: criticalCount,
                warning: warningCount,
                info: infoCount
            },
            checks
        };

        // Persist to history
        await this.persistResult(report);

        return report;
    }

    /**
     * Persists the diagnostic result to the database for historical traceability.
     */
    async persistResult(report) {
        try {
            await prisma.systemDoctorLog.create({
                data: {
                    status: report.system_status,
                    schemaVersion: report.data_schema_version,
                    reportJson: JSON.stringify(report),
                    summary: JSON.stringify(report.summary)
                }
            });
        } catch (error) {
            console.error("[DOCTOR_LOG_ERROR]: Failed to persist diagnostic history.", error);
        }
    }

    /**
     * Check A: SCHEMA vs REGISTRY
     */
    async checkSchemaVsRegistry() {
        const issues = [];
        const modelsInRegistry = Object.values(registry).map(m => m.model);
        const uniqueModels = [...new Set(modelsInRegistry)];

        for (const [key, config] of Object.entries(registry)) {
            if (!config.model) {
                issues.push({
                    type: 'mapping',
                    severity: 'WARNING',
                    module: key,
                    message: `Módulo '${key}' no define un modelo Prisma.`,
                    action: "Definir campo 'model' en registry.js o limpiar entrada."
                });
            }
            if (!config.fields || config.fields.length === 0) {
                issues.push({
                    type: 'mapping',
                    severity: 'ERROR',
                    module: key,
                    message: `Módulo '${key}' no tiene mapeo de campos.`,
                    action: "Configurar arreglo 'fields' en registry.js."
                });
            }
        }

        return {
            name: "SCHEMA_ALIGNMENT",
            description: "Checking sync between Prisma models and Registry mapping keys",
            severity: issues.some(i => i.severity === 'ERROR') ? 'ERROR' : (issues.length > 0 ? 'WARNING' : 'OK'),
            issues
        };
    }

    /**
     * Check B: REGISTRY vs MASTER_MODULES
     */
    async checkRegistryVsMasters() {
        const issues = [];
        const registryKeys = Object.keys(registry);

        MASTER_MODULES.forEach(m => {
            if (!registryKeys.includes(m)) {
                issues.push({
                    type: 'system',
                    severity: 'ERROR',
                    module: m,
                    message: `'${m}' está en la lista cañónica pero no en el Registry.`,
                    action: "Agregar definición de mapping para este maestro en registry.js."
                });
            }
        });

        return {
            name: "MASTER_DEFINITION",
            description: "Alignment between Canonical Master list and Registry",
            severity: issues.length > 0 ? 'ERROR' : 'OK',
            issues
        };
    }

    /**
     * Check C: DATASET CHECK
     */
    async checkDatasetHealth() {
        const issues = [];
        const logs = await prisma.massUploadLog.findMany({
            where: { status: 'success' },
            select: { datasetHash: true }
        });

        const hashes = logs.map(l => l.datasetHash).filter(Boolean);
        const uniqueHashes = new Set(hashes);

        if (hashes.length > uniqueHashes.size) {
            issues.push({
                type: 'data',
                severity: 'WARNING',
                module: 'mass_upload',
                message: `Se detectaron ${hashes.length - uniqueHashes.size} datasets idénticos cargados exitosamente.`,
                action: "Verificar si hay procesos duplicados o si la deduplicación falló."
            });
        }

        issues.push({
            type: 'system',
            severity: 'INFO',
            module: 'mass_upload',
            message: `Capacidad de deduplicación activa para ${hashes.length} registros exitosos.`,
            action: "Mantener monitoreo de hashes SHA-256."
        });

        return {
            name: "DATASET_HEALTH",
            description: "Data deduplication and hashing integrity",
            severity: issues.some(i => i.severity === 'ERROR') ? 'ERROR' : (issues.some(i => i.severity === 'WARNING') ? 'WARNING' : 'OK'),
            issues
        };
    }

    /**
     * Check D: LOG ANALYSIS
     */
    async checkLogAnalysis() {
        const issues = [];
        const recentLogs = await prisma.massUploadLog.findMany({
            take: 100,
            orderBy: { timestamp: 'desc' }
        });

        const totalErrors = recentLogs.reduce((acc, log) => {
            try {
                const logs = JSON.parse(log.summaryJson);
                return acc + (logs.metrics?.total_errors || 0);
            } catch (e) { return acc; }
        }, 0);

        if (totalErrors > 50) {
            issues.push({
                type: 'system',
                severity: 'WARNING',
                module: 'mass_upload',
                message: `Alta tasa de errores en las últimas 100 cargas (${totalErrors} errores).`,
                action: "Analizar logs de validación para identificar campos conflictivos."
            });
        }

        return {
            name: "EXECUTION_ANALYTICS",
            description: "Conflict trends and error hotspots analysis",
            severity: issues.length > 0 ? 'WARNING' : 'OK',
            issues
        };
    }

    /**
     * Check E: VERSION CHECK
     */
    async checkVersionConsistency() {
        const issues = [];
        if (DATA_SCHEMA_VERSION !== '3.1.0') {
            issues.push({
                type: 'system',
                severity: 'ERROR',
                module: 'core',
                message: `Versión de esquema detectada (${DATA_SCHEMA_VERSION}) no coincide con el estándar v3.1.0.`,
                action: "Actualizar DATA_SCHEMA_VERSION en masteModules.js si el cambio fue planeado."
            });
        }

        return {
            name: "SYSTEM_VERSION",
            description: "Validation of Data Schema Version alignment",
            severity: issues.length > 0 ? 'ERROR' : 'OK',
            issues
        };
    }

    /**
     * Fetches historical logs of system diagnostics.
     */
    async getHistory() {
        return await prisma.systemDoctorLog.findMany({
            orderBy: { timestamp: 'desc' },
            take: 20
        });
    }
}

module.exports = new SystemDoctorService();

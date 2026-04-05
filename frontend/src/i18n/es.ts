/**
 * DICCIONARIO DE LOCALIZACIÓN (SGC I18N)
 * Traducciones oficiales del sistema para consistencia de marca.
 */

export const es = {
    // Estado del Diagnóstico
    system_status: "Estado Global del Sistema",
    system_status_ok: "OK",
    system_status_warning: "ADVERTENCIA",
    system_status_error: "FALLA CRÍTICA",

    // Categorías de Chequeo
    schema_alignment: "Alineación de Esquema",
    master_definition: "Definición de Maestros",
    dataset_health: "Salud del Dataset",
    execution_analytics: "Análisis de Ejecuciones",
    system_version: "Versión del Sistema",

    // Descripciones
    schema_alignment_desc: "Simetría entre modelos Prisma y Registry",
    master_definition_desc: "Verificación de la lista canónica de maestros",
    dataset_health_desc: "Integridad de hashes y deduplicación",
    execution_analytics_desc: "Detección de hotspots y conflictos de datos",
    system_version_desc: "Integridad de la versión estructural (v3.2.0)",
    i18n_health: "Salud de Localización",
    i18n_health_desc: "Verificación de encoding y estructura del diccionario",

    // Métricas
    health_score: "Calificación de Salud",
    checks_performed: "Chequeos Realizados",
    system_health_status: "Estado de Salud",
    health_trend: "Tendencia de Salud",
    performance_history: "Historial de Rendimiento",
    global_dashboard: "Dashboard Global",
    top_modules: "Módulos con más Incidencias",
    no_history: "Sin historial suficiente",

    // Severidades e Issues
    severity_info: "INFO",
    severity_warning: "ADVERTENCIA",
    severity_error: "ERROR",
    info_hidden_msg: "Se ocultaron registros informativos.",
    show_info: "Ver Detalles Completos",

    // Acciones y Mensajes
    ok_status: "Sistema en cumplimiento total",
    warning_status: "Se detectaron advertencias estructurales",
    error_status: "Se detectaron fallas críticas en el core",
    action_required: "Acción Recomendada",
    module_label: "Módulo afectado",
    type_label: "Categoría",

    // Header y Reporte
    doctor_report_title: "Reporte SGC Doctor",
    checks_label: "Chequeos",
    critical_label: "Críticos",
    alerts_label: "Alertas",
    info_label: "Info",
    last_log: "Último Diagnóstico",
    new_diagnosis: "Nuevo Diagnóstico",
    retry_diagnosis: "Reintentar Diagnóstico",

    // Onboarding
    ai_protocol_active: "Protocolo AI Onboarding Activo",
    ai_protocol_desc: "Arquitectura canónica validada para asistentes de IA.",
    onboarding_mode: "Modo: Registry Driven Architecture"
};

/**
 * HELPER DE TRADUCCIÓN (SGC t-engine — HARDENED v3.3)
 */
export const t = (key: string): string => {
    try {
        if (!es) return key;
        return (es as any)[key] || key;
    } catch (e) {
        console.error("❌ I18N ERROR [CRITICO]:", e);
        return key;
    }
};

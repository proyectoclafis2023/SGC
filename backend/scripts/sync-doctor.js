/**
 * AUTOMATIC SGC DOCTOR SYNC HOOK
 * Triggered after schema changes to ensure structural integrity.
 */

const SystemDoctorService = require('../modules/systemDoctor/systemDoctor.service');

async function run() {
    console.log("🔍 SGC DOCTOR: Iniciando diagnóstico post-sincronización...");
    try {
        const report = await SystemDoctorService.diagnose();
        console.log(`[STATUS]: ${report.system_status}`);
        console.log(`[VERSION]: v${report.data_schema_version}`);
        
        if (report.system_status === 'ERROR') {
            console.error("❌ SE DETECTARON FALLAS CRÍTICAS. REVISAR DASHBOARD /system-doctor.");
            process.exit(1);
        } else {
            console.log("✅ SISTEMA EN CUMPLIMIENTO.");
            process.exit(0);
        }
    } catch (e) {
        console.error("❌ FALLA AL EJECUTAR DOCTOR:", e);
        process.exit(1);
    }
}

run();

const SystemDoctorService = require('./systemDoctor.service');

class SystemDoctorController {
    /**
     * Endpoint for global system diagnostic.
     * Accessible to super_admin or users with mass_upload:execute permission.
     */
    async diagnose(req, res) {
        try {
            const report = await SystemDoctorService.diagnose();

            // HTTP 200 even with issues, as the diagnostic itself was successful.
            return res.status(200).json({
                success: true,
                ...report
            });
        } catch (error) {
            console.error("[DOCTOR_ENDPOINT_ERROR]:", error);
            return res.status(500).json({
                success: false,
                error: "Falla crítica en el motor de diagnóstico (SGC Doctor).",
                details: error.message
            });
        }
    }

    /**
     * Endpoint for system diagnostic history.
     */
    async getHistory(req, res) {
        try {
            const history = await SystemDoctorService.getHistory();
            return res.status(200).json({ success: true, history });
        } catch (error) {
            console.error("[DOCTOR_HISTORY_ERROR]:", error);
            return res.status(500).json({ success: false, error: "Error al recuperar el historial de diagnósticos." });
        }
    }
}

module.exports = new SystemDoctorController();

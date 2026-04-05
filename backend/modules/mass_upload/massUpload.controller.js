const MassUploadService = require('./massUpload.service');
// 1. Prisma is needed here too
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class MassUploadController {
  /**
   * Endpoint for dry run of mass upload.
   * Handles multi-sheet parsing, mapping, and global validation summary response.
   * @param {Object} req - The Express request object.
   * @param {Object} res - The Express response object.
   */
  async dryRun(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No se encontró el archivo para la simulación."
        });
      }

      const options = {
        autoFix: req.body.auto_fix === 'true' || req.query.auto_fix === 'true'
      };

      const summary = await MassUploadService.dryRun(req.file.buffer, options);

      return res.status(200).json({
        success: true,
        ...summary
      });
    } catch (error) {
      console.error("Error in mass upload dry-run:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Error al procesar la simulación de carga."
      });
    }
  }

  /**
   * Endpoint for actual execution of mass upload.
   * State-aware: can receive the original file OR a JSON dataset from the UI.
   * @param {Object} req - The Express request object.
   * @param {Object} res - The Express response object.
   */
  async execute(req, res) {
    try {
      const options = {
        strictMode: req.body.strict_mode === 'true' || req.query.strict_mode === 'true',
        skipDryRun: req.body.skip_dry_run === 'true' || req.query.skip_dry_run === 'true',
        autoFix: req.body.auto_fix === 'true' || req.query.auto_fix === 'true',
        forceDuplicate: req.body.force_duplicate === 'true' || req.query.force_duplicate === 'true',
        userId: req.user ? req.user.id : null
      };

      let result;

      // Check if dataset is reaching as JSON payload or multipart data
      const uiDataset = req.body.dataset || req.body.data;

      if (uiDataset) {
        // UI-Controlled Execution (Data aware)
        const allMappedData = typeof uiDataset === 'string' ? JSON.parse(uiDataset) : uiDataset;
        result = await MassUploadService.executeData(allMappedData, options);
      } else if (req.file) {
        // Classic File Execution
        result = await MassUploadService.execute(req.file.buffer, options);
      } else {
        return res.status(400).json({
          success: false,
          error: "No se proporcionaron datos ni archivo para la ejecución de carga masiva."
        });
      }

      return res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error("Error in state-aware execution:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Error crítico durante la persistencia de datos orientada a estado."
      });
    }
  }

  /**
   * Endpoint for individual module export.
   */
  async exportIndividual(req, res) {
    try {
      const { module } = req.params;
      const buffer = await MassUploadService.exportModule(module);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=export_${module}.xlsx`);
      return res.end(buffer);
    } catch (error) {
      console.error("Error exporting individual module:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Endpoint for consolidated multi-sheet export.
   */
  async exportAll(req, res) {
    try {
      const buffer = await MassUploadService.exportAll();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=export_consolidado_sgc.xlsx`);
      return res.end(buffer);
    } catch (error) {
      console.error("Error exporting consolidated data:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Endpoint for fetching mass upload session logs.
   * @param {Object} req - The Express request object.
   * @param {Object} res - The Express response object.
   */
  async getLogs(req, res) {
    try {
      const logs = await prisma.massUploadLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: 50
      });

      return res.status(200).json({
        success: true,
        data: logs
      });
    } catch (error) {
      console.error("Error fetching mass upload logs:", error);
      return res.status(500).json({
        success: false,
        error: "Error al recuperar el historial de cargas."
      });
    }
  }
}

module.exports = new MassUploadController();

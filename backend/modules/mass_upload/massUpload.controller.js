const MassUploadService = require('./massUpload.service');

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

      const summary = await MassUploadService.dryRun(req.file.buffer);

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
   * Only persists data if dry run is 100% successful.
   * @param {Object} req - The Express request object.
   * @param {Object} res - The Express response object.
   */
  async execute(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No se encontró el archivo para la ejecución de carga real."
        });
      }

      const result = await MassUploadService.execute(req.file.buffer);

      return res.status(200).json(result);
    } catch (error) {
      console.error("Error in mass upload execute:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Error crítico durante la ejecución de la carga masiva."
      });
    }
  }
}

module.exports = new MassUploadController();

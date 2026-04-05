const MassUploadService = require('./massUpload.service');

class MassUploadController {
  /**
   * Endpoint for dry run of mass upload.
   * Handles multi-sheet parsing and summary response.
   * @param {Object} req - The Express request object.
   * @param {Object} res - The Express response object.
   */
  async dryRun(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No se encontró el archivo."
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
        error: "Hubo un problema al procesar el archivo. Por favor, asegúrese de que el formato sea correcto."
      });
    }
  }
}

module.exports = new MassUploadController();

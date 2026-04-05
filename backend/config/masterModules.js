/**
 * CANONICAL MASTER MODULES DEFINITION — SGC v3.1.0
 * Establishing the single source of truth for the SGC Data Platform.
 */

const MASTER_MODULES = [
  "torres",
  "tipos_unidad",
  "unidades",
  "estacionamientos",
  "espacios",
  "propietarios",
  "residentes",
  "personal",
  "afps",
  "previsiones",
  "bancos",
  "articulos_personal",
  "maestro_categorias_articulos",
  "emergencias"
];

const DATA_SCHEMA_VERSION = "3.2.0";
const SGC_VERSION = "3.3.0";

module.exports = {
  MASTER_MODULES,
  DATA_SCHEMA_VERSION,
  SGC_VERSION
};

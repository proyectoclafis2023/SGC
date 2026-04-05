# MASTER PROMPT SGC

SISTEMA SGC v2.2.6 – CONTEXTO OPERATIVO

Estás trabajando sobre el sistema SGC.

---

FUENTES DE VERDAD (OBLIGATORIAS):

1. **AI Core Context**: 
   /docs/ai/sgc-core-context.md (Fuente de verdad unificada)

2. **Listado de Módulos**:
   /docs/architecture/sgc-modules-full.txt

3. **Interaction Guard**:
   /docs/architecture/prompts/00-interaction-guard.md

---

REGLA DE USO DE CONTEXTO (CRÍTICA):

Antes de cualquier análisis o acción:

* Leer todos los archivos anteriores
* Usarlos como única base de decisión

Si existe contradicción:

* Priorizar archivos de arquitectura

---

INTERACCIÓN CON USUARIO (OBLIGATORIO):

Antes de ejecutar cualquier acción:

* Validar que el input cumpla estructura SGC
* Si no cumple:

  * NO ejecutar
  * Solicitar reformulación
  * Entregar ejemplo correcto

Nunca asumir contexto faltante
Nunca inferir módulo sin confirmación

---

INTERPRETACIÓN:

* sgc-modules-full.txt → define QUÉ módulos existen
* sgc-module-standard.md → define CÓMO deben construirse
* sgc-context.md → define estado actual del sistema
* interaction-guard.md → define cómo interactuar

---

REGLAS ABSOLUTAS:

* NO inventar módulos, códigos ni rutas
* NO modificar nombres del archivo de módulos
* TODO módulo debe cumplir el estándar
* UI-first: todo campo visual debe existir en BD
* Backend-driven: lógica en servidor, no en frontend
* Campos complejos → String con sufijo Json
* Serialización obligatoria (JSON.stringify / JSON.parse)
* Compatibilidad total con 8.1.0 (Carga Masiva)
* No duplicar lógica entre capas

---

MODOS DE OPERACIÓN:

---

MODO: ANALIZAR

Entrada:
MODULO: X.X.X

Salida:

* Estado (COMPLETO / PARCIAL / NO EXISTE)
* UI / API / BD / 8.1.0
* Problemas detectados

---

MODO: MIGRAR

Entrada:
MODULO: X.X.X

Acción:

* Alinear UI ↔ API ↔ BD
* Completar CRUD
* Corregir rutas
* Implementar serialización JSON
* Integrar con 8.1.0

---

MODO: CREAR

Entrada:
MODULO: X.X.X

Acción:

* Crear modelo Prisma según estándar
* Crear API (CRUD + JSON)
* Crear UI (formulario completo)
* Integrar con carga masiva

---

MODO: AUDITORIA

Acción:

* Revisar TODOS los módulos

* Detectar:

  * desalineaciones
  * campos faltantes
  * errores JSON
  * endpoints faltantes

* Clasificar:

  * OK
  * PARCIAL
  * CRÍTICO

---

MODO: AUTO-FIX

Acción:

* Generar plan de corrección para módulos PARCIALES o CRÍTICOS
* Estandarizar:

  * BD
  * API
  * Serialización
  * Carga masiva

---

MODO: DOCUMENTAR

Acción:

* Actualizar:
  /docs/ai/sgc-core-context.md

Reglas:

* No modificar contenido existente
* Solo agregar nuevas entradas (append-only)
* Registrar fecha y detalle

---

VALIDACIONES OBLIGATORIAS:

* UI = BD (1:1)
* API funcional
* JSON correcto
* Compatible con 8.1.0
* Permite crear registros

---

REGLA FINAL:

NO avanzar de módulo sin cerrarlo completamente.

---

EJECUCIÓN:

Indicar:

MODO: [ANALIZAR | MIGRAR | CREAR | AUDITORIA | AUTO-FIX | DOCUMENTAR]

Si aplica:

MODULO: X.X.X

# 🧠 SGC – CORE CONTEXT (AI Knowledge Base)

## 1. DESCRIPCIÓN DEL SISTEMA
SGC (Sistema de Gestión de Condominios) es una solución integral para la administración de edificios y condominios. Su arquitectura está diseñada para ser modular, consistente y altamente automatizada, permitiendo la gestión financiera, operativa y comunitaria bajo un estándar técnico riguroso.

---

## 🔒 Fuente de Verdad Unificada
Este archivo constituye la **única fuente de verdad** para cualquier interacción con IA dentro del sistema SGC. Todas las decisiones, análisis, generación de código y ejecución de tareas deben basarse exclusivamente en este documento.

**Queda estrictamente prohibido:**
* Inferir reglas fuera de este contexto.
* Utilizar fuentes externas no definidas en este archivo.
* Asumir comportamientos no documentados.

> [!IMPORTANT]
> En caso de conflicto entre fuentes, **prevalece siempre este documento**.

---

## 📐 Relación con el Estándar Técnico
Este documento consolida y abstrae las reglas del sistema SGC para su uso por asistentes de IA. Las definiciones técnicas detalladas en `/docs/architecture/sgc-module-standard.md` (incluyendo estructura de módulos, contratos de API y convenciones de BD) se mantienen como la referencia formal del desarrollo.

Este archivo **NO reemplaza** el estándar técnico, sino que lo sintetiza y lo hace operativo para la interacción con IA.

> [!NOTE]
> En caso de duda técnica específica o estructural, la fuente de verdad definitiva es [sgc-module-standard.md](/docs/architecture/sgc-module-standard.md).

---

## 2. PRINCIPIOS DEL SISTEMA
* **UI-First**: Todo campo visible en la interfaz de usuario DEBE existir en la base de datos.
* **Backend-Driven**: La lógica de negocio y las validaciones residen exclusivamente en el servidor.
* **No Duplicidad**: Prohibido duplicar lógica entre capas (BD, API, UI).
* **Carga Masiva (8.x.x)**: El motor de carga masiva es la fuente principal de datos para la expansión del sistema y el despliegue inicial.

---

## 3. TRIPLE ALIANZA (DATOS)
El sistema gestiona tres formatos de datos distintos que deben sincronizarse mediante el motor de mapping:
* **Excel / Usuario**: español (ej: `nombres`, `apellidos`)
* **API / Contratos**: `snake_case` (ej: `first_names`, `last_names`)
* **DB / Prisma**: `camelCase` (ej: `firstNames`, `lastNames`)

---

## 4. ARQUITECTURA DEL SISTEMA
* **Modelos (Prisma)**: PascalCase para modelos, camelCase para campos. Campos obligatorios: `id`, `isArchived`, `createdAt`.
* **API (Express)**: Endpoints estandarizados `/api/{modulo_plural_snake_case}`. CRUD completo (GET, POST, PUT, DELETE).
* **Frontend (React/Vite)**: Binding directo sin transformaciones manuales (adapters).
* **Endpoints Estándar**:
    * `GET /api/{modulo}`: Registros no archivados.
    * `POST /api/{modulo}`: Creación con `requestMapper`.
    * `PUT /api/{modulo}/:id`: Actualización con `requestMapper`.
    * `DELETE /api/{modulo}/:id`: Soft delete (`isArchived: true`).
    * `POST /api/{modulo}/upload`: Carga masiva (Dry Run / Real).

---

## 🌐 Convención de Rutas UI
El sistema SGC utiliza una separación semántica estricta entre el frontend y el backend:

### 1. Idioma y Formato:
* **Frontend (Rutas)**: Siempre en **español** y con palabras separadas por guiones (ej: `/salud-sistema`, `/carga-masiva`).
* **Backend (API)**: Siempre en **inglés** y utilizando `snake_case` (ej: `/api/system-doctor`, `/api/mass-upload`).

### 2. Consistencia y Compatibilidad:
* Toda ruta nueva debe ser en español.
* Al renombrar rutas, se deben mantener redirecciones (`Navigate replace`) para asegurar la compatibilidad con bookmarks previos.
* Los nombres de las rutas deben ser descriptivos del módulo (ej: `/personal` en lugar de `/employees`).

---

## 5. MOTOR DE MAPPING (CRÍTICO)
Todas las operaciones de datos DEBEN pasar por la capa de mapeo centralizada en `/core/mapping/registry.js`.

### Funciones Principales:
* **`requestMapper` (Entrada)**: Normaliza datos de Excel (español) o API a formato interno.
* **`mapResponse` (Salida)**: Transforma objetos de BD (camelCase) a formato de API (snake_case).

### 🔗 Flujo Obligatorio:
`Excel → requestMapper → Prisma → mapResponse → UI`

### 🔒 Regla Global Obligatoria:
Todas las operaciones (CRUD, carga masiva, procesos internos) DEBEN respetar este flujo. Está **estrictamente prohibido**:
* Devolver datos en `camelCase` directamente desde Prisma a la API.
* Recibir datos sin pasar por `requestMapper`.
* Transformar campos manualmente en controladores o routers.
* Definir mapping fuera de `registry.js`.

---

## 6. MOTOR DE CARGA MASIVA (8.x.x)
El motor de carga masiva permite la ingesta de datos a gran escala con validación determinística.

### Funciones y Flujo:
1. **DRY RUN**: Validación completa (tipos, relaciones, lógica) sin persistencia. Retorna logs estructurados.
2. **Carga Real**: Persistencia controlada tras validación exitosa.
3. **Logs Estructurados**: Reporte detallado por `fila`, `campo` y `error`.
4. **Resolución Automática**: El motor resuelve relaciones (IDs) automáticamente a partir de nombres o claves únicas.

### 🔗 Flujo Obligatorio:
`Plantilla → DRY RUN → Corrección → Carga Real`

---

## 7. DEPENDENCIAS DEL SISTEMA
Para evitar errores de integridad referencial, el orden de configuración/carga es:
1. **Infraestructura**: Torres, pisos, tipos de unidad.
2. **Maestros Base**: Unidades, áreas comunes, servicios básicos.
3. **Comunidad**: Residentes, propietarios, personal.
4. **Operacional**: Gastos comunes, cobros, multas.

---

## 8. REGLAS GLOBALES DEL SISTEMA
* **No lógica en frontend**: El frontend es puro estado y visualización.
* **No romper mapping**: El ecosistema depende de la consistencia del `registry.js`.
* **No saltarse validaciones**: Toda entrada debe ser validada en el backend.
* **No modificar estructura**: Los 49+ módulos siguen el patrón definido en `sgc-modules-full.txt`.

---

## 9. SEGURIDAD (RBAC)
* **Middleware `authorize`**: Obligatorio en todas las rutas protegidas.
* **Roles**: admin, resident, owner, concierge.
* **Ownership**: Validación de pertenencia del registro antes de modificar/eliminar.

---

## 10. TESTING Y AUTOMATIZACIÓN
* **RBAC Test Runner**: Simulación de tráfico multi-rol para validación de permisos.
* **SGC Doctor**: Auditor de consistencia entre capas (UI/API/BD).
* **Setup Determinístico**: `./setup.sh` garantiza un entorno limpio y funcional.

---

## 11. FLUJO COMPLETO DEL SISTEMA
`UI → API → requestMapper → Prisma → DB → mapResponse → UI`

---

---

## 12. 📦 FLUJO OBLIGATORIO DE RELEASE
Todo cambio significativo en el sistema (estructura, arquitectura, setup, módulos o lógica) debe seguir obligatoriamente este flujo para garantizar la consistencia y trazabilidad:

1. **Incrementar Versión**: Actualizar `package.json` siguiendo SemVer.
2. **Actualizar Changelog**: Registrar los cambios en la sección `## 📦 Changelog` del `README.md`.
3. **Commit de Release**: Realizar un commit con un mensaje claro que indique la versión.
4. **Crear Tag**: Generar un tag de versión (ej: `v2.7.0`) con la descripción correspondiente.
5. **Publicar**: Sincronizar todos los cambios y tags con el repositorio remoto.

### 🔒 Reglas de Versionado
* **Inmutabilidad**: Los tags son inmutables; no se permite sobrescribir versiones existentes.
* **Trazabilidad**: Cada cambio estructural debe generar un incremento de versión.

### 🚫 Prohibiciones
* **Push desordenado**: Prohibido subir cambios estructurales sin el respectivo versionado.
* **Omitir Documentación**: Prohibido crear versiones sin actualizar el changelog.

---

## 13. WORKFLOW IA (CRÍTICO)
* **ChatGPT (Prompt Engineer)**: Diseño de tareas técnicas, validación de lógica y generación de prompts precisos.
* **Antigravity (Coding Assistant)**: Ejecución autónoma de código, modificación del repositorio y validación de arquitectura en tiempo real.

---

> **FRASE FINAL**: Este sistema no depende de quién lo desarrolla, sino de que se respete su estándar.

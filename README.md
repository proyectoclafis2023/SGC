# PSGC - Proyecto de Gestión Comunitaria (Alpha 0.1.0)

Sistema integral para la administración de edificios y condominios, con motor financiero avanzado, control de acceso RBAC, auditoría y pruebas automatizadas.

## 🚀 Funcionalidades Principales
- **Pruebas Automatizadas (RBAC)**: Suite de simulación de tráfico multi-rol para validación de permisos.
- **Motor Financiero**: Cálculo automático de gastos comunes, fondos especiales y reglas de cobro.
- **Ciclo de Pagos**: Registro de abonos por residentes con actualización automática de estado (Parcial/Pagado).
- **Seguridad (RBAC)**: Control de acceso basado en roles (Admin, Residente, Conserje).
- **Autenticación JWT**: Sesiones seguras mediante tokens firmados.
- **Auditoría Activa**: Registro inmutable de acciones críticas y accesos denegados.
- **Arquitectura Canónica**: Naming estandarizado `snake_case` y mapeo global de entidades.

## 🛠️ Requisitos
- Node.js v18+
- SQLite (Integrado)
- Docker & Docker Compose (Opcional para despliegue rápido)

## 📦 Instalación (Modo Manual)

### 1. Clonar el repositorio
```bash
git clone https://github.com/proyectoclafis2023/PSGC.git
cd PSGC
```

### 2. Configuración del Backend
```bash
cd backend
npm install
# Configura .env con JWT_SECRET, ADMIN_PASSWORD y DEFAULT_USER_PASSWORD
npx prisma generate
npx prisma db push
npx prisma db seed
npm run dev
```

### 3. Configuración del Frontend
```bash
cd ../frontend
npm install
npm run dev
```

## 🧪 Scripts y Automatización

El sistema incluye una carpeta `/scripts/testing` con herramientas de validación continua:

### 1. RBAC Test Runner
Simula el comportamiento de diferentes roles (Admin, Residente, Conserje, Propietario) para verificar la seguridad del backend.

- **Ubicación**: `/scripts/testing/rbac-test-runner.js`
- **Ejecución**: `npm run test:rbac` (desde `backend`)
- **Logs**: Resultados detallados en `/logs/rbac-test.log`

Este script valida:
- Login exitoso por rol.
- Acceso a módulos permitidos.
- Bloqueo de accesos no autorizados (403 Forbidden).
- Control de tasa de peticiones (Rate Limiting).

### 2. PSGC Doctor (Auditor de Consistencia)
Herramienta de diagnóstico que valida la alineación canónica entre el Frontend, Backend y la Base de Datos.

- **Ubicación**: `/scripts/sgc-doctor.js`
- **Ejecución**: `node scripts/sgc-doctor.js`
- **Función**: 
  - Escanea los 49+ módulos del sistema.
  - Verifica la existencia de rutas API y componentes UI.
  - Valida el etiquetado `@module` en Prisma.
  - Asegura que los módulos maestros tengan endpoints de `/upload`.
  - Se utiliza como gatekeeper antes de realizar commits críticos.

## 🐳 Docker
```bash
docker-compose up --build
```

## 🔐 Credenciales de Prueba (Demo)
- **Admin**: `gdcuentas@sgc.cl` / `admin123` (Configurable en `.env`)
- **Residente**: `residente@sgc.cl` / `sgc123`
- **Conserje**: `conserje@sgc.cl` / `sgc123`
- **Frontend URL**: `http://localhost:5173`
- **Backend API**: `http://localhost:3001/api`

## 📚 Documentación Técnica

Para mantener la consistencia del sistema, consulte los manuales en `/docs/architecture`:

- **Standard de Módulos**: Rules in [sgc-module-standard.md](./docs/architecture/sgc-module-standard.md) (Nombres, tipos, Soft Delete).
- **Mapping Engine**: Lógica de `registry.js` en [mapping-and-registry-rules.md](./docs/architecture/mapping-and-registry-rules.md).
- **Módulo Canónico**: Ejemplo de referencia en [canonical-module-712.md](./docs/architecture/canonical-module-712.md).
- **Automatización**: Guía detallada de pruebas en [automation.md](./docs/automation.md).

## 🤖 AI / Workflow con Asistentes

Este proyecto está optimizado para trabajar con **Antigravity** (Codificación Directa) y **ChatGPT** (Refinamiento de Prompts).

### 🥇 Paso 1: Configurar ChatGPT como "Prompt Engineer"
Copia y pega el siguiente prompt en una nueva sesión de ChatGPT para darle contexto total del proyecto:

> **Rol:** Actúa como experto en Prompt Engineering para el sistema **PSGC (Alpha 0.1.0)**.
> **Misión:** Redactar tareas técnicas y precisas para que **Antigravity** las ejecute sin romper la arquitectura.
>
> **Reglas de Oro (Innegociables):**
> 1. **Triple Alianza:** API en `snake_case`, DB (Prisma) en `camelCase`, Excel en `español`.
> 2. **Mapping:** NO transformaciones manuales en frontend. Todo en `registry.js` con `requestMapper/mapResponse`.
> 3. **Modelos:** Deben incluir `id`, `isArchived`, `createdAt`. Campos complejos terminan en `Json`.
> 4. **Rutas:** `/api/{modulo_en_plural_snake_case}`.
>
> **Fuentes de Verdad:**
> - `/docs/ai/ai-context.md` (Contexto operativo)
> - `/docs/architecture/sgc-module-standard.md` (Leyes técnicas)
> - `/backend/core/mapping/registry.js` (Estructura de datos)
>
> **Instrucción:** Cada vez que te pida una tarea, genera un prompt para Antigravity que comience con: *"Basado en el estándar de /docs/architecture/, realiza lo siguiente..."*

### 🥈 Paso 2: Trabajar con Antigravity
Una vez que ChatGPT refine tu idea, dale el prompt resultante a Antigravity. Él se encargará de leer los archivos, proponer el código y ejecutarlo siguiendo las reglas del sistema.

### 📚 Documentación Base
- [Contexto AI](/docs/ai/ai-context.md)
- [Estándar de Módulos](/docs/architecture/sgc-module-standard.md)
- [Reglas de Mapeo](/docs/architecture/mapping-and-registry-rules.md)

## 📄 Licencia
Este proyecto es de uso privado para el sistema PSGC.

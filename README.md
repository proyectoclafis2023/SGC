# SGC – Sistema de Gestión de Condominios

Sistema integral para la administración de edificios y condominios, con motor financiero avanzado, control de acceso RBAC, auditoría y pruebas automatizadas.

## 🚀 Funcionalidades Principales

- **Pruebas Automatizadas (RBAC)**: Suite de simulación de tráfico multi-rol para validación de permisos.
- **Motor Financiero**: Cálculo automático de gastos comunes, fondos especiales y reglas de cobro.
- **Ciclo de Pagos**: Registro de abonos por residentes con actualización automática de estado (Parcial/Pagado).
- **Seguridad (RBAC)**: Control de acceso basado en roles (Admin, Residente, Conserje).
- **Autenticación JWT**: Sesiones seguras mediante tokens firmados.
- **Auditoría Activa**: Registro inmutable de acciones críticas y accesos denegados.
- **Arquitectura Canónica**: Naming estandarizado `snake_case` y mapeo global de entidades.

---

## 🛠️ Requisitos

- **Node.js** v18+
- **SQLite** (Integrado)
- **Docker & Docker Compose** (Opcional para despliegue rápido)

---

## 🚀 Inicio Rápido

Para un despliegue automático en menos de 5 minutos, ejecuta:

```bash
git clone https://github.com/proyectoclafis2023/SGC.git
cd SGC
chmod +x setup.sh
./setup.sh
```

El script configurará automáticamente las dependencias, generará secretos de seguridad y preparará la base de datos de manera autónoma.

---

## 🤖 AI ONBOARDING & CONTEXT

Este sistema está diseñado para ser **AI-Native**. Si eres un asistente de IA (Antigravity, Cursor, etc.), debes seguir estas reglas innegociables:

### 1. La Triple Alianza (Data Mapping)
Cualquier entidad del sistema debe fluir a través de tres capas de representación:
*   **EXCEL (Capa Humana)**: Columnas en español (ej: `Nombre de la Torre`).
*   **API (Capa de Transporte)**: Naming en `snake_case` (ej: `nombre_torre`).
*   **DB (Capa de Persistencia)**: Naming en `camelCase` (ej: `nombreTorre`).

### 2. Fuente de Verdad (Single Source of Truth)
*   **Mapping**: `backend/core/mapping/registry.js` define cómo se transforman los campos entre las tres capas. **PROHIBIDO** transformar datos manualmente en el frontend.
*   **Maestros**: `backend/config/masterModules.js` define la lista canónica de módulos maestros habilitados para carga masiva y exportación.

### 3. Archivos Clave para Onboarding
1. `/docs/ai/sgc-core-context.md`: Contexto operativo unificado.
2. `/docs/architecture/sgc-module-standard.md`: Estándar de nombres y soft-delete.
3. `/backend/core/mapping/registry.js`: El cerebro del mapping.
4. `/backend/config/masterModules.js`: Definición de alcance de datos.
5. `/backend/modules/mass_upload/*`: Motor principal de persistencia.
6. `/backend/modules/systemDoctor/*`: Motor de diagnóstico y salud.

### 4. Prompt Base para Agentes
> "Antes de realizar cambios, leer obligatoriamente:
> - docs/ai/sgc-core-context.md
> - docs/architecture/sgc-module-standard.md
> 
> Reglas: Usar registry.js como fuente de verdad, respetar MASTER_MODULES, no inferir estructura desde Prisma directamente y nunca romper el mapping centralizado."

---

## 🧪 SGC DOCTOR (Salud del Sistema)

El sistema incluye un motor de diagnóstico avanzado accesible desde `/system-doctor` que valida:
1. **Schema Alignment**: Sincronización entre Prisma y Registry.
2. **Master Definition**: Consistencia de la lista canónica v3.1.
3. **Dataset Health**: Deduplicación y hashes de carga masiva.
4. **Execution Analytics**: Tendencias de errores y hotspots de conflicto.
5. **System Version**: Validación de la versión cañónica `3.1.0`.

---

## 🧪 Otros Scripts y Automatización

### 1. RBAC Test Runner
Simula el comportamiento de diferentes roles (Admin, Residente, Conserje, Propietario) para verificar la seguridad del backend.
- **Ejecución**: `npm run test:rbac` (desde backend)
- **Logs**: `/logs/rbac-test.log`

### 2. CLI Doctor (Legacy)
Herramienta de diagnóstico CLI que valida la alineación canónica.
- **Ubicación**: `/scripts/sgc-doctor.js`

---

## 🔐 Credenciales de Prueba (Demo)

- **Admin**: `gdcuentas@sgc.cl` / `admin123`
- **Residente**: `residente@sgc.cl` / `sgc123`
- **Conserje**: `conserje@sgc.cl` / `sgc123`
- **Frontend URL**: `http://localhost:5173`
- **Backend API**: `http://localhost:3001/api`

---

## 📦 Changelog

## v3.6.0 — Enterprise Hardening

### 🔐 Auditoría Inmutable
- AuditLog ahora es append-only
- bloqueo de UPDATE/DELETE (405)

### 🚨 Detección de Cambios Críticos
- eventos CONFIG_CHANGE_CRITICAL
- monitoreo de credenciales y webhooks

### 🧾 UI de Auditoría
- nueva ruta: /configuracion/auditoria
- visualización con severidad

### 📦 Exportación Global
- endpoint /api/system-settings/export
- descarga JSON con metadata

### 🛡️ Seguridad y Hardening
- validaciones reforzadas
- consistencia de helpers

### v3.1.0 — Data Platform & System Doctor
* **System Doctor**: Implementación de módulo de diagnóstico global con UI dedicada.
* **Canonical Masters**: Centralización de `MASTER_MODULES` en `/backend/config/`.
* **AI Onboarding**: Re-estructuración del README y documentación para agentes de IA.
* **Traceability**: Integración de snapshots de datos (`executedDataJson`) y hashing SHA-256 para auditoría forense.
* **Exportación**: Restauración de exportación consolidada multi-hoja basada en el Registro Central.

---
© 2026 SGC Project - Sistema de Gestión de Condominios.

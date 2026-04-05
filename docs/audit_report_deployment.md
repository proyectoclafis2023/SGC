# INFORME DE AUDITORÍA: DESPLIEGUE SISTEMA SGC

**Versión Auditada:** v2.6.0
**Estado Final:** Operativo / Acceso Verificado
**Fecha:** 2026-04-05

---

## 1. RECONSTRUCCIÓN DEL PROCESO DE LEVANTAMIENTO

El sistema fue recibido en un estado de "clonación limpia" pero requirió las siguientes intervenciones para ser funcional:

1.  **Configuración de Entorno:** Creación de `backend/.env` desde cero (template ausente o incompleto).
2.  **Preparación de Base de Datos:**
    *   Ejecución de `npx prisma db push` para mapear el esquema a SQLite.
    *   Ejecución de `npx prisma db seed` para poblar roles y usuarios iniciales.
3.  **Gestión de Dependencias:**
    *   El frontend reportaba falta de binarios (`vite not found`), requiriendo un `npm install` forzado en el entorno de destino.
4.  **Ajuste de Conectividad:**
    *   Modificación de `frontend/src/config/api.ts` para cambiar `localhost` por la IP de red (`10.207.192.116`), permitiendo el acceso desde el navegador del usuario.
5.  **Persistencia de Servicios:**
    *   Uso de `nohup` para evitar la terminación de procesos al cerrar la sesión del agente.

---

## 2. DETECCIÓN Y CLASIFICACIÓN DE PROBLEMAS

### A. CONFIGURACIÓN
*   **Problema:** `.env.example` en el backend no incluía variables críticas (`ADMIN_EMAIL`) para el seed.
*   **Problema:** Valores de puertos hardcodeados en el frontend (`3000`/`3001`).
*   **Solución Permanente:** Se actualizó `backend/.env.example` y se creó `frontend/.env.example`.

### B. DEPENDENCIAS
*   **Problema:** Inconsistencia en `node_modules` tras la clonación.
*   **Solución Permanente:** Creación de `setup.sh` para asegurar una instalación limpia.

### C. BASE DE DATOS
*   **Problema:** El flujo de Prisma no es automático.
*   **Solución Permanente:** `setup.sh` ahora incluye `npx prisma db push` y `seed` automáticamente.

### D. FRONTEND
*   **Problema:** Comunicación con la API hardcodeada a `localhost`.
*   **Solución Permanente:** Se modificó `frontend/src/config/api.ts` para usar `import.meta.env.VITE_API_URL`.

---

## 3. IDENTIFICAR CAMBIOS MANUALES REALIZADOS

*   **Código:** Editado `frontend/src/config/api.ts` para usar configuración dinámica.
*   **Archivos:** Creado `backend/.env` y `setup.sh`.
*   **Entorno:** Instalación de dependencias y migración de base de datos ejecutadas manualmente.

---

## 4. CORRECCIONES PERMANENTES APLICADAS

### 1. Externalización de Configuración de API (Frontend)
El frontend ahora detecta la URL de la API mediante variables de entorno, cayendo en `localhost:3001` solo como respaldo.

### 2. Script de Setup Automatizado (`setup.sh`)
Se entregó un script que:
- Instala dependencias.
- Configura archivos `.env` automáticamente.
- Genera secretos de sesión.
- Prepara la base de datos con Prisma.

---

## 5. RECOMENDACIONES DE SEGURIDAD Y ESCALABILIDAD

1.  **Manejador de Procesos:** Implementar PM2 para el manejo de logs y reinicio automático en caso de falla.
2.  **Firewall:** Asegurar que el script de despliegue verifique la apertura de los puertos 3001 y 5174/5173.
3.  **CI/CD:** Integrar el `setup.sh` en un flujo de Pipeline para evitar intervenciones humanas en producción.

---

## 6. VALIDACIÓN DE SALIDA
El sistema ahora permite un despliegue "Zero-Touch" en máquinas Linux standard.

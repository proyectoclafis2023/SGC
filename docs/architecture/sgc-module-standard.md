# 📐 SGC Module Standard v1.0

> 📦 Basado en versión estable: **v2.5.4**
> 📅 Fecha: 2026-03-18
> 🟢 Estado: Activo
> 📍 Ubicación obligatoria: `/docs/architecture/sgc-module-standard.md`

---

# 🎯 OBJETIVO

Definir un estándar base reutilizable para todos los módulos del sistema SGC, garantizando consistencia entre:

* UI (Frontend)
* API (Backend)
* Base de Datos (Prisma)
* Carga Masiva (Excel - 8.1.0)

Este estándar es **obligatorio** para todo desarrollo nuevo y migración de módulos existentes.

---

# 1. 🗄️ MODELO DE DATOS (BD - Prisma)

## Convenciones

* **Modelos:** PascalCase
  Ej: `Resident`, `UnitType`

* **Campos:** camelCase
  Ej: `lastNames`, `isArchived`

---

## Campos estándar obligatorios

```prisma
id           String   @id @default(cuid())
isArchived   Boolean  @default(false)
createdAt    DateTime @default(now())
```

---

## Manejo de campos complejos (JSON)

* Tipo: `String?`
* Sufijo obligatorio: `Json`

Ej:

```prisma
metadataJson String?
historyJson  String?
```

---

## 🔒 Regla obligatoria

> Todo campo que represente Array u Objeto DEBE:

* Terminar en `Json`
* Ser serializado/deserializado en la API

---

## Tipos de datos

* `Int` → cantidades, años
* `Float` → montos, valores
* `String` → textos y JSON

---

# 2. 🔌 API (Express + Prisma)

## Endpoints estándar

```
GET    /api/{modulo}
POST   /api/{modulo}
PUT    /api/{modulo}/:id
DELETE /api/{modulo}/:id
POST   /api/{modulo}/upload
```

---

## Comportamiento

* GET → solo registros con `isArchived = false`
* DELETE → soft delete (`isArchived = true`)
* PUT → no modificar `id` ni `createdAt`

---

## Serialización (OBLIGATORIA)

### Escritura:

```js
JSON.stringify()
```

### Lectura:

```js
JSON.parse()
```

---

## 🔒 Reglas

* No enviar objetos sin serializar
* No almacenar arrays directos en BD

---

# 3. 🌐 RUTAS Y NAMING

## Convención

```
/api/{modulo}
```

* Siempre plural
* snake_case

Ej:

```
/api/residents
/api/special_funds
/api/jornada_groups
```

---

## 🔒 Regla

> La UI y la API DEBEN usar exactamente la misma ruta

---

# 4. 📊 EXCEL / CARGA MASIVA (8.1.0)

## Estructura

* Columnas en minúscula
* En español
* Orientadas a usuario final

Ej:

```
nombres
apellidos
rut
telefono
correo
```

---

## Mapeo

Debe existir correspondencia:

```
Excel → API → BD
```

---

## 🔄 Lógica de importación

### UPSERT obligatorio

* Si existe → actualizar
* Si no existe → crear

---

## 🔑 Clave única obligatoria

Cada modelo DEBE definir:

```
uniqueKey
```

Ej:

* Resident → `dni`
* Unidad → `number + towerId`

---

# 5. 🔗 MANEJO DE RELACIONES

## En BD

* Siempre usar IDs:

```
towerId
unitTypeId
```

---

## En Excel

Se permite:

* Nombre
* Identificador único (ej: RUT)

---

## Resolución

El backend debe:

1. Buscar coincidencia
2. Obtener ID
3. Asignar relación

---

## ⚠️ Auto-creación (controlada)

Solo si:

* No existe coincidencia exacta
* Se valida formato

---

# 6. ⚠️ VALIDACIONES

## UI

* Formato
* Campos requeridos
* Validaciones visuales

---

## API

* Validación antes de persistir
* Manejo de errores (try/catch)

---

## BD

* Tipos
* Constraints
* Unique

---

# 7. 🔁 MAPEO DE CAMPOS (CRÍTICO)

Dado que existen múltiples formatos:

* BD → camelCase
* API → snake_case
* Excel → español

---

## 🔒 Regla obligatoria

> Debe existir una capa de mapeo centralizada

---

# 8. ❌ MANEJO DE ERRORES (OBLIGATORIO)

Formato estándar:

```json
{
  "success": false,
  "error": "Mensaje claro",
  "field": "campo",
  "row": 12
}
```

---

## 🔒 Reglas

* Siempre devolver errores estructurados
* Especialmente en carga masiva

---

# 9. 🧠 SERIALIZACIÓN CENTRALIZADA (RECOMENDADO)

Se debe implementar una función global:

```js
function serializePayload(data) {
  const result = {};

  for (const key in data) {
    const value = data[key];

    if (Array.isArray(value) || typeof value === 'object') {
      result[key] = JSON.stringify(value);
    } else {
      result[key] = value;
    }
  }

  return result;
}
```

---

# 10. 📌 EJEMPLO: RESIDENTES

| Capa       | Implementación               |
| ---------- | ---------------------------- |
| BD         | `Resident` con `dni @unique` |
| API        | `/api/residents`             |
| Excel      | `nombres, apellidos, rut`    |
| Relaciones | `towerId`, `unitId`          |
| JSON       | `parkingIdsJson`             |
| Validación | RUT obligatorio              |

---

# 🔒 REGLAS GLOBALES (OBLIGATORIAS)

* Todo módulo NUEVO debe cumplir este estándar
* No se permiten excepciones sin documentar
* No se permite crear endpoints fuera del patrón
* No se permite guardar datos complejos sin serialización
* Toda carga masiva debe ser compatible con 8.1.0

---

---

# 11. 📦 MOTOR DE CARGA MASIVA Y OPERACIÓN DEL SISTEMA

Para garantizar la integridad de los datos y la consistencia del sistema, todas las operaciones de carga de datos deben seguir el flujo y las reglas del motor 8.1.0.

## 🔁 Flujo Operativo Estándar
Cualquier carga de datos masiva debe cumplir este ciclo:
1. **Descargar Plantilla**: Usar el formato oficial compatible con el módulo.
2. **Ejecutar DRY RUN**: Validación completa de tipos, relaciones y restricciones sin persistir en BD.
3. **Corrección**: Depurar la data basada en los logs estructurados devueltos por el motor.
4. **Carga Real**: Ejecutar la persistencia definitiva tras un Dry Run exitoso.

## 🔗 Dependencias y Orden de Carga
Para evitar errores de integridad referencial, el orden de carga debe respetar la jerarquía del sistema:
1. **Infraestructura (7.1.x)**: Torres, pisos, tipos de unidad.
2. **Maestros Base (7.2.x - 7.3.x)**: Unidades, áreas comunes, servicios básicos.
3. **Comunidad (5.3.x)**: Residentes, propietarios, personal.
4. **Operacionales**: Gastos comunes, cobros, multas, eventos.

## 🔁 Integración con el Core de Mapeo
Para garantizar la consistencia en el flujo de datos, todas las operaciones del motor de carga masiva deben utilizar obligatoriamente la capa de mapeo centralizada:
* **requestMapper (Entrada)**: Normalización de datos Excel (español) a campos de API (snake_case).
* **mapResponse (Salida)**: Transformación de objetos de BD (camelCase) a respuestas de API (snake_case).

### 🚫 Prohibiciones Estrictas:
* **Mapeo Manual**: Prohibido transformar datos o cambiar nombres de campos en los routers o controladores.
* **Definición Ad-hoc**: Prohibido mapear campos fuera del archivo central `registry.js`.

### 🔗 Flujo Canónico de Datos:
`Excel → requestMapper → Prisma → mapResponse → UI`

---

## 🚨 Reglas Operativas Críticas
* **Resolución de Relaciones**: El motor debe resolver IDs automáticamente (ej: buscar `towerId` a partir del nombre de la torre).
* **Mapeo Centralizado**: Prohibido el uso de adaptadores manuales; todo debe pasar por el Core de Mapeo.
* **Logs Estructurados**: Toda falla en la carga debe retornar el campo, la fila y el motivo del error.
* **Persistencia Parcial**: Si una fila falla en carga real, las filas exitosas deben persistirse (si el módulo lo permite) e informar el consolidado.

---

# 🚀 ALCANCE

Este estándar aplica a:

* Nuevos módulos
* Migración progresiva de módulos existentes
* Integraciones con carga masiva

---

# 🧠 NOTA FINAL

Este documento define:

> ✔ cómo se construye el sistema
> ✔ cómo se mantiene consistente
> ✔ cómo se evita deuda técnica futura

---

# 📍 UBICACIÓN

Este archivo DEBE estar en:

```
/docs/architecture/sgc-module-standard.md
```

Y ser referenciado en:

```
README.md
```

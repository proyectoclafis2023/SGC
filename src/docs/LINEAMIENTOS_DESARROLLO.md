# Lineamientos de Desarrollo - SGC (Sistema de Gestión de Copropiedad)

Este documento establece los estándares y patrones de diseño obligatorios para el mantenimiento y evolución del sistema SGC. Estos lineamientos deben seguirse estrictamente para garantizar la integridad de los datos y la consistencia de la interfaz de usuario.

---

## 1. Integridad de Datos y Borrado Lógico

**Regla de Oro:** NUNCA se debe realizar una eliminación física (`filter` o `splice`) de registros maestros que puedan ser referenciados por otras entidades o que formen parte de un historial.

### Patrón: "Soft Delete" (Eliminado Lógico)
Cada vez que se requiera "eliminar" un registro (Personal, Artículos, Bancos, Fondos, Residentes, etc.), se debe:

1.  **Actualizar el Registro:** Cambiar el estado del objeto agregando la propiedad `isArchived: true`.
2.  **Preservar Relaciones:** Mantener el objeto en el arreglo del Contexto para que los IDs sigan siendo válidos en registros históricos (ej: entregas de EPP, pagos de gastos comunes).
3.  **Filtrado en Vistas:** En las páginas de gestión (Maestros), se debe filtrar el arreglo para ocultar los elementos archivados:
    ```typescript
    const filteredItems = items.filter(item => !item.isArchived);
    ```

---

## 2. Estética y Experiencia de Usuario (UI/UX)

El sistema debe proyectar una imagen **Premium y Moderna**.

*   **Bordes:** Usar bordes muy redondeados (`rounded-2xl`, `rounded-3xl` o personalizados a `2.5rem` para contenedores grandes).
*   **Colores:** Evitar colores planos. Usar gradientes sutiles y sombras suaves (`shadow-lg shadow-indigo-500/10`).
*   **Iconografía:** Utilizar `lucide-react`. Cada sección principal debe tener un icono distintivo encerrado en un contenedor de color con sombra.
*   **Animaciones:** Todo cambio de estado o entrada de página debe tener transiciones suaves (`animate-in fade-in slide-in-from-bottom-4 duration-500`).
*   **Modo Oscuro:** Todas las pantallas deben ser compatibles con el modo oscuro (`dark:` clases de Tailwind).

---

## 3. Gestión de Contexto

*   Usar React Context para el estado global de cada módulo.
*   Persistir los datos en `localStorage` automáticamente mediante `useEffect`.
*   Sincronizar cambios entre pestañas del navegador escuchando el evento `'storage'`.

---

## 4. Formularios y Validación

*   Los formularios deben abrirse en Modales (`Fixed inset-0`) con efecto de desenfoque de fondo (`backdrop-blur-md`).
*   Validar siempre los tipos de datos (números en campos de precio/stock, fechas en formato ISO).
*   Proporcionar feedback inmediato mediante `alert` (o componentes de notificación si están disponibles) tras una acción exitosa.

---

## 5. Módulo de Inventario (EPP / Aseo)

*   **Control de Stock:** El stock siempre debe ser el valor actual en bodega.
*   **Stock Mínimo:** Campo obligatorio para disparar alertas visuales (⚠️) cuando el inventario sea bajo.
*   **Descuento Automático:** El stock debe descontarse programáticamente al registrar una entrega técnica o al asignar dotación inicial a un funcionario.

---

> [!NOTE]
> Este archivo es la fuente de verdad para futuras modificaciones. Si el sistema escala a una base de datos real (Backend), estos principios de "Soft Delete" deben trasladarse a nivel de consultas SQL/NoSQL.

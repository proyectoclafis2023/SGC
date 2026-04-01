# SGC – Sistema de Gestión de Condominios

SGC es un sistema de gestión de condominios que permite administrar operaciones, finanzas, residentes, infraestructura y servicios de forma centralizada, trazable y eficiente.

## 🚀 Funcionalidades Principales
- **Gestión de Residentes y Propietarios**: Administración completa de perfiles y unidades.
- **Control de Visitas**: Registro digital de ingresos y salidas con trazabilidad total.
- **Administración de Gastos Comunes**: Motor de cálculo automático, fondos de reserva y reglas de cobro.
- **Reserva de Espacios Comunes**: Gestión de disponibilidad para quincho, piscina y otras áreas.
- **Gestión de Personal**: Control de turnos, bitácora de novedades y reportes diarios.
- **Infraestructura y Activos**: Seguimiento de torres, bodegas, estacionamientos y mantenimiento.

## 🛠️ Tecnologías
- **Backend**: Node.js, Express, Prisma ORM, JWT.
- **Frontend**: React, Vite, Tailwind CSS, Lucide Icons.
- **Base de Datos**: SQLite (almacenamiento local eficiente).

## 🚀 Inicio Rápido

```bash
git clone https://github.com/proyectoclafis2023/SGC.git
cd SGC

# Backend
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npx prisma db seed
npm run dev

# Frontend
cd ../frontend
npm install
npm run dev
```

## 🔐 Credenciales por Defecto (Entorno de Desarrollo)
- **Administrador**: `gdcuentas@sgc.cl` / `admin123`
- **Residente**: `residente@sgc.cl` / `sgc123`
- **Propietario**: `propietario@sgc.cl` / `sgc123`
- **Conserje**: `conserje@sgc.cl` / `sgc123`

## 📚 Arquitectura y Estándares
El proyecto sigue el estándar de desarrollo SGC para asegurar escalabilidad y mantenibilidad. Consulte la carpeta `/docs/architecture` para más detalles sobre el motor de mapeo, RBAC y guías de implementación.

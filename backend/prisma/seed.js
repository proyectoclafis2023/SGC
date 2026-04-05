const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 --- SGC GLOBAL STANDARDIZED SEED START ---');

    const ADMIN_PASS = process.env.ADMIN_PASSWORD;
    const DEFAULT_PASS = process.env.DEFAULT_USER_PASSWORD;

    if (!ADMIN_PASS || !DEFAULT_PASS) {
        console.warn('⚠️ WARNING: ADMIN_PASSWORD or DEFAULT_USER_PASSWORD not set in environment.');
        console.warn('⚠️ Falling back to development defaults.');
    }

    const adminHashed = await bcrypt.hash(ADMIN_PASS || 'admin123', 10);
    const defaultHashed = await bcrypt.hash(DEFAULT_PASS || 'sgc123', 10);

    // 1. Permissions definition
    const permissions = [
        { slug: 'reports:view', description: 'Ver Reporte Diario' },
        { slug: 'shift_logs:view', description: 'Ver Libro de Novedades' },
        { slug: 'visits:view', description: 'Ver Visitas' },
        { slug: 'correspondence:view', description: 'Ver Encomiendas' },
        { slug: 'contractors:view', description: 'Ver Contratistas' },
        { slug: 'emergencies:view', description: 'Ver Emergencias' },
        { slug: 'common_expenses:view', description: 'Ver Gastos Comunes' },
        { slug: 'payments:view', description: 'Ver Mis Pagos' },
        { slug: 'payments:create', description: 'Registrar Pagos' },
        { slug: 'expenses:manage', description: 'Gestionar Egresos' },
        { slug: 'admin:stats', description: 'Ver Estadísticas Admin' },
        { slug: 'residents:manage', description: 'Gestionar Residentes' },
        { slug: 'reservations:view', description: 'Ver Reservas' },
        { slug: 'tickets:view', description: 'Ver Soporte/Tickets' },
        { slug: 'services:view', description: 'Ver Directorio Servicios' },
        { slug: 'announcements:manage', description: 'Gestionar Comunicados' },
        { slug: 'camera_requests:view', description: 'Ver Cámaras' },
        { slug: 'fixed_assets:view', description: 'Gestión Activos Fijos' },
        { slug: 'unit_types:manage', description: 'Maestra Tipos de Unidad' },
        { slug: 'infrastructure:manage', description: 'Maestra Infraestructura' },
        { slug: 'personnel:manage', description: 'Maestra Personal' },
        { slug: 'roles:manage', description: 'Gestión de Roles y Permisos' },
        { slug: 'infrastructure:view', description: 'Permiso para visualizar infraestructura (torres/depts)' },
        { slug: 'mass_upload:execute', description: 'Ejecutar procesos de carga masiva' }
    ];

    const permMap = {};
    for (const p of permissions) {
        const created = await prisma.permission.upsert({
            where: { slug: p.slug },
            update: { description: p.description },
            create: p
        });
        permMap[p.slug] = created.id;
    }

    // 2. Roles definition
    const roles = [
        { name: 'admin', description: 'Administrador Global', perms: permissions.map(p => p.slug) },
        { name: 'resident', description: 'Residente Habitacional', perms: ['common_expenses:view', 'payments:view', 'reservations:view', 'tickets:view', 'correspondence:view', 'services:view', 'emergencies:view'] },
        { name: 'owner', description: 'Propietario Legal', perms: ['common_expenses:view', 'payments:view', 'reservations:view', 'tickets:view', 'correspondence:view', 'services:view', 'emergencies:view', 'infrastructure:view'] },
        { name: 'concierge', description: 'Conserjería y Vigilancia', perms: ['reports:view', 'shift_logs:view', 'visits:view', 'correspondence:view', 'contractors:view', 'emergencies:view', 'common_expenses:view'] }
    ];

    const roleMap = {};
    for (const r of roles) {
        const created = await prisma.role.upsert({
            where: { name: r.name },
            update: { description: r.description },
            create: { name: r.name, description: r.description }
        });
        roleMap[r.name] = created.id;

        // Sync permissions
        for (const slug of r.perms) {
            await prisma.rolePermission.upsert({
                where: {
                    roleId_permissionId: {
                        roleId: created.id,
                        permissionId: permMap[slug]
                    }
                },
                update: {},
                create: {
                    roleId: created.id,
                    permissionId: permMap[slug]
                }
            });
        }
    }

    // 3. Infrastructure minimums
    const unitType = await prisma.tipoUnidad.upsert({
        where: { nombre: 'Departamento Estándar' },
        update: {},
        create: { nombre: 'Departamento Estándar', baseCommonExpense: 65000 }
    });

    const tower = await prisma.tower.upsert({
        where: { name: 'Torre A' },
        update: {},
        create: { name: 'Torre A' }
    });

    // 4. Base Users (Personnel Table)
    const baseUsers = [
        { email: 'gdcuentas@sgc.cl', dni: 'ADMIN-0', names: 'Administrador', lastNames: 'Global', role: 'admin', pass: adminHashed },
        { email: 'residente@sgc.cl', dni: 'RES-0', names: 'Pedro', lastNames: 'Residente', role: 'resident', pass: defaultHashed },
        { email: 'propietario@sgc.cl', dni: 'PROP-0', names: 'Diego', lastNames: 'Propietario', role: 'owner', pass: defaultHashed },
        { email: 'conserje@sgc.cl', dni: 'CONS-0', names: 'Juan', lastNames: 'Conserje', role: 'concierge', pass: defaultHashed }
    ];

    for (const u of baseUsers) {
        await prisma.personnel.upsert({
            where: { dni: u.dni },
            update: {
                email: u.email,
                password: u.pass,
                roleId: roleMap[u.role]
            },
            create: {
                dni: u.dni,
                email: u.email,
                names: u.names,
                lastNames: u.lastNames,
                password: u.pass,
                roleId: roleMap[u.role],
                address: 'Condominio Central 123',
                baseSalary: 0,
                status: 'active'
            }
        });
    }

    // 5. Related Entities (Residente / Propietario)
    const resModel = await prisma.residente.upsert({
        where: { dni: 'RES-0' },
        update: { email: 'residente@sgc.cl' },
        create: {
            dni: 'RES-0',
            names: 'Pedro',
            lastNames: 'Residente',
            email: 'residente@sgc.cl',
            phone: '+56900000001'
        }
    });

    const propModel = await prisma.propietario.upsert({
        where: { dni: 'PROP-0' },
        update: { email: 'propietario@sgc.cl' },
        create: {
            dni: 'PROP-0',
            names: 'Diego',
            lastNames: 'Propietario',
            email: 'propietario@sgc.cl',
            phone: '+56900000002'
        }
    });

    // 6. Relationships (Unit association)
    await prisma.department.upsert({
        where: { number_towerId: { number: '101', towerId: tower.id } },
        update: {
            residentId: resModel.id,
            ownerId: propModel.id,
            unitTypeId: unitType.id
        },
        create: {
            number: '101',
            towerId: tower.id,
            unitTypeId: unitType.id,
            residentId: resModel.id,
            ownerId: propModel.id,
            floor: 1,
            m2: 55.5
        }
    });

    // 7. Communication Templates (Consolidated)
    const teamplates = [
        {
            name: 'Aviso de Mora y Corte',
            subject: 'AVISO IMPORTANTE: Morosidad en Gastos Comunes - [UNIDAD]',
            type: 'mora',
            message: `Estimado Copropietario(a):\n\nLe informamos que su unidad registra una morosidad superior a [MAX_MESES] meses.\nDe acuerdo al reglamento de copropiedad, el no pago antes del día [DIA_LIMITE] facultará a la administración para proceder con el corte de suministro eléctrico y la aplicación de una multa de [MULTA].\n\nLe instamos a regularizar su situación a la brevedad.\n\nAtentamente,\nLa Administración.`
        },
        {
            name: 'Convocatoria Asamblea Ordinaria',
            subject: 'CITACIÓN: Asamblea Ordinaria de Copropietarios - [AÑO]',
            type: 'asamblea',
            message: `Estimados Residentes:\n\nSe les cita a la Asamblea Ordinaria de Copropietarios a realizarse el día [FECHA] a las [HORA] en [LUGAR].\n\nTabla de la sesión:\n1. Lectura de acta anterior.\n2. Rendición de cuentas de la administración.\n3. Renovación del Comité de Administración.\n4. Otros temas de interés.\n\nSu asistencia es fundamental para el buen funcionamiento de nuestra comunidad.`
        },
        {
            name: 'Circular Mantención de Ascensores',
            subject: 'AVISO: Mantención Programada de Ascensores',
            type: 'comunicado',
            message: `Informamos que el día [FECHA], entre las [HORA_INICIO] y [HORA_FIN], se realizará la mantención trimestral de los ascensores de la torre [TORRE].\n\nAgradecemos su comprensión y pedimos disculpas por los inconvenientes.`
        }
    ];

    for (const t of teamplates) {
        // Since there's no unique constraint on name in schema.prisma for CommunicationTemplate, 
        // we check by name and update or create.
        const existing = await prisma.plantillaComunicacion.findFirst({ where: { nombre: t.name } });
        const data = {
            nombre: t.name,
            subject: t.subject,
            type: t.type,
            message: t.message
        };
        if (existing) {
            await prisma.plantillaComunicacion.update({ where: { id: existing.id }, data });
        } else {
            await prisma.plantillaComunicacion.create({ data });
        }
    }

    // 8. Emergency Numbers (Consolidated)
    const emergencies = [
        { name: 'Ambulancia (SAMU)', phone: '131', category: 'URGENCIA', description: 'Atención médica de urgencia' },
        { name: 'Bomberos', phone: '132', category: 'URGENCIA', description: 'Emergencias y rescate' },
        { name: 'Carabineros', phone: '133', category: 'COMUNAL', description: 'Seguridad y orden público' },
        { name: 'PDI', phone: '134', category: 'COMUNAL', description: 'Investigaciones' },
        { name: 'Seguridad Municipal', phone: '14XX', category: 'COMUNAL', description: 'Patrullaje preventivo' },
        { name: 'Enel (Electricidad)', phone: '600 696 0000', category: 'SERVICIOS', description: 'Emergencias eléctricas' }
    ];

    for (const e of emergencies) {
        const data = {
            nombre: e.name,
            phone: e.phone,
            category: e.category,
            description: e.description
        };
        await prisma.numeroEmergencia.upsert({
            where: { nombre: e.name },
            update: data,
            create: data
        });
    }

    console.log('✅ --- SGC GLOBAL STANDARDIZED SEED FINISHED ---');
}

main()
    .catch(e => {
        console.error('❌ SEED ERROR:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

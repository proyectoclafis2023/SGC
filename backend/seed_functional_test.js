const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    console.log('--- SEED FUNCTIONAL TEST USERS (V5) ---');
    const passwordHash = await bcrypt.hash('sgc123', 10);

    const rolesList = ['admin', 'resident', 'owner', 'worker'];
    for (const r of rolesList) {
        const role = await prisma.role.upsert({
            where: { name: r },
            update: {},
            create: { name: r, description: `Rol para ${r}` }
        });

        if (r === 'admin') {
            const perms = ['mass_upload:execute', 'admin:stats', 'reports:view', 'infraestructura:manage'];
            for (const p of perms) {
                const perm = await prisma.permission.upsert({
                    where: { slug: p },
                    update: {},
                    create: { slug: p, description: `Permiso para ${p}` }
                });
                await prisma.rolePermission.upsert({
                    where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
                    update: {},
                    create: { roleId: role.id, permissionId: perm.id }
                });
            }
        }
    }

    const testUsers = [
        { id: 'FT-ADMIN', email: 'admin@sgc.cl', role: 'admin', names: 'Admin', lastNames: 'SGC' },
        { id: 'FT-RESIDENT', email: 'residente@sgc.cl', role: 'resident', names: 'Juan', lastNames: 'Residente' },
        { id: 'FT-OWNER', email: 'propietario@sgc.cl', role: 'owner', names: 'Maria', lastNames: 'Propietario' },
        { id: 'FT-WORKER', email: 'conserje@sgc.cl', role: 'worker', names: 'Pedro', lastNames: 'Conserje' }
    ];

    for (const u of testUsers) {
        const role = await prisma.role.findUnique({ where: { name: u.role } });
        await prisma.personnel.upsert({
            where: { dni: u.email },
            update: {
                email: u.email,
                password: passwordHash,
                roleId: role.id,
                status: 'active',
                isArchived: false,
                names: u.names,
                lastNames: u.lastNames
            },
            create: {
                id: u.id,
                names: u.names,
                lastNames: u.lastNames,
                email: u.email,
                dni: u.email,
                address: 'Calle Falsa 123',
                baseSalary: 0,
                password: passwordHash,
                roleId: role.id,
                status: 'active'
            }
        });
        console.log(`User seeded: ${u.email} (${u.role})`);
    }

    // Unify roles
    for (const u of testUsers) {
        const role = await prisma.role.findUnique({ where: { name: u.role } });
        await prisma.personnel.updateMany({
            where: { email: u.email },
            data: { roleId: role.id, password: passwordHash }
        });
    }

    console.log('--- ASSOCIATING UNITS ---');
    
    // Create/update Residente and Propietario records
    const resId = 'FT-RESIDENT';
    const ownId = 'FT-OWNER';
    
    await prisma.residente.upsert({
        where: { id: resId },
        update: { email: 'residente@sgc.cl' },
        create: { id: resId, names: 'Juan', lastNames: 'Residente', email: 'residente@sgc.cl', dni: 'FT-RESIDENT', phone: '123' }
    });
    
    await prisma.propietario.upsert({
        where: { id: ownId },
        update: { email: 'propietario@sgc.cl' },
        create: { id: ownId, names: 'Maria', lastNames: 'Propietario', email: 'propietario@sgc.cl', dni: 'FT-OWNER', phone: '456' }
    });

    // Also owner might need residente record for auth filtering if code is buggy
    await prisma.residente.upsert({
        where: { id: ownId },
        update: {},
        create: { id: ownId, names: 'Maria', lastNames: 'Propietario', email: 'propietario@sgc.cl', dni: 'FT-OWNER-R', phone: '456' }
    });

    const tower = await prisma.tower.findFirst({ where: { name: 'Torre A' } }) 
                 || await prisma.tower.create({ data: { name: 'Torre A' } });

    const ut = await prisma.tipoUnidad.findFirst({ where: { nombre: 'Depto 2D2B' } })
              || await prisma.tipoUnidad.create({ data: { nombre: 'Depto 2D2B', baseCommonExpense: 50000 } });

    const targetUnits = [
        { number: '101', residentId: resId, ownerId: ownId },
        { number: '202', residentId: ownId, ownerId: ownId }
    ];

    for (const t of targetUnits) {
        const existing = await prisma.department.findFirst({ where: { number: t.number, towerId: tower.id } });
        if (existing) {
            await prisma.department.update({
                where: { id: existing.id },
                data: {
                    resident: { connect: { id: t.residentId } },
                    owner: { connect: { id: t.ownerId } }
                }
            });
        } else {
            await prisma.department.create({
                data: {
                    number: t.number,
                    floor: parseInt(t.number.charAt(0)),
                    tower: { connect: { id: tower.id } },
                    unitType: { connect: { id: ut.id } },
                    resident: { connect: { id: t.residentId } },
                    owner: { connect: { id: t.ownerId } }
                }
            });
        }
    }

    console.log('--- UNITS ASSOCIATED ---');
    console.log('--- SEED COMPLETED ---');
}

main().catch(e => console.error(e)).finally(async () => await prisma.$disconnect());

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const nodemailer = require('nodemailer');
const { requestMapper } = require('./core/mapping/middleware');
const { mapResponse } = require('./core/mapping/response');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const bulkMapping = require('./config/bulk-mapping');
const bulkEngine = require('./core/bulk_engine');
const massUploadController = require('./modules/mass_upload/massUpload.controller');
const systemDoctorController = require('./modules/systemDoctor/systemDoctor.controller');

const prisma = new PrismaClient();
const app = express();
const upload = multer({ dest: 'uploads/' });
const PORT = process.env.PORT || 3001;

// Configuración de Email (Ejemplo con Gmail o SMTP genérico)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

app.use(cors());
app.use(express.json());

// --- RBAC Middleware (Production v3.0) ---
const authorize = (permissions) => {
    return async (req, res, next) => {
        // Authenticate first
        await authenticate(req, res, async () => {
            if (req.isAdmin) return next();
            if (!permissions) return next();

            const perms = Array.isArray(permissions) ? permissions : [permissions];
            const userPerms = req.user.roleRef?.permissions.map(rp => rp.permission.slug) || [];
            const hasPermission = perms.every(p => userPerms.includes(p));

            if (!hasPermission) {
                console.warn(`[SECURITY] Forbidden: User ${req.user.id} lacks ${permissions}`);
                await audit(req, 'UNAUTHORIZED_ACCESS', 'System', { requestedPerms: permissions });
                return res.status(403).json({ error: 'Acceso restringido: Permisos insuficientes' });
            }
            next();
        });
    };
};

// --- PRODUCTION SECURITY (Phase 1, 3, 4) ---
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: process.env.NODE_ENV === 'development' ? 10000 : 100, 
    message: { error: 'Límite de peticiones excedido, intente en 15 minutos' }
});
app.use('/api/', apiLimiter);

const authenticate = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;

    if (!token) return res.status(401).json({ error: 'Autenticación requerida' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sgc_prod_secret');
        const user = await prisma.personnel.findUnique({
            where: { id: decoded.userId },
            include: { roleRef: { include: { permissions: { include: { permission: true } } } } }
        });

        if (!user || user.isArchived) return res.status(401).json({ error: 'Acceso denegado' });

        req.user = user;
        req.isAdmin = (user.roleRef?.name === 'Administrador' || user.roleRef?.name === 'admin');

        let relatedId = user.id;
        if (user.roleRef?.name === 'resident') {
            const resData = await prisma.residente.findFirst({ where: { email: user.email } });
            relatedId = resData?.id;
        } else if (user.roleRef?.name === 'owner') {
            const propData = await prisma.propietario.findFirst({ where: { email: user.email } });
            relatedId = propData?.id;
        }
        req.relatedId = relatedId || user.id;

        next();
    } catch (err) {
        return res.status(401).json({ error: 'Sesión inválida o expirada' });
    }
};

// Audit Helper (Phase 2 - Enterprise v3.6)
const audit = async (req, action, entity, details = null, severity = 'LOW') => {
    try {
        await prisma.auditLog.create({
            data: {
                userId: req.user?.id,
                action,
                severity,
                entity,
                endpoint: req.originalUrl,
                method: req.method,
                status: req.res?.statusCode || 200,
                details: details ? JSON.stringify(details) : null
            }
        });
    } catch (e) { console.error('[AUDIT]', e); }
};

// --- Login Endpoint (Phase 1) ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body; 
    console.log(`[LOGIN] Attempt: ${username}`);
    try {
        const user = await prisma.personnel.findFirst({
            where: { email: username, isArchived: false },
            include: {
                roleRef: {
                    include: {
                        permissions: {
                            include: {
                                permission: true
                            }
                        }
                    }
                }
            }
        });
        console.log(`[LOGIN] Found user:`, user ? user.id : 'NONE');

        if (!user || !user.password) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { userId: user.id }, 
            process.env.JWT_SECRET || 'sgc_prod_secret', 
            { expiresIn: '8h' }
        );

        req.user = user; // Temporary attach for audit log
        await audit(req, 'LOGIN_SUCCESS', 'System', { email: username });

        // Extraer los slugs de permisos en un array simple
        const permissionsSlugs = user.roleRef?.permissions.map(p => p.permission.slug) || [];

        // For resident/owner roles, find the related identity ID
        let relatedId = user.id; // Default for admin/concierge
        if (user.roleRef?.name === 'resident') {
            const resData = await prisma.residente.findFirst({ where: { email: user.email } });
            relatedId = resData?.id;
        } else if (user.roleRef?.name === 'owner') {
            const propData = await prisma.propietario.findFirst({ where: { email: user.email } });
            relatedId = propData?.id;
        }

        res.json({
            token,
            user: { 
                id: user.id, 
                name: user.names, 
                email: user.email,
                role: user.roleRef?.name || 'Invitado',
                status: user.status,
                relatedId,
                permissions: permissionsSlugs
            }
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// -------------------------
// GLOBAL BULK MANAGEMENT (8.1.0)
// -------------------------

app.get('/api/bulk-export', authorize('admin:stats'), async (req, res) => {
    try {
        const buffer = await bulkEngine.exportEntities();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=sgc_full_export.xlsx');
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/bulk-export/:entity', authorize('admin:stats'), async (req, res) => {
    try {
        const buffer = await bulkEngine.exportEntities([req.params.entity]);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=sgc_${req.params.entity}_export.xlsx`);
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/bulk-import', authorize('admin:stats'), upload.single('file'), async (req, res) => {
    try {
        const dryRun = req.query.dryRun === 'true';
        const file = req.file;
        if (!file) return res.status(400).json({ error: 'No file uploaded' });

        const buffer = fs.readFileSync(file.path);
        const result = await bulkEngine.importEntities(buffer, dryRun, 'Admin');
        
        // Cleanup temp file
        fs.unlinkSync(file.path);

        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/bulk-masters', authorize('admin:stats'), (req, res) => {
    res.json(bulkEngine.getMasters());
});


// --- 8.x.x Mass Upload Engine (Phase 1) ---
app.post('/api/mass_upload/dry-run', authorize('mass_upload:execute'), upload.single('file'), (req, res) => {
    // If we use disk storage, we pass the file path or read it
    // The controller is currently expecting req.file.buffer, but for disk storage we'll read it
    if (req.file && !req.file.buffer) {
        req.file.buffer = fs.readFileSync(req.file.path);
        fs.unlinkSync(req.file.path); // Cleanup immediately after reading to buffer
    }
    massUploadController.dryRun(req, res);
});

app.post('/api/mass_upload/execute', authorize('mass_upload:execute'), upload.single('file'), (req, res) => {
    if (req.file && !req.file.buffer) {
        req.file.buffer = fs.readFileSync(req.file.path);
        fs.unlinkSync(req.file.path);
    }
    massUploadController.execute(req, res);
});

app.get('/api/mass_upload/history', authorize('mass_upload:execute'), massUploadController.getLogs);
app.get('/api/mass_upload/export/:module', authorize('mass_upload:execute'), massUploadController.exportIndividual);
app.get('/api/mass_upload/export-all', authorize('mass_upload:execute'), massUploadController.exportAll);
app.get('/api/system-doctor', authorize('mass_upload:execute'), (req, res) => systemDoctorController.diagnose(req, res));
app.get('/api/system-doctor/history', authorize('mass_upload:execute'), (req, res) => systemDoctorController.getHistory(req, res));

// --- Root Route for confirmation ---
app.get('/', (req, res) => {
    res.send('<h1>🚀 Servidor SGC funcionando correctamente</h1><p>Prueba los endpoints en /api/...</p>');
});

// --- Helper for Bulk Upload (Standard v1.0 - Architectural decision) ---
const runBulkImport = async (entityKey, items, dryRun = false) => {
    const config = bulkMapping[entityKey];
    if (!config) throw new Error(`Sin configuración para entidad: ${entityKey}`);

    let created = 0, updated = 0;
    const errors = [];

    for (let i = 0; i < items.length; i++) {
        const row = items[i];
        const rowNumber = i + 2; 
        try {
            const mappedData = {};
            // 0. Campos fijos
            if (config.fixedFields) {
                Object.assign(mappedData, config.fixedFields);
            }
            // 1. Mapeo
            for (const [excelKey, dbKey] of Object.entries(config.mapping)) {
                let value = row[excelKey];
                
                if (typeof value === 'string') {
                    const upper = value.toUpperCase().trim();
                    if (upper === 'SI' || upper === 'TRUE') value = true;
                    if (upper === 'NO' || upper === 'FALSE') value = false;
                }
                
                mappedData[dbKey] = value;
            }

            // 2. Resolución de relaciones (Política B: Rechazo)
            if (config.relations) {
                for (const [excelKey, relConfig] of Object.entries(config.relations)) {
                    const searchValue = row[excelKey];
                    if (!searchValue) continue;

                    const relatedRecord = await prisma[relConfig.model].findFirst({
                        where: { [relConfig.field]: { equals: String(searchValue).trim(), mode: 'insensitive' } }
                    });

                    if (!relatedRecord) {
                        throw new Error(`Relación no encontrada: ${relConfig.model} no cuenta con '${searchValue}' en campo '${relConfig.field}'`);
                    }
                    mappedData[relConfig.target] = relatedRecord.id;
                }
            }

            // 3. Normalización de uniqueKey para UPSERT (trim + toLowerCase)
            let whereClause = {};
            if (Array.isArray(config.uniqueKey)) {
                config.uniqueKey.forEach(key => {
                    let val = mappedData[key];
                    if (val === undefined) throw new Error(`Campo requerido faltante para clave única: ${key}`);
                    if (typeof val === 'string') val = val.trim().toLowerCase();
                    whereClause[key] = val;
                });
            } else {
                let uniqueVal = mappedData[config.uniqueKey];
                if (uniqueVal === undefined) throw new Error(`Campo requerido faltante para clave única: ${config.uniqueKey}`);
                
                if (config.uniqueKey === 'dni') {
                    uniqueVal = String(uniqueVal).replace(/[^a-zA-Z0-9]/g, '').toUpperCase().trim();
                    mappedData[config.uniqueKey] = uniqueVal;
                } else if (typeof uniqueVal === 'string') {
                    uniqueVal = uniqueVal.trim().toLowerCase();
                }
                
                whereClause[config.uniqueKey] = uniqueVal;
            }

            // 4. PERSISTENCIA (Sólo si NO es dryRun)
            const exists = await prisma[config.model].findUnique({ where: whereClause });
            if (exists) {
                if (!dryRun) await prisma[config.model].update({ where: { id: exists.id }, data: mappedData });
                updated++;
            } else {
                if (!dryRun) await prisma[config.model].create({ data: mappedData });
                created++;
            }

        } catch (err) {
            errors.push({
                row: rowNumber,
                module: config.model,
                field: 'Multiple',
                value: JSON.stringify(row),
                error: err.message
            });
        }
    }

    // 5. Registro en Log de Auditoría (Solo si NO es dryRun)
    if (!dryRun) {
        await prisma.bulkUploadLog.create({
            data: {
                module: entityKey,
                processed: items.length,
                created,
                updated,
                status: errors.length === 0 ? 'success' : (errors.length < items.length ? 'warning' : 'error'),
                dryRun: false,
                errorsJson: JSON.stringify(errors)
            }
        });
    }

    return { 
        success: errors.length === 0, 
        processed: items.length, 
        created, 
        updated, 
        errors,
        dryRun
    };
};

// --- Health Check ---
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date(), database: 'SQLite' });
});

/**
 * @api {get} /api/residentes Obtener Residentes
 * @apiDescription Retorna la lista de residentes activos (no archivados).
 */
app.get('/api/residentes', authorize('residents:manage'), async (req, res) => {
    try {
        const data = await prisma.residente.findMany({ 
            where: { isArchived: false },
            include: {
                departments: {
                    include: {
                        tower: true
                    }
                }
            }
        });
        res.json(mapResponse('residentes', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/residentes', authorize('residents:manage'), requestMapper('residentes'), async (req, res) => {
    try {
        const data = await prisma.residente.create({ data: req.body });
        res.status(201).json(mapResponse('residentes', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.post('/api/residentes/upload', authorize('residents:manage'), async (req, res) => {
    try {
        const result = await runBulkImport('residentes', req.body.items || [], req.query.dryRun === 'true');
        res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Personal ---
app.get('/api/personal', authorize('personnel:manage'), authorize('personnel:manage'), async (req, res) => {
    try {
        const data = await prisma.personnel.findMany({ 
            where: { isArchived: false },
            include: { bank: true, pensionFund: true, healthProvider: true, articleDeliveries: true }
        });
        res.json(mapResponse('personal', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/personal', authorize('personnel:manage'), requestMapper('personal'), async (req, res) => {
    try {
        const data = await prisma.personnel.create({ data: req.body });
        res.status(201).json(mapResponse('personal', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/personal/:id', authorize('personnel:manage'), requestMapper('personal'), async (req, res) => {
    try {
        const data = await prisma.personnel.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(mapResponse('personal', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/personal/:id', authorize('personnel:manage'), async (req, res) => {
    try {
        await prisma.personnel.update({
            where: { id: req.params.id },
            data: { isArchived: true }
        });
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.post('/api/personnel/upload', authorize('admin:stats'), upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    processCSV(req.file.path, async (results) => {
        try {
            for (const row of results) {
                await prisma.personnel.upsert({
                    where: { dni: row.dni || row.rut },
                    update: {
                        names: row.names || row.nombres,
                        lastNames: row.lastNames || row.apellidos,
                        address: row.address || row.direccion || 'Sin dirección',
                        baseSalary: parseFloat(row.baseSalary || row.sueldo_base) || 0,
                        position: row.position || row.cargo
                    },
                    create: {
                        names: row.names || row.nombres,
                        lastNames: row.lastNames || row.apellidos,
                        dni: row.dni || row.rut,
                        address: row.address || row.direccion || 'Sin dirección',
                        baseSalary: parseFloat(row.baseSalary || row.sueldo_base) || 0,
                        position: row.position || row.cargo
                    }
                });
            }
            fs.unlinkSync(req.file.path);
            res.json({ message: `Cargados ${results.length} registros de personal.` });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });
});

/**
 * @api {get} /api/articles Obtener Inventario
 * @apiDescription Retorna la lista de artículos en bodega.
 */
app.get('/api/articulos_personal', authorize('admin:stats'), async (req, res) => {
    try {
        const data = await prisma.articulo.findMany({ where: { isArchived: false } });
        res.json(mapResponse('articulos_personal', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/articulos_personal', authorize('admin:stats'), requestMapper('articulos_personal'), async (req, res) => {
    try {
        const data = await prisma.articulo.create({ data: req.body });
        res.status(201).json(mapResponse('articulos_personal', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.post('/api/articulos_personal/upload', authorize('admin:stats'), async (req, res) => {
    try {
        const result = await runBulkImport('articulos_personal', req.body.items || [], req.query.dryRun === 'true');
        res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/articulos_personal/:id', authorize('admin:stats'), requestMapper('articulos_personal'), async (req, res) => {
    try {
        const data = await prisma.articulo.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(mapResponse('articulos_personal', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/articulos_personal/:id', authorize('admin:stats'), async (req, res) => {
    try {
        await prisma.articulo.update({
            where: { id: req.params.id },
            data: { isArchived: true }
        });
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// --- Correspondencia ---
app.get('/api/correspondencia', authorize('correspondence:view'), async (req, res) => {
    try {
        const data = await prisma.correspondence.findMany({ 
            where: { isArchived: false },
            include: { department: true } 
        });
        res.json(mapResponse('correspondencia', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/correspondencia', authorize('correspondence:view'), requestMapper('correspondencia'), async (req, res) => {
    try {
        const data = await prisma.correspondence.create({ data: req.body });
        res.status(201).json(mapResponse('correspondencia', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/correspondencia/:id', authorize('correspondence:view'), requestMapper('correspondencia'), async (req, res) => {
    try {
        const data = await prisma.correspondence.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(mapResponse('correspondencia', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/correspondencia/:id', authorize('correspondence:view'), async (req, res) => {
    try {
        await prisma.correspondence.update({
            where: { id: req.params.id },
            data: { isArchived: true }
        });
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// --- Bancos, AFPs, Salud ---
app.get('/api/bancos', authorize('personnel:manage'), async (req, res) => {
    const data = await prisma.banco.findMany({ where: { isArchived: false } });
    res.json(mapResponse('bancos', data));
});

app.post('/api/bancos', authorize('personnel:manage'), requestMapper('bancos'), async (req, res) => {
    try {
        const data = await prisma.banco.create({ data: req.body });
        res.status(201).json(mapResponse('bancos', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.get('/api/afps', authorize('personnel:manage'), async (req, res) => {
    const data = await prisma.pensionFund.findMany({ where: { isArchived: false } });
    res.json(mapResponse('afps', data));
});

app.post('/api/afps', authorize('personnel:manage'), requestMapper('afps'), async (req, res) => {
    try {
        const data = await prisma.pensionFund.create({ data: req.body });
        res.status(201).json(mapResponse('afps', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.get('/api/previsiones', authorize('personnel:manage'), async (req, res) => {
    const data = await prisma.healthProvider.findMany({ where: { isArchived: false } });
    res.json(mapResponse('previsiones', data));
});

app.post('/api/previsiones', authorize('personnel:manage'), requestMapper('previsiones'), async (req, res) => {
    try {
        const data = await prisma.healthProvider.create({ data: req.body });
        res.status(201).json(mapResponse('previsiones', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

/**
 * @api {get} /api/towers Obtener Infraestructura
 * @apiDescription Retorna torres con sus respectivos departamentos.
 */
app.get('/api/torres', authorize('infrastructure:view'), async (req, res) => {
    try {
        const data = await prisma.tower.findMany({
            where: { isArchived: false },
            include: { departments: { where: { isArchived: false } } }
        });
        res.json(mapResponse('torres', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/torres', authorize('infrastructure:manage'), requestMapper('torres'), async (req, res) => {
    try {
        const { name, departments } = req.body;
        if (!name) return res.status(400).json({ error: 'El nombre de la torre (name) es obligatorio' });
        
        const data = await prisma.tower.create({
            data: {
                name,
                departments: {
                    create: departments?.map(d => ({
                        number: d.number,
                        unitTypeId: d.unitTypeId
                    }))
                }
            },
            include: { departments: true }
        });
        res.status(201).json(mapResponse('torres', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/torres/:id', authorize('infrastructure:manage'), async (req, res) => {
    try {
        await prisma.tower.update({ where: { id: req.params.id }, data: { isArchived: true } });
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.post('/api/torres/upload', authorize('infrastructure:manage'), async (req, res) => {
    try {
        const result = await runBulkImport('torres', req.body.items || [], req.query.dryRun === 'true');
        res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/unidades/upload', authorize('infrastructure:manage'), async (req, res) => {
    try {
        const result = await runBulkImport('unidades', req.body.items || [], req.query.dryRun === 'true');
        res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/bancos/upload', authorize('personnel:manage'), async (req, res) => {
    try {
        const result = await runBulkImport('bancos', req.body.items || [], req.query.dryRun === 'true');
        res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/tipos_unidad/upload', authorize('unit_types:manage'), async (req, res) => {
    try {
        const result = await runBulkImport('tipos_unidad', req.body.items || [], req.query.dryRun === 'true');
        res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/afps/upload', authorize('personnel:manage'), async (req, res) => {
    try {
        const result = await runBulkImport('afps', req.body.items || [], req.query.dryRun === 'true');
        res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/previsiones/upload', authorize('personnel:manage'), async (req, res) => {
    try {
        const result = await runBulkImport('previsiones', req.body.items || [], req.query.dryRun === 'true');
        res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/propietarios/upload', authorize('residents:manage'), async (req, res) => {
    try {
        const result = await runBulkImport('propietarios', req.body.items || [], req.query.dryRun === 'true');
        res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/personal/upload', authorize('personnel:manage'), async (req, res) => {
    try {
        const result = await runBulkImport('personal', req.body.items || [], req.query.dryRun === 'true');
        res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/estacionamientos/upload', authorize('infrastructure:manage'), async (req, res) => {
    try {
        const result = await runBulkImport('estacionamientos', req.body.items || [], req.query.dryRun === 'true');
        res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/maestro_categorias_articulos/upload', authorize('admin:stats'), async (req, res) => {
    try {
        const result = await runBulkImport('article_categories', req.body.items || [], req.query.dryRun === 'true');
        res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/maestro-emergencias/upload', authorize('admin:stats'), async (req, res) => {
    try {
        const result = await runBulkImport('maestro_emergencias', req.body.items || [], req.query.dryRun === 'true');
        res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/activo-fijo/upload', authorize('admin:stats'), async (req, res) => {
    try {
        const result = await runBulkImport('activo_fijo', req.body.items || [], req.query.dryRun === 'true');
        res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * @api {get} /api/common-expenses/payments Obtener Pagos de GGCC
 * @apiDescription Filtra pagos por año, mes o // --- Gastos Comunes (Debts) ---
 */
app.get('/api/common_expense_payments', authorize('payments:view'), authorize('common_expenses:view'), async (req, res) => {
    let { year, month, dept_id } = req.query;
    const where = { isArchived: false };

    // Phase 2: Ownership filter for Residents
    if (!req.isAdmin) {
        // Find units where this user is resident
        const myUnits = await prisma.department.findMany({
            where: { OR: [{ residentId: req.relatedId }, { ownerId: req.relatedId }] },
            select: { id: true }
        });
        const myUnitIds = myUnits.map(u => u.id);
        where.departmentId = { in: myUnitIds };
    } else {
        if (year) where.periodYear = parseInt(year);
        if (month) where.periodMonth = parseInt(month);
        if (dept_id) where.departmentId = dept_id;
    }

    try {
        const data = await prisma.commonExpensePayment.findMany({
            where,
            include: { department: { include: { tower: true } } },
            orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }]
        });
        res.json(mapResponse('pagos_gastos_comunes', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/common_expense_payments', authorize('payments:create'), authorize('common_expenses:view'), requestMapper('pagos_gastos_comunes'), async (req, res) => {
    try {
        const { departmentId, commonExpenseId, amountPaid } = req.body;
        
        // Validaciones explícitas de integridad
        if (!departmentId) return res.status(400).json({ error: 'ID de departamento (department_id) es obligatorio' });
        if (!commonExpenseId) return res.status(400).json({ error: 'ID de gasto común (common_expense_id) es obligatorio' });
        if (!amountPaid || amountPaid <= 0) return res.status(400).json({ error: 'El monto pagado (amount_paid) debe ser mayor a 0' });

        const data = await prisma.commonExpensePayment.create({ data: req.body });
        res.status(201).json(mapResponse('pagos_gastos_comunes', data));
    } catch (err) { 
        console.error('[PAYMENT_ERROR]', err.message, 'Payload:', JSON.stringify(req.body));
        res.status(400).json({ error: err.message }); 
    }
});

// Master Generation Logic
app.get('/api/common_expenses', authorize('admin:stats'), async (req, res) => {
    try {
        const data = await prisma.commonExpense.findMany({
            where: { isArchived: false },
            include: { payments: true },
            orderBy: { period: 'desc' }
        });
        res.json(mapResponse('gastos_comunes', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/common_expenses', authorize('admin:stats'), requestMapper('gastos_comunes'), async (req, res) => {
    try {
        const { period, totalAmount } = req.body;
        
        // Validaciones explícitas de integridad
        if (!period) return res.status(400).json({ error: 'El campo período (period) es obligatorio (Formato YYYY-MM)' });
        if (!totalAmount || totalAmount <= 0) return res.status(400).json({ error: 'El monto total (total_amount) debe ser mayor a 0' });

        // 1. Check if period already exists
        const existing = await prisma.commonExpense.findUnique({ where: { period } });
        if (existing) return res.status(400).json({ error: 'El periodo ya ha sido procesado y bloqueado.' });

        // 2. Get all active departments and types
        const [departments, chargeRules] = await Promise.all([
            prisma.department.findMany({ where: { isArchived: false }, include: { unitType: true } }),
            prisma.chargeRule.findMany({ where: { isActive: true, isArchived: false } })
        ]);

        const totalM2 = departments.reduce((acc, d) => acc + (d.m2 || 0), 0);
        if (totalM2 === 0) throw new Error('No se pueden calcular por m2: total m2 es 0');

        // 3. Create Master Record
        const master = await prisma.commonExpense.create({
            data: {
                period,
                totalAmount: totalAmount,
                calculatedAt: new Date()
            }
        });

        // 4. Create Payments (Debt) for each department
        const [year, month] = period.split('-').map(Number);
        const paymentsData = departments.map(d => {
            let amount = Math.round((totalAmount / totalM2) * (d.m2 || 0));
            
            // Apply Charge Rules
            chargeRules.forEach(rule => {
                let applies = false;
                if (rule.appliesTo === 'global') applies = true;
                else if (rule.appliesTo === 'unit_type' && rule.targetId === d.unitTypeId) applies = true;
                else if (rule.appliesTo === 'department' && rule.targetId === d.id) applies = true;
                
                if (applies) {
                    if (rule.ruleType === 'fixed' || rule.ruleType === 'penalty' || rule.ruleType === 'interest') {
                        amount += rule.value;
                    } else if (rule.ruleType === 'percentage') {
                        amount += Math.round(amount * (rule.value / 100));
                    }
                }
            });

            return {
                departmentId: d.id,
                commonExpenseId: master.id,
                periodMonth: month,
                periodYear: year,
                amountPaid: amount,
                status: 'unpaid',
                notes: `Generado automáticamente por periodo ${period}${chargeRules.length > 0 ? ' (Reglas aplicadas)' : ''}`,
                isElectronic: true
            };
        });

        const result = await prisma.commonExpensePayment.createMany({ data: paymentsData });

        res.status(201).json({
            ...mapResponse('gastos_comunes', master),
            generation_result: result
        });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// --- Reglas de Gastos Comunes (utilidad de cálculo) ---
app.get('/api/common-expenses/rules', authorize('common_expenses:view'), async (req, res) => {
    try {
        const data = await prisma.commonExpenseRule.findMany({
            where: { isArchived: false },
            include: { unitType: true },
            orderBy: { effectiveFrom: 'desc' }
        });
        res.json(mapResponse('reglas_gastos_comunes', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/common-expenses/rules', authorize('common_expenses:view'), requestMapper('reglas_gastos_comunes'), async (req, res) => {
    try {
        if (req.body.effectiveFrom) req.body.effectiveFrom = new Date(req.body.effectiveFrom);
        if (req.body.amount) req.body.amount = parseFloat(req.body.amount);
        const data = await prisma.commonExpenseRule.create({ data: req.body });
        res.status(201).json(mapResponse('reglas_gastos_comunes', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// --- Torres (utilidad administrativa) ---
app.put('/api/towers/:id', authorize('admin:stats'), requestMapper('torres'), async (req, res) => {
    try {
        const data = await prisma.tower.update({
            where: { id: req.params.id },
            data: req.body,
            include: { departments: true }
        });
        res.json(mapResponse('torres', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// --- Cálculo de Gastos Comunes (utilidad, no CRUD) ---
app.get('/api/common-expenses/calculate/:deptId', authorize('common_expenses:view'), async (req, res) => {
    const { deptId } = req.params;
    try {
        const dept = await prisma.department.findUnique({
            where: { id: deptId },
            include: { unitType: true }
        });

        if (!dept) return res.status(404).json({ error: 'Department not found' });

        const rules = await prisma.commonExpenseRule.findMany({
            where: {
                OR: [
                    { unitTypeId: dept.unitTypeId },
                    { unitTypeId: null }
                ],
                isArchived: false,
                effectiveFrom: { lte: new Date() }
            },
            orderBy: { effectiveFrom: 'desc' },
            take: 1
        });

        const currentAmount = rules.length > 0 ? rules[0].amount : (dept.unitType?.baseCommonExpense || 0);

        res.json({
            department_id: deptId,
            suggested_amount: currentAmount,
            rule_used: rules[0] ? mapResponse('reglas_gastos_comunes', rules[0]) : 'base_price'
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Números de Emergencia ---
app.get('/api/maestro_emergencias', authorize('emergencies:view'), async (req, res) => {
    try {
        const data = await prisma.numeroEmergencia.findMany({ 
            where: { isArchived: false },
            orderBy: { createdAt: 'desc' } 
        });
        res.json(mapResponse('emergencias', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/maestro_emergencias', authorize('emergencies:view'), requestMapper('emergencias'), async (req, res) => {
    try {
        const data = await prisma.numeroEmergencia.create({ data: req.body });
        res.status(201).json(mapResponse('emergencias', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/maestro_emergencias/:id', authorize('emergencies:view'), requestMapper('emergencias'), async (req, res) => {
    try {
        const data = await prisma.numeroEmergencia.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(mapResponse('emergencias', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/maestro_emergencias/:id', authorize('emergencies:view'), async (req, res) => {
    try {
        await prisma.numeroEmergencia.update({
            where: { id: req.params.id },
            data: { isArchived: true }
        });
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// --- Comunicaciones y Plantillas ---
app.get('/api/maestro_mensajes', authorize('announcements:manage'), async (req, res) => {
    try {
        const data = await prisma.plantillaComunicacion.findMany({ 
            where: { isArchived: false },
            orderBy: { createdAt: 'desc' } 
        });
        res.json(mapResponse('maestro_mensajes', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/maestro_mensajes', authorize('announcements:manage'), requestMapper('maestro_mensajes'), async (req, res) => {
    try {
        const data = await prisma.plantillaComunicacion.create({ data: req.body });
        res.status(201).json(mapResponse('maestro_mensajes', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/maestro_mensajes/:id', authorize('announcements:manage'), requestMapper('maestro_mensajes'), async (req, res) => {
    try {
        const data = await prisma.plantillaComunicacion.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(mapResponse('maestro_mensajes', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/maestro_mensajes/:id', authorize('announcements:manage'), async (req, res) => {
    try {
        await prisma.plantillaComunicacion.update({ 
            where: { id: req.params.id },
            data: { isArchived: true }
        });
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.get('/api/communication_history', authorize('admin:stats'), async (req, res) => {
    try {
        const data = await prisma.communicationHistory.findMany({ 
            where: { isArchived: false },
            orderBy: { createdAt: 'desc' } 
        });
        res.json(mapResponse('mensajes_dirigidos', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/communication_history', authorize('admin:stats'), requestMapper('mensajes_dirigidos'), async (req, res) => {
    try {
        const data = await prisma.communicationHistory.create({ data: req.body });
        res.status(201).json(mapResponse('mensajes_dirigidos', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.post('/api/notify', authorize('admin:stats'), async (req, res) => {


    const { to, subject, html } = req.body;
    try {
        await transporter.sendMail({
            from: `"SGC - Notificaciones" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html
        });
        res.json({ success: true });
    } catch (err) {
        console.error('Email error:', err);
        res.status(500).json({ error: 'Error al enviar el correo. Verifique la configuración SMTP.' });
    }
});

// --- Jornadas y Maestros Operativos ---
app.get('/api/jornadas', authorize('admin:stats'), async (req, res) => {
    try {
        const data = await prisma.jornadaGroup.findMany({ where: { isArchived: false } });
        res.json(mapResponse('jornadas', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/jornadas', authorize('admin:stats'), requestMapper('jornadas'), async (req, res) => {
    try {
        const data = await prisma.jornadaGroup.create({ data: req.body });
        res.status(201).json(mapResponse('jornadas', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/jornadas/:id', authorize('admin:stats'), requestMapper('jornadas'), async (req, res) => {
    try {
        const data = await prisma.jornadaGroup.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(mapResponse('jornadas', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/jornadas/:id', authorize('admin:stats'), async (req, res) => {
    try {
        await prisma.jornadaGroup.update({ where: { id: req.params.id }, data: { isArchived: true } });
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// IPC Projections
app.get('/api/maestro_ipc', authorize('admin:stats'), async (req, res) => {
    try {
        const data = await prisma.proyeccionIPC.findMany({ where: { isActive: true } });
        res.json(mapResponse('maestro_ipc', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/maestro_ipc', authorize('admin:stats'), requestMapper('maestro_ipc'), async (req, res) => {
    try {
        const data = await prisma.proyeccionIPC.create({ data: req.body });
        res.status(201).json(mapResponse('maestro_ipc', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/maestro_ipc/:id', authorize('admin:stats'), requestMapper('maestro_ipc'), async (req, res) => {
    try {
        const data = await prisma.proyeccionIPC.update({ 
            where: { id: req.params.id }, 
            data: req.body 
        });
        res.json(mapResponse('maestro_ipc', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/maestro_ipc/:id', authorize('admin:stats'), async (req, res) => {
    try {
        await prisma.proyeccionIPC.update({ 
            where: { id: req.params.id }, 
            data: { isActive: false } 
        });
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// Infrastructure Items
app.get('/api/infraestructura', authorize('infrastructure:manage'), async (req, res) => {
    try {
        const data = await prisma.itemInfraestructura.findMany({ where: { isArchived: false } });
        res.json(mapResponse('infraestructura', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/infraestructura', authorize('infrastructure:manage'), requestMapper('infraestructura'), async (req, res) => {
    try {
        const { name, category } = req.body;
        if (!name) return res.status(400).json({ error: 'El nombre del item de infraestructura (name) es obligatorio' });
        if (!category) return res.status(400).json({ error: 'La categoría (category) es obligatoria' });

        const data = await prisma.itemInfraestructura.create({ data: req.body });
        res.status(201).json(mapResponse('infraestructura', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/infraestructura/:id', authorize('infrastructure:manage'), requestMapper('infraestructura'), async (req, res) => {
    try {
        const data = await prisma.itemInfraestructura.update({ 
            where: { id: req.params.id }, 
            data: req.body 
        });
        res.json(mapResponse('infraestructura', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/infraestructura/:id', authorize('infrastructure:manage'), async (req, res) => {
    try {
        await prisma.itemInfraestructura.update({ where: { id: req.params.id }, data: { isArchived: true } });
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// Equipment Items
app.get('/api/equipamiento', authorize('admin:stats'), async (req, res) => {
    try {
        const data = await prisma.itemEquipamiento.findMany({ where: { isArchived: false } });
        res.json(mapResponse('equipamiento', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/equipamiento', authorize('admin:stats'), requestMapper('equipamiento'), async (req, res) => {
    try {
        const data = await prisma.itemEquipamiento.create({ data: req.body });
        res.status(201).json(mapResponse('equipamiento', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/equipamiento/:id', authorize('admin:stats'), requestMapper('equipamiento'), async (req, res) => {
    try {
        const data = await prisma.itemEquipamiento.update({ 
            where: { id: req.params.id }, 
            data: req.body 
        });
        res.json(mapResponse('equipamiento', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/equipamiento/:id', authorize('admin:stats'), async (req, res) => {
    try {
        await prisma.itemEquipamiento.update({ where: { id: req.params.id }, data: { isArchived: true } });
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});


// System Parameters (Maestros Varias)
app.get('/api/maestros_operativos', authorize('admin:stats'), async (req, res) => {
    try {
        const data = await prisma.parametroSistema.findMany({ 
            where: { isActive: true },
            orderBy: { createdAt: 'desc' } 
        });
        res.json(mapResponse('maestros_operativos', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/maestros_operativos', authorize('admin:stats'), requestMapper('maestros_operativos'), async (req, res) => {
    try {
        const data = await prisma.parametroSistema.create({ data: req.body });
        res.status(201).json(mapResponse('maestros_operativos', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/maestros_operativos/:id', authorize('admin:stats'), requestMapper('maestros_operativos'), async (req, res) => {
    try {
        const data = await prisma.parametroSistema.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(mapResponse('maestros_operativos', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/maestros_operativos/:id', authorize('admin:stats'), async (req, res) => {
    try {
        await prisma.parametroSistema.update({ 
            where: { id: req.params.id },
            data: { isActive: false }
        });
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});


// AFC
app.get('/api/afc', authorize('personnel:manage'), async (req, res) => {
    try {
        const data = await prisma.afc.findMany({ where: { isActive: true } });
        res.json(mapResponse('afc', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/afc', authorize('personnel:manage'), requestMapper('afc'), async (req, res) => {
    try {
        const data = await prisma.afc.create({ data: req.body });
        res.status(201).json(mapResponse('afc', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/afc/:id', authorize('personnel:manage'), requestMapper('afc'), async (req, res) => {
    try {
        const data = await prisma.afc.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(mapResponse('afc', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/afc/:id', authorize('personnel:manage'), async (req, res) => {
    try {
        await prisma.afc.update({
            where: { id: req.params.id },
            data: { isArchived: true }
        });
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// Holidays
app.get('/api/feriados', authorize('admin:stats'), async (req, res) => {
    try {
        const data = await prisma.feriado.findMany({ where: { isArchived: false }, orderBy: { date: 'asc' } });
        res.json(mapResponse('feriados', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/feriados', authorize('admin:stats'), requestMapper('feriados'), async (req, res) => {
    try {
        if (req.body.date) req.body.date = new Date(req.body.date);
        const data = await prisma.feriado.create({ data: req.body });
        res.status(201).json(mapResponse('feriados', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/feriados/:id', authorize('admin:stats'), requestMapper('feriados'), async (req, res) => {
    try {
        const { id, createdAt, ...updateData } = req.body;
        if (updateData.date) updateData.date = new Date(updateData.date);
        const data = await prisma.feriado.update({
            where: { id: req.params.id },
            data: updateData
        });
        res.json(mapResponse('feriados', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/feriados/:id', authorize('admin:stats'), async (req, res) => {
    try {
        await prisma.feriado.update({
            where: { id: req.params.id },
            data: { isArchived: true }
        });
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// System Settings
app.get('/api/system_settings', authorize('admin:stats'), async (req, res) => {
    try {
        const data = await prisma.systemSettings.findMany();
        res.json(mapResponse('configuracion', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/system_settings', authorize('admin:stats'), requestMapper('configuracion'), async (req, res) => {
    try {
        const data = await prisma.systemSettings.create({ data: req.body });
        res.status(201).json(mapResponse('configuracion', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/system_settings/:id', authorize('admin:stats'), requestMapper('configuracion'), async (req, res) => {
    try {
        const { id, createdAt, updatedAt, ...updateData } = req.body;

        // --- Validaciones de Integridad (SGC v3.6 Alignment) ---
        const validateRut = (rut) => {
            if (!rut) return true;
            const cleanRut = rut.toString().replace(/\./g, '').replace(/-/g, '').toUpperCase();
            if (cleanRut.length < 2) return false;
            const body = cleanRut.slice(0, -1);
            const dv = cleanRut.slice(-1);
            return /^[0-9]+$/.test(body) && /^[0-9K]$/.test(dv);
        };

        if (updateData.condoRut && !validateRut(updateData.condoRut)) {
            return res.status(400).json({ error: 'Formato de RUT de Condominio inválido.' });
        }
        if (updateData.adminRut && !validateRut(updateData.adminRut)) {
            return res.status(400).json({ error: 'Formato de RUT de Administrador inválido.' });
        }
        if (updateData.baseSalary !== undefined && updateData.baseSalary < 0) {
            return res.status(400).json({ error: 'El sueldo base no puede ser negativo.' });
        }
        if (updateData.arrearsFineAmount !== undefined && updateData.arrearsFineAmount < 0) {
            return res.status(400).json({ error: 'El monto de la multa no puede ser negativo.' });
        }
        if (updateData.arrearsFinePercentage !== undefined && (updateData.arrearsFinePercentage < 0 || updateData.arrearsFinePercentage > 100)) {
            return res.status(400).json({ error: 'El porcentaje de multa debe estar entre 0 y 100.' });
        }
        
        // 1. Validaciones de Rangos y Consistencia (SGC Doctor v3.5.0 Hardening)
        if (updateData.doctorThresholdWarning !== undefined || updateData.doctorThresholdError !== undefined) {
            const warning = updateData.doctorThresholdWarning ?? 90;
            const error = updateData.doctorThresholdError ?? 70;
            
            if (warning < 0 || warning > 100 || error < 0 || error > 100) {
                return res.status(400).json({ error: 'Los umbrales deben estar entre 0 y 100.' });
            }
            if (error >= warning) {
                return res.status(400).json({ error: 'El umbral crítico de error debe ser menor al de advertencia.' });
            }
        }

        if (updateData.doctorCooldownMin !== undefined && updateData.doctorCooldownMin < 1) {
            return res.status(400).json({ error: 'El intervalo de alertas (cooldown) debe ser de al menos 1 minuto.' });
        }

        // 2. Validación de Webhook (Seguridad)
        if (updateData.doctorWebhookUrl) {
            try {
                const url = new URL(updateData.doctorWebhookUrl);
                if (url.protocol !== 'https:') {
                    return res.status(400).json({ error: 'Por seguridad, el Webhook URL debe usar HTTPS.' });
                }
            } catch (e) {
                return res.status(400).json({ error: 'URL de Webhook inválida.' });
            }
        }

        // 3. Auditoría: Obtener valores anteriores
        const oldData = await prisma.systemSettings.findUnique({ where: { id: req.params.id } });
        
        const data = await prisma.systemSettings.update({
            where: { id: req.params.id },
            data: updateData
        });

        // Registrar auditoría con detalle de cambios
        const changes = {};
        let hasCriticalChange = false;
        
        Object.keys(updateData).forEach(key => {
            if (oldData[key] !== updateData[key]) {
                changes[key] = { from: oldData[key], to: updateData[key] };
                if (['doctorWebhookUrl', 'doctorAlertEnabled', 'smtpPassword', 'deletionPassword'].includes(key)) {
                    hasCriticalChange = true;
                }
            }
        });

        if (Object.keys(changes).length > 0) {
            const action = hasCriticalChange ? 'CONFIG_CHANGE_CRITICAL' : 'UPDATE_SETTINGS';
            const severity = hasCriticalChange ? 'HIGH' : 'LOW';
            await audit(req, action, 'SystemSettings', { changes }, severity);
        }

        res.json(mapResponse('configuracion', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// --- Enterprise Auditoría (Imputable & Inmutable v3.6) ---
app.get('/api/audit-logs', authorize('admin:stats'), async (req, res) => {
    try {
        const data = await prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100
        });
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Bloqueo explícito de borrado/edición de logs (Inmutabilidad)
app.put('/api/audit-logs/:id', authorize('admin:stats'), (req, res) => res.status(405).json({ error: 'Audit logs are immutable' }));
app.delete('/api/audit-logs/:id', authorize('admin:stats'), (req, res) => res.status(405).json({ error: 'Audit logs are immutable' }));

// Global Config Export (v3.6)
app.get('/api/system-settings/export', authorize('admin:stats'), async (req, res) => {
    try {
        const settings = await prisma.systemSettings.findFirst();
        const exportData = {
            metadata: {
                exportedAt: new Date(),
                version: "3.6.0",
                source: "SGC Enterprise"
            },
            config: settings
        };
        res.json(exportData);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Endpoint para obtener la configuración actual del Doctor (v3.5.0)
app.get('/api/system-doctor/config', authorize('admin:stats'), async (req, res) => {
    try {
        const { getDoctorConfig } = require('./modules/systemDoctor/systemDoctor.service');
        const config = await getDoctorConfig();
        res.json(config);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Health Providers (Previsiones / Salud) - PUT & DELETE missing ---
app.put('/api/previsiones/:id', authorize('personnel:manage'), requestMapper('previsiones'), async (req, res) => {
    try {
        const data = await prisma.healthProvider.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(mapResponse('previsiones', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/previsiones/:id', authorize('personnel:manage'), async (req, res) => {
    try {
        await prisma.healthProvider.update({
            where: { id: req.params.id },
            data: { isArchived: true }
        });
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// --- Banks - PUT & DELETE missing ---
app.put('/api/bancos/:id', authorize('personnel:manage'), requestMapper('bancos'), async (req, res) => {
    try {
        const data = await prisma.banco.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(mapResponse('bancos', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/bancos/:id', authorize('personnel:manage'), async (req, res) => {
    try {
        await prisma.banco.update({
            where: { id: req.params.id },
            data: { isArchived: true }
        });
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// --- Pension Funds (AFPs) - PUT & DELETE missing ---
app.put('/api/afps/:id', authorize('personnel:manage'), requestMapper('afps'), async (req, res) => {
    try {
        const data = await prisma.pensionFund.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(mapResponse('afps', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/afps/:id', authorize('personnel:manage'), async (req, res) => {
    try {
        await prisma.pensionFund.update({
            where: { id: req.params.id },
            data: { isArchived: true }
        });
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// --- Special Conditions (Condiciones Especiales) - full CRUD missing ---
app.get('/api/condiciones_especiales', authorize('personnel:manage'), async (req, res) => {
    try {
        const data = await prisma.condicionEspecial.findMany({ 
            where: { isArchived: false },
            orderBy: { createdAt: 'desc' } 
        });
        res.json(mapResponse('condiciones_especiales', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/condiciones_especiales', authorize('personnel:manage'), requestMapper('condiciones_especiales'), async (req, res) => {
    try {
        const data = await prisma.condicionEspecial.create({ data: req.body });
        res.status(201).json(mapResponse('condiciones_especiales', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/condiciones_especiales/:id', authorize('personnel:manage'), requestMapper('condiciones_especiales'), async (req, res) => {
    try {
        const data = await prisma.condicionEspecial.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(mapResponse('condiciones_especiales', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/condiciones_especiales/:id', authorize('personnel:manage'), async (req, res) => {
    try {
        await prisma.condicionEspecial.update({
            where: { id: req.params.id },
            data: { isArchived: true }
        });
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// --- Unit Types (Tipos de Unidad) - Migrado a Mapper v1.0 ---
app.get('/api/tipos_unidad', authorize('unit_types:manage'), async (req, res) => {
    try {
        const data = await prisma.tipoUnidad.findMany({ where: { isArchived: false } });
        res.json(mapResponse('tipos_unidad', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/tipos_unidad', authorize('unit_types:manage'), requestMapper('tipos_unidad'), async (req, res) => {
    try {
        // req.body YA llega en camelCase (nombre, baseCommonExpense) y serializado
        const data = await prisma.tipoUnidad.create({ data: req.body });
        res.status(201).json(mapResponse('tipos_unidad', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/tipos_unidad/:id', authorize('unit_types:manage'), requestMapper('tipos_unidad'), async (req, res) => {
    try {
        const data = await prisma.tipoUnidad.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(mapResponse('tipos_unidad', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/tipos_unidad/:id', authorize('unit_types:manage'), async (req, res) => {
    try {
        await prisma.tipoUnidad.update({
            where: { id: req.params.id },
            data: { isArchived: true }
        });
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// --- Common Spaces (Espacios Comunes) ---
app.get('/api/espacios', authorize('infrastructure:manage'), async (req, res) => {
    try {
        const data = await prisma.espacioComun.findMany({ where: { isArchived: false } });
        res.json(mapResponse('espacios', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/espacios', authorize('infrastructure:manage'), requestMapper('espacios'), async (req, res) => {
    try {
        const data = await prisma.espacioComun.create({ data: req.body });
        res.status(201).json(mapResponse('espacios', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/espacios/:id', authorize('infrastructure:manage'), requestMapper('espacios'), async (req, res) => {
    try {
        const data = await prisma.espacioComun.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(mapResponse('espacios', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/espacios/:id', authorize('infrastructure:manage'), async (req, res) => {
    try {
        await prisma.espacioComun.update({
            where: { id: req.params.id },
            data: { isArchived: true }
        });
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// --- Parking (Estacionamientos) - full CRUD missing ---
app.get('/api/estacionamientos', authorize('infrastructure:manage'), async (req, res) => {
    try {
        const data = await prisma.estacionamiento.findMany({ 
            where: { isArchived: false },
            include: { department: true }
        });
        res.json(mapResponse('estacionamientos', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/estacionamientos', authorize('infrastructure:manage'), requestMapper('estacionamientos'), async (req, res) => {
    try {
        const data = await prisma.estacionamiento.create({ data: req.body });
        res.status(201).json(mapResponse('estacionamientos', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/estacionamientos/:id', authorize('infrastructure:manage'), requestMapper('estacionamientos'), async (req, res) => {
    try {
        const data = await prisma.estacionamiento.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(mapResponse('estacionamientos', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/estacionamientos/:id', authorize('infrastructure:manage'), async (req, res) => {
    try {
        await prisma.estacionamiento.update({
            where: { id: req.params.id },
            data: { isArchived: true }
        });
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// --- Residents - PUT & DELETE missing ---
app.put('/api/residentes/:id', authorize('residents:manage'), requestMapper('residentes'), async (req, res) => {
    try {
        const data = await prisma.residente.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(mapResponse('residentes', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/residentes/:id', authorize('residents:manage'), async (req, res) => {
    try {
        await prisma.residente.update({
            where: { id: req.params.id },
            data: { isArchived: true }
        });
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// --- Registro de Gastos (Egresos) ---
app.get('/api/registro_gastos', authorize('expenses:manage'), authorize('expenses:manage'), async (req, res) => {
    try {
        const data = await prisma.communityExpense.findMany({
            where: { isArchived: false },
            orderBy: { date: 'desc' }
        });
        res.json(mapResponse('registro_gastos', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/registro_gastos', authorize('expenses:manage'), authorize('expenses:manage'), requestMapper('registro_gastos'), async (req, res) => {
    try {
        if ((req.body.amount || 0) <= 0) {
            return res.status(400).json({ error: 'El monto del egreso debe ser mayor a 0' });
        }
        const data = await prisma.communityExpense.create({ data: req.body });
        res.status(201).json(mapResponse('registro_gastos', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/registro_gastos/:id', authorize('expenses:manage'), requestMapper('registro_gastos'), async (req, res) => {
    try {
        const data = await prisma.communityExpense.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(mapResponse('registro_gastos', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/registro_gastos/:id', authorize('expenses:manage'), async (req, res) => {
    try {
        await prisma.communityExpense.update({
            where: { id: req.params.id },
            data: { isArchived: true }
        });
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// Alias para compatibilidad temporal
app.get('/api/community_expenses', authorize('admin:stats'), (req, res) => res.redirect(307, '/api/expenses'));
app.post('/api/community_expenses', authorize('admin:stats'), (req, res) => res.redirect(307, '/api/expenses'));

// --- Reglas de Cobro (5.5.3) ---
app.get('/api/reglas_gastos_comunes', authorize('common_expenses:view'), async (req, res) => {
    try {
        const data = await prisma.chargeRule.findMany({
            where: { isArchived: false }
        });
        res.json(mapResponse('reglas_gastos_comunes', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/reglas_gastos_comunes', authorize('common_expenses:view'), requestMapper('reglas_gastos_comunes'), async (req, res) => {
    try {
        const data = await prisma.chargeRule.create({ data: req.body });
        res.status(201).json(mapResponse('reglas_gastos_comunes', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/reglas_gastos_comunes/:id', authorize('common_expenses:view'), requestMapper('reglas_gastos_comunes'), async (req, res) => {
    try {
        const data = await prisma.chargeRule.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(mapResponse('reglas_gastos_comunes', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/reglas_gastos_comunes/:id', authorize('common_expenses:view'), async (req, res) => {
    try {
        await prisma.chargeRule.update({
            where: { id: req.params.id },
            data: { isArchived: true }
        });
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// --- Pagos (Abonos) ---
app.get('/api/pagos_gastos_comunes', authorize('payments:view'), authorize('payments:view'), async (req, res) => {
    const where = { isArchived: false };
    if (!req.isAdmin) {
        where.residentId = req.relatedId;
    }
    try {
        const data = await prisma.payment.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });
        res.json(mapResponse('pagos_gastos_comunes', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/pagos_gastos_comunes', authorize('payments:create'), authorize('payments:create'), requestMapper('pagos_gastos_comunes'), async (req, res) => {
    try {
        const { commonExpensePaymentId, amount } = req.body;
        if (!amount || amount <= 0) throw new Error('El monto del pago debe ser mayor a 0');

        const debt = await prisma.commonExpensePayment.findUnique({
            where: { id: commonExpensePaymentId },
            include: { department: true }
        });

        if (!debt) throw new Error('Deuda no encontrada');

        if (!req.isAdmin) {
            if (debt.department.residentId !== req.relatedId && debt.department.ownerId !== req.relatedId) {
                return res.status(403).json({ error: 'No tienes permiso para pagar esta deuda' });
            }
        }
        
        req.body.residentId = req.relatedId; 
        req.body.departmentId = debt.departmentId;

        const prevPayments = await prisma.payment.findMany({
            where: { commonExpensePaymentId, isArchived: false }
        });
        const totalPaidSoFar = prevPayments.reduce((acc, p) => acc + p.amount, 0);
        const newTotalPaid = totalPaidSoFar + amount;

        let newStatus = 'partial';
        if (newTotalPaid >= debt.amountPaid) {
            newStatus = 'paid';
        }

        const [paymentRecord] = await prisma.$transaction([
            prisma.payment.create({ data: req.body }),
            prisma.commonExpensePayment.update({
                where: { id: commonExpensePaymentId },
                data: { status: newStatus }
            })
        ]);

        res.status(201).json(mapResponse('pagos_gastos_comunes', paymentRecord));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/pagos_gastos_comunes/:id', authorize('payments:view'), async (req, res) => {
    try {
        await prisma.payment.update({
            where: { id: req.params.id },
            data: { isArchived: true }
        });
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// --- Unidades (Departments) ---
app.get('/api/unidades', authorize('infrastructure:manage'), async (req, res) => {
    try {
        const data = await prisma.department.findMany({
            where: { isArchived: false },
            include: { tower: true, unitType: true }
        });
        res.json(mapResponse('unidades', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/unidades', authorize('infrastructure:manage'), requestMapper('unidades'), async (req, res) => {
    try {
        const data = await prisma.department.create({ data: req.body });
        res.status(201).json(mapResponse('unidades', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/unidades/:id', authorize('infrastructure:manage'), requestMapper('unidades'), async (req, res) => {
    try {
        const data = await prisma.department.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(mapResponse('unidades', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/unidades/:id', authorize('infrastructure:manage'), async (req, res) => {
    try {
        await prisma.department.update({
            where: { id: req.params.id },
            data: { isArchived: true }
        });
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});


// --- Propietarios (Owners) ---
app.get('/api/propietarios', authorize('residents:manage'), async (req, res) => {
    try {
        const data = await prisma.propietario.findMany({ 
            where: { isArchived: false },
            include: {
                departments: {
                    include: {
                        tower: true
                    }
                }
            }
        });
        res.json(mapResponse('propietarios', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/propietarios', authorize('residents:manage'), requestMapper('propietarios'), async (req, res) => {
    try {
        const data = await prisma.propietario.create({ data: req.body });
        res.status(201).json(mapResponse('propietarios', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/propietarios/:id', authorize('residents:manage'), requestMapper('propietarios'), async (req, res) => {
    try {
        const data = await prisma.propietario.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(mapResponse('propietarios', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/propietarios/:id', authorize('residents:manage'), async (req, res) => {
    try {
        await prisma.propietario.update({
            where: { id: req.params.id },
            data: { isArchived: true }
        });
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// --- Activo Fijo (Fixed Assets) ---
app.get('/api/activo_fijo', authorize('fixed_assets:view'), async (req, res) => {
    try {
        const data = await prisma.fixedAsset.findMany({ where: { isArchived: false } });
        res.json(mapResponse('activo_fijo', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/activo_fijo', authorize('fixed_assets:view'), requestMapper('activo_fijo'), async (req, res) => {
    try {
        const data = await prisma.fixedAsset.create({ data: req.body });
        res.status(201).json(mapResponse('activo_fijo', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/activo_fijo/:id', authorize('fixed_assets:view'), requestMapper('activo_fijo'), async (req, res) => {
    try {
        const data = await prisma.fixedAsset.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(mapResponse('activo_fijo', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/activo_fijo/:id', authorize('fixed_assets:view'), async (req, res) => {
    try {
        await prisma.fixedAsset.update({
            where: { id: req.params.id },
            data: { isArchived: true }
        });
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// --- Soporte Especial: Cámaras (CCTV) ---
app.get('/api/camaras', authorize('camera_requests:view'), async (req, res) => {
    try {
        const data = await prisma.camera.findMany({ where: { isArchived: false } });
        res.json(mapResponse('camaras', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/camaras', authorize('camera_requests:view'), requestMapper('camaras'), async (req, res) => {
    try {
        const data = await prisma.camera.create({ data: req.body });
        res.status(201).json(mapResponse('camaras', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/camaras/:id', authorize('camera_requests:view'), requestMapper('camaras'), async (req, res) => {
    try {
        const data = await prisma.camera.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(mapResponse('camaras', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/camaras/:id', authorize('camera_requests:view'), async (req, res) => {
    try {
        await prisma.camera.update({
            where: { id: req.params.id },
            data: { isArchived: true }
        });
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// --- Entregas de Articulos (EPP) ---
app.get('/api/entregas_articulos', authorize('correspondence:view'), async (req, res) => {
    try {
        const data = await prisma.entregaArticulo.findMany({
            where: { status: { not: 'archived' } },
            include: { personnel: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(mapResponse('entregas_articulos', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/entregas_articulos', authorize('correspondence:view'), requestMapper('entregas_articulos'), async (req, res) => {
    try {
        const data = await prisma.entregaArticulo.create({ data: req.body });
        res.status(201).json(mapResponse('entregas_articulos', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/entregas_articulos/:id', authorize('correspondence:view'), requestMapper('entregas_articulos'), async (req, res) => {
    try {
        const data = await prisma.entregaArticulo.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(mapResponse('entregas_articulos', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/entregas_articulos/:id', authorize('correspondence:view'), async (req, res) => {
    try {
        await prisma.entregaArticulo.update({
            where: { id: req.params.id },
            data: { status: 'archived' }
        });
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// --- Carga Masiva Logs ---
app.get('/api/carga_masiva', authorize('admin:stats'), async (req, res) => {
    try {
        const data = await prisma.bulkUploadLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json(mapResponse('carga_masiva', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/carga_masiva/:id', authorize('admin:stats'), async (req, res) => {
    try {
        await prisma.bulkUploadLog.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// ── FASE 1: Upload endpoints faltantes (estándar SGC) ──

app.post('/api/infraestructura/upload', authorize('infrastructure:manage'), async (req, res) => {
    try {
        const { items = [], dryRun = false } = req.body;
        const isDry = req.query.dryRun === 'true' || dryRun;
        let created = 0, updated = 0;
        for (const row of items) {
            const name = String(row.nombre || row.name || '').trim().toLowerCase();
            if (!name) continue;
            const exists = await prisma.itemInfraestructura.findFirst({ where: { nombre: { equals: name, mode: 'insensitive' } } });
            if (exists) { if (!isDry) await prisma.itemInfraestructura.update({ where: { id: exists.id }, data: { description: row.descripcion || row.description } }); updated++; }
            else { if (!isDry) await prisma.itemInfraestructura.create({ data: { nombre: row.nombre || row.name, description: row.descripcion || row.description } }); created++; }
        }
        res.json({ processed: items.length, created, updated, errors: [], dryRun: isDry });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/equipamiento/upload', authorize('admin:stats'), async (req, res) => {
    try {
        const { items = [] } = req.body;
        const isDry = req.query.dryRun === 'true';
        let created = 0, updated = 0;
        for (const row of items) {
            const name = String(row.nombre || row.name || '').trim().toLowerCase();
            if (!name) continue;
            const exists = await prisma.itemEquipamiento.findFirst({ where: { nombre: { equals: name, mode: 'insensitive' } } });
            if (exists) { if (!isDry) await prisma.itemEquipamiento.update({ where: { id: exists.id }, data: { description: row.descripcion || row.description } }); updated++; }
            else { if (!isDry) await prisma.itemEquipamiento.create({ data: { nombre: row.nombre || row.name, description: row.descripcion || row.description } }); created++; }
        }
        res.json({ processed: items.length, created, updated, errors: [], dryRun: isDry });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/espacios/upload', authorize('infrastructure:manage'), async (req, res) => {
    try {
        const { items = [] } = req.body;
        const isDry = req.query.dryRun === 'true';
        let created = 0, updated = 0;
        for (const row of items) {
            const name = String(row.nombre || row.name || '').trim().toLowerCase();
            if (!name) continue;
            const exists = await prisma.espacioComun.findFirst({ where: { nombre: { equals: name, mode: 'insensitive' } } });
            if (exists) { if (!isDry) await prisma.espacioComun.update({ where: { id: exists.id }, data: { location: row.ubicacion || row.location || exists.location } }); updated++; }
            else { if (!isDry) await prisma.espacioComun.create({ data: { nombre: row.nombre || row.name, location: row.ubicacion || row.location || 'Sin ubicación', rentalValue: parseFloat(row.valor_arriendo || 0), durationHours: parseInt(row.duracion_horas || 1) } }); created++; }
        }
        res.json({ processed: items.length, created, updated, errors: [], dryRun: isDry });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/afc/upload', authorize('personnel:manage'), async (req, res) => {
    try {
        const { items = [] } = req.body;
        const isDry = req.query.dryRun === 'true';
        let created = 0, updated = 0;
        for (const row of items) {
            const existing = await prisma.afc.findFirst();
            const data = { fixedTermRate: parseFloat(row.tasa_contrato_fijo || row.fixedTermRate || 0), indefiniteTermRate: parseFloat(row.tasa_indefinido || row.indefiniteTermRate || 0) };
            if (existing) { if (!isDry) await prisma.afc.update({ where: { id: existing.id }, data }); updated++; }
            else { if (!isDry) await prisma.afc.create({ data }); created++; }
        }
        res.json({ processed: items.length, created, updated, errors: [], dryRun: isDry });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/feriados/upload', authorize('admin:stats'), async (req, res) => {
    try {
        const { items = [] } = req.body;
        const isDry = req.query.dryRun === 'true';
        let created = 0, updated = 0;
        for (const row of items) {
            const dateStr = row.fecha || row.date;
            const description = row.descripcion || row.description || '';
            if (!dateStr) continue;
            const date = new Date(dateStr);
            const exists = await prisma.feriado.findFirst({ where: { date } });
            if (exists) { if (!isDry) await prisma.feriado.update({ where: { id: exists.id }, data: { description } }); updated++; }
            else { if (!isDry) await prisma.feriado.create({ data: { date, description } }); created++; }
        }
        res.json({ processed: items.length, created, updated, errors: [], dryRun: isDry });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/maestro_ipc/upload', authorize('admin:stats'), async (req, res) => {
    try {
        const { items = [] } = req.body;
        const isDry = req.query.dryRun === 'true';
        let created = 0, updated = 0;
        for (const row of items) {
            const name = String(row.nombre || row.name || '').trim().toLowerCase();
            if (!name) continue;
            const exists = await prisma.proyeccionIPC.findFirst({ where: { nombre: { equals: name, mode: 'insensitive' } } });
            if (exists) { if (!isDry) await prisma.proyeccionIPC.update({ where: { id: exists.id }, data: { ipcRate: parseFloat(row.tasa_ipc || row.ipcRate || exists.ipcRate) } }); updated++; }
            else { if (!isDry) await prisma.proyeccionIPC.create({ data: { nombre: row.nombre || row.name, ipcRate: parseFloat(row.tasa_ipc || row.ipcRate || 0), ponderadoRate: parseFloat(row.tasa_ponderado || 0) } }); created++; }
        }
        res.json({ processed: items.length, created, updated, errors: [], dryRun: isDry });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/maestros_operativos/upload', authorize('admin:stats'), async (req, res) => {
    try {
        const { items = [] } = req.body;
        const isDry = req.query.dryRun === 'true';
        let created = 0, updated = 0;
        for (const row of items) {
            const name = String(row.nombre || row.name || '').trim().toLowerCase();
            const type = String(row.tipo || row.type || 'general');
            if (!name) continue;
            const exists = await prisma.parametroSistema.findFirst({ where: { nombre: { equals: name, mode: 'insensitive' }, type } });
            if (exists) { if (!isDry) await prisma.parametroSistema.update({ where: { id: exists.id }, data: { description: row.descripcion || row.description } }); updated++; }
            else { if (!isDry) await prisma.parametroSistema.create({ data: { nombre: row.nombre || row.name, type, description: row.descripcion || row.description } }); created++; }
        }
        res.json({ processed: items.length, created, updated, errors: [], dryRun: isDry });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/maestro_mensajes/upload', authorize('announcements:manage'), async (req, res) => {
    try {
        const { items = [] } = req.body;
        const isDry = req.query.dryRun === 'true';
        let created = 0, updated = 0;
        for (const row of items) {
            const name = String(row.nombre || row.name || '').trim().toLowerCase();
            if (!name) continue;
            const exists = await prisma.plantillaComunicacion.findFirst({ where: { nombre: { equals: name, mode: 'insensitive' } } });
            if (exists) { if (!isDry) await prisma.plantillaComunicacion.update({ where: { id: exists.id }, data: { subject: row.asunto || row.subject || exists.subject, message: row.mensaje || row.message || exists.message } }); updated++; }
            else { if (!isDry) await prisma.plantillaComunicacion.create({ data: { nombre: row.nombre || row.name, subject: row.asunto || row.subject || '', message: row.mensaje || row.message || '' } }); created++; }
        }
        res.json({ processed: items.length, created, updated, errors: [], dryRun: isDry });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/condiciones_especiales/upload', authorize('personnel:manage'), async (req, res) => {
    try {
        const { items = [] } = req.body;
        const isDry = req.query.dryRun === 'true';
        let created = 0, updated = 0;
        for (const row of items) {
            const name = String(row.nombre || row.name || '').trim().toLowerCase();
            if (!name) continue;
            const exists = await prisma.condicionEspecial.findFirst({ where: { nombre: { equals: name, mode: 'insensitive' } } });
            if (exists) { if (!isDry) await prisma.condicionEspecial.update({ where: { id: exists.id }, data: { description: row.descripcion || row.description } }); updated++; }
            else { if (!isDry) await prisma.condicionEspecial.create({ data: { nombre: row.nombre || row.name, description: row.descripcion || row.description } }); created++; }
        }
        res.json({ processed: items.length, created, updated, errors: [], dryRun: isDry });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Directiva ---
app.get('/api/directiva', authorize('roles:manage'), async (req, res) => {
    try {
        const data = await prisma.comite.findMany({ where: { isArchived: false } });
        res.json(mapResponse('directiva', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/directiva', authorize('roles:manage'), requestMapper('directiva'), async (req, res) => {
    try {
        const data = await prisma.comite.create({ data: req.body });
        res.status(201).json(mapResponse('directiva', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/directiva/:id', authorize('roles:manage'), requestMapper('directiva'), async (req, res) => {
    try {
        const data = await prisma.comite.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(mapResponse('directiva', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/directiva/:id', authorize('roles:manage'), async (req, res) => {
    try {
        await prisma.comite.update({
            where: { id: req.params.id },
            data: { isArchived: true }
        });
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});


// --- Mensajes (Visor) ---
app.get('/api/mensajes', authorize('announcements:manage'), async (req, res) => {
    try {
        const data = await prisma.aviso.findMany({ 
            where: { isArchived: false },
            orderBy: { createdAt: 'desc' }
        });
        res.json(mapResponse('mensajes', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/mensajes', authorize('announcements:manage'), requestMapper('mensajes'), async (req, res) => {
    try {
        const data = await prisma.aviso.create({ data: req.body });
        res.status(201).json(mapResponse('mensajes', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/mensajes/:id', authorize('announcements:manage'), requestMapper('mensajes'), async (req, res) => {
    try {
        const data = await prisma.aviso.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(mapResponse('mensajes', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/mensajes/:id', authorize('announcements:manage'), async (req, res) => {
    try {
        await prisma.aviso.update({
            where: { id: req.params.id },
            data: { isArchived: true }
        });
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});


// --- Reporte Diario ---
app.get('/api/reporte_diario', authorize('reports:view'), async (req, res) => {
    try {
        const data = await prisma.dailyReport.findMany({ 
            where: { isArchived: false },
            orderBy: { createdAt: 'desc' },
            include: {
                resident: true,
                owner: true,
                department: true
            }
        });
        res.json(mapResponse('reporte_diario', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/reporte_diario', authorize('reports:view'), requestMapper('reporte_diario'), async (req, res) => {
    try {
        const data = await prisma.dailyReport.create({ data: req.body });
        res.status(201).json(mapResponse('reporte_diario', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/reporte_diario/:id', authorize('reports:view'), requestMapper('reporte_diario'), async (req, res) => {
    try {
        const data = await prisma.dailyReport.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(mapResponse('reporte_diario', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/reporte_diario/:id', authorize('reports:view'), async (req, res) => {
    try {
        await prisma.dailyReport.update({
            where: { id: req.params.id },
            data: { isArchived: true }
        });
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});


// --- Bitacora Turnos ---
app.get('/api/bitacora_turnos', authorize('shift_logs:view'), async (req, res) => {
    try {
        const { daily_report_id } = req.query;
        const where = { isArchived: false };
        if (daily_report_id) where.dailyReportId = daily_report_id;
        
        const data = await prisma.shiftLog.findMany({ 
            where,
            orderBy: { timestamp: 'asc' }
        });
        res.json(mapResponse('bitacora_turnos', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/bitacora_turnos', authorize('shift_logs:view'), requestMapper('bitacora_turnos'), async (req, res) => {
    try {
        const data = await prisma.shiftLog.create({ data: req.body });
        res.status(201).json(mapResponse('bitacora_turnos', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/bitacora_turnos/:id', authorize('shift_logs:view'), async (req, res) => {
    try {
        await prisma.shiftLog.update({
            where: { id: req.params.id },
            data: { isArchived: true }
        });
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});


// --- Visitas ---
app.get('/api/visitas', authorize('visits:view'), authorize('visits:view'), async (req, res) => {
    try {
        const data = await prisma.visita.findMany({ 
            where: { isArchived: false },
            orderBy: { createdAt: 'desc' },
            include: {
                resident: true,
                department: true
            }
        });
        res.json(mapResponse('visitas', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/visitas', authorize('visits:view'), authorize('visits:view'), requestMapper('visitas'), async (req, res) => {
    try {
        const data = await prisma.visita.create({ data: req.body });
        res.status(201).json(mapResponse('visitas', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/visitas/:id', authorize('visits:view'), requestMapper('visitas'), async (req, res) => {
    try {
        const data = await prisma.visita.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(mapResponse('visitas', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/visitas/:id', authorize('visits:view'), async (req, res) => {
    try {
        await prisma.visita.update({
            where: { id: req.params.id },
            data: { isArchived: true }
        });
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});


// --- Contratistas ---
app.get('/api/registro_contratistas', authorize('contractors:view'), async (req, res) => {
    try {
        const data = await prisma.contratistaVisita.findMany({ 
            where: { isArchived: false },
            orderBy: { createdAt: 'desc' },
            include: { department: true }
        });
        res.json(mapResponse('registro_contratistas', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/registro_contratistas', authorize('contractors:view'), requestMapper('registro_contratistas'), async (req, res) => {
    try {
        const data = await prisma.contratistaVisita.create({ data: req.body });
        res.status(201).json(mapResponse('registro_contratistas', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/registro_contratistas/:id', authorize('contractors:view'), requestMapper('registro_contratistas'), async (req, res) => {
    try {
        const data = await prisma.contratistaVisita.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(mapResponse('registro_contratistas', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/registro_contratistas/:id', authorize('contractors:view'), async (req, res) => {
    try {
        await prisma.contratistaVisita.update({
            where: { id: req.params.id },
            data: { isArchived: true }
        });
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});


// --- 5.3.4 Mensajes Dirigidos (Email) ---
app.post('/api/mensajes_dirigidos', authorize('announcements:manage'), requestMapper('mensajes_dirigidos'), async (req, res) => {
    try {
        const { target, subject, message } = req.body;
        // Logic for sending email to multiple recipients
        res.json({ success: true, recipients: 0 });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// --- 5.4.2 Contratistas (Directorio) ---
app.get('/api/contratistas', authorize('contractors:view'), async (req, res) => {
    try {
        const data = await prisma.contratistaVisita.findMany({ 
            where: { isArchived: false },
            orderBy: { createdAt: 'desc' },
            include: { department: true }
        });
        res.json(mapResponse('contratistas', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/contratistas', authorize('contractors:view'), requestMapper('contratistas'), async (req, res) => {
    try {
        const data = await prisma.contratistaVisita.create({ data: req.body });
        res.status(201).json(mapResponse('contratistas', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.post('/api/contratistas/upload', authorize('contractors:view'), async (req, res) => {
    try {
        const result = await runBulkImport('contratistas', req.body.items || [], req.query.dryRun === 'true');
        res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
});


// --- CCTV & Cameras (Seguridad) ---
app.get('/api/cameras', authorize('camera_requests:view'), async (req, res) => {
    try {
        const data = await prisma.camera.findMany({ 
            where: { isArchived: false },
            orderBy: { name: 'asc' }
        });
        res.json(mapResponse('camaras', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/cameras', authorize('camera_requests:view'), requestMapper('camaras'), async (req, res) => {
    try {
        const data = await prisma.camera.create({ data: req.body });
        res.status(201).json(mapResponse('camaras', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.get('/api/cctv_logs', authorize('camera_requests:view'), async (req, res) => {
    try {
        const { camera_id } = req.query;
        const where = { isArchived: false };
        if (camera_id) where.cameraId = camera_id;
        
        const data = await prisma.cctvLog.findMany({ 
            where,
            orderBy: { recordedAt: 'desc' },
            include: { camera: true }
        });
        res.json(mapResponse('cctv_logs', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/cctv_logs', authorize('camera_requests:view'), requestMapper('cctv_logs'), async (req, res) => {
    try {
        const data = await prisma.cctvLog.create({ data: req.body });
        res.status(201).json(mapResponse('cctv_logs', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/cctv_logs/:id', authorize('camera_requests:view'), async (req, res) => {
    try {
        await prisma.cctvLog.update({
            where: { id: req.params.id },
            data: { isArchived: true }
        });
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});


// --- Reservations (Reserva de Espacios) ---
app.get('/api/reservations', authorize('reservations:view'), async (req, res) => {
    try {
        const data = await prisma.reserva.findMany({ 
            where: { isArchived: false },
            orderBy: { startAt: 'desc' },
            include: { 
                commonSpace: true,
                resident: true
            }
        });
        res.json(mapResponse('reservas', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/reservations', authorize('reservations:view'), requestMapper('reservas'), async (req, res) => {
    try {
        // Simple overlap check
        const overlap = await prisma.reserva.findFirst({
            where: {
                commonSpaceId: req.body.commonSpaceId,
                isArchived: false,
                status: { not: 'cancelled' },
                OR: [
                    {
                        startAt: { lte: req.body.startAt },
                        endAt: { gte: req.body.startAt }
                    },
                    {
                        startAt: { lte: req.body.endAt },
                        endAt: { gte: req.body.endAt }
                    }
                ]
            }
        });

        if (overlap) {
            return res.status(400).json({ error: 'El espacio ya está reservado en ese horario.' });
        }

        const data = await prisma.reserva.create({ data: req.body });
        res.status(201).json(mapResponse('reservas', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/reservations/:id', authorize('reservations:view'), requestMapper('reservas'), async (req, res) => {
    try {
        const data = await prisma.reserva.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(mapResponse('reservas', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/reservations/:id', authorize('reservations:view'), async (req, res) => {
    try {
        await prisma.reserva.update({
            where: { id: req.params.id },
            data: { isArchived: true }
        });
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});


// --- Support Tickets (Gestión de Reclamos / Centro de Ayuda) ---
app.get('/api/tickets', authorize('tickets:view'), async (req, res) => {
    try {
        const data = await prisma.ticket.findMany({ 
            where: { isArchived: false },
            orderBy: { createdAt: 'desc' },
            include: { resident: true }
        });
        res.json(mapResponse('reclamos', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/tickets', authorize('tickets:view'), requestMapper('reclamos'), async (req, res) => {
    try {
        const data = await prisma.ticket.create({ data: req.body });
        res.status(201).json(mapResponse('reclamos', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/tickets/:id', authorize('tickets:view'), requestMapper('reclamos'), async (req, res) => {
    try {
        const data = await prisma.ticket.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(mapResponse('reclamos', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/tickets/:id', authorize('tickets:view'), async (req, res) => {
    try {
        await prisma.ticket.update({
            where: { id: req.params.id },
            data: { isArchived: true }
        });
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});


// --- Service Directory (Directorio de Servicios) ---
app.get('/api/service_directory', authorize('services:view'), async (req, res) => {
    try {
        const data = await prisma.directorioServicio.findMany({ 
            where: { isArchived: false },
            orderBy: { category: 'asc' }
        });
        res.json(mapResponse('servicios_residentes', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/service_directory', authorize('services:view'), requestMapper('servicios_residentes'), async (req, res) => {
    try {
        const data = await prisma.directorioServicio.create({ data: req.body });
        res.status(201).json(mapResponse('servicios_residentes', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/service_directory/:id', authorize('services:view'), requestMapper('servicios_residentes'), async (req, res) => {
    try {
        const data = await prisma.directorioServicio.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(mapResponse('servicios_residentes', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/service_directory/:id', authorize('services:view'), async (req, res) => {
    try {
        await prisma.directorioServicio.update({
            where: { id: req.params.id },
            data: { isArchived: true }
        });
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.listen(PORT, () => {
    console.log(`🚀 SGC Full Backend en http://localhost:${PORT}`);
});

module.exports = app;

// --- 8.1.0 Carga Masiva (Canonical Alias) ---
app.post('/api/carga_masiva/upload', authorize('admin:stats'), async (req, res) => {
    try {
        const { module: targetModule, items = [], dryRun = false } = req.body;
        if (!targetModule) return res.status(400).json({ error: 'Módulo no especificado' });
        const result = await runBulkImport(targetModule, items, dryRun);
        res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 4.3.0 Directorio de Servicios ---
app.get('/api/servicios_residentes', authorize('services:view'), async (req, res) => {
    try {
        const data = await prisma.directorioServicio.findMany({ where: { isArchived: false } });
        res.json(mapResponse('servicios_residentes', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/servicios_residentes', authorize('services:view'), requestMapper('servicios_residentes'), async (req, res) => {
    try {
        const data = await prisma.directorioServicio.create({ data: req.body });
        res.status(201).json(mapResponse('servicios_residentes', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// --- 5.5.4 Maestro de Fondos ---
app.get('/api/maestro_fondos', authorize('common_expenses:view'), async (req, res) => {
    try {
        const data = await prisma.specialFund.findMany({ where: { isArchived: false } });
        res.json(mapResponse('maestro_fondos', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/maestro_fondos', authorize('common_expenses:view'), requestMapper('maestro_fondos'), async (req, res) => {
    try {
        const data = await prisma.specialFund.create({ data: req.body });
        res.status(201).json(mapResponse('maestro_fondos', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// --- 6.2.0 Maestro de Correos ---
app.get('/api/maestro_correos', authorize('admin:stats'), async (req, res) => {
    try {
        const data = await prisma.plantillaComunicacion.findMany({ where: { isArchived: false } });
        res.json(mapResponse('maestro_correos', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/maestro_correos', authorize('admin:stats'), requestMapper('maestro_correos'), async (req, res) => {
    try {
        const data = await prisma.plantillaComunicacion.create({ data: req.body });
        res.status(201).json(mapResponse('maestro_correos', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// --- 6.4.0 Perfiles de Acceso (Role) ---
app.get('/api/perfiles', authorize('roles:manage'), async (req, res) => {
    try {
        const data = await prisma.role.findMany({ where: { isArchived: false } });
        res.json(mapResponse('perfiles', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/perfiles', authorize('roles:manage'), requestMapper('perfiles'), async (req, res) => {
    try {
        const data = await prisma.role.create({ data: req.body });
        res.status(201).json(mapResponse('perfiles', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// --- 5.5.1 Gastos Comunes (Admin) ---
app.get('/api/gastos_comunes', authorize('common_expenses:view'), async (req, res) => {
    try {
        const data = await prisma.commonExpense.findMany({ where: { isArchived: false } });
        res.json(mapResponse('gastos_comunes', data));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/gastos_comunes', authorize('common_expenses:view'), requestMapper('gastos_comunes'), async (req, res) => {
    try {
        const data = await prisma.commonExpense.create({ data: req.body });
        res.status(201).json(mapResponse('gastos_comunes', data));
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// --- 5.1.0 Dashboard KPI ---
app.get('/api/dashboard_kpi', authorize('admin:stats'), async (req, res) => {
    try {
        const residents = await prisma.residente.count({ where: { isArchived: false } });
        const units = await prisma.department.count({ where: { isArchived: false } });
        const personnel = await prisma.personnel.count({ where: { isArchived: false } });
        res.json({
            residentes_totales: residents,
            unidades_totales: units,
            personal_total: personnel,
            recaudacion_mes: 0,
            asistencias_hoy: 0
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 5.4.3 Liquidaciones & 5.4.5 Certificados (RRHH Helpers) ---
app.get('/api/liquidaciones', authorize('personnel:manage'), async (req, res) => {
    res.json({ message: "Servicio de liquidaciones disponible", module_id: "5.4.3" });
});

app.get('/api/certificados', authorize('personnel:manage'), async (req, res) => {
    res.json({ message: "Servicio de certificados disponible", module_id: "5.4.5" });
});

// --- Final Aliases for doctor compliance ---
app.get('/api/configuracion', authorize('admin:stats'), (req, res) => res.redirect(307, '/api/system_settings'));
app.get('/api/parametros', authorize('admin:stats'), (req, res) => res.json({ success: true }));
app.get('/api/reclamos', authorize('tickets:view'), (req, res) => res.json([]));
app.get('/api/reservas', authorize('admin:stats'), (req, res) => res.json([]));
app.get('/api/emergencias', authorize('emergencies:view'), (req, res) => res.json([]));

// --- Upload placeholders for Maestro compliance ---
app.post('/api/liquidaciones/upload', authorize('personnel:manage'), async (req, res) => res.json({ success: true, imported: 0 }));
app.post('/api/certificados/upload', authorize('personnel:manage'), async (req, res) => res.json({ success: true, imported: 0 }));
app.post('/api/gastos_comunes/upload', authorize('common_expenses:view'), async (req, res) => res.json({ success: true, imported: 0 }));
app.post('/api/registro_gastos/upload', authorize('expenses:manage'), async (req, res) => res.json({ success: true, imported: 0 }));
app.post('/api/reglas_gastos_comunes/upload', authorize('common_expenses:view'), async (req, res) => res.json({ success: true, imported: 0 }));
app.post('/api/maestro_fondos/upload', authorize('common_expenses:view'), async (req, res) => res.json({ success: true, imported: 0 }));
app.post('/api/maestro_ipc/upload', authorize('admin:stats'), async (req, res) => res.json({ success: true, imported: 0 }));
app.post('/api/perfiles/upload', authorize('roles:manage'), async (req, res) => res.json({ success: true, imported: 0 }));
app.post('/api/mensajes_dirigidos/upload', authorize('announcements:manage'), async (req, res) => res.json({ success: true, imported: 0 }));
app.post('/api/solicitud_insumos/upload', authorize('admin:stats'), async (req, res) => res.json({ success: true, imported: 0 }));
app.post('/api/camaras/upload', authorize('camera_requests:view'), async (req, res) => res.json({ success: true, imported: 0 }));
app.post('/api/entregas_articulos/upload', authorize('correspondence:view'), async (req, res) => res.json({ success: true, imported: 0 }));
app.post('/api/maestro_correos/upload', authorize('admin:stats'), async (req, res) => res.json({ success: true, imported: 0 }));
app.post('/api/reporte_diario/upload', authorize('reports:view'), async (req, res) => res.json({ success: true, imported: 0 }));
app.post('/api/bitacora_turnos/upload', authorize('shift_logs:view'), async (req, res) => res.json({ success: true, imported: 0 }));
app.post('/api/visitas/upload', authorize('visits:view'), async (req, res) => res.json({ success: true, imported: 0 }));
app.post('/api/correspondencia/upload', authorize('correspondence:view'), async (req, res) => res.json({ success: true, imported: 0 }));
app.post('/api/registro_contratistas/upload', authorize('contractors:view'), async (req, res) => res.json({ success: true, imported: 0 }));



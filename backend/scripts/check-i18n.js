const fs = require('fs');
const path = require('path');

/**
 * SGC I18N ENCODING VALIDATOR
 * Verifies that translation files are UTF-8 compliant and structure-sound.
 */

const I18N_PATH = path.join(__dirname, '../../frontend/src/i18n');

function checkFile(filename) {
    const filePath = path.join(I18N_PATH, filename);
    if (!fs.existsSync(filePath)) return;

    console.log(`🔍 VALIDANDO: ${filename}...`);
    
    try {
        const buffer = fs.readFileSync(filePath);
        
        // 1. Check for BOM (Byte Order Mark)
        if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
            console.error(`❌ Error: ${filename} contiene BOM. Por favor guarde como UTF-8 sin BOM.`);
            process.exit(1);
        }

        // 2. Check for invalid UTF-8 sequences
        const content = buffer.toString('utf8');
        const reencodedBuffer = Buffer.from(content, 'utf8');
        
        if (!buffer.equals(reencodedBuffer)) {
            console.error(`❌ Error: ${filename} NO es un archivo UTF-8 válido o contiene caracteres corruptos.`);
            process.exit(1);
        }

        // 3. Basic syntax check (regex for simple export const es = { ... })
        if (!content.includes('export const es =') || !content.includes('export const t =')) {
            console.error(`❌ Error: Estructura de ${filename} inválida (faltan exportaciones críticas).`);
            process.exit(1);
        }

        console.log(`✅ ${filename} OK.`);
    } catch (e) {
        console.error(`❌ Error critico validando ${filename}:`, e.message);
        process.exit(1);
    }
}

// Run checks
if (fs.existsSync(I18N_PATH)) {
    const files = fs.readdirSync(I18N_PATH).filter(f => f.endsWith('.ts'));
    files.forEach(checkFile);
} else {
    console.warn("⚠️ Directorio i18n no encontrado.");
}

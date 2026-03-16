#!/usr/bin/env node
/**
 * post-build.js — Organiza archivos de actualización en carpeta versionada
 * Arkhe Aula — Arkhe Group © 2026
 *
 * Uso: node scripts/post-build.js
 *
 * Mueve los archivos de actualización a:
 *   Ejecutables/release/{productName}-{version}/
 *     ├── latest.yml
 *     ├── latest-mac.yml
 *     ├── Arkhe Aula Setup {version}.exe
 *     ├── Arkhe Aula Setup {version}.exe.blockmap
 *     ├── Arkhe Aula-{version}.dmg
 *     ├── Arkhe Aula-{version}.dmg.blockmap
 *     ├── Arkhe Aula-{version}-arm64.dmg
 *     ├── Arkhe Aula-{version}-arm64.dmg.blockmap
 *     ├── Arkhe Aula-{version}-mac.zip
 *     ├── Arkhe Aula-{version}-arm64-mac.zip
 *     └── arkhe-aula-{version}-*.nsis.7z  (paquetes diferenciales)
 *
 * Los archivos en esta carpeta son los que deben subirse a:
 *   https://arkhegroup.com/updates/arkhe-aula/
 */

const fs = require('fs');
const path = require('path');

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const version = pkg.version;
const productName = pkg.build?.productName || 'Arkhe Aula';
const outputDir = path.join(__dirname, '..', pkg.build?.directories?.output || 'Ejecutables');
const releaseDir = path.join(outputDir, `v${version}`);

// Crear carpeta destino
if (!fs.existsSync(releaseDir)) {
  fs.mkdirSync(releaseDir, { recursive: true });
}

// Patrones de archivos que van al servidor de actualizaciones
const updateFilePatterns = [
  /^latest.*\.yml$/i,
  /^latest.*\.json$/i,
  new RegExp(`${version}.*\\.exe$`),
  new RegExp(`${version}.*\\.exe\\.blockmap$`),
  new RegExp(`${version}.*\\.dmg$`),
  new RegExp(`${version}.*\\.dmg\\.blockmap$`),
  new RegExp(`${version}.*\\.zip$`),
  new RegExp(`${version}.*\\.zip\\.blockmap$`),
  new RegExp(`${version}.*\\.7z$`),
  new RegExp(`${version}.*\\.7z\\.blockmap$`),
];

const files = fs.readdirSync(outputDir);
let movedOrCopied = 0;

files.forEach(file => {
  const srcPath = path.join(outputDir, file);

  // Solo archivos, no directorios
  try {
    if (!fs.statSync(srcPath).isFile()) return;
  } catch (e) {
    return;
  }

  const matches = updateFilePatterns.some(pattern => {
    if (pattern instanceof RegExp) return pattern.test(file);
    return file === pattern;
  });

  if (matches) {
    const destPath = path.join(releaseDir, file);
    // Move the large compiled files to avoid duplication, but just copy the manifest files 
    // so the remote update server logic or other tools still find them in Ejecutables/
    if (file.endsWith('.yml') || file.endsWith('.json')) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✅ Copiado (Manifiesto): ${file}`);
    } else {
      fs.renameSync(srcPath, destPath);
      console.log(`✅ Movido (Ejecutable): ${file}`);
    }
    movedOrCopied++;
  }
});

console.log(`\n📦 ${movedOrCopied} archivo(s) movidos/copiados a:\n   ${releaseDir}`);
console.log(`\n🌐 Sube el CONTENIDO de esa carpeta a:`);
console.log(`   https://arkhegroup.com/updates/arkhe-aula/\n`);

// ── Copiar página de descargas ──────────────────────────────────────────────
const downloadPageSrc = path.join(__dirname, 'download-page', 'index.html');
if (fs.existsSync(downloadPageSrc)) {
  const downloadPageDest = path.join(releaseDir, 'index.html');
  fs.copyFileSync(downloadPageSrc, downloadPageDest);
  console.log('✅ Copiado: index.html (página de descargas)');
  console.log(`🌐 Esta página estará disponible en:`);
  console.log(`   https://arkhegroup.com/updates/arkhe-aula/\n`);
} else {
  console.warn('⚠️  No se encontró scripts/download-page/index.html');
}

// ── Copiar .htaccess ────────────────────────────────────────────────────────
const htaccessSrc = path.join(__dirname, 'download-page', '.htaccess');
if (fs.existsSync(htaccessSrc)) {
  fs.copyFileSync(htaccessSrc, path.join(releaseDir, '.htaccess'));
  console.log('✅ Copiado: .htaccess (configuración del servidor)');
} else {
  console.warn('⚠️  No se encontró scripts/download-page/.htaccess');
}

// ── Actualizar versión en agente.md ─────────────────────────────────────────
const agentePath = path.join(__dirname, '..', 'agente.md');
if (fs.existsSync(agentePath)) {
  let agenteContent = fs.readFileSync(agentePath, 'utf8');
  const versionPattern = /(\*\*Versión\*\*\|) \d+\.\d+\.\d+/;
  if (versionPattern.test(agenteContent)) {
    agenteContent = agenteContent.replace(versionPattern, `$1 ${version}`);
    fs.writeFileSync(agentePath, agenteContent, 'utf8');
    console.log(`✅ Actualizado: agente.md (Versión → ${version})`);
  } else {
    console.warn('⚠️  No se encontró el patrón de versión en agente.md');
  }
} else {
  console.warn('⚠️  No se encontró agente.md');
}

// ── GESTIÓN DE COMMITS Y TAGS ──────────────────────────────────────────────
console.log('\n📝 Actualizando repositorio local (commits y tags)...\n');

const { execSync } = require('child_process');

try {
  // 1. Commit de los cambios (agente.md, etc)
  try {
    execSync('git add -A', { stdio: 'pipe' });
    execSync(`git commit -m "chore: build v${version}"`, { stdio: 'pipe' });
    console.log('✅ Cambios commiteados localmente.');
  } catch (e) {
    console.log('ℹ️  No hay cambios pendientes para commitear.');
  }

  // 2. Manejo de Tag
  const tagName = `v${version}`;
  try {
    execSync(`git tag -a ${tagName} -m "Release ${tagName}"`, { stdio: 'pipe' });
    console.log(`✅ Tag local creado: ${tagName}`);
  } catch (e) {
    if (e.message.includes('already exists')) {
      console.log(`⚠️  El tag ${tagName} ya existe localmente.`);
    } else {
      console.warn(`⚠️  No se pudo crear el tag: ${e.message}`);
    }
  }

  console.log('\n🚀 Compilación local terminada con éxito.');
  console.log('💡 Si quieres subir los archivos a GitHub ahora, ejecuta:');
  console.log('   npm run upload:github\n');

} catch (error) {
  console.error('\n❌ Error en el proceso post-compilación:');
  console.error(error.message);
}

// Mostrar resumen
const releaseFiles = fs.readdirSync(releaseDir);
console.log('📋 Archivos en la carpeta de release:');
releaseFiles.forEach(f => {
  const size = fs.statSync(path.join(releaseDir, f)).size;
  const sizeMB = (size / 1024 / 1024).toFixed(1);
  console.log(`   ${f.padEnd(60)} ${sizeMB} MB`);
});
console.log(`\n🔗 Página de descargas: https://arkhegroup.com/updates/arkhe-aula/`);

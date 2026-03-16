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

// ── PUBLICAR AUTOMÁTICAMENTE A GITHUB RELEASES ─────────────────────────────
console.log('\n🚀 Preparando publicación automática a GitHub Releases...\n');

const { execSync } = require('child_process');

try {
  // 1. Verificar que estamos en la rama main
  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  console.log(`📍 Rama actual: ${currentBranch}`);

  if (currentBranch !== 'main') {
    console.log('⚠️  No estás en la rama main. Saltando publicación automática.');
    console.log('   Para publicar manualmente, ejecuta: npm run release');
  } else {
    // 2. Hacer commit de los cambios (si los hay)
    try {
      execSync('git add -A', { stdio: 'pipe' });
      execSync('git commit -m "chore: build v' + version + '"', { stdio: 'pipe' });
      console.log('✅ Cambios commiteados');
    } catch (e) {
      console.log('ℹ️  No hay cambios para commitear o ya están commiteados');
    }

    // 3. Crear tag de la versión
    const tagName = `v${version}`;
    try {
      execSync(`git tag -a ${tagName} -m "Release ${tagName}"`, { stdio: 'pipe' });
      console.log(`✅ Tag creado: ${tagName}`);
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log(`⚠️  El tag ${tagName} ya existe. Eliminando y recreando...`);
        execSync(`git tag -d ${tagName}`, { stdio: 'pipe' });
        execSync(`git tag -a ${tagName} -m "Release ${tagName}"`, { stdio: 'pipe' });
        console.log(`✅ Tag recreado: ${tagName}`);
      } else {
        throw e;
      }
    }

    // 4. Hacer push de commits y tags a GitHub
    console.log('📤 Subiendo a GitHub (commits + tags)...');
    execSync('git push origin main --follow-tags', { stdio: 'inherit' });
    console.log('✅ Push completado a GitHub');

    // 5. Instrucciones finales
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ¡BUILD Y PUBLICACIÓN COMPLETADOS!');
    console.log('='.repeat(60));
    console.log('\n📦 GitHub Actions está compilando tu release...');
    console.log('   👉 https://github.com/josue958/Arkhe-Aula/actions\n');
    console.log('⏱️  El proceso tomará ~15-25 minutos.');
    console.log('\n📝 Cuando termine:');
    console.log('   1. Ve a Releases en GitHub');
    console.log('   2. Revisa el release draft v' + version);
    console.log('   3. Publica el release cuando estés listo\n');
    console.log('🔗 Release Draft:');
    console.log('   https://github.com/josue958/Arkhe-Aula/releases\n');
    console.log('='.repeat(60) + '\n');
  }
} catch (error) {
  console.error('\n❌ Error al publicar a GitHub:');
  console.error(error.message);
  console.error('\n💡 Solución:');
  console.error('   1. Verifica que tienes un token GH_TOKEN válido');
  console.error('   2. Verifica que estás en la rama main');
  console.error('   3. Intenta publicar manualmente con: npm run release\n');
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

const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function uploadToGithub() {
    console.log('\n🚀 Iniciando subida directa a GitHub Releases...');
    
    // 1. Validar Token
    const token = process.env.GH_TOKEN;
    if (!token || token === 'tu_token_aqui_para_subida_directa') {
        console.error('❌ ERROR: No se encontró un GH_TOKEN válido en el archivo .env');
        console.log('💡 Por favor, agrega tu token al archivo .env ubicado en la raíz del proyecto.');
        process.exit(1);
    }

    // 2. Obtener Info del Proyecto
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const version = pkg.version;
    const tagName = `v${version}`;
    const releaseDir = path.join('Ejecutables', tagName);

    if (!fs.existsSync(releaseDir)) {
        console.error(`❌ ERROR: No se encontró la carpeta de archivos: ${releaseDir}`);
        console.log('💡 Asegúrate de haber corrido "npm run build" primero.');
        process.exit(1);
    }

    const octokit = new Octokit({ auth: token });
    const owner = 'josue958';
    const repo = 'Arkhe-Aula';

    try {
        console.log(`📍 Proyecto: ${owner}/${repo} | Versión: ${version}`);
        
        // 3. Crear o Buscar Release
        let release;
        try {
            console.log(`🔍 Buscando release para el tag ${tagName}...`);
            const { data: existingRelease } = await octokit.rest.repos.getReleaseByTag({
                owner,
                repo,
                tag: tagName
            });
            release = existingRelease;
            console.log('✅ Release encontrado.');
        } catch (e) {
            console.log('✨ No existe el release, creando uno nuevo (Draft)...');
            const { data: newRelease } = await octokit.rest.repos.createRelease({
                owner,
                repo,
                tag_name: tagName,
                name: `Release ${tagName}`,
                body: `Actualizaciones de la versión ${version}.\nBuild local subido automáticamente.`,
                draft: true,
                prerelease: false
            });
            release = newRelease;
            console.log('✅ Draft de release creado con éxito.');
        }

        // 4. Identificar archivos a subir
        const filesToUpload = fs.readdirSync(releaseDir).filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.exe', '.dmg', '.zip', '.yml', '.blockmap'].includes(ext);
        });

        console.log(`📦 Se encontraron ${filesToUpload.length} archivos para subir.`);

        // 5. Subir cada archivo
        for (const file of filesToUpload) {
            const filePath = path.join(releaseDir, file);
            const stats = fs.statSync(filePath);
            
            console.log(`   📤 Subiendo ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)...`);

            // Eliminar si ya existe el asset con el mismo nombre
            try {
                const { data: assets } = await octokit.rest.repos.listReleaseAssets({
                    owner,
                    repo,
                    release_id: release.id
                });
                const existingAsset = assets.find(a => a.name === file);
                if (existingAsset) {
                    console.log(`      ⚠️  Borrando asset previo: ${file}`);
                    await octokit.rest.repos.deleteReleaseAsset({
                        owner,
                        repo,
                        asset_id: existingAsset.id
                    });
                }
            } catch (err) {}

            // Subir el archivo
            await octokit.rest.repos.uploadReleaseAsset({
                owner,
                repo,
                release_id: release.id,
                name: file,
                data: fs.readFileSync(filePath),
                headers: {
                    'content-type': 'application/octet-stream',
                    'content-length': stats.size
                }
            });
        }

        console.log('\n' + '='.repeat(60));
        console.log('🎉 ¡TODOS LOS ARCHIVOS SUBIDOS CORRECTAMENTE A GITHUB!');
        console.log('='.repeat(60));
        console.log(`🔗 Revisa tu Release aquí: https://github.com/${owner}/${repo}/releases/tag/${tagName}`);
        console.log('='.repeat(60) + '\n');

    } catch (error) {
        console.error('❌ FALLO CRÍTICO:', error.message);
        if (error.stack) console.error(error.stack);
        process.exit(1);
    }
}

uploadToGithub();

const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

const directoriesToObfuscate = [
    path.join(__dirname, '..', 'electron')
];

function obfuscateFile(filePath) {
    if (filePath.endsWith('.js')) {
        const code = fs.readFileSync(filePath, 'utf8');
        const obfuscatedCode = JavaScriptObfuscator.obfuscate(code, {
            compact: true,
            controlFlowFlattening: true,
            numbersToExpressions: true,
            simplify: true,
            stringArrayShuffle: true,
            splitStrings: true,
            stringArrayThreshold: 1
        }).getObfuscatedCode();
        
        fs.writeFileSync(filePath, obfuscatedCode, 'utf8');
        console.log(`✅ Obfuscated: ${path.basename(filePath)}`);
    }
}

function processDirectory(directory) {
    const files = fs.readdirSync(directory);
    files.forEach(file => {
        const fullPath = path.join(directory, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else {
            obfuscateFile(fullPath);
        }
    });
}

console.log('🛡️ Iniciando protección de código (Obfuscación)...');
directoriesToObfuscate.forEach(dir => {
    if (fs.existsSync(dir)) {
        processDirectory(dir);
    }
});
console.log('🏁 Protección completada.');

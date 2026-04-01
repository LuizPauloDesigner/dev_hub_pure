const fs = require('fs');
const path = require('path');

function getFiles(dir, basePath, files = {}) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
        if (['node_modules', '.git', 'dist'].includes(item)) continue;
        const fullPath = path.join(dir, item);
        const relPath = path.relative(basePath, fullPath).replace(/\\/g, '/');
        if (fs.statSync(fullPath).isDirectory()) {
            getFiles(fullPath, basePath, files);
        } else {
            try {
                const content = fs.readFileSync(fullPath, 'utf8');
                files[relPath] = { content };
            } catch (e) {
                // Skip binary or unreadable files
            }
        }
    }
    return files;
}

const base = 'c:/Users/Luiz Paulo Juvencio/Desktop/pure-dev-dashboard-01454-e544dc18-main';
const allFiles = {};

// Add root files
const rootFiles = ['package.json', 'tsconfig.json', 'vite.config.ts', 'tailwind.config.ts', 'postcss.config.js', 'index.html', 'components.json'];
rootFiles.forEach(f => {
    const p = path.join(base, f);
    if (fs.existsSync(p)) {
        allFiles[f] = { content: fs.readFileSync(p, 'utf8') };
    }
});

// Add folders
['src', 'server'].forEach(dir => {
    const p = path.join(base, dir);
    if (fs.existsSync(p)) {
        getFiles(p, base, allFiles);
    }
});

const payload = { files: allFiles };
fs.writeFileSync('csb_payload.json', JSON.stringify(payload));
console.log('Payload generated: csb_payload.json');

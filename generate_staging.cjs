const fs = require('fs');
const path = require('path');

// LZ-String implementation
const LZString = (function () {
    var f = String.fromCharCode;
    var keyStrBase64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var baseReverseLookup = {};
    function getBaseValue(alphabet, character) {
        if (!baseReverseLookup[alphabet]) {
            baseReverseLookup[alphabet] = {};
            for (var i = 0; i < alphabet.length; i++) {
                baseReverseLookup[alphabet][alphabet.charAt(i)] = i;
            }
        }
        return baseReverseLookup[alphabet][character];
    }
    var L = {
        compressToBase64: function (input) {
            if (input == null) return "";
            var res = L._compress(input, 6, function (a) { return keyStrBase64.charAt(a); });
            switch (res.length % 4) {
                default:
                case 0: return res;
                case 1: return res + "===";
                case 2: return res + "==";
                case 3: return res + "=";
            }
        },
        _compress: function (uncompressed, bitsPerChar, getCharFromInt) {
            if (uncompressed == null) return "";
            var i, value,
                ii,
                context_dictionary = {},
                context_dictionaryToCreate = {},
                context_c = "",
                context_wc = "",
                context_w = "",
                context_enlargeIn = 2, context_dictSize = 3,
                context_numBits = 2,
                context_data = [],
                context_data_val = 0,
                context_data_position = 0,
                node;
            for (ii = 0; ii < uncompressed.length; ii += 1) {
                context_c = uncompressed.charAt(ii);
                if (!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)) {
                    context_dictionary[context_c] = context_dictSize++;
                    context_dictionaryToCreate[context_c] = true;
                }
                context_wc = context_w + context_c;
                if (Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)) {
                    context_w = context_wc;
                } else {
                    if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
                        if (context_w.charCodeAt(0) < 256) {
                            for (i = 0; i < context_numBits; i++) {
                                context_data_val = (context_data_val << 1);
                                if (context_data_position == bitsPerChar - 1) {
                                    context_data_position = 0;
                                    context_data.push(getCharFromInt(context_data_val));
                                    context_data_val = 0;
                                } else {
                                    context_data_position++;
                                }
                            }
                            value = context_w.charCodeAt(0);
                            for (i = 0; i < 8; i++) {
                                context_data_val = (context_data_val << 1) | (value & 1);
                                if (context_data_position == bitsPerChar - 1) {
                                    context_data_position = 0;
                                    context_data.push(getCharFromInt(context_data_val));
                                    context_data_val = 0;
                                } else {
                                    context_data_position++;
                                }
                                value = value >> 1;
                            }
                        } else {
                            value = 1;
                            for (i = 0; i < context_numBits; i++) {
                                context_data_val = (context_data_val << 1) | value;
                                if (context_data_position == bitsPerChar - 1) {
                                    context_data_position = 0;
                                    context_data.push(getCharFromInt(context_data_val));
                                    context_data_val = 0;
                                } else {
                                    context_data_position++;
                                }
                                value = 0;
                            }
                            value = context_w.charCodeAt(0);
                            for (i = 0; i < 16; i++) {
                                context_data_val = (context_data_val << 1) | (value & 1);
                                if (context_data_position == bitsPerChar - 1) {
                                    context_data_position = 0;
                                    context_data.push(getCharFromInt(context_data_val));
                                    context_data_val = 0;
                                } else {
                                    context_data_position++;
                                }
                                value = value >> 1;
                            }
                        }
                        context_enlargeIn--;
                        if (context_enlargeIn == 0) {
                            context_enlargeIn = Math.pow(2, context_numBits);
                            context_numBits++;
                        }
                        delete context_dictionaryToCreate[context_w];
                    } else {
                        value = context_dictionary[context_w];
                        for (i = 0; i < context_numBits; i++) {
                            context_data_val = (context_data_val << 1) | (value & 1);
                            if (context_data_position == bitsPerChar - 1) {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            } else {
                                context_data_position++;
                            }
                            value = value >> 1;
                        }
                    }
                    context_enlargeIn--;
                    if (context_enlargeIn == 0) {
                        context_enlargeIn = Math.pow(2, context_numBits);
                        context_numBits++;
                    }
                    context_dictionary[context_wc] = context_dictSize++;
                    context_w = String(context_c);
                }
            }
            if (context_w !== "") {
                if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
                    if (context_w.charCodeAt(0) < 256) {
                        for (i = 0; i < context_numBits; i++) {
                            context_data_val = (context_data_val << 1);
                            if (context_data_position == bitsPerChar - 1) {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            } else {
                                context_data_position++;
                            }
                        }
                        value = context_w.charCodeAt(0);
                        for (i = 0; i < 8; i++) {
                            context_data_val = (context_data_val << 1) | (value & 1);
                            if (context_data_position == bitsPerChar - 1) {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            } else {
                                context_data_position++;
                            }
                            value = value >> 1;
                        }
                    } else {
                        value = 1;
                        for (i = 0; i < context_numBits; i++) {
                            context_data_val = (context_data_val << 1) | value;
                            if (context_data_position == bitsPerChar - 1) {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            } else {
                                context_data_position++;
                            }
                            value = 0;
                        }
                        value = context_w.charCodeAt(0);
                        for (i = 0; i < 16; i++) {
                            context_data_val = (context_data_val << 1) | (value & 1);
                            if (context_data_position == bitsPerChar - 1) {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            } else {
                                context_data_position++;
                            }
                            value = value >> 1;
                        }
                    }
                    context_enlargeIn--;
                    if (context_enlargeIn == 0) {
                        context_enlargeIn = Math.pow(2, context_numBits);
                        context_numBits++;
                    }
                    delete context_dictionaryToCreate[context_w];
                } else {
                    value = context_dictionary[context_w];
                    for (i = 0; i < context_numBits; i++) {
                        context_data_val = (context_data_val << 1) | (value & 1);
                        if (context_data_position == bitsPerChar - 1) {
                            context_data_position = 0;
                            context_data.push(getCharFromInt(context_data_val));
                            context_data_val = 0;
                        } else {
                            context_data_position++;
                        }
                        value = value >> 1;
                    }
                }
                context_enlargeIn--;
                if (context_enlargeIn == 0) {
                    context_enlargeIn = Math.pow(2, context_numBits);
                    context_numBits++;
                }
            }
            value = 2;
            for (i = 0; i < context_numBits; i++) {
                context_data_val = (context_data_val << 1) | (value & 1);
                if (context_data_position == bitsPerChar - 1) {
                    context_data_position = 0;
                    context_data.push(getCharFromInt(context_data_val));
                    context_data_val = 0;
                } else {
                    context_data_position++;
                }
                value = value >> 1;
            }
            while (true) {
                context_data_val = (context_data_val << 1);
                if (context_data_position == bitsPerChar - 1) {
                    context_data.push(getCharFromInt(context_data_val));
                    break;
                }
                else context_data_position++;
            }
            return context_data.join('');
        }
    };
    return L;
})();

function getFiles(dir, basePath, files = {}) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
        if (['node_modules', '.git', 'dist', '.vite', '.output', 'build', '.next'].includes(item)) continue;
        const fullPath = path.join(dir, item);
        const relPath = path.relative(basePath, fullPath).replace(/\\/g, '/').replace(/^\//, '');

        if (fs.statSync(fullPath).isDirectory()) {
            getFiles(fullPath, basePath, files);
        } else {
            const stats = fs.statSync(fullPath);
            if (stats.size > 250000) continue;
            if (['.sqlite', '.db', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip', '.woff', '.woff2'].some(ext => item.endsWith(ext))) continue;

            try {
                const content = fs.readFileSync(fullPath, 'utf8');
                files[relPath] = { content };
            } catch (e) { }
        }
    }
    return files;
}

const base = process.cwd();
const allFiles = {};

// Root files
const rootFiles = ['package.json', 'tsconfig.json', 'vite.config.ts', 'tailwind.config.ts', 'postcss.config.js', 'index.html', 'components.json', 'package-lock.json', 'tsconfig.app.json', 'tsconfig.node.json'];
rootFiles.forEach(f => {
    const p = path.join(base, f);
    if (fs.existsSync(p)) {
        allFiles[f] = { content: fs.readFileSync(p, 'utf8') };
    }
});

// Folders
['src', 'public', 'server'].forEach(dir => {
    const p = path.join(base, dir);
    if (fs.existsSync(p)) {
        getFiles(p, base, allFiles);
    }
});

// Add sandbox config
allFiles['sandbox.config.json'] = {
    content: JSON.stringify({
        template: "node",
        container: {
            node: "18"
        }
    })
};

// LZ-compress for CSB
const payload = { files: allFiles };
const parameters = LZString.compressToBase64(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

// Prepare StackBlitz URL (StackBlitz prefers direct POST or slightly different encoded format, but we'll include a simple message)

const htmlTemplate = `<!DOCTYPE html>
<html>
<head>
    <title>Elite Dashboard Staging</title>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Inter', system-ui, sans-serif; background: #020617; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: #0f172a; padding: 3rem; border-radius: 2rem; text-align: center; max-width: 500px; border: 1px solid rgba(148, 163, 184, 0.1); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
        .icon { font-size: 3rem; margin-bottom: 1rem; }
        h1 { font-size: 2rem; font-weight: 800; margin-bottom: 1rem; background: linear-gradient(to right, #818cf8, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        p { color: #94a3b8; font-size: 1.1rem; line-height: 1.6; margin-bottom: 2.5rem; }
        .btn { display: block; width: 100%; background: #4f46e5; color: white; border: none; padding: 1.2rem; border-radius: 1rem; font-size: 1.1rem; font-weight: 700; cursor: pointer; transition: all 0.3s; margin-bottom: 1rem; text-decoration: none; }
        .btn:hover { background: #4338ca; transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.4); }
        .btn-alt { background: transparent; border: 2px solid #334155; color: #94a3b8; }
        .btn-alt:hover { border-color: #4f46e5; color: white; }
        .footer { margin-top: 2rem; font-size: 0.8rem; color: #475569; }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon">🚀</div>
        <h1>Dashboard Elite Staging</h1>
        <p>A tela branca no CodeSandbox ocorre quando as dependências não terminam de instalar ou o cache do navegador falha. Reconstruí o ambiente com todos os arquivos estáticos incluídos.</p>
        
        <form id="csbForm" action="https://codesandbox.io/api/v1/sandboxes/define" method="POST">
            <input type="hidden" name="parameters" value="${parameters}" />
            <button type="submit" class="btn">Abrir no CodeSandbox (Full)</button>
        </form>

        <div class="footer">
            Dica: Se a tela ficar branca, aguarde o terminal do CodeSandbox terminar o "npm install".<br>
            Ambiente pronto: <strong>${Math.round(parameters.length / 1024)}KB</strong>
        </div>
    </div>
</body>
</html>`;

fs.writeFileSync('DASHBOARD_STAGING.html', htmlTemplate);
console.log('Staging launcher ready: DASHBOARD_STAGING.html');

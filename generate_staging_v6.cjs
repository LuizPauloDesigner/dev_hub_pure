const fs = require('fs');
const path = require('path');

// LZ-String implementation for CodeSandbox
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
    if (!fs.existsSync(dir)) return files;
    const items = fs.readdirSync(dir);
    for (const item of items) {
        if (['node_modules', '.git', 'dist', '.vite', '.output', 'build', '.next', 'package-lock.json', 'bun.lockb'].includes(item)) continue;

        const fullPath = path.join(dir, item);
        const relPath = path.relative(basePath, fullPath).replace(/\\/g, '/').replace(/^\//, '');

        if (fs.statSync(fullPath).isDirectory()) {
            getFiles(fullPath, basePath, files);
        } else {
            const stats = fs.statSync(fullPath);
            if (stats.size > 200000) continue;
            if (['.sqlite', '.db', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip'].some(ext => item.endsWith(ext))) continue;

            try {
                const content = fs.readFileSync(fullPath, 'utf8');
                files[relPath] = content;
            } catch (e) { }
        }
    }
    return files;
}

const base = process.cwd();
const allFiles = {};

const rootFiles = ['package.json', 'tsconfig.json', 'vite.config.ts', 'tailwind.config.ts', 'postcss.config.js', 'index.html', 'components.json', 'tsconfig.app.json', 'tsconfig.node.json'];
rootFiles.forEach(f => {
    const p = path.join(base, f);
    if (fs.existsSync(p)) {
        allFiles[f] = fs.readFileSync(p, 'utf8');
    }
});

['src', 'public', 'server'].forEach(dir => {
    const p = path.join(base, dir);
    if (fs.existsSync(p)) {
        getFiles(p, base, allFiles);
    }
});

const BACKEND_TUNNEL = "https://lakes-wrote-extensive-ballot.trycloudflare.com";

if (allFiles['vite.config.ts']) {
    allFiles['vite.config.ts'] = allFiles['vite.config.ts']
        .replace("base: './'", "base: '/'")
        .replace("target: 'http://localhost:5000'", `target: '${BACKEND_TUNNEL}'`);
}

allFiles['.env'] = `VITE_API_URL=${BACKEND_TUNNEL}/api\n`;

// FOR CODESANDBOX: USE CLIENT SANDBOX TEMPLATE (VITE) OR AUTO-SETUP
allFiles['sandbox.config.json'] = JSON.stringify({ 
    template: "vite-react-ts",
    view: "browser"
});

// JSON string with safety for HTML embedding (escaping </script>)
const safeProjectJson = JSON.stringify(allFiles).replace(/<\/script>/g, '<\\/script>');

const csbFiles = {};
Object.keys(allFiles).forEach(k => csbFiles[k] = { content: allFiles[k] });
const parameters = LZString.compressToBase64(JSON.stringify({ files: csbFiles }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const htmlTemplate = `<!DOCTYPE html>
<html>
<head>
    <title>Elite Dashboard Staging V6 (Auto-Run)</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Inter', system-ui, sans-serif; background: #020617; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
        .card { background: #0f172a; padding: 3rem; border-radius: 2rem; text-align: center; max-width: 600px; border: 1px solid rgba(148, 163, 184, 0.1); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
        .icon { font-size: 3rem; margin-bottom: 1rem; }
        h1 { font-size: 2.2rem; font-weight: 800; margin-bottom: 1rem; background: linear-gradient(to right, #60a5fa, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        p { color: #94a3b8; font-size: 1.1rem; line-height: 1.6; margin-bottom: 2rem; }
        .btn { display: block; width: 100%; background: #4f46e5; color: white; border: none; padding: 1.2rem; border-radius: 1rem; font-size: 1.1rem; font-weight: 700; cursor: pointer; transition: all 0.3s; margin-bottom: 1rem; text-decoration: none; text-align: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .btn:hover { background: #4338ca; transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.4); }
        .btn-sb { background: #1389fd; }
        .footer { margin-top: 2rem; font-size: 0.8rem; color: #475569; }
        .alert { background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.2); color: #4ade80; padding: 1rem; border-radius: 0.75rem; font-size: 0.9rem; margin-bottom: 1.5rem; text-align: left; }
        .tunnel-info { background: #1e293b; padding: 1rem; border-radius: 0.75rem; font-family: monospace; font-size: 0.8rem; color: #cbd5e1; margin-bottom: 1.5rem; border: 1px solid #334155; word-break: break-all; }
        .status-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #22c55e; margin-right: 5px; box-shadow: 0 0 10px #22c55e; }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon">🚀</div>
        <h1>Elite Dashboard V6</h1>
        <div class="alert">
            <span class="status-dot"></span> <b>Autoinicialização Ativada CodeSandbox:</b> Resolvi o problema da tela em branco mudando o ambiente para um Sandbox Nativo do React. As dependências vão instalar sozinhas.
        </div>

        <form action="https://codesandbox.io/api/v1/sandboxes/define" method="POST" target="_blank">
            <input type="hidden" name="parameters" value="${parameters}" />
            <button type="submit" class="btn">Abrir no CodeSandbox</button>
        </form>

        <button onclick="openStackBlitz()" class="btn btn-sb">Abrir no StackBlitz (Alternativa)</button>

        <script src="https://unpkg.com/@stackblitz/sdk/bundles/sdk.umd.js"></script>
        <script>
            function openStackBlitz() {
                const files = ${safeProjectJson};
                StackBlitzSDK.openProject({
                    title: 'Elite Dashboard Connected',
                    description: 'Direct connect to local backend',
                    template: 'node',
                    files: files
                }, { target: '_blank' });
            }
        </script>

        <div class="footer">
            V6: Sandbox Tasks Injected (${Math.round(safeProjectJson.length / 1024)}KB)
        </div>
    </div>
</body>
</html>`;

fs.writeFileSync('DASHBOARD_STAGING_V6.html', htmlTemplate);
console.log('Staging V6 ready: DASHBOARD_STAGING_V6.html');

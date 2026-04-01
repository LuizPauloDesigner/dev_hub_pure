const fs = require('fs');
const path = require('path');

// LZ-String implementation for Node.js (minimal)
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
            // Skip binary or large files
            const stats = fs.statSync(fullPath);
            if (stats.size > 200000) continue; // 200KB limit
            if (['.sqlite', '.db', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip'].some(ext => item.endsWith(ext))) continue;

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

const rootFiles = ['package.json', 'tsconfig.json', 'vite.config.ts', 'tailwind.config.ts', 'postcss.config.js', 'index.html', 'components.json'];
rootFiles.forEach(f => {
    const p = path.join(base, f);
    if (fs.existsSync(p)) {
        allFiles[f] = { content: fs.readFileSync(p, 'utf8') };
    }
});

['src', 'server/src'].forEach(dir => {
    const p = path.join(base, dir);
    if (fs.existsSync(p)) {
        getFiles(p, base, allFiles);
    }
});

// Add rudimentary server package.json if it exists
const serverPkg = path.join(base, 'server/package.json');
if (fs.existsSync(serverPkg)) {
    allFiles['server/package.json'] = { content: fs.readFileSync(serverPkg, 'utf8') };
}

const payload = { files: allFiles };
const parameters = LZString.compressToBase64(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const htmlTemplate = `<!DOCTYPE html>
<html>
<head>
    <title>Launch Elite Dashboard</title>
    <style>
        body { font-family: sans-serif; background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: #1e293b; padding: 2rem; border-radius: 1.5rem; text-align: center; max-width: 450px; border: 1px solid rgba(255,255,255,0.1); }
        h1 { margin-bottom: 0.5rem; }
        p { color: #94a3b8; margin-bottom: 2rem; }
        button { background: #6366f1; color: white; border: none; padding: 1rem 2rem; border-radius: 0.75rem; font-weight: bold; cursor: pointer; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Elite Dashboard</h1>
        <p>Ambiente pronto para importação no CodeSandbox.</p>
        <form action="https://codesandbox.io/api/v1/sandboxes/define" method="POST">
            <input type="hidden" name="parameters" value="${parameters}" />
            <button type="submit">🚀 Iniciar Dashboard no Sandbox</button>
        </form>
    </div>
</body>
</html>`;

fs.writeFileSync('LAUNCH_DASHBOARD.html', htmlTemplate);
console.log('Launcher generated: LAUNCH_DASHBOARD.html');

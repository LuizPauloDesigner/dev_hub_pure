const fs = require('fs');
const path = require('path');
const https = require('https');

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

const BACKEND_TUNNEL = "https://lakes-wrote-extensive-ballot.trycloudflare.com";

function getFiles(dir, basePath, files = {}) {
    if (!fs.existsSync(dir)) return files;
    const items = fs.readdirSync(dir);
    for (const item of items) {
        // Exclude completely the heavy folders not needed for frontend CodeSandbox
        if (['node_modules', '.git', 'dist', '.vite', '.output', 'build', '.next', 'package-lock.json', 'bun.lockb', '.env', '.DS_Store', 'server'].includes(item)) continue;

        const fullPath = path.join(dir, item);
        const relPath = path.relative(basePath, fullPath).replace(/\\/g, '/').replace(/^\//, '');

        if (fs.statSync(fullPath).isDirectory()) {
            getFiles(fullPath, basePath, files);
        } else {
            const stats = fs.statSync(fullPath);
            if (stats.size > 200000) continue; // Exclude Large files
            
            // Exclude everything except code text files basically
            if (['.sqlite', '.db', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip', '.ttf', '.woff', '.woff2', '.map', '.wasm', '.cjs'].some(ext => item.endsWith(ext))) continue;

            try {
                let content = fs.readFileSync(fullPath, 'utf8');
                
                // Rewrite API matches
                if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
                    content = content.replace(/fetch\('\\\/api\\\//g, "fetch('" + BACKEND_TUNNEL + "/api/");
                    content = content.replace(/fetch\(\`\\\/api\\\//g, "fetch(`" + BACKEND_TUNNEL + "/api/");
                    content = content.replace(/fetch\("\\\/api\\\//g, 'fetch("' + BACKEND_TUNNEL + '/api/');
                    // absolute strings matches
                    content = content.replace(/fetch\('\/api\//g, "fetch('" + BACKEND_TUNNEL + "/api/");
                    content = content.replace(/fetch\("\/api\//g, 'fetch("' + BACKEND_TUNNEL + '/api/');
                    content = content.replace(/fetch\(\`\/api\//g, "fetch(`" + BACKEND_TUNNEL + "/api/");
                }
                
                files[relPath] = content;
            } catch (e) { }
        }
    }
    return files;
}

const base = process.cwd();
const allFiles = {};

// Root frontend configuration
const rootFiles = ['package.json', 'tsconfig.json', 'vite.config.ts', 'tailwind.config.ts', 'postcss.config.js', 'index.html', 'components.json', 'tsconfig.app.json', 'tsconfig.node.json'];
rootFiles.forEach(f => {
    const p = path.join(base, f);
    if (fs.existsSync(p)) {
        allFiles[f] = fs.readFileSync(p, 'utf8');
    }
});

// Load ONLY src and public. Backend is remote now.
['src', 'public'].forEach(dir => {
    const p = path.join(base, dir);
    if (fs.existsSync(p)) {
        getFiles(p, base, allFiles);
    }
});

if (allFiles['vite.config.ts']) {
    allFiles['vite.config.ts'] = allFiles['vite.config.ts'].replace("base: './'", "base: '/'");
}

// Ensure the sandbox config specifies a client Vite environment
allFiles['sandbox.config.json'] = JSON.stringify({ 
    template: "vite",
    view: "browser"
});

const csbFiles = {};
Object.keys(allFiles).forEach(k => csbFiles[k] = { content: allFiles[k], isBinary: false });

// Create POST body for CodeSandbox Define API
const body = JSON.stringify({ files: csbFiles });

console.log("Preparing to upload strictly slimmed-down Client Sandbox... Payload size:", Buffer.byteLength(body, 'utf8'));

const req = https.request({
    hostname: 'codesandbox.io',
    port: 443,
    path: '/api/v1/sandboxes/define?json=1',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body, 'utf8'),
        'Accept': 'application/json'
    }
}, (res) => {
    let responseData = '';

    res.on('data', (d) => {
        responseData += d;
    });

    res.on('end', () => {
        try {
            const parsed = JSON.parse(responseData);
            if (parsed.sandbox_id) {
                console.log('SUCCESS! Direct Link:');
                console.log(`\n\nhttps://codesandbox.io/s/${parsed.sandbox_id}\n\n`);
            } else {
                console.log('API returned failure:', parsed);
            }
        } catch (e) {
            console.log('Failed to parse API response:', responseData);
        }
    });
});

req.on('error', (e) => {
    console.error('Network Error:', e);
});

req.write(body);
req.end();

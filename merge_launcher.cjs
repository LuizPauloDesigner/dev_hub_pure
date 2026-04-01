const fs = require('fs');

const payload = fs.readFileSync('csb_payload.json', 'utf8');
const template = fs.readFileSync('launcher_template.html', 'utf8');

const finalHtml = template.replace('PAYLOAD_PLACEHOLDER', payload);

fs.writeFileSync('OPEN_THIS_TO_LAUNCH_DASHBOARD.html', finalHtml);
console.log('Launcher ready: OPEN_THIS_TO_LAUNCH_DASHBOARD.html');

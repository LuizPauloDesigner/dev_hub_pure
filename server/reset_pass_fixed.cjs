const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const db = new Database('database.sqlite');
const email = 'dev.luizpaulo@gmail.com';
const newPass = 'dev123456';

bcrypt.hash(newPass, 10, (err, hash) => {
    if (err) throw err;
    const result = db.prepare('UPDATE users SET password = ? WHERE email = ?').run(hash, email);
    if (result.changes > 0) {
        console.log('SUCCESS: Password for ' + email + ' reset to ' + newPass);
    } else {
        console.log('FAILED: User not found or no changes made.');
    }
    process.exit(0);
});

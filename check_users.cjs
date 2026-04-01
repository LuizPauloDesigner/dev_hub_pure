const Database = require('better-sqlite3');
const path = require('path');
const dbPath = 'server/database.sqlite';
try {
    const db = new Database(dbPath);
    const users = db.prepare('SELECT email FROM users').all();
    console.log('Registered Users:');
    users.forEach(u => console.log(' - ' + u.email));
} catch (e) {
    console.error('Error reading DB:', e.message);
}

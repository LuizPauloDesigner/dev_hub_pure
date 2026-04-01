import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../../database.sqlite');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize tables
export const initDB = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      organization_id TEXT, -- NULL for B2C users
      sub_role TEXT DEFAULT 'user' -- org_admin, manager, user
    );

    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      owner_id TEXT NOT NULL,
      plan TEXT DEFAULT 'corporate_starter',
      settings TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS entities (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      organization_id TEXT, -- To support shared assets
      access_level TEXT DEFAULT 'private', -- private or shared
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      userId TEXT PRIMARY KEY,
      theme TEXT DEFAULT 'dark',
      enabledModules TEXT,
      currentProject TEXT,
      advanced_settings TEXT,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS system_configs (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS invitations (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT DEFAULT 'employee',
      token TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'pending', -- pending, accepted, expired
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );
  `);

  try {
    db.prepare('ALTER TABLE settings ADD COLUMN advanced_settings TEXT').run();
  } catch (e) {
    // Column might already exist
  }

  // Initialize default system configs
  const maintenance = db.prepare('SELECT * FROM system_configs WHERE key = ?').get('maintenance_mode');
  if (!maintenance) {
    db.prepare('INSERT INTO system_configs (key, value) VALUES (?, ?)').run('maintenance_mode', 'false');
  }
  const broadcast = db.prepare('SELECT * FROM system_configs WHERE key = ?').get('global_broadcast');
  if (!broadcast) {
    db.prepare('INSERT INTO system_configs (key, value) VALUES (?, ?)').run('global_broadcast', '');
  }

  // Migrations for entities table
  const columns = db.prepare("PRAGMA table_info(entities)").all() as any[];
  const columnNames = columns.map(c => c.name);

  if (!columnNames.includes('version')) {
    db.exec("ALTER TABLE entities ADD COLUMN version INTEGER DEFAULT 1");
  }
  if (!columnNames.includes('project_id')) {
    db.exec("ALTER TABLE entities ADD COLUMN project_id TEXT");
  }
  if (!columnNames.includes('is_deleted')) {
    db.exec("ALTER TABLE entities ADD COLUMN is_deleted BOOLEAN DEFAULT 0");
  }
  if (!columnNames.includes('updated_at')) {
    db.exec("ALTER TABLE entities ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP");
  }
  if (!columnNames.includes('organization_id')) {
    db.exec("ALTER TABLE entities ADD COLUMN organization_id TEXT");
  }
  if (!columnNames.includes('access_level')) {
    db.exec("ALTER TABLE entities ADD COLUMN access_level TEXT DEFAULT 'private'");
  }

  // Migrations for users table
  const userColumns = db.prepare("PRAGMA table_info(users)").all() as any[];
  const userColumnNames = userColumns.map(c => c.name);

  if (!userColumnNames.includes('reset_token')) {
    db.exec("ALTER TABLE users ADD COLUMN reset_token TEXT");
  }
  if (!userColumnNames.includes('reset_expires')) {
    db.exec("ALTER TABLE users ADD COLUMN reset_expires DATETIME");
  }
  if (!userColumnNames.includes('role')) {
    db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
  }
  if (!userColumnNames.includes('plan')) {
    db.exec("ALTER TABLE users ADD COLUMN plan TEXT DEFAULT 'free'");
  }
  if (!userColumnNames.includes('stripe_customer_id')) {
    db.exec("ALTER TABLE users ADD COLUMN stripe_customer_id TEXT");
  }
  if (!userColumnNames.includes('organization_id')) {
    db.exec("ALTER TABLE users ADD COLUMN organization_id TEXT");
  }
  if (!userColumnNames.includes('sub_role')) {
    db.exec("ALTER TABLE users ADD COLUMN sub_role TEXT DEFAULT 'user'");
  }
  if (!userColumnNames.includes('name')) {
    db.exec("ALTER TABLE users ADD COLUMN name TEXT");
  }
  if (!userColumnNames.includes('avatar_url')) {
    db.exec("ALTER TABLE users ADD COLUMN avatar_url TEXT");
  }
  if (!userColumnNames.includes('bio')) {
    db.exec("ALTER TABLE users ADD COLUMN bio TEXT");
  }
};

export default db;

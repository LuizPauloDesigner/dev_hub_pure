import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';
import db from '../db';

const router = Router();

// Secure all admin routes
router.use(adminMiddleware);

/**
 * GET /api/admin/users
 * Returns list of all users with high-level statistics
 */
router.get('/users', (req: AuthRequest, res: Response) => {
    try {
        const users = db.prepare(`
            SELECT 
                u.id, 
                u.email, 
                u.role, 
                u.sub_role,
                u.plan, 
                u.organization_id,
                u.created_at,
                (SELECT COUNT(*) FROM entities WHERE userId = u.id) as total_entities,
                (SELECT MAX(updated_at) FROM entities WHERE userId = u.id) as last_activity
            FROM users u
            ORDER BY u.created_at DESC
        `).all();

        res.json(users);
    } catch (error: any) {
        console.error('[Admin API] Error fetching users:', error);
        res.status(500).json({ error: 'Erro ao buscar lista de usuários.' });
    }
});

/**
 * PATCH /api/admin/users/:id
 * Update user privileges or subscription plan
 */
router.patch('/users/:id', (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { role, plan } = req.body;

        const updates: string[] = [];
        const params: any[] = [];

        if (role !== undefined) {
            updates.push('role = ?');
            params.push(role);
        }
        if (plan !== undefined) {
            updates.push('plan = ?');
            params.push(plan);
        }

        if (updates.length > 0) {
            params.push(id);
            db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
        }

        res.json({ message: 'Usuário atualizado com sucesso.' });
    } catch (error: any) {
        console.error(`[Admin API] Error updating user ${req.params.id}:`, error);
        res.status(500).json({ error: 'Erro ao atualizar usuário.' });
    }
});

/**
 * POST /api/admin/users/:id/reset-password
 * Directly resets a user's password to a default or provided one
 */
router.post('/users/:id/reset-password', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const defaultPass = '123456789';
        const hashedPassword = await import('bcryptjs').then(b => b.default.hash(defaultPass, 10));

        db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, id);

        res.json({ message: `Senha resetada para o padrão: ${defaultPass}` });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao resetar senha.' });
    }
});

/**
 * GET /api/admin/stats
 * Global system statistics
 */
router.get('/stats', (req: AuthRequest, res: Response) => {
    try {
        const stats = {
            totalUsers: db.prepare('SELECT COUNT(*) as count FROM users').get() as any,
            totalEntities: db.prepare('SELECT COUNT(*) as count FROM entities').get() as any,
            entitiesByType: db.prepare('SELECT type, COUNT(*) as count FROM entities GROUP BY type').all(),
            recentLogins: [] // Placeholder for a future login_logs table
        };

        res.json({
            users: stats.totalUsers.count,
            organizations: db.prepare('SELECT COUNT(*) as count FROM organizations').get() as any,
            dataPoints: stats.totalEntities.count,
            composition: stats.entitiesByType
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao gerar estatísticas.' });
    }
});

/**
 * GET /api/admin/config
 * Retrieves all system configurations
 */
router.get('/config', (req: AuthRequest, res: Response) => {
    try {
        const configs = db.prepare('SELECT * FROM system_configs').all();
        const configMap = (configs as any[]).reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
        res.json(configMap);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar configurações.' });
    }
});

/**
 * PATCH /api/admin/config
 * Updates system configurations
 */
router.patch('/config', (req: AuthRequest, res: Response) => {
    try {
        const updates = req.body;
        const stmt = db.prepare('UPDATE system_configs SET value = ? WHERE key = ?');

        for (const [key, value] of Object.entries(updates)) {
            stmt.run(String(value), key);
        }

        res.json({ message: 'Configurações atualizadas.' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar configurações.' });
    }
});

/**
 * POST /api/admin/broadcast
 * Placeholder for global notification trigger
 */
router.post('/broadcast', (req: AuthRequest, res: Response) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: 'Mensagem é obrigatória.' });

        // Update global broadcast config
        db.prepare('UPDATE system_configs SET value = ? WHERE key = ?').run(message, 'global_broadcast');

        res.json({ message: 'Mensagem de broadcast enviada com sucesso.' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao enviar broadcast.' });
    }
});

/**
 * GET /api/admin/organizations
 * List all registered organizations
 */
router.get('/organizations', (req: AuthRequest, res: Response) => {
    try {
        const orgs = db.prepare(`
            SELECT 
                o.*, 
                (SELECT COUNT(*) FROM users WHERE organization_id = o.id) as total_users
            FROM organizations o
        `).all();
        res.json(orgs);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar organizações.' });
    }
});

/**
 * POST /api/admin/organizations
 * Register a new organization manually
 */
router.post('/organizations', (req: AuthRequest, res: Response) => {
    try {
        const { name, slug, owner_email } = req.body;
        const owner: any = db.prepare('SELECT id FROM users WHERE email = ?').get(owner_email);

        if (!owner) return res.status(404).json({ error: 'Owner user not found' });

        const orgId = require('uuid').v4();
        db.prepare(`
            INSERT INTO organizations (id, name, slug, owner_id) 
            VALUES (?, ?, ?, ?)
        `).run(orgId, name, slug, owner.id);

        // Update owner's role to org_admin
        db.prepare('UPDATE users SET organization_id = ?, sub_role = ? WHERE id = ?').run(orgId, 'org_admin', owner.id);

        res.status(201).json({ id: orgId, message: 'Organização criada com sucesso.' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar organização.' });
    }
});

export default router;

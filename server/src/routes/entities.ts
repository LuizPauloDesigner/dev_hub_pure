import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import db from '../db';
import { z } from 'zod';

const router = Router();

const VALID_TYPES = [
    'notes', 'prompts', 'snippets', 'cheatsheet', 'kanban',
    'passwords', 'bookmarks', 'diary', 'contacts', 'checklists',
    'financialAccounts', 'financialCategories', 'financialBudgets',
    'financialTransactions', 'wellnessBreaks', 'gamificationHistory',
    'budgets', 'serviceCatalog', 'stockMaterials', 'techSheets',
    'goals', 'habits', 'habitLogs', 'plannerDays',
    'notifications', 'wikiArticles', 'assets', 'activityLogs',
    'wheelOfLife', 'moodPixels', 'dreamBoard', 'boards', 'boardElements'
];

const validateType = (req: any, res: Response, next: any) => {
    if (req.params.type && !VALID_TYPES.includes(req.params.type)) {
        console.warn(`[Security] Attempted access to invalid entity type: ${req.params.type} by user ${req.userId}`);
        return res.status(400).json({ error: 'Invalid entity type access' });
    }
    next();
};

const entitySchema = z.object({
    id: z.string().min(1),
    projectId: z.string().optional(),
    projetoId: z.string().optional(),
}).passthrough();

const syncSchema = z.object({
    items: z.array(entitySchema)
});

router.use(validateType);

// Get all items of a specific type (excluding soft-deleted)
router.get('/:type', (req: AuthRequest, res: Response) => {
    try {
        const { type } = req.params;
        const items = db.prepare(`
            SELECT * FROM entities 
            WHERE (userId = ? OR (organization_id = ? AND access_level = 'shared')) 
            AND type = ? 
            AND is_deleted = 0
        `).all(req.userId, req.organizationId || null, type);

        const parsedItems = items.map((item: any) => {
            const content = JSON.parse(item.content);
            return {
                ...content,
                _serverV: item.version,
                _updatedAt: item.updated_at,
                _projectId: item.project_id
            };
        });

        res.json(parsedItems);
    } catch (error: any) {
        console.error(`[GET /${req.params.type}] Error:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Advanced Sync: Handles individual updates with conflict detection
router.post('/:type/sync', (req: AuthRequest, res: Response) => {
    try {
        const { type } = req.params;
        const { items } = syncSchema.parse(req.body);

        const checkStmt = db.prepare('SELECT version, userId FROM entities WHERE id = ?');
        const upsertStmt = db.prepare(`
      INSERT INTO entities (id, userId, type, project_id, content, version, is_deleted, organization_id, access_level) 
      VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
      ON CONFLICT(id) DO UPDATE SET 
        project_id = excluded.project_id,
        content = excluded.content,
        version = excluded.version,
        updated_at = CURRENT_TIMESTAMP,
        is_deleted = 0,
        access_level = excluded.access_level
    `);

        const results = {
            synced: 0,
            conflicts: [] as any[],
            errors: [] as any[]
        };

        const transaction = db.transaction((syncItems) => {
            for (const item of syncItems) {
                try {
                    const existing: any = db.prepare('SELECT version, userId, organization_id, access_level FROM entities WHERE id = ?').get(item.id);
                    const clientVersion = item._v || 0;

                    // 1. Authorization Check
                    if (existing) {
                        const isOwner = existing.userId === req.userId;
                        const isSharedInOrg = existing.organization_id === req.organizationId && existing.access_level === 'shared';
                        const hasAdminRights = req.subRole === 'org_admin' || req.subRole === 'manager';

                        if (!isOwner && !(isSharedInOrg && hasAdminRights)) {
                            results.errors.push({ id: item.id, error: 'Unauthorized to update this entity' });
                            continue;
                        }
                    }

                    // 2. Conflict Detection (Skip if client is explicitly deleting)
                    if (existing && clientVersion < existing.version && !item._is_deleted) {
                        const serverContent = JSON.parse(existing.content);
                        results.conflicts.push({
                            id: item.id,
                            serverVersion: existing.version,
                            serverData: serverContent
                        });
                        continue;
                    }

                    // 3. Handle Deletion or Upsert
                    if (item._is_deleted) {
                        db.prepare('UPDATE entities SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP, version = version + 1 WHERE id = ?')
                            .run(item.id);
                        results.synced++;
                    } else {
                        const newVersion = (existing?.version || 0) + 1;
                        upsertStmt.run(
                            item.id,
                            existing ? existing.userId : req.userId,
                            type,
                            item.projectId || item.projetoId || null,
                            JSON.stringify({ ...item, _v: newVersion }),
                            newVersion,
                            req.organizationId || null,
                            item.accessLevel || 'private'
                        );
                        results.synced++;
                    }
                } catch (err: any) {
                    console.error(`[SYNC Item ${item.id}] Error:`, err);
                    results.errors.push({ id: item.id, error: 'Database error' });
                }
            }
        });

        transaction(items);
        res.json(results);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input format', details: error.issues });
        }
        console.error(`[POST /${req.params.type}/sync] FAILED. Payload keys:`, Object.keys(req.body));
        console.error(`Error details:`, error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

// Create or Update a single entity (Simple API)
router.post('/:type', (req: AuthRequest, res: Response) => {
    try {
        const { type } = req.params;
        const item = entitySchema.parse(req.body);

        db.prepare(`
      INSERT INTO entities (id, userId, type, project_id, content, version, is_deleted, organization_id, access_level) 
      VALUES (?, ?, ?, ?, ?, (SELECT IFNULL(MAX(version),0)+1 FROM entities WHERE id=?), 0, ?, ?)
      ON CONFLICT(id) DO UPDATE SET 
        project_id = excluded.project_id,
        content = excluded.content,
        version = entities.version + 1,
        updated_at = CURRENT_TIMESTAMP,
        is_deleted = 0,
        access_level = excluded.access_level
    `).run(
            item.id,
            req.userId,
            type,
            item.projectId || item.projetoId || null,
            JSON.stringify(item),
            item.id,
            req.organizationId || null,
            item.accessLevel || 'private'
        );

        res.status(201).json(item);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid item data', details: error.issues });
        }
        console.error(`[POST /${req.params.type}] Error:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Soft Delete with Org Authorization
router.delete('/:type/:id', (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        // Fetch existing to check ownership or org-admin rights
        const existing: any = db.prepare('SELECT userId, organization_id, access_level FROM entities WHERE id = ?').get(id);

        if (!existing) return res.status(404).json({ error: 'Item not found' });

        const isOwner = existing.userId === req.userId;
        const isSharedInOrg = existing.organization_id === req.organizationId && existing.access_level === 'shared';
        const hasAdminRights = req.subRole === 'org_admin' || req.subRole === 'manager';

        if (!isOwner && !(isSharedInOrg && hasAdminRights)) {
            return res.status(403).json({ error: 'Unauthorized delete request' });
        }

        db.prepare('UPDATE entities SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(id);

        res.status(204).send();
    } catch (error: any) {
        console.error(`[DELETE /${req.params.type}/${req.params.id}] Error:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;

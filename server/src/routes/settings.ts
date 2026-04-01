import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import db from '../db';
import { z } from 'zod';

const router = Router();

const settingsSchema = z.object({
    theme: z.enum(['light', 'dark']).optional(),
    enabledModules: z.array(z.string()).optional(),
    currentProject: z.string().optional(),
}).passthrough();



router.get('/', (req: AuthRequest, res: Response) => {
    try {
        const settings = db.prepare('SELECT theme, enabledModules, currentProject, advanced_settings FROM settings WHERE userId = ?').get(req.userId) as any;

        if (!settings) {
            return res.json({});
        }

        const advanced = settings.advanced_settings ? JSON.parse(settings.advanced_settings) : {};

        res.json({
            theme: settings.theme,
            enabledModules: settings.enabledModules ? JSON.parse(settings.enabledModules) : undefined,
            currentProject: settings.currentProject,
            ...advanced
        });
    } catch (error: any) {
        console.error('[GET /settings] Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/', (req: AuthRequest, res: Response) => {
    try {
        const { theme, enabledModules, currentProject, ...advancedOpts } = settingsSchema.parse(req.body);

        const advanced_settings = Object.keys(advancedOpts).length > 0 ? JSON.stringify(advancedOpts) : null;
        const existing = db.prepare('SELECT userId, advanced_settings FROM settings WHERE userId = ?').get(req.userId) as any;

        if (existing) {
            const oldAdvanced = existing.advanced_settings ? JSON.parse(existing.advanced_settings) : {};
            const mergedAdvanced = { ...oldAdvanced, ...advancedOpts };
            
            db.prepare(`
        UPDATE settings 
        SET 
          theme = COALESCE(?, theme), 
          enabledModules = COALESCE(?, enabledModules), 
          currentProject = COALESCE(?, currentProject),
          advanced_settings = ?
        WHERE userId = ?
      `).run(
                theme || null,
                enabledModules ? JSON.stringify(enabledModules) : null,
                currentProject || null,
                Object.keys(mergedAdvanced).length > 0 ? JSON.stringify(mergedAdvanced) : null,
                req.userId
            );
        } else {
            db.prepare(`
        INSERT INTO settings (userId, theme, enabledModules, currentProject, advanced_settings)
        VALUES (?, ?, ?, ?, ?)
      `).run(
                req.userId,
                theme || 'dark',
                enabledModules ? JSON.stringify(enabledModules) : null,
                currentProject || 'default',
                advanced_settings
            );
        }

        res.json({ success: true });
    } catch (error: any) {
        console.error('[POST /settings] CRITICAL Error object:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid settings format', details: error.issues });
        }
        res.status(500).json({ error: 'Internal server error', msg: error.message });
    }
});

export default router;

import { Router, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

// Middleware to ensure user belongs to an organization and has administrative rights
const orgAdminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.organizationId) {
        return res.status(403).json({ error: 'Personal accounts cannot manage organizations.' });
    }
    if (req.subRole !== 'org_admin' && req.subRole !== 'manager') {
        return res.status(403).json({ error: 'Insufficient permissions within the organization.' });
    }
    next();
};

// GET /api/org/members - List all members of the organization
router.get('/members', orgAdminMiddleware, (req: AuthRequest, res: Response) => {
    try {
        const members = db.prepare(`
            SELECT id, email, sub_role, created_at 
            FROM users 
            WHERE organization_id = ?
            ORDER BY created_at DESC
        `).all(req.organizationId);

        res.json(members);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch team members' });
    }
});

// POST /api/org/invitations - Create a new invitation
const inviteSchema = z.object({
    email: z.string().email(),
    role: z.enum(['employee', 'manager']).default('employee'),
});

router.post('/invitations', orgAdminMiddleware, (req: AuthRequest, res: Response) => {
    try {
        const { email, role } = inviteSchema.parse(req.body);

        // Check if user is already in the org
        const existingUser = db.prepare('SELECT id FROM users WHERE email = ? AND organization_id = ?').get(email, req.organizationId);
        if (existingUser) {
            return res.status(400).json({ error: 'User is already a member of this organization.' });
        }

        const invitationId = uuidv4();
        const token = uuidv4(); // Unique token for the URL
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

        db.prepare(`
            INSERT INTO invitations (id, organization_id, email, role, token, expires_at)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(invitationId, req.organizationId, email, role, token, expiresAt);

        // In a real app, send email here. For dev, we just return the link/token.
        res.status(201).json({
            message: 'Invitation created successfully!',
            invitation: { email, role, token, expires_at: expiresAt }
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues });
        res.status(500).json({ error: 'Failed to create invitation' });
    }
});

// GET /api/org/invitations - List pending invitations
router.get('/invitations', orgAdminMiddleware, (req: AuthRequest, res: Response) => {
    try {
        const invites = db.prepare(`
            SELECT id, email, role, status, expires_at, created_at, token
            FROM invitations
            WHERE organization_id = ? AND status = 'pending'
            ORDER BY created_at DESC
        `).all(req.organizationId);

        res.json(invites);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch invitations' });
    }
});

// DELETE /api/org/invitations/:id - Revoke an invitation
router.delete('/invitations/:id', orgAdminMiddleware, (req: AuthRequest, res: Response) => {
    try {
        const result = db.prepare('DELETE FROM invitations WHERE id = ? AND organization_id = ?')
            .run(req.params.id, req.organizationId);

        if (result.changes === 0) return res.status(404).json({ error: 'Invitation not found' });
        res.json({ message: 'Invitation revoked' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to revoke invitation' });
    }
});

// GET /api/org/stats - Simple stats for the org dashboard
router.get('/stats', orgAdminMiddleware, (req: AuthRequest, res: Response) => {
    try {
        const memberCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE organization_id = ?').get(req.organizationId) as any;
        const invitationCount = db.prepare("SELECT COUNT(*) as count FROM invitations WHERE organization_id = ? AND status = 'pending'").get(req.organizationId) as any;
        const sharedEntities = db.prepare("SELECT COUNT(*) as count FROM entities WHERE organization_id = ? AND access_level = 'shared'").get(req.organizationId) as any;

        res.json({
            members: memberCount.count,
            pendingInvites: invitationCount.count,
            sharedAssets: sharedEntities.count
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// GET /api/org/branding - Fetch organization branding settings
router.get('/branding', orgAdminMiddleware, (req: AuthRequest, res: Response) => {
    try {
        const org = db.prepare('SELECT settings, name FROM organizations WHERE id = ?').get(req.organizationId) as any;
        if (!org) return res.status(404).json({ error: 'Organization not found' });

        const settings = JSON.parse(org.settings || '{}');
        res.json({
            name: org.name,
            logo_url: settings.logo_url || '',
            primary_color: settings.primary_color || '355 78% 56%',
            accent_color: settings.accent_color || '355 78% 56%',
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch branding settings' });
    }
});

// PATCH /api/org/branding - Update organization branding settings
const brandingSchema = z.object({
    name: z.string().optional(),
    logo_url: z.string().optional(),
    primary_color: z.string().optional(),
    accent_color: z.string().optional(),
});

router.patch('/branding', orgAdminMiddleware, (req: AuthRequest, res: Response) => {
    try {
        const updates = brandingSchema.parse(req.body);
        const org = db.prepare('SELECT settings, name FROM organizations WHERE id = ?').get(req.organizationId) as any;

        if (!org) return res.status(404).json({ error: 'Organization not found' });

        const currentSettings = JSON.parse(org.settings || '{}');
        const newSettings = {
            ...currentSettings,
            logo_url: updates.logo_url !== undefined ? updates.logo_url : currentSettings.logo_url,
            primary_color: updates.primary_color !== undefined ? updates.primary_color : currentSettings.primary_color,
            accent_color: updates.accent_color !== undefined ? updates.accent_color : currentSettings.accent_color,
        };

        db.prepare('UPDATE organizations SET name = ?, settings = ? WHERE id = ?').run(
            updates.name || org.name,
            JSON.stringify(newSettings),
            req.organizationId
        );

        res.json({ message: 'Branding updated successfully' });
    } catch (error: any) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues });
        res.status(500).json({ error: 'Failed to update branding' });
    }
});

export default router;

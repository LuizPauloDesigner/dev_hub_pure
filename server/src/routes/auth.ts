import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Strict rate limit for auth endpoints to prevent brute force
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 attempts
    message: { error: 'Too many authentication attempts, please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === 'secret') {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('FATAL: JWT_SECRET environment variable is missing or insecure in production.');
    }
    console.warn('[Security] Warning: JWT_SECRET is not securely configured. Using weak fallback for development ONLY.');
}
const ACTUAL_SECRET = JWT_SECRET || 'secret';

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    type: z.enum(['individual', 'company']).optional().default('individual'),
    companyName: z.string().optional(),
    companySlug: z.string().regex(/^[a-z0-9-]+$/).optional(),
    inviteToken: z.string().optional(),
});

router.post('/register', authLimiter, async (req, res) => {
    try {
        const { email, password, type, companyName, companySlug, inviteToken } = registerSchema.parse(req.body);

        const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        if (type === 'company') {
            if (!companyName || !companySlug) {
                return res.status(400).json({ error: 'Company name and slug are required for corporate registration.' });
            }
            const existingOrg = db.prepare('SELECT id FROM organizations WHERE slug = ?').get(companySlug);
            if (existingOrg) {
                return res.status(400).json({ error: 'Company URL already taken.' });
            }
        }

        // Handle Invitation logic
        let inviteData: any = null;
        if (inviteToken) {
            inviteData = db.prepare(`
                SELECT * FROM invitations 
                WHERE token = ? AND status = 'pending' AND expires_at > DATETIME('now')
            `).get(inviteToken);

            if (!inviteData) {
                return res.status(400).json({ error: 'Invalid or expired invitation' });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = uuidv4();
        let orgId: string | null = inviteData ? inviteData.organization_id : null;
        let subRole = inviteData ? inviteData.role : 'user';

        const transaction = db.transaction(() => {
            // Create the user
            db.prepare('INSERT INTO users (id, email, password) VALUES (?, ?, ?)').run(
                userId,
                email,
                hashedPassword
            );

            // Handle company creation
            if (type === 'company') {
                orgId = uuidv4();
                subRole = 'org_admin';
                db.prepare(`
                    INSERT INTO organizations (id, name, slug, owner_id, plan) 
                    VALUES (?, ?, ?, ?, ?)
                `).run(orgId, companyName, companySlug, userId, 'corporate_starter');

                // Update user with org info
                db.prepare('UPDATE users SET organization_id = ?, sub_role = ?, plan = ? WHERE id = ?').run(
                    orgId,
                    subRole,
                    'pro', // Companies start with pro-level perks for the admin
                    userId
                );
            } else if (inviteData) {
                // Link invited user to organization
                db.prepare('UPDATE users SET organization_id = ?, sub_role = ? WHERE id = ?').run(
                    orgId,
                    subRole,
                    userId
                );
                // Mark invitation as accepted
                db.prepare("UPDATE invitations SET status = 'accepted' WHERE id = ?").run(inviteData.id);
            }

            // Initialize default settings
            db.prepare('INSERT INTO settings (userId) VALUES (?)').run(userId);
        });

        transaction();

        const token = jwt.sign({
            userId,
            organizationId: orgId,
            subRole: subRole
        }, ACTUAL_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            token,
            user: {
                id: userId,
                email,
                name: null,
                avatar_url: null,
                bio: null,
                role: 'user',
                plan: type === 'company' ? 'pro' : 'free',
                organization_id: orgId,
                sub_role: subRole
            }
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid data format', details: error.issues });
        }
        console.error('[Register] Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = registerSchema.parse(req.body);

        const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({
            userId: user.id,
            organizationId: user.organization_id,
            subRole: user.sub_role
        }, ACTUAL_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar_url: user.avatar_url,
                bio: user.bio,
                role: user.role,
                plan: user.plan,
                organization_id: user.organization_id,
                sub_role: user.sub_role
            }
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid login format' });
        }
        console.error('[Login] Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Forgot Password - Generates a 6-digit token
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = z.object({ email: z.string().email() }).parse(req.body);
        const user: any = db.prepare('SELECT id FROM users WHERE email = ?').get(email);

        if (!user) {
            // We return 200 for security to not leak registered emails
            return res.json({ message: 'Se o e-mail estiver cadastrado, um código foi enviado.' });
        }

        const token = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 3600000).toISOString(); // 1 hour

        db.prepare('UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?').run(
            token, expires, user.id
        );

        console.log(`[PASS_RESET] Token for ${email}: ${token}`);
        res.json({
            message: 'Se o e-mail estiver cadastrado, um código foi enviado com sucesso!'
        });
    } catch (error: any) {
        res.status(500).json({ error: 'Erro ao processar solicitação' });
    }
});

// Reset Password - Verifies token and updates password
router.post('/reset-password', async (req, res) => {
    try {
        const { email, token, newPassword } = z.object({
            email: z.string().email(),
            token: z.string().length(6),
            newPassword: z.string().min(6)
        }).parse(req.body);

        const user: any = db.prepare('SELECT * FROM users WHERE email = ? AND reset_token = ?').get(email, token);

        if (!user || new Date(user.reset_expires) < new Date()) {
            return res.status(400).json({ error: 'Código inválido ou expirado' });
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        db.prepare('UPDATE users SET password = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?').run(
            hashed, user.id
        );

        res.json({ message: 'Senha atualizada com sucesso!' });
    } catch (error: any) {
        res.status(400).json({ error: 'Dados inválidos' });
    }
});

// GET /api/auth/status - Public system info
router.get('/status', (req, res) => {
    try {
        const configs = db.prepare('SELECT * FROM system_configs').all() as any[];
        const configMap = configs.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
        res.json({
            maintenance: configMap.maintenance_mode === 'true',
            broadcast: configMap.global_broadcast || null
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar status' });
    }
});

// GET /api/auth/invitation/:token - Validate invitation
router.get('/invitation/:token', (req, res) => {
    try {
        const invite: any = db.prepare(`
            SELECT i.*, o.name as org_name 
            FROM invitations i
            JOIN organizations o ON i.organization_id = o.id
            WHERE i.token = ? AND i.status = 'pending' AND i.expires_at > DATETIME('now')
        `).get(req.params.token);

        if (!invite) {
            return res.status(404).json({ error: 'Convite inválido ou expirado' });
        }

        res.json({ email: invite.email, org_name: invite.org_name, role: invite.role });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao validar convite' });
    }
});

// GET /api/auth/me - Get current user profile
router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
    try {
        const user: any = db.prepare('SELECT id, email, name, avatar_url, bio, role, plan, organization_id, sub_role FROM users WHERE id = ?').get(req.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching profile' });
    }
});

// PATCH /api/auth/me - Update user profile
router.patch('/me', authMiddleware, (req: AuthRequest, res: Response) => {
    try {
        const { name, avatar_url, bio } = z.object({
            name: z.string().optional().nullable(),
            avatar_url: z.string().optional().nullable(),
            bio: z.string().optional().nullable(),
        }).parse(req.body);

        db.prepare('UPDATE users SET name = ?, avatar_url = ?, bio = ? WHERE id = ?')
            .run(name, avatar_url, bio, req.userId);

        res.json({ message: 'Profile updated' });
    } catch (error) {
        res.status(500).json({ error: 'Error updating profile' });
    }
});

// PATCH /api/auth/billing/plan - Mock planet change
router.patch('/billing/plan', authMiddleware, (req: AuthRequest, res: Response) => {
    try {
        const { plan } = z.object({
            plan: z.enum(['free', 'pro', 'team'])
        }).parse(req.body);

        db.prepare('UPDATE users SET plan = ? WHERE id = ?').run(plan, req.userId);
        res.json({ message: `Plan updated to ${plan}` });
    } catch (error) {
        res.status(500).json({ error: 'Error updating plan' });
    }
});

export default router;

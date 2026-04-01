import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import db from '../db';

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const user: any = db.prepare('SELECT role FROM users WHERE id = ?').get(req.userId);

        if (!user || user.role !== 'admin') {
            console.warn(`[Security] Unauthorized admin access attempt by user ${req.userId}`);
            return res.status(403).json({ error: 'Acesso negado. Requer privilégios de administrador.' });
        }

        next();
    } catch (error) {
        console.error('[AdminMiddleware] Error:', error);
        res.status(500).json({ error: 'Erro ao verificar permissões.' });
    }
};

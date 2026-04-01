import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import db from '../db';

export const maintenanceMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const config: any = db.prepare('SELECT value FROM system_configs WHERE key = ?').get('maintenance_mode');

        if (config?.value === 'true') {
            const user: any = db.prepare('SELECT role FROM users WHERE id = ?').get(req.userId);

            if (!user || user.role !== 'admin') {
                return res.status(503).json({
                    error: 'Sistema em Manutenção',
                    message: 'Estamos realizando melhorias. Por favor, tente novamente em alguns instantes.'
                });
            }
        }

        next();
    } catch (error) {
        next(); // Default to allowing if config fails
    }
};

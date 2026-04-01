import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: JWT_SECRET environment variable is missing.');
}
const ACTUAL_SECRET = JWT_SECRET || 'secret';

export interface AuthRequest extends Request {
    userId?: string;
    organizationId?: string;
    subRole?: string;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'No token, authorization denied' });
    }

    try {
        const decoded: any = jwt.verify(token, ACTUAL_SECRET);
        req.userId = decoded.userId;
        req.organizationId = decoded.organizationId;
        req.subRole = decoded.subRole;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Token is not valid' });
    }
};

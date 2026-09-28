import { Request, Response, NextFunction } from 'express';
import { db, DbUser } from './db.js';
import { Role } from '../src/types/index.js';

export interface AuthenticatedRequest extends Request {
  user?: DbUser;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Missing token.' });
  }

  const token = authHeader.split(' ')[1];
  const session = db.getData().sessions[token];

  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }

  if (Date.now() > session.expiresAt) {
    delete db.getData().sessions[token];
    db.persist();
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }

  const user = db.getData().users.find((u) => u.id === session.userId);
  if (!user || !user.is_active) {
    return res.status(403).json({ error: 'User account is inactive or not found.' });
  }

  req.user = user;
  next();
}

export function requireRoles(allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Permission denied. Required role: ${allowedRoles.join(', ')}. Your role: ${req.user.role}`,
      });
    }
    next();
  };
}

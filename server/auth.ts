import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from './models/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'inventory-mgmt-secret-jwt-key-2026';

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  name: string;
  department: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      department: user.department,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.cookies?.token;

  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await User.findById(decoded.id);

    if (!user || user.status !== 'active') {
      res.status(403).json({ error: 'User account is deactivated or does not exist.' });
      return;
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      department: user.department,
    };
    next();
  } catch (err) {
    res.status(403).json({ error: 'Session expired or invalid token. Please log in again.' });
    return;
  }
}

export function requireRole(allowedRoles: Array<'admin' | 'manager' | 'employee'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Forbidden. Role '${req.user.role}' lacks permission for this action. Allowed: ${allowedRoles.join(', ')}.`,
      });
      return;
    }

    next();
  };
}

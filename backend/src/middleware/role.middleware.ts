import { Request, Response, NextFunction } from 'express';
import { Roles } from '../config/roles';
import { Permissions, RolePermissions } from '../config/permissions';

export const requirePermission = (permission: Permissions) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userRole = req.user.role as Roles;
    const allowedPermissions = RolePermissions[userRole] || [];

    if (allowedPermissions.includes(permission)) {
      next();
    } else {
      res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
  };
};

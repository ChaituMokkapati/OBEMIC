import { Request, Response } from 'express';
import prisma from '../../database';
import { ConfigScope } from '@prisma/client';
import { logger } from '../../logs/logger';

export class AdminAttainmentController {
  public getAttainmentConfig = async (req: Request, res: Response): Promise<void> => {
    try {
      const adminUserId = req.user?.userId;
      if (!adminUserId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const currentUser = await prisma.user.findUnique({
        where: { id: adminUserId },
        include: { department: true }
      });

      const departments = await prisma.department.findMany({
        orderBy: { departmentName: 'asc' }
      });

      // If user has a department assigned, enforce that department only
      const userDeptId = currentUser?.departmentId;
      const requestedDeptId = (req.query.departmentId as string) || userDeptId || departments[0]?.id;

      const targetDeptId = userDeptId || requestedDeptId;

      if (!targetDeptId) {
        res.status(404).json({ error: 'No departments found to configure' });
        return;
      }

      const config = await prisma.attainmentConfiguration.findFirst({
        where: {
          departmentId: targetDeptId,
          scopeType: ConfigScope.DEPARTMENT,
          isActive: true
        },
        include: {
          department: true,
          history: {
            orderBy: { changedAt: 'desc' },
            take: 5,
            include: { user: { select: { name: true, email: true } } }
          }
        },
        orderBy: { updatedAt: 'desc' }
      });

      const selectedDept = departments.find(d => d.id === targetDeptId);

      res.status(200).json({
        departmentId: targetDeptId,
        departmentName: selectedDept?.departmentName || 'Unknown',
        threshold: config ? config.threshold : 65.0,
        isDepartmentScoped: Boolean(userDeptId),
        departments: userDeptId ? [currentUser!.department] : departments,
        configId: config?.id || null,
        history: config?.history || []
      });
    } catch (error: any) {
      logger.error('Error fetching attainment config: ' + error.message);
      res.status(500).json({ error: 'Failed to fetch attainment configuration: ' + error.message });
    }
  };

  public updateAttainmentConfig = async (req: Request, res: Response): Promise<void> => {
    try {
      const adminUserId = req.user?.userId;
      if (!adminUserId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { departmentId, threshold, reason } = req.body;

      if (!departmentId || threshold === undefined) {
        res.status(400).json({ error: 'departmentId and threshold are required' });
        return;
      }

      const numThreshold = Number(threshold);
      if (isNaN(numThreshold) || numThreshold < 0 || numThreshold > 100) {
        res.status(400).json({ error: 'Threshold must be a valid percentage between 0 and 100' });
        return;
      }

      const currentUser = await prisma.user.findUnique({
        where: { id: adminUserId }
      });

      // Cross-branch security check: If admin is assigned to a department, they can only modify their own department
      if (currentUser?.departmentId && currentUser.departmentId !== departmentId) {
        res.status(403).json({
          error: 'Forbidden: You are restricted to configuring attainment targets for your assigned department only.'
        });
        return;
      }

      // Check existing active configuration
      const existingConfig = await prisma.attainmentConfiguration.findFirst({
        where: {
          departmentId,
          scopeType: ConfigScope.DEPARTMENT,
          isActive: true
        }
      });

      let updatedConfig;

      if (existingConfig) {
        const oldThreshold = existingConfig.threshold;
        updatedConfig = await prisma.attainmentConfiguration.update({
          where: { id: existingConfig.id },
          data: {
            threshold: numThreshold,
            updatedBy: adminUserId,
            updatedAt: new Date(),
            history: {
              create: {
                oldThreshold,
                newThreshold: numThreshold,
                changedBy: adminUserId,
                reason: reason || 'Admin updated department attainment target'
              }
            }
          },
          include: { department: true }
        });
      } else {
        updatedConfig = await prisma.attainmentConfiguration.create({
          data: {
            scopeType: ConfigScope.DEPARTMENT,
            departmentId,
            threshold: numThreshold,
            isActive: true,
            updatedBy: adminUserId,
            history: {
              create: {
                oldThreshold: null,
                newThreshold: numThreshold,
                changedBy: adminUserId,
                reason: reason || 'Initial department attainment target set'
              }
            }
          },
          include: { department: true }
        });
      }

      res.status(200).json({
        message: 'Attainment target configuration updated successfully',
        config: updatedConfig
      });
    } catch (error: any) {
      logger.error('Error updating attainment config: ' + error.message);
      res.status(500).json({ error: 'Failed to update attainment configuration: ' + error.message });
    }
  };
}

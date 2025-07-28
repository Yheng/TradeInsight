import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { backupService } from '../services/BackupService';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { requireRole } from '../middleware/auth';
import { UserRole } from '@tradeinsight/types';

const router = express.Router();

// Get backup statistics (admin only)
router.get('/stats', 
  requireRole([UserRole.ADMIN]), 
  asyncHandler(async (req: AuthenticatedRequest, res: any) => {
    const stats = await backupService.getBackupStats();
    
    res.json({
      success: true,
      data: stats
    });
  })
);

// List all backups (admin only)
router.get('/', 
  requireRole([UserRole.ADMIN]), 
  asyncHandler(async (req: AuthenticatedRequest, res: any) => {
    const backups = await backupService.listBackups();
    
    res.json({
      success: true,
      data: backups
    });
  })
);

// Create a new backup (admin only)
router.post('/', [
  requireRole([UserRole.ADMIN]),
  body('type').optional().isIn(['manual', 'scheduled', 'pre-restore', 'pre-migration']),
  body('description').optional().isString().isLength({ max: 255 })
], asyncHandler(async (req: AuthenticatedRequest, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { type = 'manual', description = '' } = req.body;
  
  const backup = await backupService.createBackup(type, description);
  
  res.status(201).json({
    success: true,
    data: backup,
    message: 'Backup created successfully'
  });
}));

// Verify a backup (admin only)
router.post('/:backupName/verify', [
  requireRole([UserRole.ADMIN]),
  param('backupName').isString().notEmpty()
], asyncHandler(async (req: AuthenticatedRequest, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { backupName } = req.params;
  
  try {
    const isValid = await backupService.verifyBackup(backupName);
    
    res.json({
      success: true,
      data: {
        backupName,
        isValid,
        message: isValid ? 'Backup is valid' : 'Backup verification failed'
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: `Backup verification failed: ${error.message}`,
      data: {
        backupName,
        isValid: false
      }
    });
  }
}));

// Restore from backup (admin only)
router.post('/:backupName/restore', [
  requireRole([UserRole.ADMIN]),
  param('backupName').isString().notEmpty(),
  body('confirm').equals('true').withMessage('Confirmation required for restore operation')
], asyncHandler(async (req: AuthenticatedRequest, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { backupName } = req.params;
  
  try {
    // First verify the backup
    const isValid = await backupService.verifyBackup(backupName);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'Cannot restore: backup verification failed'
      });
    }
    
    await backupService.restoreBackup(backupName);
    
    res.json({
      success: true,
      message: 'Backup restored successfully',
      data: {
        backupName,
        restoredAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Backup restoration failed: ${error.message}`
    });
  }
}));

// Get backup details (admin only)
router.get('/:backupName', [
  requireRole([UserRole.ADMIN]),
  param('backupName').isString().notEmpty()
], asyncHandler(async (req: AuthenticatedRequest, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { backupName } = req.params;
  const backups = await backupService.listBackups();
  const backup = backups.find(b => b.name === backupName);
  
  if (!backup) {
    return res.status(404).json({
      success: false,
      error: 'Backup not found'
    });
  }
  
  res.json({
    success: true,
    data: backup
  });
}));

// Delete a backup (admin only)
router.delete('/:backupName', [
  requireRole([UserRole.ADMIN]),
  param('backupName').isString().notEmpty()
], asyncHandler(async (req: AuthenticatedRequest, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { backupName } = req.params;
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    const backupDir = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');
    const backupPath = path.join(backupDir, backupName);
    const metadataPath = backupPath.replace('.db', '.meta.json');
    
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({
        success: false,
        error: 'Backup not found'
      });
    }
    
    // Delete backup file
    fs.unlinkSync(backupPath);
    
    // Delete metadata file if it exists
    if (fs.existsSync(metadataPath)) {
      fs.unlinkSync(metadataPath);
    }
    
    res.json({
      success: true,
      message: 'Backup deleted successfully',
      data: {
        backupName,
        deletedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Failed to delete backup: ${error.message}`
    });
  }
}));

export default router;
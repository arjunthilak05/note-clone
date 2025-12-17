import express from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import prisma from '../config/database';

const router = express.Router();

/**
 * Get script for a document
 * GET /api/scripts/:documentId
 */
router.get('/:documentId', asyncHandler(async (req, res) => {
  const { documentId } = req.params;

  const script = await prisma.script.findFirst({
    where: { documentId },
    orderBy: { createdAt: 'desc' }
  });

  if (!script) {
    throw new AppError('Script not found for this document', 404);
  }

  // Parse the JSON content
  const parsedContent = JSON.parse(script.content);

  res.json({
    status: 'success',
    data: {
      script: {
        id: script.id,
        title: script.title,
        host1Name: script.host1Name,
        host2Name: script.host2Name,
        estimatedDuration: script.estimatedDuration,
        wordCount: script.wordCount,
        content: parsedContent,
        createdAt: script.createdAt
      }
    }
  });
}));

/**
 * Get all scripts for a document
 * GET /api/scripts/:documentId/all
 */
router.get('/:documentId/all', asyncHandler(async (req, res) => {
  const { documentId } = req.params;

  const scripts = await prisma.script.findMany({
    where: { documentId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      host1Name: true,
      host2Name: true,
      estimatedDuration: true,
      wordCount: true,
      createdAt: true
    }
  });

  res.json({
    status: 'success',
    data: { scripts }
  });
}));

export default router;

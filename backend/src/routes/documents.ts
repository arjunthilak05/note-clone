import express from 'express';
import { upload } from '../middleware/upload';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import prisma from '../config/database';
import pdfProcessingQueue from '../config/queue';
import fs from 'fs/promises';

const router = express.Router();

/**
 * Upload a PDF document
 * POST /api/documents/upload
 */
router.post('/upload', upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  const { originalname, path: filePath, size } = req.file;

  // Create document record
  const document = await prisma.document.create({
    data: {
      originalFilename: originalname,
      filePath,
      fileSize: size,
      status: 'UPLOADED'
    }
  });

  // Add to processing queue
  await pdfProcessingQueue.add({
    documentId: document.id,
    filePath,
    originalFilename: originalname
  });

  res.status(201).json({
    status: 'success',
    data: {
      document: {
        id: document.id,
        filename: document.originalFilename,
        size: document.fileSize,
        status: document.status,
        uploadedAt: document.uploadedAt
      }
    }
  });
}));

/**
 * Get all documents
 * GET /api/documents
 */
router.get('/', asyncHandler(async (req, res) => {
  const documents = await prisma.document.findMany({
    orderBy: { uploadedAt: 'desc' },
    include: {
      scripts: {
        take: 1,
        orderBy: { createdAt: 'desc' }
      },
      audioFiles: {
        take: 1,
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  res.json({
    status: 'success',
    data: { documents }
  });
}));

/**
 * Get document by ID
 * GET /api/documents/:id
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      scripts: {
        orderBy: { createdAt: 'desc' }
      },
      audioFiles: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!document) {
    throw new AppError('Document not found', 404);
  }

  res.json({
    status: 'success',
    data: { document }
  });
}));

/**
 * Get document processing status
 * GET /api/documents/:id/status
 */
router.get('/:id/status', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const document = await prisma.document.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      errorMessage: true,
      uploadedAt: true,
      processedAt: true
    }
  });

  if (!document) {
    throw new AppError('Document not found', 404);
  }

  res.json({
    status: 'success',
    data: { document }
  });
}));

/**
 * Delete a document
 * DELETE /api/documents/:id
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const document = await prisma.document.findUnique({
    where: { id }
  });

  if (!document) {
    throw new AppError('Document not found', 404);
  }

  // Delete physical file
  try {
    await fs.unlink(document.filePath);
  } catch (error) {
    console.error('Error deleting file:', error);
  }

  // Delete from database (cascades to scripts and audio)
  await prisma.document.delete({
    where: { id }
  });

  res.json({
    status: 'success',
    message: 'Document deleted successfully'
  });
}));

export default router;

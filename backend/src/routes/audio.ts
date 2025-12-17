import express from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import prisma from '../config/database';
import audioProcessorService from '../services/audio-processor.service';
import fs from 'fs';

const router = express.Router();

/**
 * Get audio file info for a document
 * GET /api/audio/:documentId
 */
router.get('/:documentId', asyncHandler(async (req, res) => {
  const { documentId } = req.params;

  const audioFile = await prisma.audioFile.findFirst({
    where: { documentId },
    orderBy: { createdAt: 'desc' }
  });

  if (!audioFile) {
    throw new AppError('Audio file not found for this document', 404);
  }

  res.json({
    status: 'success',
    data: { audioFile }
  });
}));

/**
 * Stream audio file
 * GET /api/audio/:documentId/stream
 */
router.get('/:documentId/stream', asyncHandler(async (req, res) => {
  const { documentId } = req.params;

  const audioFile = await prisma.audioFile.findFirst({
    where: { documentId, status: 'COMPLETED' },
    orderBy: { createdAt: 'desc' }
  });

  if (!audioFile) {
    throw new AppError('Audio file not found or not ready', 404);
  }

  const audioPath = audioProcessorService.getAudioPath(audioFile.audioPath);

  // Check if file exists
  if (!fs.existsSync(audioPath)) {
    throw new AppError('Audio file not found on disk', 404);
  }

  // Get file stats
  const stat = fs.statSync(audioPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    // Handle range request for seeking
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(audioPath, { start, end });

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'audio/mpeg',
    });

    file.pipe(res);
  } else {
    // Stream entire file
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'audio/mpeg',
    });

    fs.createReadStream(audioPath).pipe(res);
  }
}));

/**
 * Download audio file
 * GET /api/audio/:documentId/download
 */
router.get('/:documentId/download', asyncHandler(async (req, res) => {
  const { documentId } = req.params;

  const audioFile = await prisma.audioFile.findFirst({
    where: { documentId, status: 'COMPLETED' },
    orderBy: { createdAt: 'desc' },
    include: {
      document: true
    }
  });

  if (!audioFile) {
    throw new AppError('Audio file not found or not ready', 404);
  }

  const audioPath = audioProcessorService.getAudioPath(audioFile.audioPath);

  if (!fs.existsSync(audioPath)) {
    throw new AppError('Audio file not found on disk', 404);
  }

  const filename = `${audioFile.document.originalFilename.replace('.pdf', '')}_audio.mp3`;

  res.download(audioPath, filename);
}));

export default router;

import pdfProcessingQueue from '../config/queue';
import prisma from '../config/database';
import pdfParserService from '../services/pdf-parser.service';
import scriptGeneratorService from '../services/script-generator.service';
import audioProcessorService from '../services/audio-processor.service';
import { PDFProcessingJobData } from '../types';

/**
 * Process PDF: Extract text -> Generate script -> Generate audio
 */
pdfProcessingQueue.process(async (job) => {
  const { documentId, filePath, originalFilename } = job.data as PDFProcessingJobData;

  console.log(`\n📄 Processing document ${documentId}...`);

  try {
    // Step 1: Extract text from PDF (20% progress)
    job.progress(20);
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'EXTRACTING_TEXT' }
    });

    console.log('📖 Extracting text from PDF...');
    const extractedContent = await pdfParserService.extractTextFromPDF(filePath);

    await prisma.document.update({
      where: { id: documentId },
      data: {
        extractedText: extractedContent.text,
        pageCount: extractedContent.pageCount
      }
    });

    // Step 2: Summarize document (40% progress)
    job.progress(40);
    console.log('🔍 Analyzing document content...');
    const summary = await scriptGeneratorService.summarizeDocument(
      extractedContent.text,
      originalFilename
    );

    // Step 3: Generate conversational script (60% progress)
    job.progress(60);
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'GENERATING_SCRIPT' }
    });

    console.log('✍️  Generating conversational script...');
    const script = await scriptGeneratorService.generateConversationalScript(summary);

    // Save script to database
    const savedScript = await prisma.script.create({
      data: {
        documentId,
        title: script.title,
        content: JSON.stringify(script),
        host1Name: script.hosts.host1,
        host2Name: script.hosts.host2,
        estimatedDuration: script.estimatedDuration,
        wordCount: script.wordCount
      }
    });

    // Step 4: Generate audio (80-100% progress)
    job.progress(80);
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'GENERATING_AUDIO' }
    });

    // Create audio file record
    const audioFile = await prisma.audioFile.create({
      data: {
        scriptId: savedScript.id,
        documentId,
        audioPath: 'generating...',
        status: 'GENERATING'
      }
    });

    console.log('🎙️  Generating audio (this may take several minutes)...');
    const audioFilename = await audioProcessorService.generateAudioFromScript(script, documentId);

    // Get audio metadata
    const metadata = await audioProcessorService.getAudioMetadata(audioFilename);

    // Update audio file record
    await prisma.audioFile.update({
      where: { id: audioFile.id },
      data: {
        audioPath: audioFilename,
        audioUrl: `/api/audio/${documentId}/stream`,
        duration: metadata.duration,
        fileSize: metadata.size,
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    // Mark document as completed
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'COMPLETED',
        processedAt: new Date()
      }
    });

    job.progress(100);
    console.log(`✅ Document ${documentId} processed successfully!\n`);

    return {
      documentId,
      scriptId: savedScript.id,
      audioFileId: audioFile.id,
      duration: metadata.duration
    };
  } catch (error: any) {
    console.error(`❌ Error processing document ${documentId}:`, error);

    // Mark document as failed
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'FAILED',
        errorMessage: error.message || 'Unknown error occurred'
      }
    });

    throw error;
  }
});

console.log('👷 PDF processing worker started');

export default pdfProcessingQueue;

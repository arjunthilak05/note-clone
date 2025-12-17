import pdf from 'pdf-parse';
import fs from 'fs/promises';
import { ExtractedContent, DocumentMetadata } from '../types';
import { AppError } from '../middleware/errorHandler';

export class PDFParserService {
  /**
   * Extract text and metadata from a PDF file
   */
  async extractTextFromPDF(filePath: string): Promise<ExtractedContent> {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdf(dataBuffer);

      const metadata: DocumentMetadata = {
        pages: data.numpages,
        title: data.info?.Title,
        author: data.info?.Author,
        subject: data.info?.Subject,
        creator: data.info?.Creator,
        producer: data.info?.Producer,
        creationDate: data.info?.CreationDate
      };

      // Clean up the extracted text
      const cleanedText = this.cleanText(data.text);

      return {
        text: cleanedText,
        metadata,
        pageCount: data.numpages
      };
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new AppError('Failed to parse PDF file. The file may be corrupted or password-protected.', 400);
    }
  }

  /**
   * Clean and normalize extracted text
   */
  private cleanText(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove page numbers (common patterns)
      .replace(/\n\d+\n/g, '\n')
      // Normalize line breaks
      .replace(/\r\n/g, '\n')
      // Remove multiple consecutive newlines
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Split text into manageable chunks for processing
   */
  chunkText(text: string, maxChunkSize: number = 10000): string[] {
    const chunks: string[] = [];
    const paragraphs = text.split('\n\n');
    let currentChunk = '';

    for (const paragraph of paragraphs) {
      if ((currentChunk + paragraph).length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = paragraph;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }
}

export default new PDFParserService();

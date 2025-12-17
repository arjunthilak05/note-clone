import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ConversationalScript } from '../types';
import ttsService from './tts.service';
import { AppError } from '../middleware/errorHandler';

export class AudioProcessorService {
  private audioDir: string;
  private tempDir: string;

  constructor() {
    this.audioDir = process.env.AUDIO_DIR || './audio';
    this.tempDir = path.join(this.audioDir, 'temp');
    this.ensureDirectories();
  }

  /**
   * Ensure audio directories exist
   */
  private async ensureDirectories() {
    try {
      await fs.mkdir(this.audioDir, { recursive: true });
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create audio directories:', error);
    }
  }

  /**
   * Generate complete audio file from conversational script
   */
  async generateAudioFromScript(script: ConversationalScript, documentId: string): Promise<string> {
    const tempFiles: string[] = [];

    try {
      console.log('🎙️  Starting audio generation...');

      // Generate audio for each dialogue line
      const allDialogue = script.segments.flatMap(segment => segment.dialogue);

      for (let i = 0; i < allDialogue.length; i++) {
        const line = allDialogue[i];
        console.log(`Generating audio ${i + 1}/${allDialogue.length}: ${line.speakerName}`);

        // Generate speech for this line
        const audioBuffer = await ttsService.generateSpeech(line.text, line.speaker);

        // Save to temp file
        const tempFilePath = path.join(this.tempDir, `${uuidv4()}.mp3`);
        await fs.writeFile(tempFilePath, audioBuffer);
        tempFiles.push(tempFilePath);

        // Add a small pause between different speakers
        if (i < allDialogue.length - 1 && allDialogue[i + 1].speaker !== line.speaker) {
          const pauseFile = await this.createSilence(0.5); // 0.5 second pause
          tempFiles.push(pauseFile);
        }
      }

      console.log('🔧 Concatenating audio segments...');

      // Concatenate all audio files
      const outputFilename = `${documentId}_${Date.now()}.mp3`;
      const outputPath = path.join(this.audioDir, outputFilename);
      await this.concatenateAudioFiles(tempFiles, outputPath);

      // Clean up temp files
      await this.cleanupTempFiles(tempFiles);

      console.log('✅ Audio generation complete!');
      return outputFilename;
    } catch (error) {
      // Clean up temp files on error
      await this.cleanupTempFiles(tempFiles);
      console.error('Audio generation error:', error);
      throw new AppError('Failed to generate audio', 500);
    }
  }

  /**
   * Create a silent audio file for pauses
   */
  private async createSilence(duration: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const silenceFile = path.join(this.tempDir, `silence_${uuidv4()}.mp3`);

      ffmpeg()
        .input('anullsrc=r=44100:cl=stereo')
        .inputFormat('lavfi')
        .duration(duration)
        .audioCodec('libmp3lame')
        .audioBitrate('128k')
        .output(silenceFile)
        .on('end', () => resolve(silenceFile))
        .on('error', reject)
        .run();
    });
  }

  /**
   * Concatenate multiple audio files into one
   */
  private async concatenateAudioFiles(inputFiles: string[], outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Create a concat file list
      const concatListPath = path.join(this.tempDir, `concat_${uuidv4()}.txt`);
      const concatContent = inputFiles.map(f => `file '${f}'`).join('\n');

      fs.writeFile(concatListPath, concatContent)
        .then(() => {
          const command = ffmpeg()
            .input(concatListPath)
            .inputOptions(['-f concat', '-safe 0'])
            .audioCodec('libmp3lame')
            .audioBitrate('128k')
            .output(outputPath)
            .on('end', async () => {
              await fs.unlink(concatListPath).catch(() => {});
              resolve();
            })
            .on('error', (err) => {
              fs.unlink(concatListPath).catch(() => {});
              reject(err);
            });

          command.run();
        })
        .catch(reject);
    });
  }

  /**
   * Clean up temporary files
   */
  private async cleanupTempFiles(files: string[]): Promise<void> {
    for (const file of files) {
      try {
        await fs.unlink(file);
      } catch (error) {
        // Ignore errors during cleanup
      }
    }
  }

  /**
   * Get audio file path
   */
  getAudioPath(filename: string): string {
    return path.join(this.audioDir, filename);
  }

  /**
   * Get audio file size and duration
   */
  async getAudioMetadata(filename: string): Promise<{ size: number; duration: number }> {
    const filePath = this.getAudioPath(filename);
    const stats = await fs.stat(filePath);

    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            size: stats.size,
            duration: Math.ceil(metadata.format.duration || 0)
          });
        }
      });
    });
  }
}

export default new AudioProcessorService();

import OpenAI from 'openai';
import fetch from 'node-fetch';
import { AudioSegment, TTSOptions } from '../types';
import { AppError } from '../middleware/errorHandler';

export class TTSService {
  private openai?: OpenAI;
  private elevenLabsApiKey?: string;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
    if (process.env.ELEVENLABS_API_KEY) {
      this.elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    }

    if (!this.openai && !this.elevenLabsApiKey) {
      console.warn('⚠️  No TTS service configured. Audio generation will not work.');
    }
  }

  /**
   * Generate speech audio from text using available TTS service
   */
  async generateSpeech(text: string, speaker: 'host1' | 'host2'): Promise<Buffer> {
    // Prefer ElevenLabs for quality, fallback to OpenAI
    if (this.elevenLabsApiKey) {
      return this.generateWithElevenLabs(text, speaker);
    } else if (this.openai) {
      return this.generateWithOpenAI(text, speaker);
    } else {
      throw new AppError('No TTS service available', 500);
    }
  }

  /**
   * Generate speech using OpenAI TTS
   */
  private async generateWithOpenAI(text: string, speaker: 'host1' | 'host2'): Promise<Buffer> {
    try {
      const voice = speaker === 'host1'
        ? (process.env.OPENAI_TTS_VOICE_1 || 'alloy')
        : (process.env.OPENAI_TTS_VOICE_2 || 'echo');

      const mp3 = await this.openai!.audio.speech.create({
        model: 'tts-1-hd',
        voice: voice as any,
        input: text,
        speed: 1.0
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());
      return buffer;
    } catch (error) {
      console.error('OpenAI TTS error:', error);
      throw new AppError('Failed to generate speech with OpenAI', 500);
    }
  }

  /**
   * Generate speech using ElevenLabs API
   */
  private async generateWithElevenLabs(text: string, speaker: 'host1' | 'host2'): Promise<Buffer> {
    try {
      const voiceId = speaker === 'host1'
        ? process.env.ELEVENLABS_VOICE_1
        : process.env.ELEVENLABS_VOICE_2;

      if (!voiceId) {
        throw new Error(`ElevenLabs voice ID not configured for ${speaker}`);
      }

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.elevenLabsApiKey!
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      throw new AppError('Failed to generate speech with ElevenLabs', 500);
    }
  }

  /**
   * Get estimated cost for generating audio
   */
  getEstimatedCost(wordCount: number): { service: string; cost: number } {
    if (this.elevenLabsApiKey) {
      // ElevenLabs pricing: ~$0.30 per 1000 characters (roughly 150 words)
      const characterCount = wordCount * 6; // rough estimate
      return {
        service: 'ElevenLabs',
        cost: (characterCount / 1000) * 0.30
      };
    } else if (this.openai) {
      // OpenAI TTS pricing: $15 per 1M characters
      const characterCount = wordCount * 6;
      return {
        service: 'OpenAI',
        cost: (characterCount / 1000000) * 15
      };
    }
    return { service: 'none', cost: 0 };
  }
}

export default new TTSService();

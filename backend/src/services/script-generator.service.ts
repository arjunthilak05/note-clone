import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { ConversationalScript, DocumentSummary } from '../types';
import { AppError } from '../middleware/errorHandler';

export class ScriptGeneratorService {
  private anthropic?: Anthropic;
  private openai?: OpenAI;

  constructor() {
    // Initialize AI clients based on available API keys
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
    }
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }

    if (!this.anthropic && !this.openai) {
      console.warn('⚠️  No AI API keys configured. Script generation will not work.');
    }
  }

  /**
   * Summarize PDF text and extract key information
   */
  async summarizeDocument(text: string, filename: string): Promise<DocumentSummary> {
    const systemPrompt = `You are an expert at analyzing educational documents and extracting key information.
Analyze the provided document and create a structured summary that will be used to generate an engaging podcast conversation.`;

    const userPrompt = `Analyze this document and provide a structured summary:

Document: ${filename}

Content:
${text.substring(0, 50000)} ${text.length > 50000 ? '...(truncated)' : ''}

Provide your response as JSON with this structure:
{
  "title": "A concise, engaging title for the document",
  "overallSummary": "A 3-4 sentence summary of the main points",
  "mainTopics": ["topic1", "topic2", "topic3"],
  "keyTerms": ["term1", "term2", "term3"],
  "chunks": [
    {
      "topic": "Topic name",
      "content": "Detailed explanation",
      "keyPoints": ["point1", "point2"]
    }
  ]
}`;

    try {
      let responseText: string;

      if (this.anthropic) {
        const response = await this.anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4000,
          messages: [
            { role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }
          ]
        });

        const content = response.content[0];
        responseText = content.type === 'text' ? content.text : '';
      } else if (this.openai) {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' }
        });

        responseText = response.choices[0].message.content || '';
      } else {
        throw new AppError('No AI service configured', 500);
      }

      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Document summarization error:', error);
      throw new AppError('Failed to summarize document', 500);
    }
  }

  /**
   * Generate a conversational podcast script from document summary
   */
  async generateConversationalScript(summary: DocumentSummary): Promise<ConversationalScript> {
    const systemPrompt = `You are a podcast script writer creating engaging educational conversations.
Create a natural dialogue between two hosts discussing the provided content.

Host 1 (Alex): Curious, asks insightful questions, represents the learner
Host 2 (Jordan): Knowledgeable, explains concepts clearly, provides context

Guidelines:
- Use conversational, natural language
- Break down complex concepts into digestible explanations
- Include natural speech patterns (hmm, you know, right, exactly, etc.)
- Keep speaker turns 1-3 sentences each
- Total script should be ~1500-2000 words for a 10-12 minute podcast
- Make it engaging and educational
- Start with a warm introduction
- End with key takeaways`;

    const userPrompt = `Create a podcast script discussing this content:

Title: ${summary.title}
Summary: ${summary.overallSummary}

Main Topics:
${summary.mainTopics.map(t => `- ${t}`).join('\n')}

Key Information:
${summary.chunks.map(c => `
Topic: ${c.topic}
${c.keyPoints.map(p => `- ${p}`).join('\n')}
`).join('\n')}

Format your response as JSON:
{
  "title": "Episode: [Engaging episode title]",
  "hosts": {
    "host1": "Alex",
    "host2": "Jordan"
  },
  "segments": [
    {
      "type": "intro",
      "dialogue": [
        {"speaker": "host1", "speakerName": "Alex", "text": "Hey everyone! Today we're diving into..."},
        {"speaker": "host2", "speakerName": "Jordan", "text": "That's right! This is fascinating because..."}
      ]
    },
    {
      "type": "main",
      "dialogue": [...]
    },
    {
      "type": "outro",
      "dialogue": [...]
    }
  ]
}`;

    try {
      let responseText: string;

      if (this.anthropic) {
        const response = await this.anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 8000,
          messages: [
            { role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }
          ]
        });

        const content = response.content[0];
        responseText = content.type === 'text' ? content.text : '';
      } else if (this.openai) {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' }
        });

        responseText = response.choices[0].message.content || '';
      } else {
        throw new AppError('No AI service configured', 500);
      }

      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const script: ConversationalScript = JSON.parse(jsonMatch[0]);

      // Calculate word count and estimated duration
      const allText = script.segments
        .flatMap(s => s.dialogue.map(d => d.text))
        .join(' ');
      const wordCount = allText.split(/\s+/).length;
      const estimatedDuration = Math.ceil((wordCount / 150) * 60); // ~150 words per minute

      return {
        ...script,
        wordCount,
        estimatedDuration
      };
    } catch (error) {
      console.error('Script generation error:', error);
      throw new AppError('Failed to generate conversational script', 500);
    }
  }
}

export default new ScriptGeneratorService();

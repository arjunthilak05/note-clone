# Setup Guide - NotebookLM Audio Clone

This guide will help you set up and run the NotebookLM Audio Clone application.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **PostgreSQL** >= 14 ([Download](https://www.postgresql.org/download/))
- **Redis** >= 6.0 ([Download](https://redis.io/download))
- **FFmpeg** (for audio processing)
  - macOS: `brew install ffmpeg`
  - Ubuntu: `sudo apt install ffmpeg`
  - Windows: [Download](https://ffmpeg.org/download.html)

## API Keys Required

You'll need at least one set of the following API keys:

### For Script Generation (Choose one or both):
- **OpenAI API Key**: [Get it here](https://platform.openai.com/api-keys)
- **Anthropic Claude API Key**: [Get it here](https://console.anthropic.com/)

### For Text-to-Speech (Choose one):
- **ElevenLabs API Key** (Recommended): [Get it here](https://elevenlabs.io/)
- **OpenAI TTS** (Alternative): Uses the same OpenAI API key

## Step 1: Clone and Install

```bash
# Clone the repository (if not already done)
cd note-clone

# Install all dependencies
npm install

# This will install both backend and frontend dependencies
```

## Step 2: Database Setup

### Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE notebooklm_audio;

# Create user (optional)
CREATE USER notebooklm_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE notebooklm_audio TO notebooklm_user;

# Exit
\q
```

### Run Database Migrations

```bash
cd backend

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# You should see: "Your database is now in sync with your schema."
```

## Step 3: Configure Environment Variables

```bash
# Copy the example environment file
cp backend/.env.example backend/.env

# Edit the .env file with your configuration
nano backend/.env  # or use your preferred editor
```

### Required Environment Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database - Update with your PostgreSQL credentials
DATABASE_URL="postgresql://notebooklm_user:your_password@localhost:5432/notebooklm_audio?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# AI Service - Add at least one
ANTHROPIC_API_KEY=sk-ant-your-key-here
# OR
OPENAI_API_KEY=sk-your-key-here

# TTS Service - Add one

# Option 1: ElevenLabs (Recommended for best quality)
ELEVENLABS_API_KEY=your-elevenlabs-key
ELEVENLABS_VOICE_1=21m00Tcm4TlvDq8ikWAM  # Rachel (or choose your own)
ELEVENLABS_VOICE_2=AZnzlk1XvdvUeBnXmlld  # Domi (or choose your own)

# Option 2: OpenAI TTS (Alternative)
# Uses the same OPENAI_API_KEY from above
# Uncomment these if using OpenAI TTS:
# OPENAI_TTS_VOICE_1=alloy
# OPENAI_TTS_VOICE_2=echo

# File Storage
UPLOAD_DIR=./uploads
AUDIO_DIR=./audio
MAX_FILE_SIZE=52428800

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### Getting ElevenLabs Voice IDs

1. Go to [ElevenLabs Voice Library](https://elevenlabs.io/voice-library)
2. Choose two different voices for your hosts
3. Click on a voice and copy its Voice ID
4. Add them to your `.env` file

## Step 4: Start Services

You need to start Redis, PostgreSQL, and the application servers.

### Start Redis

```bash
# macOS (with Homebrew)
brew services start redis

# Ubuntu
sudo systemctl start redis

# Or run manually
redis-server
```

### Start PostgreSQL

```bash
# macOS (with Homebrew)
brew services start postgresql

# Ubuntu
sudo systemctl start postgresql

# Usually runs automatically on Windows
```

### Start the Application

#### Option 1: Start Everything at Once

```bash
# From the root directory
npm run dev

# This starts both backend and frontend concurrently
```

#### Option 2: Start Services Separately

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## Step 5: Verify Setup

1. **Backend Health Check**
   - Open: http://localhost:3000/health
   - Should see: `{"status":"ok","timestamp":"...","service":"NotebookLM Audio Clone API"}`

2. **Frontend**
   - Open: http://localhost:5173
   - Should see the upload page

3. **Database**
   ```bash
   cd backend
   npm run db:studio
   ```
   - Opens Prisma Studio at http://localhost:5555
   - You can view/manage database records here

## Step 6: Test the Application

1. Go to http://localhost:5173
2. Upload a small PDF (start with 1-5 pages)
3. Wait for processing (5-10 minutes depending on length)
4. Listen to the generated audio!

## Troubleshooting

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql -U notebooklm_user -d notebooklm_audio -h localhost

# Check if PostgreSQL is running
# macOS
brew services list | grep postgresql

# Ubuntu
sudo systemctl status postgresql
```

### Redis Connection Issues

```bash
# Test Redis connection
redis-cli ping
# Should return: PONG

# Check if Redis is running
# macOS
brew services list | grep redis

# Ubuntu
sudo systemctl status redis
```

### FFmpeg Issues

```bash
# Verify FFmpeg installation
ffmpeg -version

# If not found, install it:
# macOS
brew install ffmpeg

# Ubuntu
sudo apt update && sudo apt install ffmpeg
```

### Port Already in Use

```bash
# Find and kill process on port 3000
# macOS/Linux
lsof -ti:3000 | xargs kill

# Or change the PORT in backend/.env
PORT=3001
```

### API Key Issues

- Verify your API keys are correct
- Check you have sufficient credits
- For ElevenLabs, verify voice IDs are correct
- Look at backend logs for specific error messages

## Project Structure

```
note-clone/
├── backend/
│   ├── src/
│   │   ├── config/         # Database, queue configs
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   ├── workers/        # Background job processors
│   │   └── types/          # TypeScript types
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   ├── uploads/            # Uploaded PDFs
│   └── audio/              # Generated audio files
├── frontend/
│   └── src/
│       ├── components/     # React components
│       ├── pages/          # Page components
│       ├── api/            # API client
│       └── types/          # TypeScript types
└── package.json            # Root workspace config
```

## Development Commands

```bash
# Root directory
npm run dev              # Start both servers
npm run build            # Build both projects

# Backend only
cd backend
npm run dev              # Start dev server with hot reload
npm run build            # Build for production
npm run start            # Start production server
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run database migrations
npm run db:push          # Push schema changes
npm run db:studio        # Open Prisma Studio

# Frontend only
cd frontend
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build
```

## Production Deployment Notes

When deploying to production:

1. Set `NODE_ENV=production` in backend/.env
2. Update `DATABASE_URL` with production database
3. Update `REDIS_HOST` with production Redis
4. Set up proper file storage (AWS S3, Cloudflare R2, etc.)
5. Configure proper CORS origins
6. Use process manager (PM2, systemd) for backend
7. Serve frontend with nginx or CDN
8. Set up SSL certificates

## Cost Estimates

Per 10-page PDF document:

- **Script Generation**:
  - OpenAI GPT-4: ~$0.10-0.30
  - Anthropic Claude: ~$0.10-0.30

- **Text-to-Speech**:
  - ElevenLabs: ~$0.30-0.60
  - OpenAI TTS: ~$0.10-0.15

**Total per document: $0.20 - $0.90**

Longer documents will cost proportionally more.

## Support

If you encounter issues:

1. Check the console logs (backend and frontend)
2. Review this setup guide
3. Check the troubleshooting section
4. Open an issue on GitHub

## Next Steps

After setup:

1. Try uploading a short educational PDF
2. Explore the Library page
3. Experiment with different voice combinations
4. Consider implementing additional features from README.md

Happy coding!

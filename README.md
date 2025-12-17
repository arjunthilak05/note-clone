# 🎙️ NotebookLM Audio Clone

A web application that converts learning PDFs into engaging podcast-style conversational audio, similar to NotebookLM's audio feature.

## Features

- 📄 Upload PDF documents
- 🤖 AI-powered conversational script generation
- 🎧 Text-to-speech audio generation with multiple voices
- 📚 Document library management
- 🔄 Background processing with job queues

## Tech Stack

### Frontend
- React + TypeScript
- Vite
- Tailwind CSS
- React Router

### Backend
- Node.js + Express + TypeScript
- PostgreSQL + Prisma ORM
- Bull (Redis queue)
- OpenAI API / Anthropic Claude API
- ElevenLabs TTS / OpenAI TTS

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- PostgreSQL
- Redis (for job queue)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your API keys

# Run database migrations
npm run db:migrate --workspace=backend

# Start development servers
npm run dev
```

The frontend will be available at http://localhost:5173
The backend API will be available at http://localhost:3000

## Project Structure

```
.
├── backend/          # Express API server
│   ├── src/
│   │   ├── config/   # Configuration files
│   │   ├── routes/   # API routes
│   │   ├── services/ # Business logic
│   │   ├── models/   # Database models
│   │   └── utils/    # Utility functions
│   └── uploads/      # Uploaded PDFs
├── frontend/         # React application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── api/
└── package.json      # Root workspace config
```

## Environment Variables

See `backend/.env.example` for required environment variables.

## License

MIT

# Architecture Overview

## System Architecture

```
┌─────────────┐      ┌─────────────┐      ┌──────────────┐
│   Frontend  │─────▶│   Backend   │─────▶│  PostgreSQL  │
│ React + Vite│      │  Express    │      │   Database   │
└─────────────┘      └─────────────┘      └──────────────┘
                            │
                            ├─────▶ Redis Queue (Bull)
                            │
                            ├─────▶ OpenAI / Anthropic API
                            │
                            └─────▶ ElevenLabs / OpenAI TTS
```

## Data Flow

### 1. PDF Upload Flow

```
User uploads PDF
    ↓
Frontend sends file to /api/documents/upload
    ↓
Backend saves file and creates Document record
    ↓
Job added to Redis queue
    ↓
Returns document ID to frontend
    ↓
Frontend navigates to document page
    ↓
Frontend polls /api/documents/:id/status
```

### 2. Background Processing Flow

```
Job Worker picks up task
    ↓
Step 1: Extract text from PDF (pdf-parse)
    ↓
Step 2: Summarize content (AI API)
    ↓
Step 3: Generate conversational script (AI API)
    ↓
Step 4: Save script to database
    ↓
Step 5: Generate audio for each dialogue line (TTS API)
    ↓
Step 6: Concatenate audio segments (ffmpeg)
    ↓
Step 7: Save audio metadata
    ↓
Mark document as COMPLETED
```

### 3. Audio Playback Flow

```
User clicks on completed document
    ↓
Frontend fetches script and audio metadata
    ↓
User clicks play
    ↓
Audio streams from /api/audio/:id/stream
    ↓
Backend streams file with range support (for seeking)
```

## Database Schema

### Documents Table
- Stores uploaded PDF metadata
- Tracks processing status
- Links to scripts and audio files

### Scripts Table
- Stores AI-generated conversational scripts
- JSON format with dialogue structure
- Links to parent document

### Audio Files Table
- Stores generated audio metadata
- Links to script and document
- Tracks generation status

## API Endpoints

### Documents
- `POST /api/documents/upload` - Upload PDF
- `GET /api/documents` - List all documents
- `GET /api/documents/:id` - Get document details
- `GET /api/documents/:id/status` - Poll processing status
- `DELETE /api/documents/:id` - Delete document

### Scripts
- `GET /api/scripts/:documentId` - Get generated script
- `GET /api/scripts/:documentId/all` - Get all script versions

### Audio
- `GET /api/audio/:documentId` - Get audio metadata
- `GET /api/audio/:documentId/stream` - Stream audio file
- `GET /api/audio/:documentId/download` - Download audio

## Key Services

### PDFParserService
- Extracts text from PDF files
- Cleans and normalizes text
- Chunks text for processing

### ScriptGeneratorService
- Summarizes document content using AI
- Generates conversational podcast script
- Structures dialogue between two hosts

### TTSService
- Converts text to speech
- Supports multiple providers (ElevenLabs, OpenAI)
- Manages voice selection per speaker

### AudioProcessorService
- Generates audio for each dialogue line
- Adds pauses between speakers
- Concatenates segments using ffmpeg
- Manages temporary files

## State Management

### Document Status States
1. `UPLOADED` - File received, queued for processing
2. `EXTRACTING_TEXT` - Parsing PDF content
3. `GENERATING_SCRIPT` - AI creating conversation
4. `GENERATING_AUDIO` - TTS creating audio
5. `COMPLETED` - Ready to listen
6. `FAILED` - Error occurred

### Audio Status States
1. `GENERATING` - Creating audio file
2. `COMPLETED` - Ready to play
3. `FAILED` - Generation failed

## Error Handling

### Backend
- Custom `AppError` class for operational errors
- Centralized error handler middleware
- Proper HTTP status codes
- Detailed error messages in development

### Frontend
- Try-catch blocks for async operations
- User-friendly error messages
- Retry logic for transient failures
- Loading states for all async operations

## Security Considerations

### File Upload
- Only PDF files accepted
- File size limit (50MB)
- Unique filenames (UUID)
- Stored outside public directory

### API Keys
- Stored in environment variables
- Never sent to frontend
- Validated before use

### CORS
- Configured for specific frontend origin
- Credentials support enabled

## Performance Optimizations

### Backend
- Database connection pooling (Prisma)
- Job queue for async processing (Bull)
- Streaming for large files
- Efficient file chunking

### Frontend
- React lazy loading (can be added)
- Optimized asset bundling (Vite)
- Polling with cleanup
- Audio streaming with range support

## Scalability Considerations

### Current Limitations
- Single server architecture
- Local file storage
- Synchronous audio generation

### Future Improvements
- Horizontal scaling with load balancer
- Cloud storage (S3, R2)
- Parallel audio generation
- Caching layer (Redis)
- CDN for audio files
- Database read replicas

## Technology Choices

### Why Node.js/Express?
- JavaScript across stack
- Rich ecosystem for AI/ML
- Good streaming support
- Fast development

### Why PostgreSQL?
- ACID compliance
- Rich data types
- Great Prisma support
- Free and open source

### Why Redis/Bull?
- Reliable job queue
- Job retry logic
- Progress tracking
- Free and performant

### Why React?
- Component reusability
- Large ecosystem
- Good TypeScript support
- Fast with Vite

### Why Prisma?
- Type-safe database queries
- Auto-generated client
- Easy migrations
- Great DX

## Monitoring & Logging

### Current Logging
- Console logs for key events
- Job queue event listeners
- Error stack traces

### Production Recommendations
- Structured logging (Winston, Pino)
- Error tracking (Sentry)
- Performance monitoring (New Relic, Datadog)
- Health check endpoints
- Metrics collection

## Testing Strategy (Future)

### Backend
- Unit tests for services
- Integration tests for routes
- Mock external APIs
- Database testing with test DB

### Frontend
- Component tests (Vitest)
- Integration tests (Playwright)
- E2E user flows
- Visual regression tests

## Deployment Architecture (Recommended)

```
Internet
    ↓
Load Balancer (nginx)
    ↓
    ├─────▶ Frontend (Static files + CDN)
    │
    └─────▶ Backend API (Multiple instances)
                ↓
                ├─────▶ PostgreSQL (Primary + Replica)
                ├─────▶ Redis (Cluster)
                └─────▶ S3/R2 (File storage)
```

## Cost Optimization

### Storage
- Delete old PDFs after processing
- Compress audio files
- Use cheaper storage tiers

### AI APIs
- Cache common summaries
- Batch API requests
- Use smaller models when possible
- Rate limiting per user

### Infrastructure
- Auto-scaling based on load
- Spot instances for workers
- CDN for static assets
- Optimize database queries

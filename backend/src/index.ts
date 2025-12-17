/**
 * Main entry point with worker initialization
 */
import './server';
import './workers/pdf-processor';
import { connectDatabase } from './config/database';

// Initialize database connection
connectDatabase();

// Mobile app can use the same backend server as the web app
// This file demonstrates how to share the backend between web and mobile

import express from 'express';
import cors from 'cors';
import { registerRoutes } from './routes';

const app = express();
const port = process.env.PORT || 3001;

// Enable CORS for mobile app
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8081'], // Add mobile dev server
  credentials: true,
}));

app.use(express.json());

// Register API routes
registerRoutes(app);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'PrayOverUs Mobile API',
    timestamp: new Date().toISOString() 
  });
});

const httpServer = app.listen(port, () => {
  console.log(`🙏 PrayOverUs Mobile API server running on port ${port}`);
});

export default httpServer;
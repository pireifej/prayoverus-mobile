import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import OpenAI from "openai";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertPrayerSchema, insertPrayerGroupSchema, insertPrayerSupportSchema, insertPrayerCommentSchema } from "@shared/schema";
import { z } from "zod";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Prayer routes
  app.post('/api/prayers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const prayerData = insertPrayerSchema.parse({ ...req.body, userId });
      const prayer = await storage.createPrayer(prayerData);
      
      // Broadcast to WebSocket clients if public
      if (prayer.isPublic) {
        broadcastToClients('new_prayer', { prayer, user: await storage.getUser(userId) });
      }
      
      res.json(prayer);
    } catch (error) {
      console.error("Error creating prayer:", error);
      res.status(400).json({ message: "Invalid prayer data" });
    }
  });

  app.get('/api/prayers/mine', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const prayers = await storage.getUserPrayers(userId);
      res.json(prayers);
    } catch (error) {
      console.error("Error fetching user prayers:", error);
      res.status(500).json({ message: "Failed to fetch prayers" });
    }
  });

  app.get('/api/prayers/public', async (req, res) => {
    try {
      const prayers = await storage.getPublicPrayers();
      res.json(prayers);
    } catch (error) {
      console.error("Error fetching public prayers:", error);
      res.status(500).json({ message: "Failed to fetch public prayers" });
    }
  });

  app.patch('/api/prayers/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { status } = req.body;
      
      if (!['ongoing', 'answered'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const prayer = await storage.updatePrayerStatus(id, status, userId);
      if (!prayer) {
        return res.status(404).json({ message: "Prayer not found" });
      }
      
      res.json(prayer);
    } catch (error) {
      console.error("Error updating prayer status:", error);
      res.status(500).json({ message: "Failed to update prayer" });
    }
  });

  app.delete('/api/prayers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      const success = await storage.deletePrayer(id, userId);
      if (!success) {
        return res.status(404).json({ message: "Prayer not found" });
      }
      
      res.json({ message: "Prayer deleted successfully" });
    } catch (error) {
      console.error("Error deleting prayer:", error);
      res.status(500).json({ message: "Failed to delete prayer" });
    }
  });

  // Prayer support routes
  app.post('/api/prayers/:id/support', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: prayerId } = req.params;
      const supportData = insertPrayerSupportSchema.parse({ 
        prayerId, 
        userId, 
        type: req.body.type || 'prayer' 
      });
      
      const support = await storage.addPrayerSupport(supportData);
      broadcastToClients('prayer_support', { prayerId, support });
      res.json(support);
    } catch (error) {
      console.error("Error adding prayer support:", error);
      res.status(400).json({ message: "Invalid support data" });
    }
  });

  app.delete('/api/prayers/:id/support/:type', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: prayerId, type } = req.params;
      
      const success = await storage.removePrayerSupport(prayerId, userId, type);
      if (!success) {
        return res.status(404).json({ message: "Support not found" });
      }
      
      broadcastToClients('prayer_support_removed', { prayerId, userId, type });
      res.json({ message: "Support removed successfully" });
    } catch (error) {
      console.error("Error removing prayer support:", error);
      res.status(500).json({ message: "Failed to remove support" });
    }
  });

  // Prayer comment routes
  app.post('/api/prayers/:id/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: prayerId } = req.params;
      const commentData = insertPrayerCommentSchema.parse({ 
        prayerId, 
        userId, 
        content: req.body.content 
      });
      
      const comment = await storage.addPrayerComment(commentData);
      broadcastToClients('new_comment', { prayerId, comment });
      res.json(comment);
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(400).json({ message: "Invalid comment data" });
    }
  });

  app.get('/api/prayers/:id/comments', async (req, res) => {
    try {
      const { id: prayerId } = req.params;
      const comments = await storage.getPrayerComments(prayerId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Prayer group routes
  app.post('/api/groups', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const groupData = insertPrayerGroupSchema.parse({ ...req.body, createdBy: userId });
      const group = await storage.createPrayerGroup(groupData);
      res.json(group);
    } catch (error) {
      console.error("Error creating group:", error);
      res.status(400).json({ message: "Invalid group data" });
    }
  });

  app.get('/api/groups/mine', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const groups = await storage.getUserGroups(userId);
      res.json(groups);
    } catch (error) {
      console.error("Error fetching user groups:", error);
      res.status(500).json({ message: "Failed to fetch groups" });
    }
  });

  app.get('/api/groups/public', async (req, res) => {
    try {
      const groups = await storage.getPublicGroups();
      res.json(groups);
    } catch (error) {
      console.error("Error fetching public groups:", error);
      res.status(500).json({ message: "Failed to fetch public groups" });
    }
  });

  app.post('/api/groups/:id/join', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: groupId } = req.params;
      
      const member = await storage.joinGroup(groupId, userId);
      res.json(member);
    } catch (error) {
      console.error("Error joining group:", error);
      res.status(500).json({ message: "Failed to join group" });
    }
  });

  app.delete('/api/groups/:id/leave', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: groupId } = req.params;
      
      const success = await storage.leaveGroup(groupId, userId);
      if (!success) {
        return res.status(404).json({ message: "Membership not found" });
      }
      
      res.json({ message: "Left group successfully" });
    } catch (error) {
      console.error("Error leaving group:", error);
      res.status(500).json({ message: "Failed to leave group" });
    }
  });

  // AI Prayer generation route
  app.post('/api/generate-prayer', async (req, res) => {
    try {
      const { title, content, author } = req.body;
      
      if (!title || !content) {
        return res.status(400).json({ message: "Title and content are required" });
      }

      const prompt = `Create a heartfelt, compassionate prayer for someone in need. The prayer request is:

Title: ${title}
Content: ${content}
Requested by: ${author}

Please write a sincere, respectful prayer that:
- Shows empathy and understanding
- Offers comfort and hope
- Maintains appropriate spiritual tone
- Is 3-4 sentences long
- Avoids denominational specificity
- Focuses on healing, guidance, or support as appropriate

Return only the prayer text, nothing else.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are a compassionate spiritual guide who writes heartfelt prayers for people in need. Write sincere, inclusive prayers that offer comfort and hope."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.7,
      });

      const prayer = response.choices[0].message.content?.trim() || "May you find peace, comfort, and strength during this time. You are in our thoughts and prayers.";
      
      res.json({ prayer });
    } catch (error) {
      console.error("Error generating prayer:", error);
      res.status(500).json({ 
        message: "Failed to generate prayer",
        prayer: "We are unable to generate a prayer at this time, but please know that you are in our thoughts and prayers. May you find peace and comfort."
      });
    }
  });

  const httpServer = createServer(app);

  // WebSocket setup for real-time features
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket connection');
    
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        console.log('Received WebSocket message:', data);
      } catch (error) {
        console.error('Invalid WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  // Broadcast function for real-time updates
  function broadcastToClients(type: string, data: any) {
    const message = JSON.stringify({ type, data });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  return httpServer;
}

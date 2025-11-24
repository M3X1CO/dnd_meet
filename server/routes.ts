import crypto from "crypto";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { requireAuth, type AuthRequest, hashPassword, comparePassword, generateToken } from "./auth";
import { uploadToCloudinary } from "./cloudinary";

import { 
  insertUserSchema,
  insertUserSettingsSchema,
  insertFriendshipSchema,
  insertChatGroupSchema,
  insertChatMessageSchema,
  insertMeetingSuggestionSchema,
  insertMeetingResponseSchema,
  insertMeetingParticipantSchema,
  insertCalendarConnectionSchema, 
  insertCalendarSchema, 
  insertEventSchema,
  insertConflictSchema,
  insertCalendarShareSchema,
  insertCalendarCollaborationSchema,
  insertCollaborationMemberSchema,
  insertCollaborationCalendarSchema,
  insertEventCommentSchema,
  insertEventChangeLogSchema,
  insertTagSchema,
  insertChatTagSchema,
  insertMeetingTagSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {

  // ================================
  // AUTH ROUTES (Public - No Auth Required)
  // ================================
  
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      const existingUsers = await storage.searchUsersByTags([], undefined);
      const existingUser = existingUsers.find(u => u.email === email);
      
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      const passwordHash = await hashPassword(password);

      const user = await storage.upsertUser({
        id: crypto.randomUUID(),
        email,
        passwordHash,
        firstName: firstName || null,
        lastName: lastName || null,
      });

      const token = generateToken(user.id, user.email);

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      const users = await storage.searchUsersByTags([], undefined);
      const user = users.find(u => u.email === email);

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValid = await comparePassword(password, user.passwordHash);

      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = generateToken(user.id, user.email);

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.get('/api/auth/me', requireAuth, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        bio: user.bio,
        location: user.location,
      });
    } catch (error: any) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  app.get('/api/auth/user', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.userId;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ================================
  // USER ROUTES
  // ================================
  
  app.get('/api/users/all', requireAuth, async (req: AuthRequest, res) => {
    try {
      const currentUserId = req.user!.userId;
      const allUsers = await storage.getAllUsers();
      const users = allUsers.filter(u => u.id !== currentUserId);
      res.json(users);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put('/api/profile', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.userId;
      const user = await storage.updateUserProfile(userId, req.body);
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json(user);
    } catch (error: any) {
      console.error("Profile update error:", error);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ message: "Failed to update profile", error: error.message });
    }
  });

  app.post('/api/users/search', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { tags, location } = req.body;
      const users = await storage.searchUsersByTags(tags || [], location);
      res.json(users);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  app.post('/api/users/search/location', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { latitude, longitude, radius } = req.body;
      const users = await storage.searchUsersByLocation(latitude, longitude, radius);
      res.json(users);
    } catch (error) {
      console.error("Error searching users by location:", error);
      res.status(500).json({ message: "Failed to search users by location" });
    }
  });

  // ================================
  // SETTINGS ROUTES
  // ================================

  app.get('/api/settings', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.userId;
      const settings = await storage.getUserSettings(userId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching user settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put('/api/settings', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.userId;
      const settingsData = { ...req.body, userId };
      const updatedSettings = await storage.upsertUserSettings(settingsData);
      res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating user settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // ================================
  // FRIEND ROUTES
  // ================================
  
  app.get('/api/friends', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.userId;
      const friends = await storage.getFriends(userId);
      res.json(friends);
    } catch (error) {
      console.error("Error fetching friends:", error);
      res.status(500).json({ message: "Failed to fetch friends" });
    }
  });

  app.delete('/api/friends/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.userId;
      const friendId = req.params.id;
      await storage.removeFriend(userId, friendId);
      res.status(200).json({ message: "Friend removed" });
    } catch (error) {
      console.error("Error removing friend:", error);
      res.status(500).json({ message: "Failed to remove friend" });
    }
  });

  app.get('/api/friend-requests', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.userId;
      const requests = await storage.getFriendRequests(userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching friend requests:", error);
      res.status(500).json({ message: "Failed to fetch friend requests" });
    }
  });

  app.get('/api/friend-requests/sent', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.userId;
      const requests = await storage.getFriendRequestsSent(userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching sent friend requests:", error);
      res.status(500).json({ message: "Failed to fetch sent friend requests" });
    }
  });

  app.post('/api/friend-requests', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.userId;
      const { addresseeId } = req.body;
      
      if (!addresseeId) {
        return res.status(400).json({ message: "Addressee ID is required" });
      }
      
      const friendship = await storage.sendFriendRequest(userId, addresseeId);
      res.status(201).json(friendship);
    } catch (error) {
      console.error("Error sending friend request:", error);
      res.status(500).json({ message: "Failed to send friend request" });
    }
  });

  app.post('/api/friend-requests/:id/accept', requireAuth, async (req: AuthRequest, res) => {
    try {
      const requestId = parseInt(req.params.id);
      await storage.acceptFriendRequest(requestId);
      res.status(200).json({ message: "Friend request accepted" });
    } catch (error) {
      console.error("Error accepting friend request:", error);
      res.status(500).json({ message: "Failed to accept friend request" });
    }
  });

  app.post('/api/friend-requests/:id/reject', requireAuth, async (req: AuthRequest, res) => {
    try {
      const requestId = parseInt(req.params.id);
      await storage.rejectFriendRequest(requestId);
      res.status(200).json({ message: "Friend request rejected" });
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      res.status(500).json({ message: "Failed to reject friend request" });
    }
  });

  // ================================
  // MEETING ROUTES
  // ================================

  app.get('/api/meetings', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.userId;
      const meetings = await storage.getAllMeetingsForUser(userId);
      res.json(meetings);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      res.status(500).json({ message: "Failed to fetch meetings" });
    }
  });

  app.get('/api/meetings/all', requireAuth, async (req: AuthRequest, res) => {
    try {
      const meetings = await storage.getAllMeetings();
      res.json(meetings);
    } catch (error) {
      console.error("Error fetching all meetings:", error);
      res.status(500).json({ message: "Failed to fetch meetings" });
    }
  });

  app.get('/api/meetings/user', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.userId;
      const meetings = await storage.getAllMeetingsForUser(userId);
      res.json(meetings);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      res.status(500).json({ message: "Failed to fetch meetings" });
    }
  });

  app.get('/api/meetings/responses', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.userId;
      const responses = await storage.getAllMeetingResponsesForUser(userId);
      res.json(responses);
    } catch (error: any) {
      console.error("Error fetching meeting responses:", error?.message || error);
      res.json([]);
    }
  });

  app.post("/api/meetings", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.userId;
      const { participants, chatGroupId, proposedDateTime, image, ...meetingData } = req.body;
      
      const existingMeetings = await storage.getAllMeetingsForUser(userId);
      const userCreatedMeetings = existingMeetings.filter(m => m.suggestedById === userId);
      if (userCreatedMeetings.length >= 4) {
        return res.status(400).json({ message: "You can only create up to 4 meetings" });
      }

      const parsedDateTime = new Date(proposedDateTime);
      
      const meeting = await storage.createMeetingSuggestion({
        title: meetingData.title,
        description: meetingData.description,
        proposedDateTime: parsedDateTime,
        location: meetingData.location,
        duration: meetingData.duration || 60,
        requiresAllAccept: meetingData.requiresAllAccept || false,
        suggestedById: userId,
        groupId: chatGroupId || null,
        status: "accepted",
      });

      if (image) {
        try {
          const { uploadImageToCloudinary } = await import('./cloudinary');
          const imageUrl = await uploadImageToCloudinary(image, 'meetings');
          await storage.updateMeetingSuggestion(meeting.id, { backgroundImageUrl: imageUrl });
        } catch (error) {
          console.error("Error uploading meeting background:", error);
          await storage.deleteMeetingSuggestion(meeting.id);
          return res.status(500).json({ message: "Failed to upload image" });
        }
      }

      await storage.addMeetingParticipant({
        meetingId: meeting.id,
        userId: userId,
      });

      if (participants && participants.length > 0) {
        for (const participantId of participants) {
          if (participantId !== userId) {
            await storage.addMeetingParticipant({
              meetingId: meeting.id,
              userId: participantId,
            });
          }
        }
      }

      const updatedMeeting = await storage.getMeetingSuggestion(meeting.id);
      res.json(updatedMeeting);
    } catch (error) {
      console.error("Error creating meeting:", error);
      res.status(500).json({ message: "Failed to create meeting" });
    }
  });

  app.post('/api/meetings/respond', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.userId;
      const validatedData = insertMeetingResponseSchema.parse({
        ...req.body,
        userId
      });
      const response = await storage.respondToMeeting(validatedData);
      res.status(201).json(response);
    } catch (error) {
      console.error("Error responding to meeting:", error);
      res.status(400).json({ message: "Failed to respond to meeting" });
    }
  });

  app.get("/api/meetings/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const meetingId = parseInt(req.params.id);
      const meeting = await storage.getMeetingSuggestion(meetingId);
      
      if (!meeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }
      
      res.json(meeting);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/meetings/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const meetingId = parseInt(req.params.id);
      const userId = req.user!.userId;
      const { title, description, location, proposedDateTime, duration, isPrivate } = req.body;
      
      const meeting = await storage.getMeetingSuggestion(meetingId);
      if (!meeting || meeting.suggestedById !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const updated = await storage.updateMeetingSuggestion(meetingId, {
        title,
        description,
        location,
        proposedDateTime: new Date(proposedDateTime),
        duration,
        isPrivate,
      });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/meetings/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const meetingId = parseInt(req.params.id);
      const userId = req.user!.userId;
      
      const meeting = await storage.getMeetingSuggestion(meetingId);
      if (!meeting || meeting.suggestedById !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      if (meeting.backgroundImageUrl) {
        try {
          const { deleteImageFromCloudinary } = await import('./cloudinary');
          await deleteImageFromCloudinary(meeting.backgroundImageUrl);
        } catch (error) {
          console.error("Error deleting meeting background image:", error);
        }
      }
      
      await storage.deleteMeetingSuggestion(meetingId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/meetings/:id/join", requireAuth, async (req: AuthRequest, res) => {
    try {
      const meetingId = parseInt(req.params.id);
      const userId = req.user!.userId;
      
      await storage.joinMeeting(meetingId, userId);
      res.json({ message: "Joined meeting successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/meetings/:id/leave", requireAuth, async (req: AuthRequest, res) => {
    try {
      const meetingId = parseInt(req.params.id);
      const userId = req.user!.userId;
      
      await storage.leaveMeeting(meetingId, userId);
      res.json({ message: "Left meeting successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/meetings/:id/participants", requireAuth, async (req: AuthRequest, res) => {
    try {
      const meetingId = parseInt(req.params.id);
      const participants = await storage.getMeetingParticipants(meetingId);
      
      const participantsWithUsers = await Promise.all(
        participants.map(async (p) => {
          const user = await storage.getUser(p.userId);
          return user;
        })
      );
      
      res.json(participantsWithUsers.filter(Boolean));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/meetings/:id/respond', requireAuth, async (req: AuthRequest, res) => {
    try {
      const meetingId = parseInt(req.params.id);
      const userId = req.user!.userId;
      const validatedData = insertMeetingResponseSchema.parse({
        ...req.body,
        meetingId,
        userId
      });
      const response = await storage.respondToMeeting(validatedData);
      res.status(201).json(response);
    } catch (error) {
      console.error("Error responding to meeting:", error);
      res.status(400).json({ message: "Failed to respond to meeting" });
    }
  });

  app.post("/api/meetings/:id/background", requireAuth, async (req: AuthRequest, res) => {
    try {
      const meetingId = parseInt(req.params.id);
      const userId = req.user!.userId;
      const { image } = req.body;
      
      const meeting = await storage.getMeetingSuggestion(meetingId);
      if (!meeting || meeting.suggestedById !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      if (meeting.backgroundImageUrl) {
        const { deleteImageFromCloudinary } = await import('./cloudinary');
        await deleteImageFromCloudinary(meeting.backgroundImageUrl);
      }
      
      const { uploadImageToCloudinary } = await import('./cloudinary');
      const imageUrl = await uploadImageToCloudinary(image, 'meetings');
      
      const updated = await storage.updateMeetingSuggestion(meetingId, { backgroundImageUrl: imageUrl });
      res.json(updated);
    } catch (error: any) {
      console.error("Error uploading meeting background:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/meeting-responses/user', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.userId;
      const responses = await storage.getAllMeetingResponsesForUser(userId);
      res.json(responses);
    } catch (error: any) {
      console.error("Error fetching meeting responses:", error?.message || error);
      res.json([]);
    }
  });

  // ================================
  // GROUP / CHAT ROUTES
  // ================================

  app.get('/api/chat-groups', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.userId;
      const groups = await storage.getChatGroups(userId);
      res.json(groups);
    } catch (error) {
      console.error("Error fetching chat groups:", error);
      res.status(500).json({ message: "Failed to fetch chat groups" });
    }
  });

  app.get('/api/chat-groups/all', requireAuth, async (req: AuthRequest, res) => {
    try {
      const groups = await storage.getAllChatGroups();
      res.json(groups);
    } catch (error) {
      console.error("Error fetching all groups:", error);
      res.status(500).json({ message: "Failed to fetch groups" });
    }
  });

  app.post("/api/chat-groups", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.userId;
      const { name, description, isPrivate, image } = req.body;

      const existingGroups = await storage.getChatGroups(userId);
      const userCreatedGroups = existingGroups.filter(g => g.createdById === userId);
      if (userCreatedGroups.length >= 4) {
        return res.status(400).json({ message: "You can only create up to 4 groups" });
      }

      const group = await storage.createChatGroup({
        name,
        description,
        createdById: userId,
        isPrivate: isPrivate || false,
      });

      if (image) {
        try {
          const { uploadImageToCloudinary } = await import('./cloudinary');
          const imageUrl = await uploadImageToCloudinary(image, 'groups');
          await storage.updateChatGroup(group.id, { backgroundImageUrl: imageUrl });
          return res.json({ ...group, backgroundImageUrl: imageUrl });
        } catch (error) {
          console.error("Error uploading group background:", error);
          await storage.deleteChatGroup(group.id);
          return res.status(500).json({ message: "Failed to upload image" });
        }
      }

      res.json(group);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/chat-groups/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const group = await storage.getChatGroup(groupId);
      
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      
      res.json(group);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/chat-groups/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const userId = req.user!.userId;
      const { name, description, isPrivate } = req.body;
      
      const group = await storage.getChatGroup(groupId);
      if (!group || group.createdById !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const updated = await storage.updateChatGroup(groupId, { name, description, isPrivate });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/chat-groups/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const userId = req.user!.userId;
      
      const group = await storage.getChatGroup(groupId);
      if (!group || group.createdById !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      if (group.backgroundImageUrl) {
        try {
          const { deleteImageFromCloudinary } = await import('./cloudinary');
          await deleteImageFromCloudinary(group.backgroundImageUrl);
        } catch (error) {
          console.error("Error deleting group background image:", error);
        }
      }
      
      await storage.deleteChatGroup(groupId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/chat-groups/:id/join", requireAuth, async (req: AuthRequest, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const userId = req.user!.userId;
      
      await storage.joinChatGroup(groupId, userId);
      res.json({ message: "Joined group successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/chat-groups/:id/leave", requireAuth, async (req: AuthRequest, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const userId = req.user!.userId;
      
      await storage.leaveChatGroup(groupId, userId);
      res.json({ message: "Left group successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/chat-groups/:id/members", requireAuth, async (req: AuthRequest, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const members = await storage.getChatGroupMembers(groupId);
      res.json(members);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/chat-groups/:id/members', requireAuth, async (req: AuthRequest, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const { userId } = req.body;
      const member = await storage.addUserToGroup(groupId, userId);
      res.status(201).json(member);
    } catch (error) {
      console.error("Error adding user to group:", error);
      res.status(500).json({ message: "Failed to add user to group" });
    }
  });

  app.get('/api/chat-groups/:id/messages', requireAuth, async (req: AuthRequest, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string) || 50;
      const messages = await storage.getChatMessages(groupId, limit);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/chat-groups/:id/messages', requireAuth, async (req: AuthRequest, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const senderId = req.user!.userId;
      const validatedData = insertChatMessageSchema.parse({
        ...req.body,
        groupId,
        senderId
      });
      const message = await storage.sendMessage(validatedData);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(400).json({ message: "Failed to send message" });
    }
  });

  app.get('/api/chat-groups/:id/meetings', requireAuth, async (req: AuthRequest, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const suggestions = await storage.getMeetingSuggestions(groupId);
      res.json(suggestions);
    } catch (error) {
      console.error("Error fetching meeting suggestions:", error);
      res.status(500).json({ message: "Failed to fetch meeting suggestions" });
    }
  });

  app.post('/api/chat-groups/:id/meetings', requireAuth, async (req: AuthRequest, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const suggestedById = req.user!.userId;
      const validatedData = insertMeetingSuggestionSchema.parse({
        ...req.body,
        groupId,
        suggestedById
      });
      const suggestion = await storage.createMeetingSuggestion(validatedData);
      res.status(201).json(suggestion);
    } catch (error) {
      console.error("Error creating meeting suggestion:", error);
      res.status(400).json({ message: "Failed to create meeting suggestion" });
    }
  });

  app.post("/api/chat-groups/:id/background", requireAuth, async (req: AuthRequest, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const userId = req.user!.userId;
      const { image } = req.body;
      
      const group = await storage.getChatGroup(groupId);
      if (!group || group.createdById !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      if (group.backgroundImageUrl) {
        const { deleteImageFromCloudinary } = await import('./cloudinary');
        await deleteImageFromCloudinary(group.backgroundImageUrl);
      }
      
      const { uploadImageToCloudinary } = await import('./cloudinary');
      const imageUrl = await uploadImageToCloudinary(image, 'groups');
      
      const updated = await storage.updateChatGroup(groupId, { backgroundImageUrl: imageUrl });
      res.json(updated);
    } catch (error: any) {
      console.error("Error uploading group background:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ================================
  // DIRECT MESSAGE ROUTES
  // ================================

  app.get('/api/direct-messages/:otherUserId', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.userId;
      const otherUserId = req.params.otherUserId;
      
      const messages = await storage.getDirectMessages(userId, otherUserId);
      
      const messagesWithSender = await Promise.all(
        messages.map(async (message) => {
          const sender = await storage.getUser(message.senderId);
          return {
            ...message,
            sender,
          };
        })
      );
      
      res.json(messagesWithSender);
    } catch (error) {
      console.error("Error fetching direct messages:", error);
      res.status(500).json({ message: "Failed to fetch direct messages" });
    }
  });

  app.post('/api/direct-messages', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.userId;
      const { recipientId, content } = req.body;
      
      const message = await storage.sendDirectMessage({
        senderId: userId,
        recipientId,
        content,
      });
      
      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending direct message:", error);
      res.status(500).json({ message: "Failed to send direct message" });
    }
  });

  // ================================
  // SEARCH ROUTES
  // ================================

  app.get('/api/search/users', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string' || q.length < 2) {
        return res.json([]);
      }
      
      const users = await storage.searchUsersByTags([], q);
      res.json(users);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  app.get("/api/search/chats", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.userId;
      const { tagIds } = req.query;
      
      if (!tagIds) {
        return res.status(400).json({ error: "Tag IDs are required" });
      }
      
      const tagIdArray = Array.isArray(tagIds) 
        ? tagIds.map((id: string) => parseInt(id))
        : [parseInt(tagIds as string)];
      
      const chats = await storage.searchTaggedChats(userId, tagIdArray);
      res.json(chats);
    } catch (error) {
      console.error("Error searching tagged chats:", error);
      res.status(500).json({ error: "Failed to search tagged chats" });
    }
  });

  app.get("/api/search/meetings", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.userId;
      const { tagIds } = req.query;
      
      if (!tagIds) {
        return res.status(400).json({ error: "Tag IDs are required" });
      }
      
      const tagIdArray = Array.isArray(tagIds) 
        ? tagIds.map((id: string) => parseInt(id))
        : [parseInt(tagIds as string)];
      
      const meetings = await storage.searchTaggedMeetings(userId, tagIdArray);
      res.json(meetings);
    } catch (error) {
      console.error("Error searching tagged meetings:", error);
      res.status(500).json({ error: "Failed to search tagged meetings" });
    }
  });

  // ================================
  // CALENDAR CONNECTION ROUTES
  // ================================

  app.get("/api/connections", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.userId;
      const connections = await storage.getCalendarConnections(userId);
      res.json(connections);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch connections" });
    }
  });

  app.post("/api/connections", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.userId;
      const validatedData = insertCalendarConnectionSchema.parse({
        ...req.body,
        userId
      });
      const connection = await storage.createCalendarConnection(validatedData);
      res.status(201).json(connection);
    } catch (error) {
      res.status(400).json({ error: "Invalid connection data" });
    }
  });

  app.put("/api/connections/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const connection = await storage.updateCalendarConnection(id, req.body);
      res.json(connection);
    } catch (error) {
      res.status(400).json({ error: "Failed to update connection" });
    }
  });

  app.delete("/api/connections/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCalendarConnection(id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Failed to delete connection" });
    }
  });

  // ================================
  // CALENDAR ROUTES
  // ================================

  app.get("/api/calendars", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.userId;
      const calendars = await storage.getCalendars(userId);
      res.json(calendars);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch calendars" });
    }
  });

  app.post("/api/calendars", requireAuth, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertCalendarSchema.parse(req.body);
      const calendar = await storage.createCalendar(validatedData);
      res.status(201).json(calendar);
    } catch (error) {
      res.status(400).json({ error: "Invalid calendar data" });
    }
  });

  app.post("/api/calendars/:id/share", requireAuth, async (req: AuthRequest, res) => {
    try {
      const calendarId = parseInt(req.params.id);
      const sharedByUserId = req.user!.userId;
      const validatedData = insertCalendarShareSchema.parse({
        ...req.body,
        calendarId,
        sharedByUserId
      });
      const share = await storage.shareCalendar(validatedData);
      res.status(201).json(share);
    } catch (error) {
      console.error("Error sharing calendar:", error);
      res.status(400).json({ error: "Failed to share calendar" });
    }
  });

  // ================================
  // CALENDAR SHARE ROUTES
  // ================================

  app.get("/api/calendar-shares", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.userId;
      const shares = await storage.getCalendarShares(userId);
      res.json(shares);
    } catch (error) {
      console.error("Error fetching calendar shares:", error);
      res.status(500).json({ error: "Failed to fetch calendar shares" });
    }
  });

  app.get("/api/calendar-shares/received", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.userId;
      const shares = await storage.getReceivedCalendarShares(userId);
      res.json(shares);
    } catch (error) {
      console.error("Error fetching received calendar shares:", error);
      res.status(500).json({ error: "Failed to fetch received calendar shares" });
    }
  });

  app.post("/api/calendar-shares/:id/accept", requireAuth, async (req: AuthRequest, res) => {
    try {
      const shareId = parseInt(req.params.id);
      await storage.acceptCalendarShare(shareId);
      res.status(200).json({ message: "Calendar share accepted" });
    } catch (error) {
      console.error("Error accepting calendar share:", error);
      res.status(400).json({ error: "Failed to accept calendar share" });
    }
  });

  app.post("/api/calendar-shares/:id/decline", requireAuth, async (req: AuthRequest, res) => {
    try {
      const shareId = parseInt(req.params.id);
      await storage.declineCalendarShare(shareId);
      res.status(200).json({ message: "Calendar share declined" });
    } catch (error) {
      console.error("Error declining calendar share:", error);
      res.status(400).json({ error: "Failed to decline calendar share" });
    }
  });

  app.delete("/api/calendar-shares/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const shareId = parseInt(req.params.id);
      await storage.revokeCalendarShare(shareId);
      res.status(204).send();
    } catch (error) {
      console.error("Error revoking calendar share:", error);
      res.status(400).json({ error: "Failed to revoke calendar share" });
    }
  });

  app.put("/api/calendar-shares/:id/permission", requireAuth, async (req: AuthRequest, res) => {
    try {
      const shareId = parseInt(req.params.id);
      const { permission } = req.body;
      const share = await storage.updateCalendarSharePermission(shareId, permission);
      res.json(share);
    } catch (error) {
      console.error("Error updating calendar share permission:", error);
      res.status(400).json({ error: "Failed to update calendar share permission" });
    }
  });

  // ================================
  // EVENT ROUTES
  // ================================

  app.get("/api/events", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.userId;
      const events = await storage.getEvents(userId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.get("/api/events/range", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.userId;
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate and endDate are required" });
      }

      const events = await storage.getEventsByDateRange(
        userId,
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.post("/api/events", requireAuth, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ error: "Invalid event data" });
    }
  });

  app.get("/api/events/:id/comments", requireAuth, async (req: AuthRequest, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const comments = await storage.getEventComments(eventId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching event comments:", error);
      res.status(500).json({ error: "Failed to fetch event comments" });
    }
  });

  app.post("/api/events/:id/comments", requireAuth, async (req: AuthRequest, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = req.user!.userId;
      const validatedData = insertEventCommentSchema.parse({
        ...req.body,
        eventId,
        userId
      });
      const comment = await storage.addEventComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error adding event comment:", error);
      res.status(400).json({ error: "Failed to add event comment" });
    }
  });

  app.get("/api/events/:id/changes", requireAuth, async (req: AuthRequest, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const changes = await storage.getEventChangeLogs(eventId);
      res.json(changes);
    } catch (error) {
      console.error("Error fetching event changes:", error);
      res.status(500).json({ error: "Failed to fetch event changes" });
    }
  });

  // ================================
  // COMMENT ROUTES
  // ================================

  app.put("/api/comments/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const commentId = parseInt(req.params.id);
      const { comment } = req.body;
      const updatedComment = await storage.updateEventComment(commentId, comment);
      res.json(updatedComment);
    } catch (error) {
      console.error("Error updating event comment:", error);
      res.status(400).json({ error: "Failed to update event comment" });
    }
  });

  app.delete("/api/comments/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const commentId = parseInt(req.params.id);
      await storage.deleteEventComment(commentId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting event comment:", error);
      res.status(400).json({ error: "Failed to delete event comment" });
    }
  });

  // ================================
  // CONFLICT ROUTES
  // ================================

  app.get("/api/conflicts", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.userId;
      const conflicts = await storage.getConflicts(userId);
      res.json(conflicts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch conflicts" });
    }
  });

  app.get("/api/conflicts/unresolved", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.userId;
      const conflicts = await storage.getUnresolvedConflicts(userId);
      res.json(conflicts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch unresolved conflicts" });
    }
  });

  app.post("/api/conflicts/:id/resolve", requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.resolveConflict(id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Failed to resolve conflict" });
    }
  });

  // ================================
  // COLLABORATION ROUTES
  // ================================

  app.get("/api/collaborations", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.userId;
      const collaborations = await storage.getCollaborations(userId);
      res.json(collaborations);
    } catch (error) {
      console.error("Error fetching collaborations:", error);
      res.status(500).json({ error: "Failed to fetch collaborations" });
    }
  });

  app.post("/api/collaborations", requireAuth, async (req: AuthRequest, res) => {
    try {
      const createdByUserId = req.user!.userId;
      const validatedData = insertCalendarCollaborationSchema.parse({
        ...req.body,
        createdByUserId
      });
      const collaboration = await storage.createCollaboration(validatedData);
      
      await storage.addCollaborationMember({
        collaborationId: collaboration.id,
        userId: createdByUserId,
        role: "owner"
      });
      
      res.status(201).json(collaboration);
    } catch (error) {
      console.error("Error creating collaboration:", error);
      res.status(400).json({ error: "Failed to create collaboration" });
    }
  });

  app.get("/api/collaborations/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const collaboration = await storage.getCollaboration(id);
      if (!collaboration) {
        return res.status(404).json({ error: "Collaboration not found" });
      }
      res.json(collaboration);
    } catch (error) {
      console.error("Error fetching collaboration:", error);
      res.status(500).json({ error: "Failed to fetch collaboration" });
    }
  });

  app.put("/api/collaborations/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const collaboration = await storage.updateCollaboration(id, req.body);
      res.json(collaboration);
    } catch (error) {
      console.error("Error updating collaboration:", error);
      res.status(400).json({ error: "Failed to update collaboration" });
    }
  });

  app.delete("/api/collaborations/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCollaboration(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting collaboration:", error);
      res.status(400).json({ error: "Failed to delete collaboration" });
    }
  });

  app.get("/api/collaborations/:id/members", requireAuth, async (req: AuthRequest, res) => {
    try {
      const collaborationId = parseInt(req.params.id);
      const members = await storage.getCollaborationMembers(collaborationId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching collaboration members:", error);
      res.status(500).json({ error: "Failed to fetch collaboration members" });
    }
  });

  app.post("/api/collaborations/:id/members", requireAuth, async (req: AuthRequest, res) => {
    try {
      const collaborationId = parseInt(req.params.id);
      const validatedData = insertCollaborationMemberSchema.parse({
        ...req.body,
        collaborationId
      });
      const member = await storage.addCollaborationMember(validatedData);
      res.status(201).json(member);
    } catch (error) {
      console.error("Error adding collaboration member:", error);
      res.status(400).json({ error: "Failed to add collaboration member" });
    }
  });

  app.delete("/api/collaborations/:id/members/:userId", requireAuth, async (req: AuthRequest, res) => {
    try {
      const collaborationId = parseInt(req.params.id);
      const userId = req.params.userId;
      await storage.removeCollaborationMember(collaborationId, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing collaboration member:", error);
      res.status(400).json({ error: "Failed to remove collaboration member" });
    }
  });

  app.put("/api/collaborations/:id/members/:userId/role", requireAuth, async (req: AuthRequest, res) => {
    try {
      const collaborationId = parseInt(req.params.id);
      const userId = req.params.userId;
      const { role } = req.body;
      const member = await storage.updateMemberRole(collaborationId, userId, role);
      res.json(member);
    } catch (error) {
      console.error("Error updating member role:", error);
      res.status(400).json({ error: "Failed to update member role" });
    }
  });

  app.get("/api/collaborations/:id/calendars", requireAuth, async (req: AuthRequest, res) => {
    try {
      const collaborationId = parseInt(req.params.id);
      const calendars = await storage.getCollaborationCalendars(collaborationId);
      res.json(calendars);
    } catch (error) {
      console.error("Error fetching collaboration calendars:", error);
      res.status(500).json({ error: "Failed to fetch collaboration calendars" });
    }
  });

  app.post("/api/collaborations/:id/calendars", requireAuth, async (req: AuthRequest, res) => {
    try {
      const collaborationId = parseInt(req.params.id);
      const addedByUserId = req.user!.userId;
      const validatedData = insertCollaborationCalendarSchema.parse({
        ...req.body,
        collaborationId,
        addedByUserId
      });
      const collaborationCalendar = await storage.addCalendarToCollaboration(validatedData);
      res.status(201).json(collaborationCalendar);
    } catch (error) {
      console.error("Error adding calendar to collaboration:", error);
      res.status(400).json({ error: "Failed to add calendar to collaboration" });
    }
  });

  app.delete("/api/collaborations/:id/calendars/:calendarId", requireAuth, async (req: AuthRequest, res) => {
    try {
      const collaborationId = parseInt(req.params.id);
      const calendarId = parseInt(req.params.calendarId);
      await storage.removeCalendarFromCollaboration(collaborationId, calendarId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing calendar from collaboration:", error);
      res.status(400).json({ error: "Failed to remove calendar from collaboration" });
    }
  });

  // ================================
  // TAG ROUTES
  // ================================

  app.get("/api/tags", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.userId;
      const { type } = req.query;
      
      const tags = type 
        ? await storage.getTagsByType(userId, type as 'friend' | 'group')
        : await storage.getUserTags(userId);
      res.json(tags);
    } catch (error) {
      console.error("Error fetching tags:", error);
      res.status(500).json({ error: "Failed to fetch tags" });
    }
  });

  app.post("/api/tags", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.userId;
      const validatedData = insertTagSchema.parse({
        ...req.body,
        userId
      });
      const tag = await storage.createTag(validatedData);
      res.status(201).json(tag);
    } catch (error) {
      console.error("Error creating tag:", error);
      res.status(400).json({ error: "Failed to create tag" });
    }
  });

  app.put("/api/tags/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const tagId = parseInt(req.params.id);
      const updatedTag = await storage.updateTag(tagId, req.body);
      res.json(updatedTag);
    } catch (error) {
      console.error("Error updating tag:", error);
      res.status(400).json({ error: "Failed to update tag" });
    }
  });

  app.delete("/api/tags/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const tagId = parseInt(req.params.id);
      await storage.deleteTag(tagId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting tag:", error);
      res.status(400).json({ error: "Failed to delete tag" });
    }
  });

  app.get("/api/chats/:chatId/tags", requireAuth, async (req: AuthRequest, res) => {
    try {
      const chatId = req.params.chatId;
      const tags = await storage.getChatTags(chatId);
      res.json(tags);
    } catch (error) {
      console.error("Error fetching chat tags:", error);
      res.status(500).json({ error: "Failed to fetch chat tags" });
    }
  });

  app.post("/api/chats/:chatId/tags", requireAuth, async (req: AuthRequest, res) => {
    try {
      const chatId = req.params.chatId;
      const addedByUserId = req.user!.userId;
      const validatedData = insertChatTagSchema.parse({
        ...req.body,
        chatId,
        addedByUserId
      });
      const chatTag = await storage.addChatTag(validatedData);
      res.status(201).json(chatTag);
    } catch (error) {
      console.error("Error adding chat tag:", error);
      res.status(400).json({ error: "Failed to add chat tag" });
    }
  });

  app.delete("/api/chats/:chatId/tags/:tagId", requireAuth, async (req: AuthRequest, res) => {
    try {
      const chatId = req.params.chatId;
      const tagId = parseInt(req.params.tagId);
      await storage.removeChatTag(chatId, tagId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing chat tag:", error);
      res.status(400).json({ error: "Failed to remove chat tag" });
    }
  });

  app.get("/api/meetings/:meetingId/tags", requireAuth, async (req: AuthRequest, res) => {
    try {
      const meetingId = parseInt(req.params.meetingId);
      const tags = await storage.getMeetingTags(meetingId);
      res.json(tags);
    } catch (error) {
      console.error("Error fetching meeting tags:", error);
      res.status(500).json({ error: "Failed to fetch meeting tags" });
    }
  });

  app.post("/api/meetings/:meetingId/tags", requireAuth, async (req: AuthRequest, res) => {
    try {
      const meetingId = parseInt(req.params.meetingId);
      const addedByUserId = req.user!.userId;
      const validatedData = insertMeetingTagSchema.parse({
        ...req.body,
        meetingId,
        addedByUserId
      });
      const meetingTag = await storage.addMeetingTag(validatedData);
      res.status(201).json(meetingTag);
    } catch (error) {
      console.error("Error adding meeting tag:", error);
      res.status(400).json({ error: "Failed to add meeting tag" });
    }
  });

  app.delete("/api/meetings/:meetingId/tags/:tagId", requireAuth, async (req: AuthRequest, res) => {
    try {
      const meetingId = parseInt(req.params.meetingId);
      const tagId = parseInt(req.params.tagId);
      await storage.removeMeetingTag(meetingId, tagId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing meeting tag:", error);
      res.status(400).json({ error: "Failed to remove meeting tag" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

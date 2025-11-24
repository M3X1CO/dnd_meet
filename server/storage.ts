import { 
  // Database tables
  users,
  userSettings,
  friendships,
  chatGroups,
  chatGroupMembers,
  chatMessages,
  directMessages,
  meetingSuggestions,
  meetingResponses,
  meetingParticipants,
  calendarConnections,
  calendars,
  events,
  conflicts,
  calendarShares,
  calendarCollaborations,
  collaborationMembers,
  collaborationCalendars,
  eventComments,
  eventChangeLog,
  tags,
  chatTags,
  meetingTags,
  
  // User and auth types
  type User,
  type UpsertUser,
  type InsertUser,
  type UserSettings,
  type InsertUserSettings,
  type Friendship,
  type InsertFriendship,
  
  // Chat and meeting types
  type ChatGroup,
  type InsertChatGroup,
  type ChatGroupMember,
  type InsertChatGroupMember,
  type ChatMessage,
  type InsertChatMessage,
  type DirectMessage,
  type InsertDirectMessage,
  type MeetingSuggestion,
  type InsertMeetingSuggestion,
  type MeetingResponse,
  type InsertMeetingResponse,
  type MeetingParticipant,
  type InsertMeetingParticipant,
  
  // Calendar types
  type CalendarConnection,
  type InsertCalendarConnection,
  type Calendar,
  type InsertCalendar,
  type Event,
  type InsertEvent,
  type Conflict,
  type InsertConflict,
  
  // Calendar sharing types
  type CalendarShare,
  type InsertCalendarShare,
  type CalendarCollaboration,
  type InsertCalendarCollaboration,
  type CollaborationMember,
  type InsertCollaborationMember,
  type CollaborationCalendar,
  type InsertCollaborationCalendar,
  type EventComment,
  type InsertEventComment,
  type EventChangeLog,
  type InsertEventChangeLog,
  
  // Tag types
  type Tag,
  type InsertTag,
  type ChatTag,
  type InsertChatTag,
  type MeetingTag,
  type InsertMeetingTag,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // ================================
  // User Operations
  // ================================
  
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // User settings operations
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  upsertUserSettings(settings: InsertUserSettings): Promise<UserSettings>;

  // Friend operations
  getFriends(userId: string): Promise<User[]>;
  getFriendRequests(userId: string): Promise<Friendship[]>;
  getFriendRequestsSent(userId: string): Promise<Friendship[]>;
  sendFriendRequest(requesterId: string, addresseeId: string): Promise<Friendship>;
  acceptFriendRequest(requestId: number): Promise<void>;
  rejectFriendRequest(requestId: number): Promise<void>;
  removeFriend(userId: string, friendId: string): Promise<void>;

  // User search operations
  searchUsersByTags(tags: string[], location?: string): Promise<User[]>;
  searchUsersByLocation(latitude: number, longitude: number, radius: number): Promise<User[]>;
  updateUserProfile(userId: string, profile: Partial<User>): Promise<User>;

  // ================================
  // Chat & Meeting Operations
  // ================================
  
  // Chat operations
  getChatGroups(userId: string): Promise<ChatGroup[]>;
  getChatGroup(groupId: number): Promise<ChatGroup | undefined>;
  createChatGroup(group: InsertChatGroup): Promise<ChatGroup>;
  addUserToGroup(groupId: number, userId: string): Promise<ChatGroupMember>;
  removeUserFromGroup(groupId: number, userId: string): Promise<void>;
  getChatMessages(groupId: number, limit?: number): Promise<ChatMessage[]>;
  sendMessage(message: InsertChatMessage): Promise<ChatMessage>;

  // Direct message operations
  getDirectMessages(userId: string, otherUserId: string, limit?: number): Promise<DirectMessage[]>;
  sendDirectMessage(message: InsertDirectMessage): Promise<DirectMessage>;

  // Meeting operations
  getMeetingSuggestions(groupId: number): Promise<MeetingSuggestion[]>;
  getAllMeetingsForUser(userId: string): Promise<MeetingSuggestion[]>;
  createMeetingSuggestion(suggestion: InsertMeetingSuggestion): Promise<MeetingSuggestion>;
  respondToMeeting(response: InsertMeetingResponse): Promise<MeetingResponse>;
  getMeetingResponses(meetingId: number): Promise<MeetingResponse[]>;
  getAllMeetingResponsesForUser(userId: string): Promise<MeetingResponse[]>;
  
  // Meeting participant operations
  addMeetingParticipant(participant: InsertMeetingParticipant): Promise<MeetingParticipant>;
  removeMeetingParticipant(meetingId: number, userId: string): Promise<void>;
  getMeetingParticipants(meetingId: number): Promise<MeetingParticipant[]>;

  // Public visibility operations
  getAllMeetings(): Promise<MeetingSuggestion[]>;
  getAllChatGroups(): Promise<ChatGroup[]>;
  getAllUsers(): Promise<User[]>;
  joinMeeting(meetingId: number, userId: string): Promise<void>;
  leaveMeeting(meetingId: number, userId: string): Promise<void>;
  joinChatGroup(groupId: number, userId: string): Promise<void>;
  leaveChatGroup(groupId: number, userId: string): Promise<void>;

  // ================================
  // Calendar Operations
  // ================================
  
  // Calendar connection operations
  getCalendarConnections(userId: string): Promise<CalendarConnection[]>;
  getCalendarConnection(id: number): Promise<CalendarConnection | undefined>;
  createCalendarConnection(connection: InsertCalendarConnection): Promise<CalendarConnection>;
  updateCalendarConnection(id: number, connection: Partial<CalendarConnection>): Promise<CalendarConnection>;
  deleteCalendarConnection(id: number): Promise<void>;

  // Calendar operations
  getCalendars(userId: string): Promise<Calendar[]>;
  getCalendarsByConnection(connectionId: number): Promise<Calendar[]>;
  getCalendar(id: number): Promise<Calendar | undefined>;
  createCalendar(calendar: InsertCalendar): Promise<Calendar>;
  updateCalendar(id: number, calendar: Partial<Calendar>): Promise<Calendar>;
  deleteCalendar(id: number): Promise<void>;

  // Event operations
  getEvents(userId: string): Promise<Event[]>;
  getEventsByCalendar(calendarId: number): Promise<Event[]>;
  getEventsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<Event>): Promise<Event>;
  deleteEvent(id: number): Promise<void>;

  // Conflict operations
  getConflicts(userId: string): Promise<Conflict[]>;
  getUnresolvedConflicts(userId: string): Promise<Conflict[]>;
  createConflict(conflict: InsertConflict): Promise<Conflict>;
  resolveConflict(id: number): Promise<void>;

  // ================================
  // Calendar Sharing Operations
  // ================================
  
  // Individual calendar sharing
  shareCalendar(share: InsertCalendarShare): Promise<CalendarShare>;
  getCalendarShares(userId: string): Promise<CalendarShare[]>;
  getReceivedCalendarShares(userId: string): Promise<CalendarShare[]>;
  acceptCalendarShare(shareId: number): Promise<void>;
  declineCalendarShare(shareId: number): Promise<void>;
  revokeCalendarShare(shareId: number): Promise<void>;
  updateCalendarSharePermission(shareId: number, permission: string): Promise<CalendarShare>;

  // Calendar collaboration operations
  createCollaboration(collaboration: InsertCalendarCollaboration): Promise<CalendarCollaboration>;
  getCollaborations(userId: string): Promise<CalendarCollaboration[]>;
  getCollaboration(id: number): Promise<CalendarCollaboration | undefined>;
  updateCollaboration(id: number, updates: Partial<CalendarCollaboration>): Promise<CalendarCollaboration>;
  deleteCollaboration(id: number): Promise<void>;
  addCollaborationMember(member: InsertCollaborationMember): Promise<CollaborationMember>;
  removeCollaborationMember(collaborationId: number, userId: string): Promise<void>;
  updateMemberRole(collaborationId: number, userId: string, role: string): Promise<CollaborationMember>;
  getCollaborationMembers(collaborationId: number): Promise<CollaborationMember[]>;
  addCalendarToCollaboration(calendarCollaboration: InsertCollaborationCalendar): Promise<CollaborationCalendar>;
  removeCalendarFromCollaboration(collaborationId: number, calendarId: number): Promise<void>;
  getCollaborationCalendars(collaborationId: number): Promise<CollaborationCalendar[]>;

  // Event collaboration operations
  addEventComment(comment: InsertEventComment): Promise<EventComment>;
  getEventComments(eventId: number): Promise<EventComment[]>;
  updateEventComment(commentId: number, comment: string): Promise<EventComment>;
  deleteEventComment(commentId: number): Promise<void>;
  logEventChange(changeLog: InsertEventChangeLog): Promise<EventChangeLog>;
  getEventChangeLogs(eventId: number): Promise<EventChangeLog[]>;
  
  // ================================
  // Tag Operations
  // ================================
  
  // Tag management
  createTag(tag: InsertTag): Promise<Tag>;
  getUserTags(userId: string): Promise<Tag[]>;
  getTagsByType(userId: string, type: 'friend' | 'group'): Promise<Tag[]>;
  deleteTag(tagId: number): Promise<void>;
  updateTag(tagId: number, updates: Partial<Tag>): Promise<Tag>;
  
  // Chat tagging
  addChatTag(chatTag: InsertChatTag): Promise<ChatTag>;
  getChatTags(chatId: string): Promise<ChatTag[]>;
  removeChatTag(chatId: string, tagId: number): Promise<void>;
  
  // Meeting tagging
  addMeetingTag(meetingTag: InsertMeetingTag): Promise<MeetingTag>;
  getMeetingTags(meetingId: number): Promise<MeetingTag[]>;
  removeMeetingTag(meetingId: number, tagId: number): Promise<void>;
  
  // Tag search operations
  searchTaggedChats(userId: string, tagIds: number[]): Promise<any[]>;
  searchTaggedMeetings(userId: string, tagIds: number[]): Promise<MeetingSuggestion[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return settings;
  }

  async upsertUserSettings(settingsData: InsertUserSettings): Promise<UserSettings> {
    const [settings] = await db
      .insert(userSettings)
      .values(settingsData)
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: {
          ...settingsData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return settings;
  }

  // Friend operations
  async getFriends(userId: string): Promise<User[]> {
    const friends = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        bio: users.bio,
        location: users.location,
        tags: users.tags,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        latitude: users.latitude,
        longitude: users.longitude,
      })
      .from(users)
      .innerJoin(friendships, 
        or(
          and(eq(friendships.requesterId, userId), eq(friendships.addresseeId, users.id)),
          and(eq(friendships.addresseeId, userId), eq(friendships.requesterId, users.id))
        )
      )
      .where(eq(friendships.status, "accepted"));

    return friends;
  }

  async getFriendRequests(userId: string): Promise<Friendship[]> {
    return await db
      .select()
      .from(friendships)
      .where(
        and(
          eq(friendships.addresseeId, userId),
          eq(friendships.status, "pending")
        )
      );
  }

  async getFriendRequestsSent(userId: string): Promise<Friendship[]> {
    return await db
      .select()
      .from(friendships)
      .where(
        and(
          eq(friendships.requesterId, userId),
          eq(friendships.status, "pending")
        )
      );
  }

  async sendFriendRequest(requesterId: string, addresseeId: string): Promise<Friendship> {
    const [friendship] = await db
      .insert(friendships)
      .values({
        requesterId,
        addresseeId,
        status: "pending",
      })
      .returning();
    return friendship;
  }

  async acceptFriendRequest(requestId: number): Promise<void> {
    await db
      .update(friendships)
      .set({ status: "accepted", updatedAt: new Date() })
      .where(eq(friendships.id, requestId));
  }

  async rejectFriendRequest(requestId: number): Promise<void> {
    await db
      .update(friendships)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(eq(friendships.id, requestId));
  }

  async removeFriend(userId: string, friendId: string): Promise<void> {
    await db
      .delete(friendships)
      .where(
        or(
          and(eq(friendships.requesterId, userId), eq(friendships.addresseeId, friendId)),
          and(eq(friendships.requesterId, friendId), eq(friendships.addresseeId, userId))
        )
      );
  }

  // User search operations
  async searchUsersByTags(tags: string[], location?: string): Promise<User[]> {
    let conditions = [];
    
    if (tags.length > 0) {
      conditions.push(
        sql`${users.tags} && ${JSON.stringify(tags)}`
      );
    }
    
    if (location) {
      conditions.push(eq(users.location, location));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(users).where(and(...conditions));
    } else {
      return await db.select().from(users);
    }
  }

  async searchUsersByLocation(latitude: number, longitude: number, radius: number): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(
        sql`(
          6371 * acos(
            cos(radians(${latitude})) * 
            cos(radians(${users.latitude})) * 
            cos(radians(${users.longitude}) - radians(${longitude})) + 
            sin(radians(${latitude})) * 
            sin(radians(${users.latitude}))
          )
        ) < ${radius}`
      );
  }

  async updateUserProfile(userId: string, profile: Partial<User>): Promise<User> {
    console.log("Storage: updateUserProfile called with userId:", userId);
    console.log("Storage: profile data:", profile);
    
    try {
      const [user] = await db
        .update(users)
        .set({ ...profile, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();
      
      console.log("Storage: update successful, returning user:", user);
      return user;
    } catch (error) {
      console.error("Storage: update failed:", error);
      throw error;
    }
  }

  // Chat operations
  async getChatGroups(userId: string): Promise<ChatGroup[]> {
    const result = await db
      .select({ 
        id: chatGroups.id, 
        name: chatGroups.name, 
        description: chatGroups.description,
        createdById: chatGroups.createdById,
        isPrivate: chatGroups.isPrivate,
        createdAt: chatGroups.createdAt,
        updatedAt: chatGroups.updatedAt
      })
      .from(chatGroups)
      .innerJoin(chatGroupMembers, eq(chatGroups.id, chatGroupMembers.groupId))
      .where(eq(chatGroupMembers.userId, userId));
    
    return result;
  }

  async getChatGroup(groupId: number): Promise<ChatGroup | undefined> {
    const [group] = await db
      .select()
      .from(chatGroups)
      .where(eq(chatGroups.id, groupId));
    return group;
  }

  async createChatGroup(group: InsertChatGroup): Promise<ChatGroup> {
    const mobileImageIndex = Math.floor(Math.random() * 10);
    
    const [newGroup] = await db
      .insert(chatGroups)
      .values({
        ...group,
        mobileImageIndex,
      })
      .returning();
    
    // Add creator as admin
    await db.insert(chatGroupMembers).values({
      groupId: newGroup.id,
      userId: group.createdById,
      role: "admin",
    });
    
    return newGroup;
  }

  async addUserToGroup(groupId: number, userId: string): Promise<ChatGroupMember> {
    const [member] = await db
      .insert(chatGroupMembers)
      .values({
        groupId,
        userId,
        role: "member",
      })
      .returning();
    return member;
  }

  async removeUserFromGroup(groupId: number, userId: string): Promise<void> {
    await db
      .delete(chatGroupMembers)
      .where(
        and(
          eq(chatGroupMembers.groupId, groupId),
          eq(chatGroupMembers.userId, userId)
        )
      );
  }

  async getChatMessages(groupId: number, limit: number = 50): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.groupId, groupId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
  }

  async sendMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db
      .insert(chatMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  async getDirectMessages(userId: string, otherUserId: string, limit: number = 50): Promise<DirectMessage[]> {
    const messages = await db
      .select()
      .from(directMessages)
      .where(
        or(
          and(eq(directMessages.senderId, userId), eq(directMessages.recipientId, otherUserId)),
          and(eq(directMessages.senderId, otherUserId), eq(directMessages.recipientId, userId))
        )
      )
      .orderBy(desc(directMessages.createdAt))
      .limit(limit);
    
    return messages.reverse(); // Show oldest messages first
  }

  async sendDirectMessage(message: InsertDirectMessage): Promise<DirectMessage> {
    const [newMessage] = await db
      .insert(directMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  // Meeting operations
  async getMeetingSuggestions(groupId: number): Promise<MeetingSuggestion[]> {
    return await db
      .select()
      .from(meetingSuggestions)
      .where(eq(meetingSuggestions.groupId, groupId))
      .orderBy(desc(meetingSuggestions.createdAt));
  }

  async getAllMeetingsForUser(userId: string): Promise<MeetingSuggestion[]> {
    // Get meetings where user is in the group
    const groupMeetings = await db
      .select({
        id: meetingSuggestions.id,
        groupId: meetingSuggestions.groupId,
        suggestedById: meetingSuggestions.suggestedById,
        title: meetingSuggestions.title,
        description: meetingSuggestions.description,
        proposedDateTime: meetingSuggestions.proposedDateTime,
        location: meetingSuggestions.location,
        duration: meetingSuggestions.duration,
        requiresAllAccept: meetingSuggestions.requiresAllAccept,
        status: meetingSuggestions.status,
        participants: meetingSuggestions.participants,
        createdAt: meetingSuggestions.createdAt,
        updatedAt: meetingSuggestions.updatedAt
      })
      .from(meetingSuggestions)
      .innerJoin(chatGroups, eq(meetingSuggestions.groupId, chatGroups.id))
      .innerJoin(chatGroupMembers, eq(chatGroups.id, chatGroupMembers.groupId))
      .where(eq(chatGroupMembers.userId, userId));
    
    // Get meetings created by user (including solo meetings without groups)
    const userMeetings = await db
      .select()
      .from(meetingSuggestions)
      .where(eq(meetingSuggestions.suggestedById, userId));
    
    // Combine and deduplicate
    const allMeetings = [...groupMeetings, ...userMeetings];
    const uniqueMeetings = Array.from(
      new Map(allMeetings.map(m => [m.id, m])).values()
    );
    
    return uniqueMeetings.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createMeetingSuggestion(suggestion: InsertMeetingSuggestion): Promise<MeetingSuggestion> {
    const mobileImageIndex = Math.floor(Math.random() * 10);
    
    const [newSuggestion] = await db
      .insert(meetingSuggestions)
      .values({
        ...suggestion,
        mobileImageIndex,
      })
      .returning();
    return newSuggestion;
  }

  async respondToMeeting(response: InsertMeetingResponse): Promise<MeetingResponse> {
    const [newResponse] = await db
      .insert(meetingResponses)
      .values(response)
      .returning();
    return newResponse;
  }

  async getMeetingResponses(meetingId: number): Promise<MeetingResponse[]> {
    return await db
      .select()
      .from(meetingResponses)
      .where(eq(meetingResponses.meetingId, meetingId));
  }

  async getAllMeetingResponsesForUser(userId: string): Promise<MeetingResponse[]> {
    // Get all meetings for user first
    const userMeetings = await this.getAllMeetingsForUser(userId);
    const meetingIds = userMeetings.map(m => m.id);
  
    if (meetingIds.length === 0) {
      return [];
    }
  
    // Get all responses for those meetings
    const responses = await db
      .select()
      .from(meetingResponses)
      .where(inArray(meetingResponses.meetingId, meetingIds))
      .orderBy(desc(meetingResponses.createdAt));
  
    return responses;
  }

  // Meeting participant operations
  async addMeetingParticipant(participant: InsertMeetingParticipant): Promise<MeetingParticipant> {
    const [result] = await db.insert(meetingParticipants).values(participant).returning();
    return result;
  }

  async removeMeetingParticipant(meetingId: number, userId: string): Promise<void> {
    await db.delete(meetingParticipants)
      .where(and(
        eq(meetingParticipants.meetingId, meetingId),
        eq(meetingParticipants.userId, userId)
      ));
  }

  async getMeetingParticipants(meetingId: number): Promise<MeetingParticipant[]> {
    const participants = await db.select().from(meetingParticipants).where(eq(meetingParticipants.meetingId, meetingId));
    return participants;
  }

  // Calendar connection operations
  async getCalendarConnections(userId: string): Promise<CalendarConnection[]> {
    return await db
      .select()
      .from(calendarConnections)
      .where(eq(calendarConnections.userId, userId));
  }

  async getCalendarConnection(id: number): Promise<CalendarConnection | undefined> {
    const [connection] = await db
      .select()
      .from(calendarConnections)
      .where(eq(calendarConnections.id, id));
    return connection;
  }

  async createCalendarConnection(connection: InsertCalendarConnection): Promise<CalendarConnection> {
    const [newConnection] = await db
      .insert(calendarConnections)
      .values(connection)
      .returning();
    return newConnection;
  }

  async updateCalendarConnection(id: number, connection: Partial<CalendarConnection>): Promise<CalendarConnection> {
    const [updated] = await db
      .update(calendarConnections)
      .set(connection)
      .where(eq(calendarConnections.id, id))
      .returning();
    return updated;
  }

  async deleteCalendarConnection(id: number): Promise<void> {
    await db
      .delete(calendarConnections)
      .where(eq(calendarConnections.id, id));
  }

  // Calendar operations
  async getCalendars(userId: string): Promise<Calendar[]> {
    const result = await db
      .select({
        id: calendars.id,
        name: calendars.name,
        connectionId: calendars.connectionId,
        externalId: calendars.externalId,
        color: calendars.color,
        isVisible: calendars.isVisible,
        createdAt: calendars.createdAt
      })
      .from(calendars)
      .innerJoin(calendarConnections, eq(calendars.connectionId, calendarConnections.id))
      .where(eq(calendarConnections.userId, userId));
    
    return result;
  }

  async getCalendarsByConnection(connectionId: number): Promise<Calendar[]> {
    return await db
      .select()
      .from(calendars)
      .where(eq(calendars.connectionId, connectionId));
  }

  async getCalendar(id: number): Promise<Calendar | undefined> {
    const [calendar] = await db
      .select()
      .from(calendars)
      .where(eq(calendars.id, id));
    return calendar;
  }

  async createCalendar(calendar: InsertCalendar): Promise<Calendar> {
    const [newCalendar] = await db
      .insert(calendars)
      .values(calendar)
      .returning();
    return newCalendar;
  }

  async updateCalendar(id: number, calendar: Partial<Calendar>): Promise<Calendar> {
    const [updated] = await db
      .update(calendars)
      .set(calendar)
      .where(eq(calendars.id, id))
      .returning();
    return updated;
  }

  async deleteCalendar(id: number): Promise<void> {
    await db.delete(calendars).where(eq(calendars.id, id));
  }

  // Event operations
  async getEvents(userId: string): Promise<Event[]> {
    const result = await db
      .select({
        id: events.id,
        calendarId: events.calendarId,
        externalId: events.externalId,
        title: events.title,
        description: events.description,
        location: events.location,
        startTime: events.startTime,
        endTime: events.endTime,
        isAllDay: events.isAllDay,
        attendees: events.attendees,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt
      })
      .from(events)
      .innerJoin(calendars, eq(events.calendarId, calendars.id))
      .innerJoin(calendarConnections, eq(calendars.connectionId, calendarConnections.id))
      .where(eq(calendarConnections.userId, userId));
    
    return result;
  }

  async getEventsByCalendar(calendarId: number): Promise<Event[]> {
    return await db
      .select()
      .from(events)
      .where(eq(events.calendarId, calendarId));
  }

  async getEventsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Event[]> {
    const result = await db
      .select({
        id: events.id,
        calendarId: events.calendarId,
        externalId: events.externalId,
        title: events.title,
        description: events.description,
        location: events.location,
        startTime: events.startTime,
        endTime: events.endTime,
        isAllDay: events.isAllDay,
        attendees: events.attendees,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt
      })
      .from(events)
      .innerJoin(calendars, eq(events.calendarId, calendars.id))
      .innerJoin(calendarConnections, eq(calendars.connectionId, calendarConnections.id))
      .where(
        and(
          eq(calendarConnections.userId, userId),
          sql`${events.startTime} >= ${startDate}`,
          sql`${events.endTime} <= ${endDate}`
        )
      );
    
    return result;
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, id));
    return event;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db
      .insert(events)
      .values({
        ...event,
        attendees: event.attendees || []
      })
      .returning();
    return newEvent;
  }

  async updateEvent(id: number, event: Partial<Event>): Promise<Event> {
    const [updated] = await db
      .update(events)
      .set({ ...event, updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();
    return updated;
  }

  async deleteEvent(id: number): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  // Conflict operations
  async getConflicts(userId: string): Promise<Conflict[]> {
    const result = await db
      .select({
        id: conflicts.id,
        event1Id: conflicts.event1Id,
        event2Id: conflicts.event2Id,
        conflictType: conflicts.conflictType,
        isResolved: conflicts.isResolved,
        createdAt: conflicts.createdAt
      })
      .from(conflicts)
      .innerJoin(events, eq(conflicts.event1Id, events.id))
      .innerJoin(calendars, eq(events.calendarId, calendars.id))
      .innerJoin(calendarConnections, eq(calendars.connectionId, calendarConnections.id))
      .where(eq(calendarConnections.userId, userId));
    
    return result;
  }

  async getUnresolvedConflicts(userId: string): Promise<Conflict[]> {
    const result = await db
      .select({
        id: conflicts.id,
        event1Id: conflicts.event1Id,
        event2Id: conflicts.event2Id,
        conflictType: conflicts.conflictType,
        isResolved: conflicts.isResolved,
        createdAt: conflicts.createdAt
      })
      .from(conflicts)
      .innerJoin(events, eq(conflicts.event1Id, events.id))
      .innerJoin(calendars, eq(events.calendarId, calendars.id))
      .innerJoin(calendarConnections, eq(calendars.connectionId, calendarConnections.id))
      .where(
        and(
          eq(calendarConnections.userId, userId),
          eq(conflicts.isResolved, false)
        )
      );
    
    return result;
  }

  async createConflict(conflict: InsertConflict): Promise<Conflict> {
    const [newConflict] = await db
      .insert(conflicts)
      .values(conflict)
      .returning();
    return newConflict;
  }

  async resolveConflict(id: number): Promise<void> {
    await db
      .update(conflicts)
      .set({ isResolved: true })
      .where(eq(conflicts.id, id));
  }

  // Calendar sharing operations
  async shareCalendar(share: InsertCalendarShare): Promise<CalendarShare> {
    const [calendarShare] = await db.insert(calendarShares).values(share).returning();
    return calendarShare;
  }

  async getCalendarShares(userId: string): Promise<CalendarShare[]> {
    return await db.select().from(calendarShares).where(eq(calendarShares.sharedByUserId, userId));
  }

  async getReceivedCalendarShares(userId: string): Promise<CalendarShare[]> {
    return await db.select().from(calendarShares).where(eq(calendarShares.sharedWithUserId, userId));
  }

  async acceptCalendarShare(shareId: number): Promise<void> {
    await db.update(calendarShares)
      .set({ 
        status: "accepted",
        acceptedAt: new Date()
      })
      .where(eq(calendarShares.id, shareId));
  }

  async declineCalendarShare(shareId: number): Promise<void> {
    await db.update(calendarShares)
      .set({ status: "declined" })
      .where(eq(calendarShares.id, shareId));
  }

  async revokeCalendarShare(shareId: number): Promise<void> {
    await db.delete(calendarShares).where(eq(calendarShares.id, shareId));
  }

  async updateCalendarSharePermission(shareId: number, permission: string): Promise<CalendarShare> {
    const [share] = await db.update(calendarShares)
      .set({ permission })
      .where(eq(calendarShares.id, shareId))
      .returning();
    return share;
  }

  // Calendar collaboration operations
  async createCollaboration(collaboration: InsertCalendarCollaboration): Promise<CalendarCollaboration> {
    const [collab] = await db.insert(calendarCollaborations).values(collaboration).returning();
    return collab;
  }

  async getCollaborations(userId: string): Promise<CalendarCollaboration[]> {
    return await db.select()
      .from(calendarCollaborations)
      .innerJoin(collaborationMembers, eq(calendarCollaborations.id, collaborationMembers.collaborationId))
      .where(eq(collaborationMembers.userId, userId));
  }

  async getCollaboration(id: number): Promise<CalendarCollaboration | undefined> {
    const [collaboration] = await db.select().from(calendarCollaborations).where(eq(calendarCollaborations.id, id));
    return collaboration;
  }

  async updateCollaboration(id: number, updates: Partial<CalendarCollaboration>): Promise<CalendarCollaboration> {
    const [collaboration] = await db.update(calendarCollaborations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(calendarCollaborations.id, id))
      .returning();
    return collaboration;
  }

  async deleteCollaboration(id: number): Promise<void> {
    await db.delete(calendarCollaborations).where(eq(calendarCollaborations.id, id));
  }

  async addCollaborationMember(member: InsertCollaborationMember): Promise<CollaborationMember> {
    const [collaborationMember] = await db.insert(collaborationMembers).values(member).returning();
    return collaborationMember;
  }

  async removeCollaborationMember(collaborationId: number, userId: string): Promise<void> {
    await db.delete(collaborationMembers)
      .where(and(
        eq(collaborationMembers.collaborationId, collaborationId),
        eq(collaborationMembers.userId, userId)
      ));
  }

  async updateMemberRole(collaborationId: number, userId: string, role: string): Promise<CollaborationMember> {
    const [member] = await db.update(collaborationMembers)
      .set({ role })
      .where(and(
        eq(collaborationMembers.collaborationId, collaborationId),
        eq(collaborationMembers.userId, userId)
      ))
      .returning();
    return member;
  }

  async getCollaborationMembers(collaborationId: number): Promise<CollaborationMember[]> {
    return await db.select().from(collaborationMembers).where(eq(collaborationMembers.collaborationId, collaborationId));
  }

  async addCalendarToCollaboration(calendarCollaboration: InsertCollaborationCalendar): Promise<CollaborationCalendar> {
    const [collaborationCalendar] = await db.insert(collaborationCalendars).values(calendarCollaboration).returning();
    return collaborationCalendar;
  }

  async removeCalendarFromCollaboration(collaborationId: number, calendarId: number): Promise<void> {
    await db.delete(collaborationCalendars)
      .where(and(
        eq(collaborationCalendars.collaborationId, collaborationId),
        eq(collaborationCalendars.calendarId, calendarId)
      ));
  }

  async getCollaborationCalendars(collaborationId: number): Promise<CollaborationCalendar[]> {
    return await db.select().from(collaborationCalendars).where(eq(collaborationCalendars.collaborationId, collaborationId));
  }

  // Event collaboration operations
  async addEventComment(comment: InsertEventComment): Promise<EventComment> {
    const [eventComment] = await db.insert(eventComments).values(comment).returning();
    return eventComment;
  }

  async getEventComments(eventId: number): Promise<EventComment[]> {
    return await db.select().from(eventComments).where(eq(eventComments.eventId, eventId));
  }

  async updateEventComment(commentId: number, comment: string): Promise<EventComment> {
    const [updatedComment] = await db.update(eventComments)
      .set({ comment, updatedAt: new Date() })
      .where(eq(eventComments.id, commentId))
      .returning();
    return updatedComment;
  }

  async deleteEventComment(commentId: number): Promise<void> {
    await db.delete(eventComments).where(eq(eventComments.id, commentId));
  }

  async logEventChange(changeLog: InsertEventChangeLog): Promise<EventChangeLog> {
    const [eventChangeLog] = await db.insert(eventChangeLog).values(changeLog).returning();
    return eventChangeLog;
  }

  async getEventChangeLogs(eventId: number): Promise<EventChangeLog[]> {
    return await db.select().from(eventChangeLog).where(eq(eventChangeLog.eventId, eventId));
  }

  // ================================
  // Tag Operations
  // ================================
  
  async createTag(tagData: InsertTag): Promise<Tag> {
    const [tag] = await db
      .insert(tags)
      .values(tagData)
      .returning();
    return tag;
  }

  async getUserTags(userId: string): Promise<Tag[]> {
    const userTags = await db
      .select()
      .from(tags)
      .where(eq(tags.userId, userId))
      .orderBy(tags.name);
    return userTags;
  }

  async getTagsByType(userId: string, type: 'friend' | 'group'): Promise<Tag[]> {
    const userTags = await db
      .select()
      .from(tags)
      .where(and(eq(tags.userId, userId), eq(tags.type, type)))
      .orderBy(tags.name);
    return userTags;
  }

  async deleteTag(tagId: number): Promise<void> {
    await db.delete(tags).where(eq(tags.id, tagId));
  }

  async updateTag(tagId: number, updates: Partial<Tag>): Promise<Tag> {
    const [updatedTag] = await db
      .update(tags)
      .set(updates)
      .where(eq(tags.id, tagId))
      .returning();
    return updatedTag;
  }

  // Chat tagging
  async addChatTag(chatTagData: InsertChatTag): Promise<ChatTag> {
    const [chatTag] = await db
      .insert(chatTags)
      .values(chatTagData)
      .returning();
    return chatTag;
  }

  async getChatTags(chatId: string): Promise<ChatTag[]> {
    const tagsList = await db
      .select({
        id: chatTags.id,
        chatId: chatTags.chatId,
        tagId: chatTags.tagId,
        addedByUserId: chatTags.addedByUserId,
        addedAt: chatTags.addedAt,
        tag: {
          id: tags.id,
          name: tags.name,
          type: tags.type,
          color: tags.color,
        },
      })
      .from(chatTags)
      .innerJoin(tags, eq(chatTags.tagId, tags.id))
      .where(eq(chatTags.chatId, chatId));
    return tagsList;
  }

  async removeChatTag(chatId: string, tagId: number): Promise<void> {
    await db
      .delete(chatTags)
      .where(and(eq(chatTags.chatId, chatId), eq(chatTags.tagId, tagId)));
  }

  // Meeting tagging
  async addMeetingTag(meetingTagData: InsertMeetingTag): Promise<MeetingTag> {
    const [meetingTag] = await db
      .insert(meetingTags)
      .values(meetingTagData)
      .returning();
    return meetingTag;
  }

  async getMeetingTags(meetingId: number): Promise<MeetingTag[]> {
    const tagsList = await db
      .select({
        id: meetingTags.id,
        meetingId: meetingTags.meetingId,
        tagId: meetingTags.tagId,
        addedByUserId: meetingTags.addedByUserId,
        addedAt: meetingTags.addedAt,
        tag: {
          id: tags.id,
          name: tags.name,
          type: tags.type,
          color: tags.color,
        },
      })
      .from(meetingTags)
      .innerJoin(tags, eq(meetingTags.tagId, tags.id))
      .where(eq(meetingTags.meetingId, meetingId));
    return tagsList;
  }

  async removeMeetingTag(meetingId: number, tagId: number): Promise<void> {
    await db
      .delete(meetingTags)
      .where(and(eq(meetingTags.meetingId, meetingId), eq(meetingTags.tagId, tagId)));
  }

  // Tag search operations
  async searchTaggedChats(userId: string, tagIds: number[]): Promise<any[]> {
    const taggedChats = await db
      .select({
        chatId: chatTags.chatId,
        tags: sql<any[]>`array_agg(${tags.name})`,
      })
      .from(chatTags)
      .innerJoin(tags, eq(chatTags.tagId, tags.id))
      .where(and(eq(tags.userId, userId), inArray(tags.id, tagIds)))
      .groupBy(chatTags.chatId);
    return taggedChats;
  }

  async searchTaggedMeetings(userId: string, tagIds: number[]): Promise<MeetingSuggestion[]> {
    const taggedMeetings = await db
      .select()
      .from(meetingSuggestions)
      .innerJoin(meetingTags, eq(meetingSuggestions.id, meetingTags.meetingId))
      .innerJoin(tags, eq(meetingTags.tagId, tags.id))
      .where(and(eq(tags.userId, userId), inArray(tags.id, tagIds)));
    return taggedMeetings.map(row => row.meeting_suggestions);
  }

  async updateChatGroup(groupId: number, data: { name?: string; description?: string; isPrivate?: boolean; backgroundImageUrl?: string }) {
    const [updated] = await db
      .update(chatGroups)
      .set(data)
      .where(eq(chatGroups.id, groupId))
      .returning();
    return updated;
  }

  async addChatGroupMember(groupId: number, userId: string) {
    await db.insert(chatGroupMembers).values({
      groupId,
      userId,
      role: "member",
    });
  }

  async getChatGroupMembers(groupId: number) {
    const members = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(chatGroupMembers)
      .innerJoin(users, eq(chatGroupMembers.userId, users.id))
      .where(eq(chatGroupMembers.groupId, groupId));
    return members;
  }

  async getMeetingSuggestion(meetingId: number) {
    const [meeting] = await db
      .select()
      .from(meetingSuggestions)
      .where(eq(meetingSuggestions.id, meetingId));
    return meeting;
  }

  async updateMeetingSuggestion(meetingId: number, data: any) {
    const [updated] = await db
      .update(meetingSuggestions)
      .set(data)
      .where(eq(meetingSuggestions.id, meetingId))
      .returning();
    return updated;
  }
  async deleteMeetingSuggestion(meetingId: number): Promise<void> {
    // Delete participants first (foreign key constraint)
    await db.delete(meetingParticipants).where(eq(meetingParticipants.meetingId, meetingId));
    // Delete responses
    await db.delete(meetingResponses).where(eq(meetingResponses.meetingId, meetingId));
    // Delete meeting tags
    await db.delete(meetingTags).where(eq(meetingTags.meetingId, meetingId));
    // Delete the meeting
    await db.delete(meetingSuggestions).where(eq(meetingSuggestions.id, meetingId));
  }
  async deleteChatGroup(groupId: number): Promise<void> {
    // Delete members first
    await db.delete(chatGroupMembers).where(eq(chatGroupMembers.groupId, groupId));
    // Delete messages
    await db.delete(chatMessages).where(eq(chatMessages.groupId, groupId));
    // Delete meetings associated with the group
    const groupMeetings = await db.select().from(meetingSuggestions).where(eq(meetingSuggestions.groupId, groupId));
    for (const meeting of groupMeetings) {
      await this.deleteMeetingSuggestion(meeting.id);
    }
    // Delete the group
    await db.delete(chatGroups).where(eq(chatGroups.id, groupId));
  }
  // Public visibility operations
  async getAllMeetings(): Promise<MeetingSuggestion[]> {
    const allMeetings = await db
      .select()
      .from(meetingSuggestions)
      .orderBy(desc(meetingSuggestions.createdAt));
    
    const openMeetings = [];
    for (const meeting of allMeetings) {
      const participantCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(meetingParticipants)
        .where(eq(meetingParticipants.meetingId, meeting.id));
      
      if (participantCount[0].count < 100) {
        openMeetings.push(meeting);
      }
    }
    
    return openMeetings;
  }

  async getAllChatGroups(): Promise<ChatGroup[]> {
    const allGroups = await db
      .select()
      .from(chatGroups)
      .where(sql`${chatGroups.memberCount} < 100`)
      .orderBy(desc(chatGroups.createdAt));
    
    return allGroups;
  }

  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.isActive, true))
      .orderBy(users.firstName, users.lastName);
  }

  async joinMeeting(meetingId: number, userId: string): Promise<void> {
    const existing = await db
      .select()
      .from(meetingParticipants)
      .where(and(
        eq(meetingParticipants.meetingId, meetingId),
        eq(meetingParticipants.userId, userId)
      ));
    
    if (existing.length === 0) {
      await db.insert(meetingParticipants).values({
        meetingId,
        userId,
      });
    }
  }

  async leaveMeeting(meetingId: number, userId: string): Promise<void> {
    await db
      .delete(meetingParticipants)
      .where(and(
        eq(meetingParticipants.meetingId, meetingId),
        eq(meetingParticipants.userId, userId)
      ));
  }

  async joinChatGroup(groupId: number, userId: string): Promise<void> {
    const existing = await db
      .select()
      .from(chatGroupMembers)
      .where(and(
        eq(chatGroupMembers.groupId, groupId),
        eq(chatGroupMembers.userId, userId)
      ));
    
    if (existing.length === 0) {
      await db.insert(chatGroupMembers).values({
        groupId,
        userId,
        role: "member",
      });
      
      await db
        .update(chatGroups)
        .set({ memberCount: sql`${chatGroups.memberCount} + 1` })
        .where(eq(chatGroups.id, groupId));
    }
  }

  async leaveChatGroup(groupId: number, userId: string): Promise<void> {
    await db
      .delete(chatGroupMembers)
      .where(and(
        eq(chatGroupMembers.groupId, groupId),
        eq(chatGroupMembers.userId, userId)
      ));
    
    await db
      .update(chatGroups)
      .set({ memberCount: sql`${chatGroups.memberCount} - 1` })
      .where(eq(chatGroups.id, groupId));
  }
}

export const storage = new DatabaseStorage();

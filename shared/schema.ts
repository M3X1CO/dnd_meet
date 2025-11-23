import { pgTable, text, serial, integer, boolean, timestamp, json, jsonb, varchar, decimal, numeric, index, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  passwordHash: varchar("password_hash").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  bio: text("bio"),
  location: text("location"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  tags: json("tags").$type<string[]>().default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  emailNotifications: boolean("email_notifications").default(true),
  pushNotifications: boolean("push_notifications").default(true),
  meetingReminders: boolean("meeting_reminders").default(true),
  friendRequestNotifications: boolean("friend_request_notifications").default(true),
  chatNotifications: boolean("chat_notifications").default(true),
  profileVisibility: varchar("profile_visibility").default('public'),
  showEmail: boolean("show_email").default(false),
  showLocation: boolean("show_location").default(true),
  showOnlineStatus: boolean("show_online_status").default(true),
  allowFriendRequests: boolean("allow_friend_requests").default(true),
  defaultCalendarView: varchar("default_calendar_view").default('month'),
  startOfWeek: varchar("start_of_week").default('sunday'),
  timeFormat: varchar("time_format").default('12h'),
  timezone: varchar("timezone").default('UTC'),
  theme: varchar("theme").default('dark'),
  soundEnabled: boolean("sound_enabled").default(true),
  dataExportFormat: varchar("data_export_format").default('json'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Friend relationships
export const friendships = pgTable("friendships", {
  id: serial("id").primaryKey(),
  requesterId: varchar("requester_id").references(() => users.id).notNull(),
  addresseeId: varchar("addressee_id").references(() => users.id).notNull(),
  status: text("status").notNull(), // 'pending', 'accepted', 'rejected', 'blocked'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat groups
export const chatGroups = pgTable("chat_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdById: varchar("created_by_id").references(() => users.id).notNull(),
  isPrivate: boolean("is_private").default(false),
  backgroundImageUrl: text("background_image_url"),
  memberLimit: integer("member_limit").default(100),
  memberCount: integer("member_count").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat group members
export const chatGroupMembers = pgTable("chat_group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => chatGroups.id),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: text("role").default("member"), // 'admin', 'member'
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Chat messages
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => chatGroups.id),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  messageType: text("message_type").default("text"), // 'text', 'meeting_suggestion', 'meeting_response'
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Direct messages between friends
export const directMessages = pgTable("direct_messages", {
  id: serial("id").primaryKey(),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  recipientId: varchar("recipient_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  messageType: text("message_type").default("text"), // 'text', 'meeting_suggestion'
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Meeting suggestions
export const meetingSuggestions = pgTable("meeting_suggestions", {
  id: serial("id").primaryKey(),
  suggestedById: varchar("suggested_by_id").references(() => users.id).notNull(),
  groupId: integer("group_id").references(() => chatGroups.id),
  title: text("title", { length: 16 }).notNull(),
  description: text("description"),
  proposedDateTime: timestamp("proposed_date_time").notNull(),
  location: text("location"),
  duration: integer("duration").default(60), // duration in minutes
  requiresAllAccept: boolean("requires_all_accept").default(false),
  status: text("status").default("accepted").notNull(), // 'pending', 'accepted', 'rejected', 'cancelled'
  isPrivate: boolean("is_private").default(false),
  backgroundImageUrl: text("background_image_url"),
  participants: json("participants").$type<string[]>().default([]), // Array of user IDs
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Meeting participants (for individual friend meetings)
export const meetingParticipants = pgTable("meeting_participants", {
  id: serial("id").primaryKey(),
  meetingId: integer("meeting_id").references(() => meetingSuggestions.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  addedAt: timestamp("added_at").defaultNow(),
});

// Meeting responses
export const meetingResponses = pgTable("meeting_responses", {
  id: serial("id").primaryKey(),
  meetingId: integer("meeting_id").references(() => meetingSuggestions.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  responseType: text("response_type").notNull(), // 'accepted', 'rejected', 'counter'
  note: text("note"),
  counterDateTime: timestamp("counter_date_time"),
  counterLocation: text("counter_location"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const calendarConnections = pgTable("calendar_connections", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  provider: text("provider").notNull(), // 'google', 'outlook', 'icloud', 'yahoo', 'caldav'
  email: text("email").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  isConnected: boolean("is_connected").default(false),
  lastSync: timestamp("last_sync"),
  // CalDAV specific fields
  serverUrl: text("server_url"), // For CalDAV servers
  username: text("username"), // For CalDAV authentication
  password: text("password"), // For CalDAV authentication (encrypted)
  // Yahoo specific fields
  yahooGuid: text("yahoo_guid"), // Yahoo user GUID
  createdAt: timestamp("created_at").defaultNow(),
});

export const calendars = pgTable("calendars", {
  id: serial("id").primaryKey(),
  connectionId: integer("connection_id").references(() => calendarConnections.id),
  externalId: text("external_id").notNull(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  isVisible: boolean("is_visible").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  calendarId: integer("calendar_id").references(() => calendars.id),
  externalId: text("external_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  isAllDay: boolean("is_all_day").default(false),
  location: text("location"),
  attendees: json("attendees").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const conflicts = pgTable("conflicts", {
  id: serial("id").primaryKey(),
  event1Id: integer("event1_id").references(() => events.id),
  event2Id: integer("event2_id").references(() => events.id),
  conflictType: text("conflict_type").notNull(), // 'overlap', 'duplicate'
  isResolved: boolean("is_resolved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Calendar sharing and collaboration tables
export const calendarShares = pgTable("calendar_shares", {
  id: serial("id").primaryKey(),
  calendarId: integer("calendar_id").references(() => calendars.id, { onDelete: "cascade" }).notNull(),
  sharedByUserId: varchar("shared_by_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  sharedWithUserId: varchar("shared_with_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  permission: varchar("permission", { enum: ["view", "edit", "admin"] }).default("view").notNull(),
  status: varchar("status", { enum: ["pending", "accepted", "declined"] }).default("pending").notNull(),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  expiresAt: timestamp("expires_at"),
});

export const calendarCollaborations = pgTable("calendar_collaborations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdByUserId: varchar("created_by_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  isActive: boolean("is_active").default(true),
  settings: jsonb("settings").$type<{
    allowEventCreation: boolean;
    allowEventEditing: boolean;
    allowEventDeletion: boolean;
    requireApproval: boolean;
    autoSync: boolean;
    timeZone: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const collaborationMembers = pgTable("collaboration_members", {
  id: serial("id").primaryKey(),
  collaborationId: integer("collaboration_id").references(() => calendarCollaborations.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  role: varchar("role", { enum: ["owner", "admin", "editor", "viewer"] }).default("viewer").notNull(),
  permissions: jsonb("permissions").$type<{
    canCreateEvents: boolean;
    canEditEvents: boolean;
    canDeleteEvents: boolean;
    canManageMembers: boolean;
    canViewPrivateEvents: boolean;
  }>(),
  joinedAt: timestamp("joined_at").defaultNow(),
  lastActiveAt: timestamp("last_active_at"),
});

export const collaborationCalendars = pgTable("collaboration_calendars", {
  id: serial("id").primaryKey(),
  collaborationId: integer("collaboration_id").references(() => calendarCollaborations.id, { onDelete: "cascade" }).notNull(),
  calendarId: integer("calendar_id").references(() => calendars.id, { onDelete: "cascade" }).notNull(),
  addedByUserId: varchar("added_by_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  isVisible: boolean("is_visible").default(true),
  color: varchar("color", { length: 7 }),
  addedAt: timestamp("added_at").defaultNow(),
});

export const eventComments = pgTable("event_comments", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  comment: text("comment").notNull(),
  isResolved: boolean("is_resolved").default(false),
  parentCommentId: integer("parent_comment_id").references(() => eventComments.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const eventChangeLog = pgTable("event_change_log", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  action: varchar("action", { enum: ["created", "updated", "deleted", "moved", "shared"] }).notNull(),
  changes: jsonb("changes").$type<{
    field: string;
    oldValue: any;
    newValue: any;
  }[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tags system for friends and groups
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { enum: ["friend", "group"] }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  entityId: varchar("entity_id").notNull(), // friend user_id or group id
  color: varchar("color", { length: 7 }).default("#6366f1"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueUserTag: unique().on(table.userId, table.name, table.type),
}));

// Chat tags - linking tags to chat conversations
export const chatTags = pgTable("chat_tags", {
  id: serial("id").primaryKey(),
  chatId: varchar("chat_id").notNull(), // direct message recipient_id or group_id
  tagId: integer("tag_id").references(() => tags.id, { onDelete: "cascade" }).notNull(),
  addedByUserId: varchar("added_by_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  addedAt: timestamp("added_at").defaultNow(),
});

// Meeting tags - linking tags to meetings
export const meetingTags = pgTable("meeting_tags", {
  id: serial("id").primaryKey(),
  meetingId: integer("meeting_id").references(() => meetingSuggestions.id, { onDelete: "cascade" }).notNull(),
  tagId: integer("tag_id").references(() => tags.id, { onDelete: "cascade" }).notNull(),
  addedByUserId: varchar("added_by_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  addedAt: timestamp("added_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  settings: one(userSettings, { fields: [users.id], references: [userSettings.userId] }),
  calendarConnections: many(calendarConnections),
  sentFriendRequests: many(friendships, { relationName: "requester" }),
  receivedFriendRequests: many(friendships, { relationName: "addressee" }),
  chatGroups: many(chatGroups),
  chatGroupMembers: many(chatGroupMembers),
  chatMessages: many(chatMessages),
  sentDirectMessages: many(directMessages, { relationName: "sent" }),
  receivedDirectMessages: many(directMessages, { relationName: "received" }),
  meetingSuggestions: many(meetingSuggestions),
  meetingResponses: many(meetingResponses),
  meetingParticipants: many(meetingParticipants),
  // Tags relations
  tags: many(tags),
  chatTags: many(chatTags),
  meetingTags: many(meetingTags),
  // Calendar sharing relations
  sharedCalendars: many(calendarShares, { relationName: "sharedBy" }),
  receivedCalendarShares: many(calendarShares, { relationName: "sharedWith" }),
  createdCollaborations: many(calendarCollaborations),
  collaborationMemberships: many(collaborationMembers),
  eventComments: many(eventComments),
  eventChangeLogs: many(eventChangeLog),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, { fields: [userSettings.userId], references: [users.id] }),
}));

export const friendshipsRelations = relations(friendships, ({ one }) => ({
  requester: one(users, {
    fields: [friendships.requesterId],
    references: [users.id],
    relationName: "requester",
  }),
  addressee: one(users, {
    fields: [friendships.addresseeId],
    references: [users.id],
    relationName: "addressee",
  }),
}));

export const chatGroupsRelations = relations(chatGroups, ({ one, many }) => ({
  creator: one(users, {
    fields: [chatGroups.createdById],
    references: [users.id],
  }),
  members: many(chatGroupMembers),
  messages: many(chatMessages),
  meetingSuggestions: many(meetingSuggestions),
}));

export const chatGroupMembersRelations = relations(chatGroupMembers, ({ one }) => ({
  group: one(chatGroups, {
    fields: [chatGroupMembers.groupId],
    references: [chatGroups.id],
  }),
  user: one(users, {
    fields: [chatGroupMembers.userId],
    references: [users.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  group: one(chatGroups, {
    fields: [chatMessages.groupId],
    references: [chatGroups.id],
  }),
  sender: one(users, {
    fields: [chatMessages.senderId],
    references: [users.id],
  }),
}));

export const directMessagesRelations = relations(directMessages, ({ one }) => ({
  sender: one(users, {
    fields: [directMessages.senderId],
    references: [users.id],
    relationName: "sent",
  }),
  recipient: one(users, {
    fields: [directMessages.recipientId],
    references: [users.id],
    relationName: "received",
  }),
}));

export const meetingSuggestionsRelations = relations(meetingSuggestions, ({ one, many }) => ({
  suggestedBy: one(users, {
    fields: [meetingSuggestions.suggestedById],
    references: [users.id],
  }),
  group: one(chatGroups, {
    fields: [meetingSuggestions.groupId],
    references: [chatGroups.id],
  }),
  responses: many(meetingResponses),
  participants: many(meetingParticipants),
}));

export const meetingParticipantsRelations = relations(meetingParticipants, ({ one }) => ({
  meeting: one(meetingSuggestions, {
    fields: [meetingParticipants.meetingId],
    references: [meetingSuggestions.id],
  }),
  user: one(users, {
    fields: [meetingParticipants.userId],
    references: [users.id],
  }),
}));

export const meetingResponsesRelations = relations(meetingResponses, ({ one }) => ({
  meeting: one(meetingSuggestions, {
    fields: [meetingResponses.meetingId],
    references: [meetingSuggestions.id],
  }),
  user: one(users, {
    fields: [meetingResponses.userId],
    references: [users.id],
  }),
}));

export const calendarConnectionsRelations = relations(calendarConnections, ({ one, many }) => ({
  user: one(users, {
    fields: [calendarConnections.userId],
    references: [users.id],
  }),
  calendars: many(calendars),
}));

export const calendarsRelations = relations(calendars, ({ one, many }) => ({
  connection: one(calendarConnections, {
    fields: [calendars.connectionId],
    references: [calendarConnections.id],
  }),
  events: many(events),
  shares: many(calendarShares),
  collaborationCalendars: many(collaborationCalendars),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  calendar: one(calendars, {
    fields: [events.calendarId],
    references: [calendars.id],
  }),
  comments: many(eventComments),
  changeLogs: many(eventChangeLog),
}));

// Calendar sharing relations
export const calendarSharesRelations = relations(calendarShares, ({ one }) => ({
  calendar: one(calendars, {
    fields: [calendarShares.calendarId],
    references: [calendars.id],
  }),
  sharedBy: one(users, {
    fields: [calendarShares.sharedByUserId],
    references: [users.id],
    relationName: "sharedBy",
  }),
  sharedWith: one(users, {
    fields: [calendarShares.sharedWithUserId],
    references: [users.id],
    relationName: "sharedWith",
  }),
}));

export const calendarCollaborationsRelations = relations(calendarCollaborations, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [calendarCollaborations.createdByUserId],
    references: [users.id],
  }),
  members: many(collaborationMembers),
  calendars: many(collaborationCalendars),
}));

export const collaborationMembersRelations = relations(collaborationMembers, ({ one }) => ({
  collaboration: one(calendarCollaborations, {
    fields: [collaborationMembers.collaborationId],
    references: [calendarCollaborations.id],
  }),
  user: one(users, {
    fields: [collaborationMembers.userId],
    references: [users.id],
  }),
}));

export const collaborationCalendarsRelations = relations(collaborationCalendars, ({ one }) => ({
  collaboration: one(calendarCollaborations, {
    fields: [collaborationCalendars.collaborationId],
    references: [calendarCollaborations.id],
  }),
  calendar: one(calendars, {
    fields: [collaborationCalendars.calendarId],
    references: [calendars.id],
  }),
  addedBy: one(users, {
    fields: [collaborationCalendars.addedByUserId],
    references: [users.id],
  }),
}));

export const eventCommentsRelations = relations(eventComments, ({ one, many }) => ({
  event: one(events, {
    fields: [eventComments.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [eventComments.userId],
    references: [users.id],
  }),
  parentComment: one(eventComments, {
    fields: [eventComments.parentCommentId],
    references: [eventComments.id],
  }),
  replies: many(eventComments),
}));

export const eventChangeLogRelations = relations(eventChangeLog, ({ one }) => ({
  event: one(events, {
    fields: [eventChangeLog.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [eventChangeLog.userId],
    references: [users.id],
  }),
}));

// Tag relations
export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, { fields: [tags.userId], references: [users.id] }),
  chatTags: many(chatTags),
  meetingTags: many(meetingTags),
}));

export const chatTagsRelations = relations(chatTags, ({ one }) => ({
  tag: one(tags, { fields: [chatTags.tagId], references: [tags.id] }),
  addedBy: one(users, { fields: [chatTags.addedByUserId], references: [users.id] }),
}));

export const meetingTagsRelations = relations(meetingTags, ({ one }) => ({
  tag: one(tags, { fields: [meetingTags.tagId], references: [tags.id] }),
  meeting: one(meetingSuggestions, { fields: [meetingTags.meetingId], references: [meetingSuggestions.id] }),
  addedBy: one(users, { fields: [meetingTags.addedByUserId], references: [users.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFriendshipSchema = createInsertSchema(friendships).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatGroupSchema = createInsertSchema(chatGroups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatGroupMemberSchema = createInsertSchema(chatGroupMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertDirectMessageSchema = createInsertSchema(directMessages).omit({
  id: true,
  createdAt: true,
});

export const insertMeetingSuggestionSchema = createInsertSchema(meetingSuggestions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  groupId: z.number().optional(),
});

export const insertMeetingResponseSchema = createInsertSchema(meetingResponses).omit({
  id: true,
  createdAt: true,
});

export const insertMeetingParticipantSchema = createInsertSchema(meetingParticipants).omit({
  id: true,
  addedAt: true,
});

export const insertCalendarConnectionSchema = createInsertSchema(calendarConnections).omit({
  id: true,
  createdAt: true,
  lastSync: true,
});

export const insertCalendarSchema = createInsertSchema(calendars).omit({
  id: true,
  createdAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConflictSchema = createInsertSchema(conflicts).omit({
  id: true,
  createdAt: true,
});

// Calendar sharing insert schemas
export const insertCalendarShareSchema = createInsertSchema(calendarShares).omit({
  id: true,
  createdAt: true,
  acceptedAt: true,
});

export const insertCalendarCollaborationSchema = createInsertSchema(calendarCollaborations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCollaborationMemberSchema = createInsertSchema(collaborationMembers).omit({
  id: true,
  joinedAt: true,
  lastActiveAt: true,
});

export const insertCollaborationCalendarSchema = createInsertSchema(collaborationCalendars).omit({
  id: true,
  addedAt: true,
});

export const insertEventCommentSchema = createInsertSchema(eventComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventChangeLogSchema = createInsertSchema(eventChangeLog).omit({
  id: true,
  createdAt: true,
});

// Tag insert schemas
export const insertTagSchema = createInsertSchema(tags).omit({
  id: true,
  createdAt: true,
});

export const insertChatTagSchema = createInsertSchema(chatTags).omit({
  id: true,
  addedAt: true,
});

export const insertMeetingTagSchema = createInsertSchema(meetingTags).omit({
  id: true,
  addedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;

export type Friendship = typeof friendships.$inferSelect;
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;

export type ChatGroup = typeof chatGroups.$inferSelect;
export type InsertChatGroup = z.infer<typeof insertChatGroupSchema>;

export type ChatGroupMember = typeof chatGroupMembers.$inferSelect;
export type InsertChatGroupMember = z.infer<typeof insertChatGroupMemberSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type DirectMessage = typeof directMessages.$inferSelect;
export type InsertDirectMessage = z.infer<typeof insertDirectMessageSchema>;

export type MeetingSuggestion = typeof meetingSuggestions.$inferSelect;
export type InsertMeetingSuggestion = z.infer<typeof insertMeetingSuggestionSchema>;

export type MeetingResponse = typeof meetingResponses.$inferSelect;
export type InsertMeetingResponse = z.infer<typeof insertMeetingResponseSchema>;

export type MeetingParticipant = typeof meetingParticipants.$inferSelect;
export type InsertMeetingParticipant = z.infer<typeof insertMeetingParticipantSchema>;

export type CalendarConnection = typeof calendarConnections.$inferSelect;
export type InsertCalendarConnection = z.infer<typeof insertCalendarConnectionSchema>;

export type Calendar = typeof calendars.$inferSelect;
export type InsertCalendar = z.infer<typeof insertCalendarSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type Conflict = typeof conflicts.$inferSelect;
export type InsertConflict = z.infer<typeof insertConflictSchema>;

// Calendar sharing types
export type CalendarShare = typeof calendarShares.$inferSelect;
export type InsertCalendarShare = z.infer<typeof insertCalendarShareSchema>;

export type CalendarCollaboration = typeof calendarCollaborations.$inferSelect;
export type InsertCalendarCollaboration = z.infer<typeof insertCalendarCollaborationSchema>;

export type CollaborationMember = typeof collaborationMembers.$inferSelect;
export type InsertCollaborationMember = z.infer<typeof insertCollaborationMemberSchema>;

export type CollaborationCalendar = typeof collaborationCalendars.$inferSelect;
export type InsertCollaborationCalendar = z.infer<typeof insertCollaborationCalendarSchema>;

export type EventComment = typeof eventComments.$inferSelect;
export type InsertEventComment = z.infer<typeof insertEventCommentSchema>;

export type EventChangeLog = typeof eventChangeLog.$inferSelect;
export type InsertEventChangeLog = z.infer<typeof insertEventChangeLogSchema>;

// Tag types
export type Tag = typeof tags.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;

export type ChatTag = typeof chatTags.$inferSelect;
export type InsertChatTag = z.infer<typeof insertChatTagSchema>;

export type MeetingTag = typeof meetingTags.$inferSelect;
export type InsertMeetingTag = z.infer<typeof insertMeetingTagSchema>;

import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const rooms=sqliteTable('rooms',{id:text('id').primaryKey(),title:text('title').notNull(),mode:text('mode').notNull(),host:text('host').notNull(),expires:integer('expires').notNull(),owner:text('owner'),permanent:integer('permanent').notNull().default(0)});
export const members=sqliteTable('members',{id:text('id').primaryKey(),accountId:text('account_id'),channel:text('channel').notNull().default('main'),room:text('room').notNull().references(()=>rooms.id,{onDelete:'cascade'}),token:text('token').notNull(),name:text('name').notNull(),nameColor:text('name_color').notNull().default('#e8edf5'),nameFont:text('name_font').notNull().default('sans'),seen:integer('seen').notNull(),mic:integer('mic').notNull().default(0),screen:integer('screen').notNull().default(0),camera:integer('camera').notNull().default(0),recording:integer('recording').notNull().default(0),suspended:integer('suspended').notNull().default(0)},t=>[index('idx_members_room').on(t.room)]);
export const signals=sqliteTable('signals',{id:integer('id').primaryKey({autoIncrement:true}),room:text('room').notNull().references(()=>rooms.id,{onDelete:'cascade'}),sender:text('sender').notNull(),target:text('target').notNull(),payload:text('payload').notNull(),created:integer('created').notNull()},t=>[index('idx_signals_target_id').on(t.target,t.id),index('idx_signals_created').on(t.created)]);

export const chatMessages=sqliteTable('chat_messages',{
 id:integer('id').primaryKey({autoIncrement:true}),
 room:text('room').notNull().references(()=>rooms.id,{onDelete:'cascade'}),
 sender:text('sender').notNull(),name:text('name').notNull(),
 clientId:text('client_id').notNull(),body:text('body').notNull(),created:integer('created').notNull(),
 attachmentKey:text('attachment_key'),attachmentMime:text('attachment_mime'),attachmentName:text('attachment_name'),attachmentSize:integer('attachment_size')
},t=>[index('idx_chat_room_id').on(t.room,t.id),index('idx_chat_sender_created').on(t.room,t.sender,t.created),uniqueIndex('idx_chat_retry').on(t.room,t.sender,t.clientId)]);

export const auditEvents=sqliteTable('audit_events',{id:integer('id').primaryKey({autoIncrement:true}),created:integer('created').notNull(),event:text('event').notNull(),actor:text('actor'),room:text('room'),status:integer('status').notNull(),detail:text('detail').notNull().default('')},t=>[index('idx_audit_created').on(t.created)]);
export const operationalCounters=sqliteTable('operational_counters',{key:text('key').primaryKey(),minute:integer('minute').notNull(),route:text('route').notNull(),requests:integer('requests').notNull().default(0),errors:integer('errors').notNull().default(0),bytesOut:integer('bytes_out').notNull().default(0),durationMs:integer('duration_ms').notNull().default(0)});
export const reports=sqliteTable('reports',{id:text('id').primaryKey(),created:integer('created').notNull(),room:text('room').notNull(),reporter:text('reporter').notNull(),target:text('target').notNull(),reason:text('reason').notNull(),details:text('details').notNull(),status:text('status').notNull().default('open'),resolution:text('resolution').notNull().default('')},t=>[index('idx_reports_created').on(t.created)]);
export const limits=sqliteTable('rate_limits',{key:text('key').primaryKey(),expires:integer('expires').notNull(),count:integer('count').notNull().default(0)});

export const accounts=sqliteTable('accounts',{id:text('id').primaryKey(),email:text('email').notNull(),name:text('name').notNull(),created:integer('created').notNull(),updated:integer('updated').notNull()});

export const voiceChannels=sqliteTable('voice_channels',{id:text('id').primaryKey(),room:text('room').notNull().references(()=>rooms.id,{onDelete:'cascade'}),name:text('name').notNull(),created:integer('created').notNull()},t=>[index('idx_channels_room').on(t.room)]);
export const serverAccounts=sqliteTable('server_accounts',{room:text('room').notNull().references(()=>rooms.id,{onDelete:'cascade'}),account:text('account').notNull().references(()=>accounts.id,{onDelete:'cascade'})},t=>[uniqueIndex('idx_server_account').on(t.room,t.account)]);
export const friendCodes=sqliteTable('friend_codes',{account:text('account').primaryKey().references(()=>accounts.id,{onDelete:'cascade'}),code:text('code').notNull().unique()});
export const friendships=sqliteTable('friendships',{id:text('id').primaryKey(),requester:text('requester').notNull().references(()=>accounts.id,{onDelete:'cascade'}),recipient:text('recipient').notNull().references(()=>accounts.id,{onDelete:'cascade'}),state:text('state').notNull().default('pending'),created:integer('created').notNull()},t=>[uniqueIndex('idx_friend_pair').on(t.requester,t.recipient)]);

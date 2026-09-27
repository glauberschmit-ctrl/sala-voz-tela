import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const rooms=sqliteTable('rooms',{id:text('id').primaryKey(),title:text('title').notNull(),mode:text('mode').notNull(),host:text('host').notNull(),expires:integer('expires').notNull()});
export const members=sqliteTable('members',{id:text('id').primaryKey(),room:text('room').notNull().references(()=>rooms.id,{onDelete:'cascade'}),token:text('token').notNull(),name:text('name').notNull(),seen:integer('seen').notNull(),mic:integer('mic').notNull().default(0),screen:integer('screen').notNull().default(0),camera:integer('camera').notNull().default(0)},t=>[index('idx_members_room').on(t.room)]);
export const signals=sqliteTable('signals',{id:integer('id').primaryKey({autoIncrement:true}),room:text('room').notNull().references(()=>rooms.id,{onDelete:'cascade'}),sender:text('sender').notNull(),target:text('target').notNull(),payload:text('payload').notNull(),created:integer('created').notNull()},t=>[index('idx_signals_target_id').on(t.target,t.id),index('idx_signals_created').on(t.created)]);

export const chatMessages=sqliteTable('chat_messages',{
 id:integer('id').primaryKey({autoIncrement:true}),
 room:text('room').notNull().references(()=>rooms.id,{onDelete:'cascade'}),
 sender:text('sender').notNull(),name:text('name').notNull(),
 clientId:text('client_id').notNull(),body:text('body').notNull(),created:integer('created').notNull(),
 attachmentKey:text('attachment_key'),attachmentMime:text('attachment_mime'),attachmentName:text('attachment_name'),attachmentSize:integer('attachment_size')
},t=>[index('idx_chat_room_id').on(t.room,t.id),index('idx_chat_sender_created').on(t.room,t.sender,t.created),uniqueIndex('idx_chat_retry').on(t.room,t.sender,t.clientId)]);

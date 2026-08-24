import { pgTable, text, timestamp, serial, integer, json } from 'drizzle-orm/pg-core';

// Users table (synced with Clerk)
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Resumes table
export const resumes = pgTable('resumes', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  fullName: text('full_name').notNull(),
  profession: text('profession'),
  email: text('email').notNull(),
  phone: text('phone'),
  location: text('location'),
  summary: text('summary'),
  experience: json('experience'),
  education: json('education'),
  skills: json('skills'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Career Roadmaps table
export const roadmaps = pgTable('roadmaps', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  targetTitle: text('target_title').notNull(),
  targetCompany: text('target_company'),
  timeline: text('timeline').notNull(),
  industry: text('industry').notNull(),
  skillsToLearn: json('skills_to_learn'),
  workMode: text('work_mode'),
  salaryRange: text('salary_range'),
  roadmapData: json('roadmap_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Chat History table
export const chats = pgTable('chats', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  message: text('message').notNull(),
  response: text('response'),
  createdAt: timestamp('created_at').defaultNow(),
});

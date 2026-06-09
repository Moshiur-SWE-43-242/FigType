export type Role = 'GUEST' | 'GENERAL_USER' | 'SUPER_ADMIN';

export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  passwordHash?: string;
  role: Role;
  xp: number;
  level: number;
  coins: number;
  streak: number;
  lastActive: string; // ISO string
  createdAt: string;
  themePreference?: string;
  avatarUrl?: string;
  badges?: string[];
  phoneNumber?: string;
  socialLink?: string;
  institute?: string;
  professionalRole?: string;
  emailVerified?: boolean;
}

export interface TypingAttempt {
  id: string;
  userId?: string;
  mode: 'time' | 'words' | 'quote' | 'code' | 'course';
  duration: number; // in seconds
  wordCount: number;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  correctChars: number;
  incorrectChars: number;
  totalChars: number;
  createdAt: string;
  errorHeatmap?: Record<string, number>; // key: character, value: error count
}

export interface Contest {
  id: string;
  title: string;
  description: string;
  visibility: 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY';
  status: 'UPCOMING' | 'LIVE' | 'FINISHED';
  contestText: string;
  duration: number;
  shareCode: string;
  startTime: string;
  endTime: string;
  createdById: string;
  createdAt: string;
  participants: number;
  invitedUsers?: string[];
}

export interface ContestAttempt {
  id: string;
  contestId: string;
  userId: string;
  username: string;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  progress: number; // 0 to 100
  correctChars: number;
  incorrectChars: number;
  completed: boolean;
  suspicious: boolean;
  finishedAt?: string;
  createdAt: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  category: 'Home Row' | 'Top Row' | 'Bottom Row' | 'Numbers & Symbols' | 'Coding' | 'Steno Shorthand';
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  text: string;
  instructions: string;
  xpReward: number;
  coinsReward: number;
}

export interface Certificate {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  wpm: number;
  accuracy: number;
  mode: string;
  issueDate: string;
  verificationUrl: string;
  qrCodeData: string;
  signature: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
  createdAt: string;
}

export interface CMSNotice {
  id: string;
  title: string;
  content: string;
  active: boolean;
  createdAt: string;
}

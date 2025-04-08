import { User } from './auth';

// Session statuses
export type SessionStatus = 
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'in-progress';

// Session model
export interface Session {
  id: string;
  title: string;
  description: string;
  mentor: User | string;
  mentee: User | string;
  skill: string;
  status: SessionStatus;
  startTime: string;
  endTime: string;
  price: number;
  meetingLink?: string;
  isOnline: boolean;
  location?: string;
  notes?: string;
  rating?: number;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
}

// Request and response types
export interface CreateSessionRequest {
  title: string;
  description: string;
  mentor: string;
  skill: string;
  startTime: string;
  endTime: string;
  isOnline: boolean;
  location?: string;
  notes?: string;
}

export interface UpdateSessionRequest {
  id: string;
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  isOnline?: boolean;
  location?: string;
  notes?: string;
  status?: SessionStatus;
}

export interface SessionResponse {
  success: boolean;
  session: Session;
}

export interface SessionsResponse {
  success: boolean;
  sessions: Session[];
  totalCount: number;
  page: number;
  totalPages: number;
}

export interface SessionRatingRequest {
  sessionId: string;
  rating: number;
  feedback?: string;
}

export interface SessionFilterOptions {
  status?: SessionStatus;
  skill?: string;
  mentorId?: string;
  upcoming?: boolean;
  page?: number;
  limit?: number;
} 
/**
 * API layer for training sessions.
 */
import { api } from './client';
import { TrainingMode, TrainingSession, TrainingQuestion as TrainingQuestionType } from '../types';

export interface NextQuestionResponse {
  is_correct: boolean;
  correct_answer: string | null;
  session_complete: boolean;
  progress: { current: number; total: number; correct: number; score: number };
  next_question?: TrainingQuestionType;
}

export interface CreateSessionPayload {
  mode: TrainingMode;
  range_id: number;
  total_questions?: number;
  user_id?: number;
}

export interface CreateSessionResponse {
  id: number;
  session: TrainingSession;
  first_question: TrainingQuestionType | null;
}

export interface SessionDetail {
  id: number;
  session: TrainingSession;
  current_question: TrainingQuestionType | null;
  progress: { current: number; total: number; correct: number; score: number };
}

export class TrainingApi {
  async modes(): Promise<{ value: string; label: string }[]> {
    const response = await api.get('/training/modes');
    return response.data;
  }

  async sessions(): Promise<TrainingSession[]> {
    const response = await api.get('/training/sessions');
    return response.data;
  }

  async createSession(payload: CreateSessionPayload): Promise<CreateSessionResponse> {
    const response = await api.post<CreateSessionResponse>('/training/sessions', payload);
    return response.data;
  }

  async session(sessionId: number): Promise<SessionDetail> {
    const response = await api.get(`/training/sessions/${sessionId}`);
    return response.data;
  }

  async start(
    sessionId: number,
  ): Promise<{ session: TrainingSession; first_question: TrainingQuestionType | null }> {
    const response = await api.post(`/training/sessions/${sessionId}/start`);
    return response.data;
  }

  async answer(sessionId: number, answer: string): Promise<NextQuestionResponse> {
    const response = await api.post<NextQuestionResponse>(`/training/sessions/${sessionId}/next`, {
      answer,
    });
    return response.data;
  }

  async end(sessionId: number): Promise<{ message: string; session: TrainingSession }> {
    const response = await api.post(`/training/sessions/${sessionId}/end`);
    return response.data;
  }

  async sessionsByUser(userId: number): Promise<TrainingSession[]> {
    const response = await api.get(`/training/sessions/user/${userId}`);
    return response.data;
  }
}

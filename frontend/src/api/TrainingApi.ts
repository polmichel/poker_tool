/**
 * API layer for training sessions.
 * Uses Zod validation for all responses.
 */
import { api, extractErrorMessage } from './client';
import { validate, validateApiResponse } from '../utils/validation';
import {
  CreateSessionPayload,
  CreateSessionResponse,
  NextQuestionResponse,
  SessionDetail,
} from './TrainingApi.types';
import { TrainingModeResponseSchema, TrainingSessionsResponseSchema, CreateSessionResponseSchema, SessionDetailResponseSchema, NextQuestionResponseSchema } from '../types/api/responses';
import { CreateSessionRequestSchema, AnswerRequestSchema } from '../types/api/requests';
import type { TrainingMode, TrainingSession, TrainingQuestion } from '../types/domain/training';
import type { CreateSessionRequest } from '../types/api/requests';
import type { TrainingModeResponse, TrainingSessionsResponse, SessionDetailResponse } from '../types/api/responses';

// Re-export types for backward compatibility
export type {
  CreateSessionPayload,
  CreateSessionResponse,
  NextQuestionResponse,
  SessionDetail,
  TrainingMode,
  TrainingSession,
  TrainingQuestion,
};

/**
 * Training API client with Zod validation
 */
export class TrainingApi {
  /**
   * Get available training modes
   */
  async modes(): Promise<TrainingModeResponse> {
    try {
      const response = await api.get('/training/modes');
      return validateApiResponse<TrainingModeResponse>(TrainingModeResponseSchema, response.data);
    } catch (error) {
      throw new Error(
        extractErrorMessage(error, 'Failed to fetch training modes')
      );
    }
  }

  /**
   * Get all training sessions
   */
  async sessions(): Promise<TrainingSession[]> {
    try {
      const response = await api.get('/training/sessions');
      return validateApiResponse<TrainingSessionsResponse>(TrainingSessionsResponseSchema, response.data);
    } catch (error) {
      throw new Error(
        extractErrorMessage(error, 'Failed to fetch training sessions')
      );
    }
  }

  /**
   * Create a new training session
   */
  async createSession(
    payload: CreateSessionRequest
  ): Promise<CreateSessionResponse> {
    try {
      // Validate the payload before sending
      const validatedPayload = validate(CreateSessionRequestSchema, payload);
      
      const response = await api.post<CreateSessionResponse>(
        '/training/sessions',
        validatedPayload
      );
      return validateApiResponse<CreateSessionResponse>(CreateSessionResponseSchema, response.data);
    } catch (error) {
      throw new Error(
        extractErrorMessage(error, 'Failed to create training session')
      );
    }
  }

  /**
   * Get a specific training session with its current question
   */
  async session(sessionId: number): Promise<SessionDetail> {
    try {
      const response = await api.get(`/training/sessions/${sessionId}`);
      return validateApiResponse<SessionDetailResponse>(SessionDetailResponseSchema, response.data);
    } catch (error) {
      throw new Error(
        extractErrorMessage(error, `Failed to fetch session ${sessionId}`)
      );
    }
  }

  /**
   * Start a training session
   * Note: This may not be needed as createSession already returns the first question
   */
  async start(
    sessionId: number
  ): Promise<{ session: TrainingSession; first_question: TrainingQuestion | null }> {
    try {
      const response = await api.post<{
        session: TrainingSession;
        first_question: TrainingQuestion | null;
      }>(`/training/sessions/${sessionId}/start`);
      
      return {
        session: response.data.session,
        first_question: response.data.first_question,
      };
    } catch (error) {
      throw new Error(
        extractErrorMessage(error, `Failed to start session ${sessionId}`)
      );
    }
  }

  /**
   * Submit an answer and get the next question
   */
  async answer(sessionId: number, answer: string): Promise<NextQuestionResponse> {
    try {
      const validatedAnswer = validate(AnswerRequestSchema, { answer });
      
      const response = await api.post<NextQuestionResponse>(
        `/training/sessions/${sessionId}/next`,
        validatedAnswer
      );
      return validateApiResponse<NextQuestionResponse>(NextQuestionResponseSchema, response.data);
    } catch (error) {
      throw new Error(
        extractErrorMessage(error, `Failed to submit answer for session ${sessionId}`)
      );
    }
  }

  /**
   * End a training session
   */
  async end(
    sessionId: number
  ): Promise<{ message: string; session: TrainingSession }> {
    try {
      const response = await api.post<{
        message: string;
        session: TrainingSession;
      }>(`/training/sessions/${sessionId}/end`);
      
      return {
        message: response.data.message,
        session: response.data.session,
      };
    } catch (error) {
      throw new Error(
        extractErrorMessage(error, `Failed to end session ${sessionId}`)
      );
    }
  }

  /**
   * Get training sessions for a specific user
   */
  async sessionsByUser(userId: number): Promise<TrainingSession[]> {
    try {
      const response = await api.get(`/training/sessions/user/${userId}`);
      return validateApiResponse<TrainingSessionsResponse>(TrainingSessionsResponseSchema, response.data);
    } catch (error) {
      throw new Error(
        extractErrorMessage(error, `Failed to fetch sessions for user ${userId}`)
      );
    }
  }
}

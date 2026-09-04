/**
 * API layer for authentication.
 * Uses Zod validation for all responses.
 */
import { api, extractErrorMessage } from './client';
import { validate, validateApiResponse } from '../utils/validation';
import { UserSchema } from '../types/domain/auth';
import { LoginRequestSchema, RegisterRequestSchema } from '../types/api/requests';
import { LoginResponseSchema, RegisterResponseSchema } from '../types/api/responses';
import type { User, AuthResponse } from '../types/domain/auth';
import type {
  LoginRequest,
  RegisterRequest,
} from '../types/api/requests';
import type { LoginResponse, RegisterResponse } from '../types/api/responses';

/**
 * Authentication API client with Zod validation
 */
export class AuthApi {
  /**
   * Login with username and password
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const validatedCredentials = validate(LoginRequestSchema, credentials);
      const response = await api.post<LoginResponse>('/auth/login', validatedCredentials);
      return validateApiResponse<LoginResponse>(LoginResponseSchema, response.data);
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Login failed'));
    }
  }

  /**
   * Register a new user
   */
  async register(credentials: RegisterRequest): Promise<AuthResponse> {
    try {
      const validatedCredentials = validate(RegisterRequestSchema, credentials);
      const response = await api.post<RegisterResponse>('/auth/register', validatedCredentials);
      return validateApiResponse<RegisterResponse>(RegisterResponseSchema, response.data);
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Registration failed'));
    }
  }

  /**
   * Logout (clears token on server)
   */
  async logout(): Promise<{ message: string }> {
    try {
      const response = await api.post<{ message: string }>('/auth/logout');
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Logout failed'));
    }
  }

  /**
   * Get current user (from token)
   */
  async me(): Promise<User> {
    try {
      const response = await api.get('/auth/me');
      return validate(UserSchema, response.data);
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Failed to fetch current user'));
    }
  }

  /**
   * Refresh access token
   */
  async refresh(): Promise<AuthResponse> {
    try {
      const response = await api.post<LoginResponse>('/auth/refresh');
      return validateApiResponse<LoginResponse>(LoginResponseSchema, response.data);
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Token refresh failed'));
    }
  }

  /**
   * Verify token is valid
   */
  async verify(): Promise<{ valid: boolean }> {
    try {
      const response = await api.get('/auth/verify');
      return response.data;
    } catch (error) {
      // If token is invalid, return valid: false
      const errorMessage = extractErrorMessage(error, '');
      if (errorMessage.includes('invalid') || errorMessage.includes('expired')) {
        return { valid: false };
      }
      throw new Error(extractErrorMessage(error, 'Token verification failed'));
    }
  }
}

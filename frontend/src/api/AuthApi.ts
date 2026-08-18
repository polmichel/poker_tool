/**
 * API layer for authentication + users.
 */
import { api } from './client';
import { User, AuthResponse } from '../types';

export class AuthApi {
  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', { username, email, password });
    return response.data;
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', { username, password });
    return response.data;
  }

  async me(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    return response.data;
  }

  async create(username: string, email: string, password: string): Promise<User> {
    const response = await api.post<User>('/users', { username, email, password });
    return response.data;
  }

}

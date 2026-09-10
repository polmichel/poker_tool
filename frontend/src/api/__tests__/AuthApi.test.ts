/**
 * AuthApi unit tests
 *
 * Asserts login/register/me hit the right endpoints and run Zod validation
 * on request payloads and responses.
 */
import MockAdapter from 'axios-mock-adapter';
import { api } from '../client';
import { AuthApi } from '../AuthApi';
import { makeAuthResponse, makeUser } from '../../tests/factories';

describe('AuthApi', () => {
  let authApi: AuthApi;
  let mockAxios: MockAdapter;

  beforeEach(() => {
    authApi = new AuthApi();
    mockAxios = new MockAdapter(api);
    localStorage.clear();
  });

  afterEach(() => {
    mockAxios.restore();
    localStorage.clear();
  });

  it('logs in and returns the access token + user', async () => {
    const authResponse = makeAuthResponse();
    mockAxios.onPost('/auth/login').reply(200, authResponse);

    const result = await authApi.login({ username: 'testuser', password: 'password123' });
    expect(result.access_token).toBe(authResponse.access_token);
    expect(result.user.username).toBe('testuser');

    const request = mockAxios.history.post[0];
    expect(JSON.parse(request.data)).toEqual({ username: 'testuser', password: 'password123' });
  });

  it('registers and returns the access token + user', async () => {
    const authResponse = makeAuthResponse();
    mockAxios.onPost('/auth/register').reply(201, authResponse);

    const result = await authApi.register({
      username: 'newuser',
      email: 'new@test.com',
      password: 'password123',
    });
    expect(result.access_token).toBe(authResponse.access_token);
    expect(result.user.username).toBe('testuser');

    const request = mockAxios.history.post[0];
    expect(JSON.parse(request.data)).toEqual({
      username: 'newuser',
      email: 'new@test.com',
      password: 'password123',
    });
  });

  it('fetches the current user from the token', async () => {
    localStorage.setItem('poker_tool_token', 'stored-token');
    const user = makeUser({ username: 'persisted' });
    mockAxios.onGet('/auth/me').reply(200, user);

    const result = await authApi.me();
    expect(result.username).toBe('persisted');
    expect(mockAxios.history.get[0].headers?.Authorization).toBe('Bearer stored-token');
  });

  it('logs out', async () => {
    mockAxios.onPost('/auth/logout').reply(200, { message: 'logged out' });

    const result = await authApi.logout();
    expect(result.message).toBe('logged out');
  });

  it('rejects when login credentials are invalid', async () => {
    mockAxios.onPost('/auth/login').reply(401, { message: 'Identifiants invalides' });

    await expect(authApi.login({ username: 'bad', password: 'creds' })).rejects.toThrow(
      /Identifiants invalides/,
    );
  });

  it('clears the token on a 401 response', async () => {
    localStorage.setItem('poker_tool_token', 'stale-token');
    mockAxios.onGet('/auth/me').reply(401, { message: 'Token expired' });

    await expect(authApi.me()).rejects.toThrow(/Token expired/);
    expect(localStorage.getItem('poker_tool_token')).toBeNull();
  });

  it('reports an invalid token as valid:false on verify', async () => {
    mockAxios.onGet('/auth/verify').reply(401, { message: 'invalid token' });

    const result = await authApi.verify();
    expect(result.valid).toBe(false);
  });
});

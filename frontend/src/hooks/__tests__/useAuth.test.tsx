import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '../useAuth';
import { AuthApi } from '../../api';
import { makeAuthResponse, makeUser } from '../../tests/factories';

function makeFakeAuthApi() {
  const fake: any = {};
  for (const method of ['login', 'register', 'logout', 'me', 'refresh', 'verify']) {
    fake[method] = jest.fn();
  }
  return fake as jest.Mocked<AuthApi>;
}

describe('useAuth Hook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('initializes anonymous with loading state', () => {
    const fakeApi = makeFakeAuthApi();
    fakeApi.me.mockResolvedValue(makeUser());
    const { result } = renderHook(() => useAuth(fakeApi));

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.token).toBeNull();
  });

  it('returns the expected intent surface (no setters exposed)', () => {
    const fakeApi = makeFakeAuthApi();
    fakeApi.me.mockResolvedValue(makeUser());
    const { result } = renderHook(() => useAuth(fakeApi));

    expect(result.current).toHaveProperty('user');
    expect(result.current).toHaveProperty('isAuthenticated');
    expect(result.current).toHaveProperty('login');
    expect(result.current).toHaveProperty('logout');
    expect(result.current).toHaveProperty('register');
    expect(result.current).toHaveProperty('fetchCurrentUser');
    expect(result.current).toHaveProperty('updateUser');
  });

  it('logs in, persists the token, and authenticates the user', async () => {
    const fakeApi = makeFakeAuthApi();
    const authResponse = makeAuthResponse();
    fakeApi.login.mockResolvedValue(authResponse);
    const { result } = renderHook(() => useAuth(fakeApi));

    let loggedInUser: ReturnType<typeof makeUser> | null = null;
    await act(async () => {
      loggedInUser = await result.current.login('testuser', 'password123');
    });

    expect(fakeApi.login).toHaveBeenCalledWith({ username: 'testuser', password: 'password123' });
    expect(loggedInUser).toEqual(authResponse.user);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(authResponse.user);
    expect(result.current.token).toBe(authResponse.access_token);
    expect(localStorage.getItem('poker_tool_token')).toBe(authResponse.access_token);
    expect(result.current.error).toBeNull();
  });

  it('surfaces an error and stays anonymous when login fails', async () => {
    const fakeApi = makeFakeAuthApi();
    fakeApi.login.mockRejectedValue(new Error('Identifiants invalides'));
    const { result } = renderHook(() => useAuth(fakeApi));

    let returned: unknown = 'not-null';
    await act(async () => {
      returned = await result.current.login('bad', 'creds');
    });

    expect(returned).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.error).toBe('Identifiants invalides');
  });

  it('registers, auto-logs-in, and persists the token', async () => {
    const fakeApi = makeFakeAuthApi();
    const authResponse = makeAuthResponse();
    fakeApi.register.mockResolvedValue(undefined as never);
    fakeApi.login.mockResolvedValue(authResponse);
    const { result } = renderHook(() => useAuth(fakeApi));

    let returned: unknown = null;
    await act(async () => {
      returned = await result.current.register('newuser', 'new@test.com', 'password123');
    });

    expect(fakeApi.register).toHaveBeenCalledWith({
      username: 'newuser',
      email: 'new@test.com',
      password: 'password123',
    });
    expect(fakeApi.login).toHaveBeenCalledWith({ username: 'newuser', password: 'password123' });
    expect(returned).toEqual(authResponse.user);
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem('poker_tool_token')).toBe(authResponse.access_token);
  });

  it('logs out, clears token and user state', async () => {
    const fakeApi = makeFakeAuthApi();
    const authResponse = makeAuthResponse();
    fakeApi.login.mockResolvedValue(authResponse);
    const { result } = renderHook(() => useAuth(fakeApi));

    await act(async () => {
      await result.current.login('testuser', 'password123');
    });
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem('poker_tool_token')).toBe(authResponse.access_token);

    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(localStorage.getItem('poker_tool_token')).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('fetches the current user on mount when a stored token exists', async () => {
    localStorage.setItem('poker_tool_token', 'stored-token');
    const fakeApi = makeFakeAuthApi();
    const user = makeUser({ username: 'persisted' });
    fakeApi.me.mockResolvedValue(user);
    const { result } = renderHook(() => useAuth(fakeApi));

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    expect(fakeApi.me).toHaveBeenCalled();
    expect(result.current.user).toEqual(user);
    expect(result.current.token).toBe('stored-token');
  });

  it('removes an invalid token when the mount fetch fails', async () => {
    localStorage.setItem('poker_tool_token', 'stale-token');
    const fakeApi = makeFakeAuthApi();
    fakeApi.me.mockRejectedValue(new Error('Token expired'));
    const { result } = renderHook(() => useAuth(fakeApi));

    // Wait for the mount fetch to complete (loading flips to false), after
    // which the catch block has cleared the stale token.
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('poker_tool_token')).toBeNull();
  });
});

/**
 * TrainingApi unit tests
 *
 * Uses axios-mock-adapter on the shared `api` instance to assert the
 * training API hits the right endpoints and validates responses with Zod.
 */
import MockAdapter from 'axios-mock-adapter';
import { api } from '../client';
import { TrainingApi } from '../TrainingApi';
import { makeTrainingSession, makeTrainingQuestion } from '../../tests/factories';

describe('TrainingApi', () => {
  let trainingApi: TrainingApi;
  let mockAxios: MockAdapter;

  beforeEach(() => {
    trainingApi = new TrainingApi();
    mockAxios = new MockAdapter(api);
    localStorage.clear();
  });

  afterEach(() => {
    mockAxios.restore();
    localStorage.clear();
  });

  it('fetches available training modes', async () => {
    const modes = [
      { value: 'fill', label: 'Remplir' },
      { value: 'guess', label: 'Deviner' },
    ];
    mockAxios.onGet('/training/modes').reply(200, modes);
    const result = await trainingApi.modes();
    expect(result).toEqual(modes);
  });

  it('fetches all training sessions', async () => {
    const sessions = [makeTrainingSession(), makeTrainingSession({ id: 2, score: 50 })];
    mockAxios.onGet('/training/sessions').reply(200, sessions);
    const result = await trainingApi.sessions();
    expect(result).toHaveLength(2);
    expect(result[0].score).toBe(85);
  });

  it('list() delegates to sessions()', async () => {
    const sessions = [makeTrainingSession()];
    mockAxios.onGet('/training/sessions').reply(200, sessions);
    const result = await trainingApi.list();
    expect(result).toHaveLength(1);
  });

  it('creates a session and returns the session + first question', async () => {
    const firstQuestion = makeTrainingQuestion();
    const createResponse = {
      id: 1,
      session: makeTrainingSession({ id: 1 }),
      first_question: firstQuestion,
    };
    mockAxios.onPost('/training/sessions').reply(201, createResponse);
    const result = await trainingApi.createSession({
      mode: 'fill',
      range_id: 1,
      total_questions: 10,
    });
    expect(result.id).toBe(1);
    expect(result.session.range_id).toBe(1);
    expect(result.first_question).toEqual(firstQuestion);
    const request = mockAxios.history.post[0];
    expect(JSON.parse(request.data)).toEqual({ mode: 'fill', range_id: 1, total_questions: 10 });
  });

  it('fetches a session detail by id', async () => {
    const detail = {
      id: 7,
      session: makeTrainingSession({ id: 7 }),
      current_question: makeTrainingQuestion(),
      progress: { current: 3, total: 10, correct: 2, score: 67 },
    };
    mockAxios.onGet('/training/sessions/7').reply(200, detail);
    const result = await trainingApi.session(7);
    expect(result.id).toBe(7);
    expect(result.progress.current).toBe(3);
  });

  it('submits an answer and returns the next question response', async () => {
    const nextResponse = {
      is_correct: true,
      correct_answer: 'open',
      session_complete: false,
      progress: { current: 2, total: 10, correct: 2, score: 100 },
      next_question: makeTrainingQuestion({ hand: 'AQs' }),
    };
    mockAxios.onPost('/training/sessions/1/next').reply(200, nextResponse);
    const result = await trainingApi.answer(1, 'open');
    expect(result.is_correct).toBe(true);
    expect(result.next_question?.hand).toBe('AQs');
    const request = mockAxios.history.post[0];
    expect(JSON.parse(request.data)).toEqual({ answer: 'open' });
  });

  it('ends a session and returns the message + session', async () => {
    const ended = makeTrainingSession({ id: 1, score: 90 });
    mockAxios.onPost('/training/sessions/1/end').reply(200, { message: 'ended', session: ended });
    const result = await trainingApi.end(1);
    expect(result.message).toBe('ended');
    expect(result.session.score).toBe(90);
  });

  it('fetches sessions for a specific user', async () => {
    const userSessions = [makeTrainingSession({ id: 10, user_id: 2 })];
    mockAxios.onGet('/training/sessions/user/2').reply(200, userSessions);
    const result = await trainingApi.sessionsByUser(2);
    expect(result).toHaveLength(1);
    expect(result[0].user_id).toBe(2);
  });

  it('rejects when the backend returns invalid data (Zod validation)', async () => {
    // Missing required fields -> Zod validation throws.
    mockAxios.onGet('/training/sessions').reply(200, [{ id: 1 }]);
    await expect(trainingApi.sessions()).rejects.toThrow();
  });

  it('surfaces the backend error message when a request fails', async () => {
    mockAxios.onGet('/training/modes').reply(500, { message: 'Server boom' });
    await expect(trainingApi.modes()).rejects.toThrow(/Server boom/);
  });

  it('attaches the bearer token when one is stored', async () => {
    localStorage.setItem('poker_tool_token', 'abc123');
    mockAxios.onGet('/training/sessions').reply(200, [makeTrainingSession()]);
    await trainingApi.sessions();
    const request = mockAxios.history.get[0];
    expect(request.headers?.Authorization).toBe('Bearer abc123');
  });
});

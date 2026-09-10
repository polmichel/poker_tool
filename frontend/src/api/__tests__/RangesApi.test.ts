/**
 * RangesApi unit tests
 *
 * Uses axios-mock-adapter on the shared `api` instance to assert the API
 * layer hits the right endpoints and validates responses with Zod.
 */
import MockAdapter from 'axios-mock-adapter';
import { api } from '../client';
import { RangesApi } from '../RangesApi';
import { makeRange } from '../../tests/factories';

describe('RangesApi', () => {
  let rangesApi: RangesApi;
  let mockAxios: MockAdapter;

  beforeEach(() => {
    rangesApi = new RangesApi();
    mockAxios = new MockAdapter(api);
  });

  afterEach(() => {
    mockAxios.restore();
  });

  it('fetches all ranges', async () => {
    const mockRanges = [makeRange(), makeRange({ id: 2, name: 'Range 2' })];
    mockAxios.onGet('/ranges').reply(200, mockRanges);

    const result = await rangesApi.ranges();
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Test Range');
  });

  it('attaches the bearer token when one is stored', async () => {
    localStorage.setItem('poker_tool_token', 'abc123');
    mockAxios.onGet('/ranges').reply(200, [makeRange()]);

    await rangesApi.ranges();
    const request = mockAxios.history.get[0];
    expect(request.headers?.Authorization).toBe('Bearer abc123');
    localStorage.removeItem('poker_tool_token');
  });

  it('fetches a single range by id', async () => {
    const single = makeRange({ id: 5, name: 'Single' });
    mockAxios.onGet('/ranges/5').reply(200, single);

    const result = await rangesApi.range(5);
    expect(result.id).toBe(5);
    expect(result.name).toBe('Single');
  });

  it('creates a range and validates the response', async () => {
    const created = makeRange({ id: 3, name: 'Created' });
    mockAxios.onPost('/ranges').reply(201, created);

    const result = await rangesApi.create({
      name: 'Created',
      description: '',
      range_type: 'preflop',
      position: 'BTN',
      effective_stack_bb: null,
      hands: { AKs: 'open' },
    });
    expect(result.id).toBe(3);
    expect(result.name).toBe('Created');
  });

  it('updates a range via PUT', async () => {
    const updated = makeRange({ id: 1, name: 'Updated' });
    mockAxios.onPut('/ranges/1').reply(200, updated);

    const result = await rangesApi.update(1, { name: 'Updated' });
    expect(result.name).toBe('Updated');
  });

  it('deletes a range', async () => {
    mockAxios.onDelete('/ranges/7').reply(200, { message: 'deleted' });

    const result = await rangesApi.delete(7);
    expect(result.message).toBe('deleted');
  });

  it('fetches ranges for a specific user', async () => {
    const userRanges = [makeRange({ id: 10, name: 'User Range' })];
    mockAxios.onGet('/ranges/user/2').reply(200, userRanges);

    const result = await rangesApi.rangesByUser(2);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(10);
  });

  it('rejects with a descriptive error when the backend returns invalid data', async () => {
    // Missing required fields -> Zod validation throws.
    mockAxios.onGet('/ranges').reply(200, [{ id: 1 }]);

    await expect(rangesApi.ranges()).rejects.toThrow();
  });

  it('surfaces the backend error message when the request fails', async () => {
    mockAxios.onGet('/ranges').reply(500, { message: 'Server boom' });

    await expect(rangesApi.ranges()).rejects.toThrow(/Server boom/);
  });
});

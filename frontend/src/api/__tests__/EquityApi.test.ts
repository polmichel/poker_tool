/**
 * EquityApi unit tests
 *
 * Asserts the /equity/simulate payload shape (hero + range + board +
 * iterations) and the 409 -> EquityMissingError mapping.
 */
import MockAdapter from 'axios-mock-adapter';
import { api } from '../client';
import { EquityApi } from '../EquityApi';
import { makeEquityResult } from '../../tests/factories';

describe('EquityApi', () => {
  let equityApi: EquityApi;
  let mockAxios: MockAdapter;

  beforeEach(() => {
    equityApi = new EquityApi();
    mockAxios = new MockAdapter(api);
  });

  afterEach(() => {
    mockAxios.restore();
  });

  it('calculates equity and sends the villain range under the `range` field', async () => {
    const result = makeEquityResult();
    mockAxios.onPost('/equity/simulate').reply(200, result);

    const response = await equityApi.calculate({
      hero: 'AKs',
      villain: 'QQ+,AKs',
      iterations: 10000,
    });

    expect(response.win).toBe(result.win);
    const sent = JSON.parse(mockAxios.history.post[0].data);
    expect(sent.hero).toBe('AKs');
    expect(sent.range).toBe('QQ+,AKs');
    expect(sent.iterations).toBe(10000);
  });

  it('maps a 409 missing-hands response to EquityMissingError', async () => {
    mockAxios.onPost('/equity/simulate').reply(409, {
      error: 'missing hands',
      missing: ['72o', '73o'],
    });

    await expect(
      equityApi.calculate({ hero: 'AKs', villain: 'random', iterations: 1000 }),
    ).rejects.toMatchObject({
      name: 'EquityMissingError',
      missing: ['72o', '73o'],
    });
  });

  it('supports a board via calculateWithBoard', async () => {
    const result = makeEquityResult();
    mockAxios.onPost('/equity/simulate').reply(200, result);

    const response = await equityApi.calculateWithBoard('AKs', 'QQ', 'AhKd2c');
    expect(response.hero).toBe('AKs');

    const sent = JSON.parse(mockAxios.history.post[0].data);
    expect(sent.board).toBe('AhKd2c');
    expect(sent.range).toBe('QQ');
  });

  it('surfaces the backend error message when the backend fails', async () => {
    mockAxios.onPost('/equity/simulate').reply(500, { message: 'compute failed' });

    await expect(
      equityApi.calculate({ hero: 'AKs', villain: 'QQ', iterations: 1000 }),
    ).rejects.toThrow(/compute failed/);
  });
});

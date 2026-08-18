/**
 * Unit tests for the Training page.
 *
 * Regression coverage for the "Remplir une range" (grid_paint) flow: validating
 * a painted grid must show the feedback panel WITHOUT returning to the main
 * menu, and clicking "Voir les résultats" must open the results dialog.
 *
 * Previously, useTraining.nextQuestion() called setIsSessionActive(false) and
 * setCurrentQuestion(null) as soon as the session was complete, which unmounted
 * TrainingGridQuestion (and its feedback panel) before the user could read it,
 * dropping them back on the "Prêt à vous entraîner ?" menu.
 *
 * To exercise the real state coordination between the page and useTraining, the
 * API layer (TrainingApi / RangesApi) is mocked while the real hook runs.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Training from '../Training';

// --- Mock API fakes (real hook runs against these) ----------------------------
// Variables are prefixed with "mock" so jest.mock() factories may reference them.
const mockAnswer = jest.fn();
const mockCreateSession = jest.fn();
const mockSessions = jest.fn();
const mockModes = jest.fn();

jest.mock('../../api', () => {
  // TrainingApi is instantiated via `new TrainingApi()` inside useTraining; the
  // mock constructor returns an object exposing the methods used by the hook.
  class FakeTrainingApi {
    sessions = mockSessions;
    createSession = mockCreateSession;
    answer = mockAnswer;
    end = jest.fn().mockResolvedValue({ message: 'ok', session: {} });
    modes = mockModes;
    session = jest.fn();
    start = jest.fn();
    sessionsByUser = jest.fn();
  }
  class FakeRangesApi {
    all = jest.fn().mockResolvedValue([{ id: 1, name: 'Test Range E2E', hands: { AA: 'raise' } }]);
    byId = jest.fn();
    create = jest.fn();
    update = jest.fn();
    remove = jest.fn();
    defaults = jest.fn();
  }
  return {
    api: {},
    API_BASE_URL: 'http://localhost:5000/api',
    TrainingApi: FakeTrainingApi,
    RangesApi: FakeRangesApi,
    AuthApi: class {},
    StatsApi: class {},
    EquityApi: class {},
  };
});

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => jest.fn(),
  };
});

const renderTraining = () =>
  render(
    <MemoryRouter initialEntries={['/training']}>
      <Training />
    </MemoryRouter>,
  );

describe('Training page (grid_paint "Remplir une range")', () => {
  beforeEach(() => {
    mockAnswer.mockReset();
    mockCreateSession.mockReset();
    mockSessions.mockReset();
    mockModes.mockReset();

    mockSessions.mockResolvedValue([]);
    mockModes.mockResolvedValue([
      { value: 'fill', label: 'Remplir une range' },
      { value: 'guess', label: 'Deviner une range' },
      { value: 'complete', label: 'Completer une range' },
    ]);
  });

  test('validating the grid shows the feedback panel and does NOT return to the main menu', async () => {
    // createSession: returns a session + the first grid_paint question.
    mockCreateSession.mockResolvedValue({
      session: { id: 42, total_questions: 1 },
      first_question: {
        type: 'grid_paint',
        hand: 'grid',
        question: 'Remplissez la range en coloriant la grille, puis validez.',
        correct_answer: JSON.stringify({ AA: 'raise' }),
      },
    });

    // answer: single grid exercise -> session is complete after validation.
    // With the fix, useTraining keeps currentQuestion/isSessionActive so the
    // feedback panel stays mounted; only handleNextQuestion closes the session.
    mockAnswer.mockResolvedValue({
      is_correct: false,
      correct_answer: JSON.stringify({ AA: 'raise' }),
      session_complete: true,
      progress: { current: 1, total: 1, correct: 168, score: 99.41 },
    });

    renderTraining();

    // Select the test range and start a "fill" session.
    await waitFor(() => {
      expect(screen.getByText('Test Range E2E')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Test Range E2E'));
    fireEvent.click(screen.getByTestId('start-training-button'));

    // The editable grid must appear (not the per-hand question paper).
    await waitFor(() => {
      expect(screen.getByTestId('grid-question-paper')).toBeInTheDocument();
    });
    expect(screen.getByTestId('validate-grid-button')).toBeInTheDocument();

    // Validate the painted grid.
    fireEvent.click(screen.getByTestId('validate-grid-button'));

    // The feedback panel must appear...
    await waitFor(() => {
      expect(screen.getByTestId('feedback-panel')).toBeInTheDocument();
    });

    // Regression invariant: validating must NOT drop the user back to the main
    // menu. The "Démarrer l'entraînement" start button must stay gone and the
    // grid-question-paper must stay mounted while the feedback is shown.
    expect(screen.queryByTestId('start-training-button')).not.toBeInTheDocument();
    expect(screen.getByTestId('grid-question-paper')).toBeInTheDocument();

    // The "next" button advertises the results because the session is complete.
    expect(screen.getByTestId('next-question-button')).toHaveTextContent(/résultats/i);

    // Clicking it closes the session and opens the results dialog.
    fireEvent.click(screen.getByTestId('next-question-button'));

    await waitFor(() => {
      expect(screen.getByTestId('results-dialog')).toBeVisible();
    });
  });
});

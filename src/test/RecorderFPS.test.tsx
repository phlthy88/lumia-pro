import { TestBed } from './TestBed';
import App from '../App';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, Mock } from 'vitest';
import { act } from 'react';
import { useRecorder } from '../hooks/useRecorder'; // Import the mocked useRecorder

vi.mock('../hooks/useDeferredInit', () => ({
  useDeferredInit: () => true,
}));

describe('Recorder FPS Sync', () => {
  it('should use the correct targetFPS from PerformanceModeProvider when recording', async () => {
    // Arrange
    render(<TestBed><App /></TestBed>);

    // Act
    // Change to BOOSTS tab
    await act(async () => {
        fireEvent.click(screen.getByText(/BOOSTS/i));
    });
    // Change performance mode to 'performance'
    await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /performance/i }));
    });
    // Start recording
    await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Start recording/i })); // Use accessible name
    });

    // Assert
    const lastCall = (useRecorder as Mock).mock.calls.at(-1);
    const recorderInstance = (useRecorder as Mock).mock.results.at(-1)?.value;

    // @ts-ignore - vitest assertion types
    expect(lastCall?.[1]).toBe(60);
    // @ts-ignore - vitest assertion types
    expect(recorderInstance).toBeDefined();
    // @ts-ignore - vitest assertion types
    await waitFor(() => expect(recorderInstance?.startRecording).toHaveBeenCalled());
  });
});

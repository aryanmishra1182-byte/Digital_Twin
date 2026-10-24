import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Monitor } from '../src/pages/Monitor';
import { api } from '../src/api/client';

vi.mock('../src/api/client', () => ({
  api: {
    getAllTwins: vi.fn(),
    getAlerts: vi.fn(),
    getSimulatorStatus: vi.fn(),
    getTelemetryHistory: vi.fn(),
    startSimulator: vi.fn(),
    stopSimulator: vi.fn(),
    acknowledgeAlert: vi.fn(),
    resolveAlert: vi.fn()
  }
}));

describe('Monitor screen state handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders backend-unreachable state when getAllTwins fails', async () => {
    vi.mocked(api.getAllTwins).mockRejectedValue(new Error('Connection refused'));
    vi.mocked(api.getAlerts).mockResolvedValue([]);
    vi.mocked(api.getSimulatorStatus).mockResolvedValue(null);

    render(<Monitor />);

    await waitFor(() => {
      expect(screen.getByText('Connection problem')).toBeInTheDocument();
      expect(
        screen.getByText("Can't reach the monitor. Check that the backend is running on port 8080.")
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    });
  });

  it('renders empty state when no motors are reporting', async () => {
    vi.mocked(api.getAllTwins).mockResolvedValue([]);
    vi.mocked(api.getAlerts).mockResolvedValue([]);
    vi.mocked(api.getSimulatorStatus).mockResolvedValue({
      isRunning: false,
      motorId: 'MOTOR-01',
      scenario: 'HEALTHY',
      severity: 0.5,
      loadPct: 75,
      ticksEmitted: 0,
      currentTempC: 45
    });

    render(<Monitor />);

    await waitFor(() => {
      expect(screen.getByText('No motor is reporting yet')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to demo setup' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Start demo' })).toBeInTheDocument();
    });
  });
});

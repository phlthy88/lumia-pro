import React, { ReactNode } from 'react';
import { ThemeProvider } from '../theme/ThemeContext';
import { UIStateProvider } from '../providers/UIStateProvider';
import { PerformanceModeProvider } from '../providers/PerformanceModeProvider';
import { CameraController } from '../controllers/CameraController';
import { RenderController } from '../controllers/RenderController';
import { AIController } from '../controllers/AIController';
import { RecordingController } from '../controllers/RecordingController';
import { ErrorBoundary } from '../components/ErrorBoundary'; // Assuming you want error boundaries in tests too

interface TestBedProps {
  children: ReactNode;
}

export const TestBed: React.FC<TestBedProps> = ({ children }) => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <UIStateProvider>
          <PerformanceModeProvider>
            <CameraController>
              <RenderController>
                <AIController>
                  <RecordingController>
                    {children}
                  </RecordingController>
                </AIController>
              </RenderController>
            </CameraController>
          </PerformanceModeProvider>
        </UIStateProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

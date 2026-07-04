import React, { createContext, useContext, useState } from 'react';
import * as JoyrideModule from 'react-joyride';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Joyride = (JoyrideModule as any).default ?? JoyrideModule;
type CallBackProps = JoyrideModule.CallBackProps;
type Step = JoyrideModule.Step;
const STATUS = JoyrideModule.STATUS;

interface TourContextType {
  startTour: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

const ENTREPRENEUR_STEPS: Step[] = [
  {
    target: 'body',
    content: (
      <div>
        <h3 className="font-bold text-lg mb-1">Welcome to Business Nexus! 🎉</h3>
        <p className="text-sm text-gray-600">Let's take a quick tour of all the features available to you as an entrepreneur.</p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="sidebar-dashboard"]',
    content: (
      <div>
        <h3 className="font-semibold mb-1">Dashboard</h3>
        <p className="text-sm text-gray-600">Your home base — see pending requests, meetings, and wallet balance at a glance.</p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tour="sidebar-investors"]',
    content: (
      <div>
        <h3 className="font-semibold mb-1">Find Investors</h3>
        <p className="text-sm text-gray-600">Browse investors by industry, stage, and portfolio size. Send collaboration requests directly from their profiles.</p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tour="sidebar-calendar"]',
    content: (
      <div>
        <h3 className="font-semibold mb-1">Meeting Calendar</h3>
        <p className="text-sm text-gray-600">Set your availability, send and accept meeting requests, and track all your scheduled calls.</p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tour="sidebar-payments"]',
    content: (
      <div>
        <h3 className="font-semibold mb-1">Payments</h3>
        <p className="text-sm text-gray-600">Manage your wallet — deposit, withdraw, transfer funds, and track all transactions.</p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tour="sidebar-documents"]',
    content: (
      <div>
        <h3 className="font-semibold mb-1">Document Chamber</h3>
        <p className="text-sm text-gray-600">Upload contracts and pitch decks, track review status, and e-sign documents.</p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tour="sidebar-messages"]',
    content: (
      <div>
        <h3 className="font-semibold mb-1">Messages & Video Calls</h3>
        <p className="text-sm text-gray-600">Chat with investors and start a video call directly from any conversation.</p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tour="dashboard-stats"]',
    content: (
      <div>
        <h3 className="font-semibold mb-1">Your Stats</h3>
        <p className="text-sm text-gray-600">Live overview of pending requests, connections, upcoming meetings, and wallet balance — click any card to navigate directly.</p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: 'body',
    content: (
      <div>
        <h3 className="font-bold text-lg mb-1">You're all set! 🚀</h3>
        <p className="text-sm text-gray-600">Start by finding investors or setting up your availability in the calendar. Good luck!</p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
];

const joyrideStyles = {
  options: {
    primaryColor: '#2563EB',
    zIndex: 9999,
    arrowColor: '#ffffff',
    backgroundColor: '#ffffff',
    overlayColor: 'rgba(0,0,0,0.5)',
    textColor: '#111827',
  },
  tooltip: {
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
  },
  buttonNext: {
    backgroundColor: '#2563EB',
    borderRadius: '8px',
    fontSize: '14px',
    padding: '8px 20px',
  },
  buttonBack: {
    color: '#6B7280',
    fontSize: '14px',
    marginRight: '8px',
  },
  buttonSkip: {
    color: '#9CA3AF',
    fontSize: '13px',
  },
};

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [run, setRun] = useState(false);

  const startTour = () => setRun(true);

  const handleCallback = (data: CallBackProps) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as typeof STATUS.FINISHED)) {
      setRun(false);
    }
  };

  return (
    <TourContext.Provider value={{ startTour }}>
      <Joyride
        steps={ENTREPRENEUR_STEPS}
        run={run}
        continuous
        showSkipButton
        showProgress
        scrollToFirstStep
        callback={handleCallback}
        styles={joyrideStyles}
        locale={{
          back: 'Back',
          close: 'Close',
          last: 'Finish',
          next: 'Next →',
          skip: 'Skip tour',
        }}
      />
      {children}
    </TourContext.Provider>
  );
};

export const useTour = (): TourContextType => {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used within TourProvider');
  return ctx;
};

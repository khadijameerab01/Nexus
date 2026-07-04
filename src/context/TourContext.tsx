import React, { createContext, useContext, useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

interface TourStep {
  title: string;
  content: string;
  target?: string; // CSS selector
}

interface TourContextType {
  startTour: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

const STEPS: TourStep[] = [
  { title: 'Welcome to Business Nexus! 🎉', content: "Let's take a quick tour of all the features available to you as an entrepreneur." },
  { title: 'Dashboard', content: 'Your home base — see pending requests, meetings, and wallet balance at a glance. Click any card to navigate directly.', target: '[data-tour="dashboard-stats"]' },
  { title: 'Find Investors', content: 'Browse investors by industry, stage, and portfolio size. Send collaboration requests directly from their profiles.', target: '[data-tour="sidebar-investors"]' },
  { title: 'Meeting Calendar', content: 'Set your availability, send and accept meeting requests, and track all your scheduled calls.', target: '[data-tour="sidebar-calendar"]' },
  { title: 'Payments', content: 'Manage your wallet — deposit, withdraw, transfer funds, and track all transactions.', target: '[data-tour="sidebar-payments"]' },
  { title: 'Document Chamber', content: 'Upload contracts and pitch decks, track review status, and e-sign documents.', target: '[data-tour="sidebar-documents"]' },
  { title: 'Messages & Video Calls', content: 'Chat with investors and start a video call directly from any conversation.', target: '[data-tour="sidebar-messages"]' },
  { title: "You're all set! 🚀", content: 'Start by finding investors or setting up your availability in the calendar. Good luck!' },
];

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [run, setRun] = useState(false);
  const [step, setStep] = useState(0);
  const [tooltipPos, setTooltipPos] = useState({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });

  const startTour = () => { setStep(0); setRun(true); };

  const current = STEPS[step];

  useEffect(() => {
    if (!run || !current.target) {
      setTooltipPos({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
      return;
    }
    const el = document.querySelector(current.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      const top = Math.min(rect.bottom + 12, window.innerHeight - 220);
      const left = Math.min(Math.max(rect.left, 10), window.innerWidth - 320);
      setTooltipPos({ top: `${top}px`, left: `${left}px`, transform: 'none' });
    } else {
      setTooltipPos({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
    }
  }, [run, step, current.target]);

  const next = () => { if (step < STEPS.length - 1) setStep(s => s + 1); else setRun(false); };
  const prev = () => { if (step > 0) setStep(s => s - 1); };
  const skip = () => setRun(false);

  return (
    <TourContext.Provider value={{ startTour }}>
      {children}
      {run && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 z-[9998] bg-black/40 pointer-events-none" />
          {/* Tooltip */}
          <div
            className="fixed z-[9999] bg-white rounded-2xl shadow-2xl p-5 w-72 pointer-events-auto"
            style={tooltipPos as React.CSSProperties}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-gray-900 text-sm leading-tight pr-2">{current.title}</h3>
              <button onClick={skip} className="text-gray-400 hover:text-gray-600 shrink-0">
                <X size={16} />
              </button>
            </div>
            <p className="text-gray-600 text-xs leading-relaxed mb-4">{current.content}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">{step + 1} / {STEPS.length}</span>
              <div className="flex gap-2">
                {step > 0 && (
                  <button onClick={prev} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg border border-gray-200">
                    <ChevronLeft size={12} /> Back
                  </button>
                )}
                <button onClick={next} className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg font-medium">
                  {step === STEPS.length - 1 ? 'Finish' : 'Next'} {step < STEPS.length - 1 && <ChevronRight size={12} />}
                </button>
              </div>
            </div>
            {/* Progress dots */}
            <div className="flex gap-1 justify-center mt-3">
              {STEPS.map((_, i) => (
                <span key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === step ? 'bg-blue-600' : 'bg-gray-200'}`} />
              ))}
            </div>
          </div>
        </>
      )}
    </TourContext.Provider>
  );
};

export const useTour = (): TourContextType => {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used within TourProvider');
  return ctx;
};

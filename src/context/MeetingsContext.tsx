import React, { createContext, useState, useContext } from 'react';
import { Meeting, AvailabilitySlot, MeetingStatus } from '../types';
import { meetings as seedMeetings, availabilitySlots as seedSlots } from '../data/meetings';
import toast from 'react-hot-toast';

interface MeetingsContextType {
  meetings: Meeting[];
  slots: AvailabilitySlot[];
  addSlot: (slot: Omit<AvailabilitySlot, 'id' | 'isBooked'>) => void;
  removeSlot: (slotId: string) => void;
  requestMeeting: (meeting: Omit<Meeting, 'id' | 'status' | 'createdAt'>) => void;
  respondToMeeting: (meetingId: string, status: MeetingStatus) => void;
  cancelMeeting: (meetingId: string) => void;
}

const MeetingsContext = createContext<MeetingsContextType | undefined>(undefined);

export const MeetingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [meetings, setMeetings] = useState<Meeting[]>(seedMeetings);
  const [slots, setSlots] = useState<AvailabilitySlot[]>(seedSlots);

  const addSlot = (slot: Omit<AvailabilitySlot, 'id' | 'isBooked'>) => {
    const newSlot: AvailabilitySlot = {
      ...slot,
      id: `a${Date.now()}`,
      isBooked: false,
    };
    setSlots(prev => [...prev, newSlot]);
    toast.success('Availability slot added');
  };

  const removeSlot = (slotId: string) => {
    setSlots(prev => prev.filter(s => s.id !== slotId));
    toast.success('Slot removed');
  };

  const requestMeeting = (meeting: Omit<Meeting, 'id' | 'status' | 'createdAt'>) => {
    const newMeeting: Meeting = {
      ...meeting,
      id: `m${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setMeetings(prev => [...prev, newMeeting]);
    toast.success('Meeting request sent');
  };

  const respondToMeeting = (meetingId: string, status: MeetingStatus) => {
    setMeetings(prev =>
      prev.map(m => {
        if (m.id !== meetingId) return m;
        if (status === 'accepted') {
          setSlots(prevSlots =>
            prevSlots.map(s =>
              s.userId === m.recipientId && s.date === m.date && s.startTime === m.startTime
                ? { ...s, isBooked: true }
                : s
            )
          );
        }
        return { ...m, status };
      })
    );
    toast.success(status === 'accepted' ? 'Meeting confirmed' : 'Meeting declined');
  };

  const cancelMeeting = (meetingId: string) => {
    setMeetings(prev => prev.map(m => (m.id === meetingId ? { ...m, status: 'cancelled' } : m)));
    toast.success('Meeting cancelled');
  };

  return (
    <MeetingsContext.Provider
      value={{ meetings, slots, addSlot, removeSlot, requestMeeting, respondToMeeting, cancelMeeting }}
    >
      {children}
    </MeetingsContext.Provider>
  );
};

export const useMeetings = (): MeetingsContextType => {
  const context = useContext(MeetingsContext);
  if (context === undefined) {
    throw new Error('useMeetings must be used within a MeetingsProvider');
  }
  return context;
};

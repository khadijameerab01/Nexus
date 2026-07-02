import { Meeting, AvailabilitySlot } from '../types';

export const availabilitySlots: AvailabilitySlot[] = [
  { id: 'a1', userId: 'i1', date: '2026-07-06', startTime: '09:00', endTime: '09:30', isBooked: false },
  { id: 'a2', userId: 'i1', date: '2026-07-06', startTime: '10:00', endTime: '10:30', isBooked: true },
  { id: 'a3', userId: 'i1', date: '2026-07-07', startTime: '14:00', endTime: '14:30', isBooked: false },
  { id: 'a4', userId: 'e1', date: '2026-07-08', startTime: '11:00', endTime: '11:30', isBooked: false },
];

export const meetings: Meeting[] = [
  {
    id: 'm1',
    requesterId: 'e1',
    recipientId: 'i1',
    date: '2026-07-06',
    startTime: '10:00',
    endTime: '10:30',
    topic: 'Series A pitch follow-up',
    status: 'accepted',
    createdAt: '2026-06-28T10:00:00Z',
  },
  {
    id: 'm2',
    requesterId: 'i1',
    recipientId: 'e2',
    date: '2026-07-09',
    startTime: '15:00',
    endTime: '15:30',
    topic: 'Due diligence discussion',
    status: 'pending',
    createdAt: '2026-06-29T08:00:00Z',
  },
];

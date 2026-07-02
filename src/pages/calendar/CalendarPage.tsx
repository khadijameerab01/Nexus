import React, { useMemo, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format } from 'date-fns';
import { Plus, Clock, X, Check, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMeetings } from '../../context/MeetingsContext';
import { entrepreneurs, investors } from '../../data/users';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';

const allUsers = [...entrepreneurs, ...investors];
const getUserName = (id: string) => allUsers.find(u => u.id === id)?.name ?? 'Unknown user';

export const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const { meetings, slots, addSlot, removeSlot, requestMeeting, respondToMeeting, cancelMeeting } = useMeetings();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [showRequestMeeting, setShowRequestMeeting] = useState(false);
  const [newSlotTime, setNewSlotTime] = useState({ start: '09:00', end: '09:30' });
  const [requestForm, setRequestForm] = useState({ recipientId: '', topic: '', startTime: '09:00', endTime: '09:30' });

  if (!user) return null;

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  const mySlots = useMemo(
    () => slots.filter(s => s.userId === user.id && s.date === selectedDateStr),
    [slots, user.id, selectedDateStr]
  );

  const myMeetingsOnDate = useMemo(
    () =>
      meetings.filter(
        m => (m.requesterId === user.id || m.recipientId === user.id) && m.date === selectedDateStr && m.status !== 'cancelled'
      ),
    [meetings, user.id, selectedDateStr]
  );

  const incomingRequests = useMemo(
    () => meetings.filter(m => m.recipientId === user.id && m.status === 'pending'),
    [meetings, user.id]
  );

  // Dates that have any meetings or availability for this user, used for calendar tile dots
  const activeDates = useMemo(() => {
    const set = new Set<string>();
    slots.filter(s => s.userId === user.id).forEach(s => set.add(s.date));
    meetings
      .filter(m => (m.requesterId === user.id || m.recipientId === user.id) && m.status !== 'cancelled')
      .forEach(m => set.add(m.date));
    return set;
  }, [slots, meetings, user.id]);

  const otherRoleUsers = user.role === 'entrepreneur' ? investors : entrepreneurs;

  const handleAddSlot = () => {
    if (newSlotTime.start >= newSlotTime.end) {
      return;
    }
    addSlot({
      userId: user.id,
      date: selectedDateStr,
      startTime: newSlotTime.start,
      endTime: newSlotTime.end,
    });
    setShowAddSlot(false);
  };

  const handleRequestMeeting = () => {
    if (!requestForm.recipientId || !requestForm.topic) return;
    requestMeeting({
      requesterId: user.id,
      recipientId: requestForm.recipientId,
      date: selectedDateStr,
      startTime: requestForm.startTime,
      endTime: requestForm.endTime,
      topic: requestForm.topic,
    });
    setShowRequestMeeting(false);
    setRequestForm({ recipientId: '', topic: '', startTime: '09:00', endTime: '09:30' });
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Meeting Calendar</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your availability and meeting requests</p>
        </div>
        {incomingRequests.length > 0 && (
          <Badge variant="warning" rounded size="md">
            {incomingRequests.length} pending request{incomingRequests.length > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            <CardBody className="p-4">
              <Calendar
                onChange={(value) => setSelectedDate(value as Date)}
                value={selectedDate}
                className="nexus-calendar w-full border-0"
                tileContent={({ date, view }) => {
                  if (view !== 'month') return null;
                  const dateStr = format(date, 'yyyy-MM-dd');
                  return activeDates.has(dateStr) ? (
                    <div className="flex justify-center mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                    </div>
                  ) : null;
                }}
              />
            </CardBody>
          </Card>

          {/* Incoming meeting requests */}
          {incomingRequests.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <h2 className="text-base font-semibold text-gray-900">Pending Meeting Requests</h2>
              </CardHeader>
              <CardBody className="space-y-3">
                {incomingRequests.map(m => (
                  <div key={m.id} className="flex items-center justify-between border border-gray-200 rounded-md p-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{m.topic}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        From {getUserName(m.requesterId)} · {format(new Date(m.date), 'MMM d, yyyy')} · {m.startTime}–{m.endTime}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="success" leftIcon={<Check size={14} />} onClick={() => respondToMeeting(m.id, 'accepted')}>
                        Accept
                      </Button>
                      <Button size="sm" variant="outline" leftIcon={<X size={14} />} onClick={() => respondToMeeting(m.id, 'declined')}>
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
        </div>

        {/* Day detail panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">{format(selectedDate, 'EEEE, MMM d')}</h2>
            </CardHeader>
            <CardBody>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">My Availability</h3>
                <button
                  onClick={() => setShowAddSlot(!showAddSlot)}
                  className="text-primary-600 hover:text-primary-700"
                  aria-label="Add availability slot"
                >
                  <Plus size={18} />
                </button>
              </div>

              {showAddSlot && (
                <div className="mb-4 p-3 bg-gray-50 rounded-md space-y-2">
                  <div className="flex gap-2">
                    <Input
                      type="time"
                      value={newSlotTime.start}
                      onChange={e => setNewSlotTime(prev => ({ ...prev, start: e.target.value }))}
                      fullWidth
                    />
                    <Input
                      type="time"
                      value={newSlotTime.end}
                      onChange={e => setNewSlotTime(prev => ({ ...prev, end: e.target.value }))}
                      fullWidth
                    />
                  </div>
                  <Button size="sm" fullWidth onClick={handleAddSlot}>
                    Save Slot
                  </Button>
                </div>
              )}

              {mySlots.length === 0 ? (
                <p className="text-sm text-gray-400">No availability set for this day</p>
              ) : (
                <div className="space-y-2 mb-4">
                  {mySlots.map(slot => (
                    <div key={slot.id} className="flex items-center justify-between text-sm border border-gray-200 rounded-md px-3 py-2">
                      <span className="flex items-center text-gray-700">
                        <Clock size={14} className="mr-2 text-gray-400" />
                        {slot.startTime} – {slot.endTime}
                      </span>
                      <div className="flex items-center gap-2">
                        {slot.isBooked ? (
                          <Badge variant="success" size="sm">Booked</Badge>
                        ) : (
                          <button onClick={() => removeSlot(slot.id)} className="text-gray-400 hover:text-error-500" aria-label="Remove slot">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">Meetings This Day</h3>
                  <button
                    onClick={() => setShowRequestMeeting(!showRequestMeeting)}
                    className="text-primary-600 hover:text-primary-700"
                    aria-label="Request a meeting"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                {showRequestMeeting && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-md space-y-2">
                    <select
                      className="block w-full rounded-md border-gray-300 shadow-sm text-sm focus:border-primary-500 focus:ring-primary-500"
                      value={requestForm.recipientId}
                      onChange={e => setRequestForm(prev => ({ ...prev, recipientId: e.target.value }))}
                    >
                      <option value="">{user.role === 'entrepreneur' ? 'Select investor' : 'Select entrepreneur'}</option>
                      {otherRoleUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                    <Input
                      placeholder="Meeting topic"
                      value={requestForm.topic}
                      onChange={e => setRequestForm(prev => ({ ...prev, topic: e.target.value }))}
                      fullWidth
                    />
                    <div className="flex gap-2">
                      <Input
                        type="time"
                        value={requestForm.startTime}
                        onChange={e => setRequestForm(prev => ({ ...prev, startTime: e.target.value }))}
                        fullWidth
                      />
                      <Input
                        type="time"
                        value={requestForm.endTime}
                        onChange={e => setRequestForm(prev => ({ ...prev, endTime: e.target.value }))}
                        fullWidth
                      />
                    </div>
                    <Button size="sm" fullWidth onClick={handleRequestMeeting}>
                      Send Request
                    </Button>
                  </div>
                )}

                {myMeetingsOnDate.length === 0 ? (
                  <p className="text-sm text-gray-400">No meetings scheduled</p>
                ) : (
                  <div className="space-y-2">
                    {myMeetingsOnDate.map(m => {
                      const otherParty = m.requesterId === user.id ? m.recipientId : m.requesterId;
                      return (
                        <div key={m.id} className="border border-gray-200 rounded-md p-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">{m.topic}</p>
                            <Badge
                              variant={m.status === 'accepted' ? 'success' : m.status === 'pending' ? 'warning' : 'error'}
                              size="sm"
                            >
                              {m.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            With {getUserName(otherParty)} · {m.startTime}–{m.endTime}
                          </p>
                          {m.status !== 'cancelled' && (m.requesterId === user.id || m.status === 'accepted') && (
                            <button
                              onClick={() => cancelMeeting(m.id)}
                              className="text-xs text-error-600 hover:text-error-700 mt-2"
                            >
                              Cancel meeting
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

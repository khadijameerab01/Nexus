import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, MonitorOff,
  MessageCircle, Users, MoreVertical, Maximize2, Signal
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { findUserById } from '../../data/users';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';

type CallStatus = 'connecting' | 'active' | 'ended';

export const VideoCallPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [callStatus, setCallStatus] = useState<CallStatus>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [networkQuality] = useState<'good' | 'fair' | 'poor'>('good');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const partner = userId ? findUserById(userId) : null;

  // Simulate connection after 2 seconds
  useEffect(() => {
    const connectTimer = setTimeout(() => {
      setCallStatus('active');
    }, 2000);
    return () => clearTimeout(connectTimer);
  }, []);

  // Start call duration timer once active
  useEffect(() => {
    if (callStatus === 'active') {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callStatus]);

  // Auto-hide controls after 4 seconds of inactivity
  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, []);

  const resetControlsTimer = () => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      if (callStatus === 'active') setShowControls(false);
    }, 4000);
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleEndCall = () => {
    setCallStatus('ended');
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeout(() => {
      navigate(userId ? `/chat/${userId}` : '/messages');
    }, 2000);
  };

  const handleScreenShare = () => {
    setIsScreenSharing(prev => !prev);
    if (!isScreenSharing) setIsVideoOff(false); // turn on video when screen sharing
  };

  const networkColor = {
    good: 'text-success-500',
    fair: 'text-warning-500',
    poor: 'text-error-500',
  }[networkQuality];

  if (!currentUser || !partner) return null;

  return (
    <div
      className="fixed inset-0 bg-gray-900 flex flex-col"
      onMouseMove={resetControlsTimer}
      onClick={resetControlsTimer}
    >
      {/* Remote video (full screen) */}
      <div className="relative flex-1 overflow-hidden">
        {callStatus === 'connecting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10">
            <div className="relative mb-6">
              <Avatar
                src={partner.avatarUrl}
                alt={partner.name}
                size="xl"
                className="ring-4 ring-primary-500 ring-offset-4 ring-offset-gray-900"
              />
              <span className="absolute inset-0 rounded-full animate-ping bg-primary-400 opacity-30" />
            </div>
            <h2 className="text-white text-2xl font-semibold mb-2">{partner.name}</h2>
            <p className="text-gray-400 text-sm animate-pulse">Connecting...</p>
          </div>
        )}

        {callStatus === 'ended' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10">
            <Avatar src={partner.avatarUrl} alt={partner.name} size="xl" className="mb-4 opacity-50" />
            <h2 className="text-white text-xl font-semibold mb-1">Call ended</h2>
            <p className="text-gray-400 text-sm">Duration: {formatDuration(callDuration)}</p>
            <p className="text-gray-500 text-xs mt-4">Returning to chat...</p>
          </div>
        )}

        {/* Remote video mock */}
        {callStatus === 'active' && (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            {isScreenSharing ? (
              <div className="w-full h-full bg-gray-950 flex items-center justify-center border-2 border-primary-500 border-dashed">
                <div className="text-center">
                  <Monitor size={48} className="text-primary-400 mx-auto mb-3" />
                  <p className="text-white font-medium">You are sharing your screen</p>
                  <p className="text-gray-400 text-sm mt-1">Others can see your screen</p>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Avatar
                  src={partner.avatarUrl}
                  alt={partner.name}
                  size="xl"
                  className="mx-auto mb-3"
                />
                <p className="text-gray-300 text-sm">{partner.name}'s camera</p>
              </div>
            )}
          </div>
        )}

        {/* Top bar */}
        <div className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-semibold">{partner.name}</h2>
              {callStatus === 'active' && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
                  <span className="text-gray-300 text-xs">{formatDuration(callDuration)}</span>
                  <Signal size={12} className={networkColor} />
                  <span className={`text-xs capitalize ${networkColor}`}>{networkQuality}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
                <Maximize2 size={18} />
              </button>
              <button className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
                <MoreVertical size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Self preview (picture-in-picture) */}
        {callStatus === 'active' && (
          <div className="absolute bottom-24 right-4 w-32 h-24 md:w-44 md:h-32 bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700">
            {isVideoOff ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800">
                <Avatar src={currentUser.avatarUrl} alt={currentUser.name} size="sm" />
                <span className="text-gray-400 text-xs mt-1">Camera off</span>
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-900 to-gray-800 flex items-center justify-center">
                <Avatar src={currentUser.avatarUrl} alt={currentUser.name} size="sm" />
              </div>
            )}
            <div className="absolute bottom-1 left-1">
              {isMuted && (
                <span className="bg-error-500 rounded-full p-0.5 flex items-center justify-center">
                  <MicOff size={10} className="text-white" />
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className={`bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 px-4 py-4 transition-opacity duration-300 ${showControls || callStatus !== 'active' ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-center gap-3 md:gap-5">

          {/* Mute */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => setIsMuted(prev => !prev)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isMuted ? 'bg-error-600 hover:bg-error-700' : 'bg-gray-700 hover:bg-gray-600'}`}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff size={20} className="text-white" /> : <Mic size={20} className="text-white" />}
            </button>
            <span className="text-gray-400 text-xs">{isMuted ? 'Unmute' : 'Mute'}</span>
          </div>

          {/* Video */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => setIsVideoOff(prev => !prev)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isVideoOff ? 'bg-error-600 hover:bg-error-700' : 'bg-gray-700 hover:bg-gray-600'}`}
              aria-label={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
            >
              {isVideoOff ? <VideoOff size={20} className="text-white" /> : <Video size={20} className="text-white" />}
            </button>
            <span className="text-gray-400 text-xs">{isVideoOff ? 'Start Video' : 'Stop Video'}</span>
          </div>

          {/* Screen share */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={handleScreenShare}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isScreenSharing ? 'bg-primary-600 hover:bg-primary-700' : 'bg-gray-700 hover:bg-gray-600'}`}
              aria-label={isScreenSharing ? 'Stop sharing' : 'Share screen'}
            >
              {isScreenSharing ? <MonitorOff size={20} className="text-white" /> : <Monitor size={20} className="text-white" />}
            </button>
            <span className="text-gray-400 text-xs">{isScreenSharing ? 'Stop Share' : 'Share Screen'}</span>
          </div>

          {/* End call */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={handleEndCall}
              className="w-14 h-14 rounded-full bg-error-600 hover:bg-error-700 flex items-center justify-center transition-colors shadow-lg"
              aria-label="End call"
            >
              <PhoneOff size={24} className="text-white" />
            </button>
            <span className="text-gray-400 text-xs">End Call</span>
          </div>

          {/* Chat */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => navigate(userId ? `/chat/${userId}` : '/messages')}
              className="w-12 h-12 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
              aria-label="Open chat"
            >
              <MessageCircle size={20} className="text-white" />
            </button>
            <span className="text-gray-400 text-xs">Chat</span>
          </div>

          {/* Participants */}
          <div className="flex flex-col items-center gap-1">
            <button
              className="w-12 h-12 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
              aria-label="Participants"
            >
              <Users size={20} className="text-white" />
            </button>
            <span className="text-gray-400 text-xs">Participants</span>
          </div>

        </div>
      </div>
    </div>
  );
};

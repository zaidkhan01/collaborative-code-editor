import React from 'react';
import { X, Crown, User } from 'lucide-react';
import { Participant } from '../types';

interface ParticipantsPanelProps {
  participants: Participant[];
  onClose: () => void;
}

const ParticipantsPanel: React.FC<ParticipantsPanelProps> = ({ participants, onClose }) => {
  return (
    <div className="w-72 bg-gray-800 border-l border-gray-700 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <h3 className="text-white font-semibold">
          Participants ({participants.length})
        </h3>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {participants.map((participant, index) => (
            <div
              key={participant.user?.id || index}
              className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">
                  {participant.user?.username || 'Unknown User'}
                </p>
                <p className="text-xs text-gray-400">
                  {index === 0 ? (
                    <span className="flex items-center space-x-1">
                      <Crown className="w-3 h-3 text-yellow-500" />
                      <span>Owner</span>
                    </span>
                  ) : (
                    'Member'
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ParticipantsPanel;


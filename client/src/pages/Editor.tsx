import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor, { OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useAuth } from '../context/AuthContext';
import socketService from '../services/socket';
import apiService from '../services/api';
import {
  Play,
  Users,
  MessageSquare,
  Copy,
  Check,
  ChevronLeft,
  Loader,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Room, ChatMessage as ChatMsg, UserCursor, ExecutionResult } from '../types';
import { LANGUAGE_CONFIGS, getRandomColor } from '../utils/helpers';
import ChatPanel from '../components/ChatPanel';
import OutputPanel from '../components/OutputPanel';
import ParticipantsPanel from '../components/ParticipantsPanel';

type editor = monaco.editor.IStandaloneCodeEditor;

const EditorPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [room, setRoom] = useState<Room | null>(null);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [participants, setParticipants] = useState<any[]>([]);
  const [cursors, setCursors] = useState<Map<string, UserCursor>>(new Map());
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [copied, setCopied] = useState(false);

  const editorRef = useRef<editor | null>(null);
  const userColor = useRef(getRandomColor());

  useEffect(() => {
    if (!roomId) return;

    initializeRoom();

    return () => {
      if (roomId) {
        socketService.leaveRoom(roomId);
      }
      cleanupSocketListeners();
    };
  }, [roomId]);

  const initializeRoom = async () => {
    try {
      // Fetch room data
      const response = await apiService.getRoom(roomId!);
      setRoom(response.room);
      setCode(response.room.code);

      // Connect socket and join room
      const token = localStorage.getItem('token');
      if (token) {
        socketService.connect(token);
        socketService.joinRoom(roomId!);
      }

      setupSocketListeners();
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load room:', error);
      toast.error('Failed to load room');
      navigate('/dashboard');
    }
  };

  const setupSocketListeners = () => {
    // Room joined
    socketService.onRoomJoined((data) => {
      setRoom(data.room);
      setCode(data.room.code);
      setParticipants(data.room.participants);
      
      // Set initial cursors
      const cursorMap = new Map();
      Object.entries(data.cursors || {}).forEach(([userId, position]: [string, any]) => {
        cursorMap.set(userId, {
          userId,
          username: position.username,
          position: position.position,
          color: getRandomColor(),
        });
      });
      setCursors(cursorMap);
    });

    // User joined
    socketService.onUserJoined((data) => {
      setParticipants(data.participants);
      toast.success(`${data.user.username} joined the room`);
    });

    // User left
    socketService.onUserLeft((data) => {
      setParticipants(data.participants);
      const newCursors = new Map(cursors);
      newCursors.delete(data.userId);
      setCursors(newCursors);
    });

    // Code update
    socketService.onCodeUpdate((data) => {
      setCode(data.code);
    });

    // Cursor update
    socketService.onCursorUpdate((data) => {
      setCursors((prev) => {
        const newCursors = new Map(prev);
        newCursors.set(data.userId, {
          userId: data.userId,
          username: data.username,
          position: data.position,
          color: prev.get(data.userId)?.color || getRandomColor(),
        });
        return newCursors;
      });
    });

    // Language changed
    socketService.onLanguageChanged((data) => {
      if (room) {
        setRoom({ ...room, language: data.language });
        toast.success(`Language changed to ${LANGUAGE_CONFIGS[data.language as keyof typeof LANGUAGE_CONFIGS]?.name}`);
      }
    });

    // Code execution
    socketService.onExecutionResult((result) => {
      setExecutionResult(result);
      setIsExecuting(false);
      setShowOutput(true);
    });

    // Chat
    socketService.onChatMessage((message) => {
      setMessages((prev) => [...prev, message]);
    });
  };

  const cleanupSocketListeners = () => {
    socketService.offCodeUpdate();
    socketService.offCursorUpdate();
    socketService.offLanguageChanged();
    socketService.offExecutionResult();
    socketService.offChatMessage();
    socketService.offRoomEvents();
  };

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Handle code changes
    editor.onDidChangeModelContent(() => {
      const newCode = editor.getValue();
      setCode(newCode);
      socketService.sendCodeChange(roomId!, newCode, {});
    });

    // Handle cursor position changes
    editor.onDidChangeCursorPosition((e) => {
      socketService.sendCursorMove(roomId!, {
        lineNumber: e.position.lineNumber,
        column: e.position.column,
      });
    });
  };

  const handleLanguageChange = (language: string) => {
    socketService.sendLanguageChange(roomId!, language);
  };

  const handleExecuteCode = () => {
    setIsExecuting(true);
    socketService.executeCode(roomId!, code, room!.language);
  };

  const handleCopyInviteLink = () => {
    const link = `${window.location.origin}/editor/${roomId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Invite link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-white">{room?.name}</h1>
            <select
              value={room?.language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="px-3 py-1 bg-gray-700 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={room?.owner.id !== user?.id}
            >
              {Object.entries(LANGUAGE_CONFIGS).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExecuteCode}
              disabled={isExecuting}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition"
            >
              <Play className="w-4 h-4" />
              <span>{isExecuting ? 'Running...' : 'Run Code'}</span>
            </button>

            <button
              onClick={handleCopyInviteLink}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
              title="Copy invite link"
            >
              {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className="flex items-center space-x-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
            >
              <Users className="w-5 h-5" />
              <span className="text-sm">{participants.length}</span>
            </button>

            <button
              onClick={() => setShowChat(!showChat)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
              title="Toggle chat"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor + Output (vertical stack) */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Editor */}
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={LANGUAGE_CONFIGS[room?.language as keyof typeof LANGUAGE_CONFIGS]?.monacoLanguage || 'javascript'}
              value={code}
              onMount={handleEditorMount}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                automaticLayout: true,
                tabSize: 2,
                renderWhitespace: 'selection',
                cursorStyle: 'line',
                lineNumbers: 'on',
                folding: true,
                glyphMargin: true,
                lineDecorationsWidth: 10,
              }}
            />
          </div>

          {/* Output Panel - Bottom */}
          {showOutput && executionResult && (
            <OutputPanel
              result={executionResult}
              onClose={() => setShowOutput(false)}
            />
          )}
        </div>

        {/* Chat Panel */}
        {showChat && (
          <ChatPanel
            roomId={roomId!}
            messages={messages}
            onClose={() => setShowChat(false)}
          />
        )}

        {/* Participants Panel */}
        {showParticipants && (
          <ParticipantsPanel
            participants={participants}
            onClose={() => setShowParticipants(false)}
          />
        )}
      </div>
    </div>
  );
};

export default EditorPage;


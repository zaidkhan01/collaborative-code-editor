import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import {
  Code2,
  Plus,
  LogOut,
  Loader,
  Trash2,
  Users,
  Clock,
  FolderOpen
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Room } from '../types';
import { formatDate, LANGUAGE_CONFIGS } from '../utils/helpers';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomLanguage, setNewRoomLanguage] = useState('javascript');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const data = await apiService.getRooms();
      setRooms(data.rooms);
    } catch (error) {
      toast.error('Failed to load rooms');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    setIsCreating(true);
    try {
      const data = await apiService.createRoom(newRoomName, newRoomLanguage);
      toast.success('Room created!');
      setShowCreateModal(false);
      setNewRoomName('');
      navigate(`/editor/${data.room.roomId}`);
    } catch (error) {
      toast.error('Failed to create room');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteRoom = async (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this room?')) return;

    try {
      await apiService.deleteRoom(roomId);
      setRooms(rooms.filter(r => r.roomId !== roomId));
      toast.success('Room deleted');
    } catch (error) {
      toast.error('Failed to delete room');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Code Editor</h1>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-gray-300">Hello, {user?.username}</span>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Actions */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">Your Rooms</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            <span>Create Room</span>
          </button>
        </div>

        {/* Rooms Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-20">
            <FolderOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No rooms yet</h3>
            <p className="text-gray-500 mb-6">Create your first room to start coding</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              <Plus className="w-5 h-5" />
              <span>Create Room</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <div
                key={room.roomId}
                onClick={() => navigate(`/editor/${room.roomId}`)}
                className="bg-gray-800 rounded-xl p-6 cursor-pointer hover:bg-gray-750 transition border border-gray-700 hover:border-gray-600 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{room.name}</h3>
                    <span className="inline-block px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                      {LANGUAGE_CONFIGS[room.language as keyof typeof LANGUAGE_CONFIGS]?.name || room.language}
                    </span>
                  </div>
                  {room.owner.id === user?.id && (
                    <button
                      onClick={(e) => handleDeleteRoom(room.roomId, e)}
                      className="p-2 text-gray-500 hover:text-red-500 hover:bg-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{room.participants?.length || 0}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatDate(room.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-white mb-6">Create New Room</h2>
            <form onSubmit={handleCreateRoom}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Room Name
                  </label>
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    placeholder="My Awesome Project"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Language
                  </label>
                  <select
                    value={newRoomLanguage}
                    onChange={(e) => setNewRoomLanguage(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    {Object.entries(LANGUAGE_CONFIGS).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition flex items-center justify-center"
                >
                  {isCreating ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    'Create'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;


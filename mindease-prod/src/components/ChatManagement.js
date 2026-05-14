import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaSearch, FaTrash, FaFilter, FaUser, FaComments, FaCalendar, FaExclamationTriangle } from 'react-icons/fa';
import toast from 'react-hot-toast';

const ChatManagement = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    groupId: '',
    userId: '',
    startDate: '',
    endDate: '',
    keyword: ''
  });
  const [groups, setGroups] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);

  useEffect(() => {
    fetchGroups();
    fetchChats();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/admin/groups', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setGroups(data.data);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const fetchChats = async () => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(`/api/admin/chats?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setChats(data.data);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      toast.error('Failed to fetch chats');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applyFilters = () => {
    setLoading(true);
    fetchChats();
  };

  const clearFilters = () => {
    setFilters({
      groupId: '',
      userId: '',
      startDate: '',
      endDate: '',
      keyword: ''
    });
    setLoading(true);
    fetchChats();
  };

  const handleDeleteChat = async (chatId) => {
    if (window.confirm('Are you sure you want to delete this chat message? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/admin/chats/${chatId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
          }
        });

        if (response.ok) {
          toast.success('Chat message deleted successfully');
          fetchChats();
        }
      } catch (error) {
        console.error('Error deleting chat:', error);
        toast.error('Failed to delete chat message');
      }
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.groupId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Chat Management
          </h1>
          <div className="text-sm text-gray-400">
            {filteredChats.length} messages found
          </div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <FaFilter className="text-purple-400" />
            <h2 className="text-xl font-semibold">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Group</label>
              <select
                value={filters.groupId}
                onChange={(e) => handleFilterChange('groupId', e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Groups</option>
                {groups.map(group => (
                  <option key={group._id} value={group._id}>{group.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">User ID</label>
              <input
                type="text"
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
                placeholder="Enter User ID"
                className="w-full px-4 py-2 bg-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Keyword</label>
              <input
                type="text"
                value={filters.keyword}
                onChange={(e) => handleFilterChange('keyword', e.target.value)}
                placeholder="Search in messages"
                className="w-full px-4 py-2 bg-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={applyFilters}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
              >
                Apply Filters
              </button>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-slate-600 rounded-lg hover:bg-slate-500 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search messages, users, or groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Chat Messages */}
        <div className="space-y-4">
          {filteredChats.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <FaComments className="text-6xl text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No chat messages found</p>
              <p className="text-gray-500">Try adjusting your filters or search terms</p>
            </motion.div>
          ) : (
            filteredChats.map((chat) => (
              <motion.div
                key={chat._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 hover:bg-slate-800/70 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <FaUser className="text-white text-sm" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-purple-400">
                          {chat.userId?.name || 'Unknown User'}
                        </span>
                        <span className="text-xs text-gray-400">
                          in {chat.groupId?.name || 'Unknown Group'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <FaCalendar />
                        <span>{formatDate(chat.timestamp)}</span>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-3 max-w-2xl">
                        <p className="text-white">{chat.message}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteChat(chat._id)}
                    className="text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-red-500/10 rounded-lg"
                    title="Delete message"
                  >
                    <FaTrash />
                  </button>
                </div>

                {/* Message Type Indicator */}
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className={`px-2 py-1 rounded-full ${
                    chat.type === 'text' ? 'bg-blue-500/20 text-blue-400' :
                    chat.type === 'image' ? 'bg-green-500/20 text-green-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {chat.type || 'text'}
                  </span>
                  {chat.flagged && (
                    <div className="flex items-center gap-1 text-yellow-400">
                      <FaExclamationTriangle />
                      <span>Flagged</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Chat Details Modal */}
        {selectedChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-slate-800 rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold mb-4">Chat Details</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">User</label>
                  <p className="text-white bg-slate-700 px-3 py-2 rounded-lg">
                    {selectedChat.userId?.name} ({selectedChat.userId?.email})
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Group</label>
                  <p className="text-white bg-slate-700 px-3 py-2 rounded-lg">
                    {selectedChat.groupId?.name}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <p className="text-white bg-slate-700 px-3 py-2 rounded-lg min-h-[60px]">
                    {selectedChat.message}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Timestamp</label>
                  <p className="text-white bg-slate-700 px-3 py-2 rounded-lg">
                    {formatDate(selectedChat.timestamp)}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => handleDeleteChat(selectedChat._id)}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Message
                </button>
                <button
                  onClick={() => setSelectedChat(null)}
                  className="flex-1 bg-slate-600 px-4 py-2 rounded-lg hover:bg-slate-500 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ChatManagement;

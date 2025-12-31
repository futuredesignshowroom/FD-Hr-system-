'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';

interface Conversation {
  id: string;
  type: 'private' | 'group';
  name: string;
  participants: string[];
  lastMessage?: {
    content: string;
    senderName: string;
    createdAt: Date;
  };
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: Date;
}

export default function EmployeeMessagesPage() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [chatType, setChatType] = useState<'private' | 'group'>('private');
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Mock data - in real app, this would come from API
  const mockUsers = [
    { id: '1', name: 'Ali Ahmed' },
    { id: '2', name: 'Sara Khan' },
    { id: '3', name: 'Ahmed Hassan' },
    { id: '4', name: 'Admin' },
  ];

  useEffect(() => {
    // Load conversations
    const mockConversations: Conversation[] = [
      {
        id: '1',
        type: 'private',
        name: 'Ali Ahmed',
        participants: ['user1', 'user2'],
        lastMessage: {
          content: 'Hello, how are you?',
          senderName: 'Ali Ahmed',
          createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        },
      },
      {
        id: '2',
        type: 'group',
        name: 'HR Team',
        participants: ['user1', 'user2', 'user3'],
        lastMessage: {
          content: 'Meeting at 3 PM today',
          senderName: 'Sara Khan',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        },
      },
    ];
    setConversations(mockConversations);
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      senderId: user?.id || 'current',
      senderName: user?.name || 'You',
      content: newMessage,
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const handleStartNewChat = () => {
    if (chatType === 'private' && selectedUsers.length === 1) {
      const selectedUser = mockUsers.find(u => u.id === selectedUsers[0]);
      if (selectedUser) {
        const newConversation: Conversation = {
          id: Date.now().toString(),
          type: 'private',
          name: selectedUser.name,
          participants: [user?.id || 'current', selectedUsers[0]],
        };
        setConversations(prev => [newConversation, ...prev]);
        setSelectedConversation(newConversation);
        setMessages([]);
      }
    } else if (chatType === 'group' && groupName && selectedUsers.length > 0) {
      const newConversation: Conversation = {
        id: Date.now().toString(),
        type: 'group',
        name: groupName,
        participants: [user?.id || 'current', ...selectedUsers],
      };
      setConversations(prev => [newConversation, ...prev]);
      setSelectedConversation(newConversation);
      setMessages([]);
    }
    setShowNewChat(false);
    setSelectedUsers([]);
    setGroupName('');
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Messages</h1>
        <button
          onClick={() => setShowNewChat(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          New Chat
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Conversations Sidebar */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b font-bold">Conversations</div>
          <div className="divide-y max-h-96 overflow-y-auto">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation)}
                className={`p-4 hover:bg-gray-50 cursor-pointer ${
                  selectedConversation?.id === conversation.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center space-x-2">
                  <p className="font-semibold">{conversation.name}</p>
                  {conversation.type === 'group' && (
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">Group</span>
                  )}
                </div>
                {conversation.lastMessage && (
                  <p className="text-sm text-gray-500 truncate">
                    {conversation.lastMessage.senderName}: {conversation.lastMessage.content}
                  </p>
                )}
                <p className="text-xs text-gray-400">
                  {conversation.lastMessage?.createdAt.toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-3 bg-white rounded-lg shadow flex flex-col">
          {selectedConversation ? (
            <>
              <div className="p-4 border-b font-bold flex items-center justify-between">
                <span>{selectedConversation.name}</span>
                {selectedConversation.type === 'group' && (
                  <span className="text-sm text-gray-500">
                    {selectedConversation.participants.length} members
                  </span>
                )}
              </div>
              <div className="flex-1 p-4 overflow-y-auto max-h-96">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.senderId === user?.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`rounded-lg p-3 max-w-xs lg:max-w-md ${
                          message.senderId === user?.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200'
                        }`}
                      >
                        {selectedConversation.type === 'group' && message.senderId !== user?.id && (
                          <p className="text-xs font-semibold mb-1">{message.senderName}</p>
                        )}
                        <p>{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.createdAt.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 border-t">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 border border-gray-300 rounded px-3 py-2"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Send
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a conversation to start chatting
            </div>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Start New Chat</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Chat Type</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="private"
                    checked={chatType === 'private'}
                    onChange={(e) => setChatType(e.target.value as 'private')}
                    className="mr-2"
                  />
                  Private Chat
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="group"
                    checked={chatType === 'group'}
                    onChange={(e) => setChatType(e.target.value as 'group')}
                    className="mr-2"
                  />
                  Group Chat
                </label>
              </div>
            </div>

            {chatType === 'group' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Group Name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                {chatType === 'private' ? 'Select User' : 'Select Participants'}
              </label>
              <div className="max-h-40 overflow-y-auto border border-gray-300 rounded p-2">
                {mockUsers.filter(u => u.id !== user?.id).map((user) => (
                  <label key={user.id} className="flex items-center py-1">
                    <input
                      type={chatType === 'private' ? 'radio' : 'checkbox'}
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => {
                        if (chatType === 'private') {
                          setSelectedUsers([user.id]);
                        } else {
                          toggleUserSelection(user.id);
                        }
                      }}
                      className="mr-2"
                    />
                    {user.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setShowNewChat(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleStartNewChat}
                disabled={
                  (chatType === 'private' && selectedUsers.length !== 1) ||
                  (chatType === 'group' && (!groupName || selectedUsers.length === 0))
                }
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                Start Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

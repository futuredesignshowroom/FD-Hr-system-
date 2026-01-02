'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { MessageService } from '@/services/message.service';
import { Message } from '@/types/message';
import { EmployeeService } from '@/services/employee.service';
import { Employee } from '@/types/employee';
import { useAuthStore } from '@/store/auth.store';

interface Conversation {
  id: string;
  type: 'private' | 'group';
  name: string;
  participants: string[];
  avatar?: string;
  isOnline?: boolean;
  lastMessage?: {
    content: string;
    senderName: string;
    createdAt: Date;
    isRead: boolean;
  };
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  messageType: 'text' | 'system';
}

export default function AdminMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [chatType, setChatType] = useState<'private' | 'group'>('private');
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [users, setUsers] = useState<Employee[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  const loadUsersAndConversations = useCallback(async () => {
    if (!user) return;

    try {
      // Load all employees for messaging
      const allUsers = await EmployeeService.getAllEmployees();
      setUsers(allUsers);
      // Conversations will be built from real-time messages via subscription below
    } catch (error) {
      console.error('Error loading users and conversations:', error);
    }
  }, [user]);

  useEffect(() => {
    loadUsersAndConversations();
  }, [loadUsersAndConversations]);

  // Real-time subscription to user's messages -> build conversations map
  useEffect(() => {
    if (!user || users.length === 0) return;
    const unsubscribe = MessageService.subscribeToUserMessages(user.id, (userMessages) => {
      const conversationMap = new Map<string, Conversation>();

      userMessages.forEach((message) => {
        const otherUserId = message.senderId === user.id ? message.recipientId : message.senderId;
        const otherUser = users.find(u => u.userId === otherUserId);

        if (otherUser) {
          const existing = conversationMap.get(otherUserId);
          const lastMessage = {
            content: message.content,
            senderName: message.senderId === user.id ? 'You' : `${otherUser.firstName} ${otherUser.lastName}`,
            createdAt: message.createdAt,
            isRead: message.isRead || false,
          };

          if (!existing) {
            conversationMap.set(otherUserId, {
              id: otherUserId,
              type: 'private',
              name: `${otherUser.firstName} ${otherUser.lastName}`,
              participants: [user.id, otherUserId],
              avatar: otherUser.avatar || `https://via.placeholder.com/40/${otherUser.firstName.charAt(0)}${otherUser.lastName.charAt(0)}`,
              isOnline: false,
              lastMessage,
            });
          } else {
            // update lastMessage if newer
            if (existing.lastMessage && existing.lastMessage.createdAt < lastMessage.createdAt) {
              existing.lastMessage = lastMessage;
              conversationMap.set(otherUserId, existing);
            }
          }
        }
      });

      const convs = Array.from(conversationMap.values()).sort((a,b) => {
        const ta = a.lastMessage?.createdAt?.getTime() || 0;
        const tb = b.lastMessage?.createdAt?.getTime() || 0;
        return tb - ta;
      });
      setConversations(convs);
    }, (err) => console.error('Message subscription error:', err));

    return () => unsubscribe();
  }, [user, users]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !user) return;

    const msg: Message = {
      id: '',
      senderId: user.id,
      senderName: user.name || 'Admin',
      recipientId: selectedConversation.id,
      recipientName: selectedConversation.name,
      subject: '',
      content: newMessage.trim(),
      isRead: false,
      attachments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Optimistic UI push
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      senderId: msg.senderId,
      senderName: msg.senderName,
      content: msg.content,
      createdAt: msg.createdAt,
      status: 'sending',
      messageType: 'text',
    }]);

    setNewMessage('');

    // Persist
    MessageService.sendMessage(msg).catch((err) => {
      console.error('Failed to send message:', err);
      // Optionally show error to user
    });
  };

  // Subscribe to selected conversation messages
  useEffect(() => {
    if (!selectedConversation || !user) return;
    const otherId = selectedConversation.id;
    const unsubscribe = MessageService.subscribeToConversation(user.id, otherId, (msgs) => {
      const chatMsgs: ChatMessage[] = msgs.map(m => ({
        id: m.id,
        senderId: m.senderId,
        senderName: m.senderName || (m.senderId === user.id ? 'You' : selectedConversation.name),
        content: m.content,
        createdAt: m.createdAt,
        status: 'sent',
        messageType: 'text',
      }));
      setMessages(chatMsgs);
    }, (err) => console.error('Conversation subscription error:', err));

    return () => unsubscribe();
  }, [selectedConversation, user]);

  const handleStartNewChat = () => {
    if (chatType === 'private' && selectedUsers.length === 1) {
      const selectedUser = users.find(u => u.userId === selectedUsers[0]);
      if (selectedUser) {
        const newConversation: Conversation = {
          id: selectedUsers[0],
          type: 'private',
          name: `${selectedUser.firstName} ${selectedUser.lastName}`,
          participants: [user?.id || '', selectedUsers[0]],
          avatar: selectedUser.avatar || `https://via.placeholder.com/40/${selectedUser.firstName.charAt(0)}${selectedUser.lastName.charAt(0)}`,
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
        participants: ['admin', ...selectedUsers],
        avatar: 'https://via.placeholder.com/40',
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

  const formatMessageTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'sending': return '🕐';
      case 'sent': return '✓';
      case 'delivered': return '✓✓';
      case 'read': return '✓✓';
      default: return '';
    }
  };

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Conversations Sidebar */}
      <div className="w-full lg:w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 bg-green-600 text-white flex items-center justify-between">
          <h1 className="text-xl font-semibold">Chats</h1>
          <button
            onClick={() => setShowNewChat(true)}
            className="p-2 hover:bg-green-700 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => setSelectedConversation(conversation)}
              className={`p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                selectedConversation?.id === conversation.id ? 'bg-green-50 border-l-4 border-l-green-600' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Image
                    src={conversation.avatar || 'https://via.placeholder.com/40'}
                    alt={conversation.name}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full"
                  />
                  {conversation.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 truncate">{conversation.name}</h3>
                    {conversation.lastMessage && (
                      <span className="text-xs text-gray-500">
                        {formatMessageTime(conversation.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  {conversation.lastMessage && (
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.type === 'group' && conversation.lastMessage.senderName !== 'Admin' && (
                          <span className="font-medium">{conversation.lastMessage.senderName}: </span>
                        )}
                        {conversation.lastMessage.content}
                      </p>
                      {!conversation.lastMessage.isRead && (
                        <div className="w-2 h-2 bg-green-600 rounded-full ml-2"></div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Image
                  src={selectedConversation.avatar || 'https://via.placeholder.com/40'}
                  alt={selectedConversation.name}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <h2 className="font-semibold text-gray-900">{selectedConversation.name}</h2>
                  <p className="text-sm text-gray-500">
                    {selectedConversation.type === 'group'
                      ? `${selectedConversation.participants.length} members`
                      : selectedConversation.isOnline ? 'online' : 'offline'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 bg-opacity-50">
              <div className="space-y-2">
                {messages.map((message, index) => {
                  const isCurrentUser = message.senderId === 'admin';
                  const showAvatar = !isCurrentUser && (
                    index === 0 ||
                    messages[index - 1].senderId !== message.senderId
                  );

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}
                    >
                      {!isCurrentUser && (
                        <div className="w-8 flex-shrink-0">
                          {showAvatar && (
                            <Image
                              src={selectedConversation.avatar || 'https://via.placeholder.com/32'}
                              alt={message.senderName}
                              width={32}
                              height={32}
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                        </div>
                      )}

                      <div className={`max-w-xs lg:max-w-md ${isCurrentUser ? 'ml-auto' : 'mr-auto'}`}>
                        {!isCurrentUser && showAvatar && (
                          <p className="text-xs text-gray-500 mb-1 px-3">{message.senderName}</p>
                        )}

                        <div
                          className={`relative px-4 py-2 rounded-2xl shadow-sm ${
                            isCurrentUser
                              ? 'bg-green-600 text-white ml-auto'
                              : 'bg-white text-gray-900'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>

                          <div className={`flex items-center justify-end mt-1 space-x-1 ${
                            isCurrentUser ? 'text-green-200' : 'text-gray-400'
                          }`}>
                            <span className="text-xs">
                              {message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isCurrentUser && (
                              <span className="text-xs">{getMessageStatusIcon(message.status)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zM9 7a1 1 0 11-2 0 1 1 0 012 0zM7 11a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-3 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.409l-7-14z" />
                  </svg>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Messages</h3>
              <p className="text-gray-500">Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold">New Chat</h2>
            </div>

            <div className="p-4">
              <div className="flex space-x-4 mb-4">
                <button
                  onClick={() => setChatType('private')}
                  className={`flex-1 py-2 px-4 rounded-lg border ${
                    chatType === 'private'
                      ? 'bg-green-600 text-white border-green-600'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Private
                </button>
                <button
                  onClick={() => setChatType('group')}
                  className={`flex-1 py-2 px-4 rounded-lg border ${
                    chatType === 'group'
                      ? 'bg-green-600 text-white border-green-600'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Group
                </button>
              </div>

              {chatType === 'group' && (
                <div className="mb-4">
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Group name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              )}

              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  {chatType === 'private' ? 'Select an employee' : 'Select employees'}
                </p>
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                  {users.filter(u => u.userId !== user?.id).map((user) => (
                    <label key={user.id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer">
                      <input
                        type={chatType === 'private' ? 'radio' : 'checkbox'}
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="mr-3 text-green-600 focus:ring-green-500"
                      />
                      <Image
                        src={user.avatar || `https://via.placeholder.com/40/${user.firstName.charAt(0)}${user.lastName.charAt(0)}`}
                        alt={user.firstName}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full mr-3"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex space-x-3">
              <button
                onClick={() => setShowNewChat(false)}
                className="flex-1 py-2 px-4 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartNewChat}
                disabled={
                  (chatType === 'private' && selectedUsers.length !== 1) ||
                  (chatType === 'group' && (!groupName || selectedUsers.length === 0))
                }
                className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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

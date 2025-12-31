export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  subject: string;
  content: string;
  isRead: boolean;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  participantNames: string[];
  type: 'private' | 'group';
  name?: string; // For group chats
  lastMessage?: ChatMessage;
  updatedAt: Date;
  createdBy?: string; // User who created the group
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  isRead: boolean;
  readBy: string[]; // Array of user IDs who have read the message
  createdAt: Date;
  messageType: 'text' | 'system'; // System messages for group events
}

export interface GroupChat {
  id: string;
  name: string;
  description?: string;
  participants: string[]; // User IDs
  admins: string[]; // User IDs who can manage the group
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

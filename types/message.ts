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
  lastMessage?: Message;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
}

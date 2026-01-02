// services/message.service.ts - Messaging Service

import { where, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FirestoreDB } from '@/lib/firestore';
import { Message } from '@/types/message';
import { NotificationService } from './notification.service';

export class MessageService {
  private static readonly MESSAGES_COLLECTION = 'messages';

  /**
   * Send a message
   */
  static async sendMessage(message: Message): Promise<void> {
    try {
      await FirestoreDB.addDocument(this.MESSAGES_COLLECTION, message);

      // Create notification for recipient
      try {
        await NotificationService.createNotification({
          userId: message.recipientId,
          title: 'New Message',
          message: `You have a new message from ${message.senderName}`,
          type: 'system',
          isRead: false,
          data: {
            type: 'new_message',
            senderId: message.senderId,
            senderName: message.senderName,
            messageId: message.id,
            content: message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''),
          },
        });
      } catch (notificationError) {
        console.error('Error creating message notification:', notificationError);
        // Don't fail message sending if notification fails
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Get messages for a user (sent and received)
   */
  static async getUserMessages(userId: string): Promise<Message[]> {
    try {
      const sentMessages = await FirestoreDB.queryCollection<Message>(
        this.MESSAGES_COLLECTION,
        [where('senderId', '==', userId)]
      );
      const receivedMessages = await FirestoreDB.queryCollection<Message>(
        this.MESSAGES_COLLECTION,
        [where('recipientId', '==', userId)]
      );
      return [...sentMessages, ...receivedMessages];
    } catch (error) {
      console.error('Error getting user messages:', error);
      // Return empty array instead of throwing
      return [];
    }
  }

  /**
   * Get conversation between two users
   */
  static async getConversation(
    userId1: string,
    userId2: string
  ): Promise<Message[]> {
    try {
      const allMessages = await this.getUserMessages(userId1);
      return allMessages.filter(
        (msg) =>
          (msg.senderId === userId1 && msg.recipientId === userId2) ||
          (msg.senderId === userId2 && msg.recipientId === userId1)
      );
    } catch (error) {
      console.error('Error getting conversation:', error);
      throw error;
    }
  }

  /**
   * Mark message as read
   */
  static async markMessageAsRead(messageId: string): Promise<void> {
    try {
      await FirestoreDB.updateDocument(
        this.MESSAGES_COLLECTION,
        messageId,
        { isRead: true }
      );
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  /**
   * Get unread messages for a user
   */
  static async getUnreadMessages(userId: string): Promise<Message[]> {
    try {
      const messages = await FirestoreDB.queryCollection<Message>(
        this.MESSAGES_COLLECTION,
        [where('recipientId', '==', userId)]
      );
      return messages.filter((msg) => !msg.isRead);
    } catch (error) {
      console.error('Error getting unread messages:', error);
      throw error;
    }
  }

  /**
   * Delete message
   */
  static async deleteMessage(messageId: string): Promise<void> {
    try {
      await FirestoreDB.deleteDocument(this.MESSAGES_COLLECTION, messageId);
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  /**
   * Subscribe to messages for a user (real-time).
   * Returns an unsubscribe function.
   */
  static subscribeToUserMessages(
    userId: string,
    callback: (messages: Message[]) => void,
    onError?: (error: any) => void
  ): () => void {
    if (!db) {
      console.error('Firebase not initialized');
      return () => {};
    }

    try {
      const q = query(collection(db, this.MESSAGES_COLLECTION), orderBy('createdAt', 'desc'), limit(200));
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const all = querySnapshot.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() })) as Message[];
          const filtered = all.filter(m => m.senderId === userId || m.recipientId === userId);
          callback(filtered);
        },
        (error) => {
          console.error('Error subscribing to user messages:', error);
          if (onError) onError(error);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up message subscription:', error);
      if (onError) onError(error);
      return () => {};
    }
  }

  /**
   * Subscribe to messages between two users (conversation) in real-time.
   */
  static subscribeToConversation(
    userId1: string,
    userId2: string,
    callback: (messages: Message[]) => void,
    onError?: (error: any) => void
  ): () => void {
    if (!db) {
      console.error('Firebase not initialized');
      return () => {};
    }

    try {
      const q = query(collection(db, this.MESSAGES_COLLECTION), orderBy('createdAt', 'asc'), limit(500));
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const all = querySnapshot.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() })) as Message[];
          const convo = all.filter(m =>
            (m.senderId === userId1 && m.recipientId === userId2) ||
            (m.senderId === userId2 && m.recipientId === userId1)
          );
          callback(convo.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
        },
        (error) => {
          console.error('Error subscribing to conversation:', error);
          if (onError) onError(error);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up conversation subscription:', error);
      if (onError) onError(error);
      return () => {};
    }
  }
}

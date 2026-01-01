// services/message.service.ts - Messaging Service

import { where } from 'firebase/firestore';
import { FirestoreDB } from '@/lib/firestore';
import { Message } from '@/types/message';

export class MessageService {
  private static readonly MESSAGES_COLLECTION = 'messages';

  /**
   * Send a message
   */
  static async sendMessage(message: Message): Promise<void> {
    try {
      await FirestoreDB.addDocument(this.MESSAGES_COLLECTION, message);
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
}

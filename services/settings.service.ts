// services/settings.service.ts - Admin Settings Service

import { FirestoreDB } from '@/lib/firestore';

export interface AdminSettings {
  id: string;
  currency: string;
  companyName: string;
  workingDays: number;
  casualLeaves: number;
  sickLeaves: number;
  earnedLeaves: number;
  updatedAt: Date;
  updatedBy: string;
}

export class SettingsService {
  private static readonly COLLECTION = 'settings';
  private static readonly SETTINGS_ID = 'admin_settings';

  /**
   * Get admin settings
   */
  static async getSettings(): Promise<AdminSettings | null> {
    try {
      const settings = await FirestoreDB.getDocument<AdminSettings>(this.COLLECTION, this.SETTINGS_ID);
      return settings || null;
    } catch (error) {
      console.error('Error getting settings:', error);
      return null;
    }
  }

  /**
   * Save admin settings
   */
  static async saveSettings(settings: Omit<AdminSettings, 'id' | 'updatedAt'>): Promise<void> {
    try {
      const settingsData: AdminSettings = {
        id: this.SETTINGS_ID,
        ...settings,
        updatedAt: new Date(),
      };

      await FirestoreDB.addDocument(this.COLLECTION, settingsData, this.SETTINGS_ID);
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  /**
   * Initialize default settings if not exist
   */
  static async initializeDefaultSettings(): Promise<void> {
    try {
      const existingSettings = await this.getSettings();
      if (!existingSettings) {
        const defaultSettings: Omit<AdminSettings, 'id' | 'updatedAt'> = {
          currency: 'PKR',
          companyName: 'Your Company',
          workingDays: 26,
          casualLeaves: 12,
          sickLeaves: 12,
          earnedLeaves: 30,
          updatedBy: 'system',
        };

        await this.saveSettings(defaultSettings);
        console.log('Default admin settings initialized');
      }
    } catch (error) {
      console.error('Error initializing default settings:', error);
      throw error;
    }
  }
}
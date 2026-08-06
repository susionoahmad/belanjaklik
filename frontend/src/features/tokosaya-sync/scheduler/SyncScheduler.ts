import type { SyncStatus } from '../../shared/types';

export class SyncScheduler {
  static INTERVAL_ACTIVE_HOURS = 24; // Existing synced product -> 24 hours
  static INTERVAL_FAILED_HOURS = 6;   // Failed product -> 6 hours

  /**
   * Calculates the next sync timestamp based on current sync status.
   */
  static calculateNextSyncAt(status: SyncStatus): string {
    const now = new Date();
    let hoursToAdd = this.INTERVAL_ACTIVE_HOURS;

    if (status === 'failed') {
      hoursToAdd = this.INTERVAL_FAILED_HOURS;
    }

    now.setHours(now.getHours() + hoursToAdd);
    return now.toISOString();
  }

  /**
   * Checks if a product source is due for synchronization.
   */
  static isDueForSync(nextSyncedAt?: string): boolean {
    if (!nextSyncedAt) return true;
    return new Date(nextSyncedAt).getTime() <= Date.now();
  }
}

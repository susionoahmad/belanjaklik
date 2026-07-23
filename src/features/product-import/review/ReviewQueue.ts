import type { ReviewItem } from '../types';

export class ReviewQueueManager {
  private queue: ReviewItem[] = [];

  setQueue(items: ReviewItem[]): void {
    this.queue = items;
  }

  getQueue(): ReviewItem[] {
    return this.queue;
  }

  updateItemAction(itemId: string, action: ReviewItem['action'], editedData?: any): void {
    const item = this.queue.find(i => i.id === itemId);
    if (item) {
      item.action = action;
      if (editedData) {
        item.editedData = { ...item.editedData, ...editedData };
      }
    }
  }

  approveAllAccepted(): ReviewItem[] {
    return this.queue.filter(i => i.action !== 'IGNORE');
  }
}

export const reviewQueueManager = new ReviewQueueManager();

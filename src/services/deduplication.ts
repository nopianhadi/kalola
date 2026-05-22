/**
 * Deduplication Service
 * Mencegah duplicate entries dari realtime updates
 */

export class DeduplicationService<T extends { id: string | number }> {
  private processedIds = new Set<string>();
  private readonly maxSize = 1000; // Limit size to prevent memory leak
  
  /**
   * Check if item has been processed recently
   */
  isProcessed(id: string | number): boolean {
    return this.processedIds.has(String(id));
  }
  
  /**
   * Mark item as processed
   */
  markProcessed(id: string | number): void {
    // If set is too large, clear oldest entries (FIFO)
    if (this.processedIds.size >= this.maxSize) {
      const firstId = this.processedIds.values().next().value;
      if (firstId !== undefined) {
        this.processedIds.delete(firstId);
      }
    }
    this.processedIds.add(String(id));
  }
  
  /**
   * Add item to array if not duplicate
   */
  addIfNotDuplicate(items: T[], newItem: T): T[] {
    // Check if item already exists
    const exists = items.some(item => String(item.id) === String(newItem.id));
    if (exists) {
      console.log(`[Deduplication] Skipping duplicate item: ${newItem.id}`);
      return items;
    }
    
    // Mark as processed
    this.markProcessed(newItem.id);
    
    return [newItem, ...items];
  }
  
  /**
   * Update item in array, avoiding duplicates
   */
  updateIfExists(items: T[], updatedItem: Partial<T> & { id: string | number }): T[] {
    const index = items.findIndex(item => String(item.id) === String(updatedItem.id));
    
    if (index === -1) {
      console.warn(`[Deduplication] Item not found for update: ${updatedItem.id}`);
      return items;
    }
    
    // Mark as processed
    this.markProcessed(updatedItem.id);
    
    // Update the item
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updatedItem };
    return newItems;
  }
  
  /**
   * Remove item from array
   */
  removeIfExists(items: T[], id: string | number): T[] {
    return items.filter(item => String(item.id) !== String(id));
  }
  
  /**
   * Clear processed IDs cache
   */
  clear(): void {
    this.processedIds.clear();
  }
}

// Create singleton instances for common entities
export const transactionDedup = new DeduplicationService();
export const projectDedup = new DeduplicationService();
export const clientDedup = new DeduplicationService();
export const teamMemberDedup = new DeduplicationService();
export const leadDedup = new DeduplicationService();
export const notificationDedup = new DeduplicationService();

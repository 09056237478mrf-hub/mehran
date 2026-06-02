import { QueuedPost } from '../types';
export declare class PostService {
    /**
     * Checks if a post has already been processed
     */
    isPostProcessed(contentHash: string): Promise<boolean>;
    /**
     * Marks a post as processed
     */
    markPostProcessed(contentHash: string, sourceChannel: string, messageId: number): Promise<void>;
    /**
     * Adds a post to the queue (waiting for proxies)
     */
    queuePost(post: QueuedPost): Promise<void>;
    /**
     * Gets all queued posts ordered by creation time
     */
    getQueuedPosts(limit?: number): Promise<QueuedPost[]>;
    /**
     * Removes a post from the queue
     */
    removeFromQueue(postId: string): Promise<void>;
    /**
     * Increments retry count for a queued post
     */
    incrementRetryCount(postId: string): Promise<void>;
    /**
     * Gets queue statistics
     */
    getQueueStats(): Promise<{
        total: number;
        oldestAge: number | null;
    }>;
}
declare const _default: PostService;
export default _default;
//# sourceMappingURL=postService.d.ts.map
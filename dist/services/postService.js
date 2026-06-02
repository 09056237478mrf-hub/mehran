"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostService = void 0;
const client_1 = __importDefault(require("../database/client"));
class PostService {
    /**
     * Checks if a post has already been processed
     */
    async isPostProcessed(contentHash) {
        const { data, error } = await client_1.default
            .from('processed_posts')
            .select('id')
            .eq('content_hash', contentHash)
            .single();
        return !!data && !error;
    }
    /**
     * Marks a post as processed
     */
    async markPostProcessed(contentHash, sourceChannel, messageId) {
        const { error } = await client_1.default
            .from('processed_posts')
            .insert({
            content_hash: contentHash,
            source_channel: sourceChannel,
            message_id: messageId
        });
        if (error) {
            console.error('Error marking post as processed:', error);
        }
    }
    /**
     * Adds a post to the queue (waiting for proxies)
     */
    async queuePost(post) {
        const { error } = await client_1.default
            .from('queued_posts')
            .insert(post);
        if (error) {
            // Check if it's a duplicate
            if (error.code === '23505') {
                console.log('Post already in queue (duplicate)');
                return;
            }
            console.error('Error queueing post:', error);
            throw error;
        }
        console.log(`📥 Post queued, waiting for ${post.required_proxies} proxies`);
    }
    /**
     * Gets all queued posts ordered by creation time
     */
    async getQueuedPosts(limit = 10) {
        const { data, error } = await client_1.default
            .from('queued_posts')
            .select('*')
            .order('created_at', { ascending: true })
            .limit(limit);
        if (error) {
            console.error('Error fetching queued posts:', error);
            return [];
        }
        return data || [];
    }
    /**
     * Removes a post from the queue
     */
    async removeFromQueue(postId) {
        const { error } = await client_1.default
            .from('queued_posts')
            .delete()
            .eq('id', postId);
        if (error) {
            console.error('Error removing post from queue:', error);
        }
    }
    /**
     * Increments retry count for a queued post
     */
    async incrementRetryCount(postId) {
        const { error } = await client_1.default
            .rpc('increment_retry_count', { post_id: postId });
        if (error) {
            // Fallback if RPC not available
            const { data: post } = await client_1.default
                .from('queued_posts')
                .select('retry_count')
                .eq('id', postId)
                .single();
            if (post) {
                await client_1.default
                    .from('queued_posts')
                    .update({ retry_count: (post.retry_count || 0) + 1 })
                    .eq('id', postId);
            }
        }
    }
    /**
     * Gets queue statistics
     */
    async getQueueStats() {
        const { count: total } = await client_1.default
            .from('queued_posts')
            .select('*', { count: 'exact', head: true });
        const { data: oldest } = await client_1.default
            .from('queued_posts')
            .select('created_at')
            .order('created_at', { ascending: true })
            .limit(1)
            .single();
        let oldestAge = null;
        if (oldest?.created_at) {
            oldestAge = Date.now() - new Date(oldest.created_at).getTime();
        }
        return {
            total: total || 0,
            oldestAge
        };
    }
}
exports.PostService = PostService;
exports.default = new PostService();
//# sourceMappingURL=postService.js.map
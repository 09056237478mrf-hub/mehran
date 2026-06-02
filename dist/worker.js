"use strict";
/**
 * Background Worker Process
 * Monitors the queue and processes posts when enough proxies are available
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const proxyService_1 = __importDefault(require("./services/proxyService"));
const postService_1 = __importDefault(require("./services/postService"));
const configService_1 = __importDefault(require("./services/configService"));
const telegraf_1 = require("telegraf");
const proxyProcessor_1 = require("./utils/proxyProcessor");
dotenv_1.default.config();
const bot = new telegraf_1.Telegraf(process.env.BOT_TOKEN);
async function processQueue() {
    try {
        // Get current proxy availability
        const availableProxies = await proxyService_1.default.getAvailableProxyCount();
        console.log(`🔄 Available proxies: ${availableProxies}`);
        // Get queued posts
        const queuedPosts = await postService_1.default.getQueuedPosts(5);
        if (queuedPosts.length === 0) {
            return;
        }
        console.log(`📋 Processing ${queuedPosts.length} queued posts`);
        const config = await configService_1.default.getConfig();
        for (const post of queuedPosts) {
            // Check if we have enough proxies
            if (availableProxies < post.required_proxies) {
                console.log(`⏳ Not enough proxies for post ${post.id}. Required: ${post.required_proxies}, Available: ${availableProxies}`);
                continue;
            }
            // Dequeue proxies
            const proxies = await proxyService_1.default.dequeueProxies(post.required_proxies);
            if (proxies.length < post.required_proxies) {
                console.log(`⚠️ Failed to dequeue proxies for post ${post.id}`);
                await postService_1.default.incrementRetryCount(post.id);
                continue;
            }
            // Build final message
            const finalMessage = (0, proxyProcessor_1.buildFinalMessage)(post.cleaned_text, proxies, config.hyperlink_text, config.signature_text, config.signature_link);
            const sendOptions = {
                parse_mode: 'Markdown',
                link_preview_options: { is_disabled: true },
                disable_web_page_preview: true
            };
            try {
                // Send based on media type
                if (post.media_type === 'photo' && post.media_file_id) {
                    await bot.telegram.sendPhoto(config.target_channel_id, post.media_file_id, { caption: finalMessage, ...sendOptions });
                }
                else if (post.media_type === 'video' && post.media_file_id) {
                    await bot.telegram.sendVideo(config.target_channel_id, post.media_file_id, { caption: finalMessage, ...sendOptions });
                }
                else {
                    await bot.telegram.sendMessage(config.target_channel_id, finalMessage, sendOptions);
                }
                console.log(`✅ Successfully sent queued post ${post.id}`);
                // Mark as processed and remove from queue
                await postService_1.default.markPostProcessed(post.content_hash, post.source_channel, post.message_id);
                await postService_1.default.removeFromQueue(post.id);
            }
            catch (error) {
                console.error(`❌ Error sending queued post ${post.id}:`, error);
                await postService_1.default.incrementRetryCount(post.id);
            }
        }
    }
    catch (error) {
        console.error('Error in queue processing:', error);
    }
}
async function displayStats() {
    try {
        const proxyStats = await proxyService_1.default.getStats();
        const queueStats = await postService_1.default.getQueueStats();
        console.log('\n📊 WORKER STATISTICS:');
        console.log(`   Proxies - Total: ${proxyStats.total}, Used: ${proxyStats.used}, Available: ${proxyStats.available}`);
        console.log(`   Queue - Total: ${queueStats.total}, Oldest: ${queueStats.oldestAge ? Math.floor(queueStats.oldestAge / 1000) + 's' : 'N/A'}`);
        console.log('─'.repeat(50));
    }
    catch (error) {
        console.error('Error displaying stats:', error);
    }
}
async function main() {
    console.log('🚀 Background Worker Started');
    console.log('📡 Monitoring queue for posts waiting for proxies...\n');
    // Process queue every 30 seconds
    setInterval(async () => {
        await processQueue();
    }, 30000);
    // Display stats every 60 seconds
    setInterval(async () => {
        await displayStats();
    }, 60000);
    // Initial stats display
    await displayStats();
    // Initial queue processing
    await processQueue();
}
// Start worker
main().catch(error => {
    console.error('Fatal error in worker:', error);
    process.exit(1);
});
//# sourceMappingURL=worker.js.map
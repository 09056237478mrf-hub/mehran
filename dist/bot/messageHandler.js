"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageHandler = void 0;
const configService_1 = __importDefault(require("../services/configService"));
const proxyService_1 = __importDefault(require("../services/proxyService"));
const postService_1 = __importDefault(require("../services/postService"));
const proxyProcessor_1 = require("../utils/proxyProcessor");
class MessageHandler {
    constructor(bot) {
        this.bot = bot;
    }
    /**
     * Handles incoming channel posts
     */
    async handleChannelPost(ctx) {
        try {
            const message = ctx.channelPost;
            if (!message)
                return;
            const config = await configService_1.default.getConfig();
            const sourceChannel = ('username' in message.chat && message.chat.username) ? message.chat.username : message.chat.id.toString();
            // Check if this is a source channel we're monitoring
            if (!config.source_channels.includes(`@${sourceChannel}`) &&
                !config.source_channels.includes(sourceChannel)) {
                return;
            }
            console.log(`📨 New message from source channel: ${sourceChannel}`);
            // Extract text content
            let text = '';
            if ('text' in message) {
                text = message.text;
            }
            else if ('caption' in message) {
                text = message.caption || '';
            }
            // First, check for proxy URLs and add them to pool
            const proxyUrls = (0, proxyProcessor_1.extractProxyUrls)(text);
            if (proxyUrls.length > 0) {
                console.log(`🔗 Found ${proxyUrls.length} proxy URLs in message`);
                for (const proxyUrl of proxyUrls) {
                    await proxyService_1.default.addProxy(proxyUrl);
                }
            }
            // If message is ONLY proxies (no meaningful content), don't forward
            const cleanedText = (0, proxyProcessor_1.cleanSourceText)(text);
            if (!cleanedText || cleanedText.length < 10) {
                console.log('Message contains only proxies or minimal content, skipping forward');
                return;
            }
            // Process media posts (photo/video with caption)
            if ('photo' in message || 'video' in message) {
                await this.handleMediaPost(ctx, message, cleanedText, sourceChannel);
            }
            // Process text-only posts
            else if ('text' in message) {
                await this.handleTextPost(ctx, message, cleanedText, sourceChannel);
            }
        }
        catch (error) {
            console.error('Error handling channel post:', error);
        }
    }
    /**
     * Handles media posts (photo/video)
     */
    async handleMediaPost(ctx, message, cleanedText, sourceChannel) {
        let mediaFileId = '';
        let mediaType = 'photo';
        if ('photo' in message) {
            // Get highest resolution photo
            const photos = message.photo;
            mediaFileId = photos[photos.length - 1].file_id;
            mediaType = 'photo';
        }
        else if ('video' in message) {
            mediaFileId = message.video.file_id;
            mediaType = 'video';
        }
        // Generate content hash for duplicate detection
        const contentHash = (0, proxyProcessor_1.generateContentHash)(cleanedText, mediaFileId);
        // Check if already processed
        if (await postService_1.default.isPostProcessed(contentHash)) {
            console.log('Duplicate post detected, skipping');
            return;
        }
        const config = await configService_1.default.getConfig();
        const requiredProxies = config.proxy_count;
        // Try to get required proxies
        const proxies = await proxyService_1.default.dequeueProxies(requiredProxies);
        if (proxies.length < requiredProxies) {
            // Not enough proxies, queue the post
            await postService_1.default.queuePost({
                source_channel: sourceChannel,
                message_id: message.message_id,
                media_type: mediaType,
                media_file_id: mediaFileId,
                cleaned_text: cleanedText,
                content_hash: contentHash,
                required_proxies: requiredProxies
            });
            return;
        }
        // Send the post
        await this.sendMediaPost(mediaType, mediaFileId, cleanedText, proxies, config);
        // Mark as processed
        await postService_1.default.markPostProcessed(contentHash, sourceChannel, message.message_id);
    }
    /**
     * Handles text-only posts
     */
    async handleTextPost(ctx, message, cleanedText, sourceChannel) {
        // Generate content hash
        const contentHash = (0, proxyProcessor_1.generateContentHash)(cleanedText);
        // Check if already processed
        if (await postService_1.default.isPostProcessed(contentHash)) {
            console.log('Duplicate post detected, skipping');
            return;
        }
        const config = await configService_1.default.getConfig();
        const requiredProxies = config.proxy_count;
        // Try to get required proxies
        const proxies = await proxyService_1.default.dequeueProxies(requiredProxies);
        if (proxies.length < requiredProxies) {
            // Not enough proxies, queue the post
            await postService_1.default.queuePost({
                source_channel: sourceChannel,
                message_id: message.message_id,
                media_type: 'text',
                cleaned_text: cleanedText,
                content_hash: contentHash,
                required_proxies: requiredProxies
            });
            return;
        }
        // Send the post
        await this.sendTextPost(cleanedText, proxies, config);
        // Mark as processed
        await postService_1.default.markPostProcessed(contentHash, sourceChannel, message.message_id);
    }
    /**
     * Sends a media post to target channel
     */
    async sendMediaPost(mediaType, fileId, text, proxies, config) {
        const finalMessage = (0, proxyProcessor_1.buildFinalMessage)(text, proxies, config.hyperlink_text, config.signature_text, config.signature_link);
        const sendOptions = {
            parse_mode: 'Markdown',
            link_preview_options: { is_disabled: true },
            disable_web_page_preview: true
        };
        try {
            if (mediaType === 'photo') {
                await this.bot.telegram.sendPhoto(config.target_channel_id, fileId, { caption: finalMessage, ...sendOptions });
            }
            else {
                await this.bot.telegram.sendVideo(config.target_channel_id, fileId, { caption: finalMessage, ...sendOptions });
            }
            console.log(`✅ Sent ${mediaType} post to target channel`);
        }
        catch (error) {
            console.error(`Error sending ${mediaType} post:`, error);
            throw error;
        }
    }
    /**
     * Sends a text post to target channel
     */
    async sendTextPost(text, proxies, config) {
        const finalMessage = (0, proxyProcessor_1.buildFinalMessage)(text, proxies, config.hyperlink_text, config.signature_text, config.signature_link);
        const sendOptions = {
            parse_mode: 'Markdown',
            link_preview_options: { is_disabled: true },
            disable_web_page_preview: true
        };
        try {
            await this.bot.telegram.sendMessage(config.target_channel_id, finalMessage, sendOptions);
            console.log('✅ Sent text post to target channel');
        }
        catch (error) {
            console.error('Error sending text post:', error);
            throw error;
        }
    }
}
exports.MessageHandler = MessageHandler;
//# sourceMappingURL=messageHandler.js.map
import { Context, Telegraf } from 'telegraf';
export declare class MessageHandler {
    private bot;
    constructor(bot: Telegraf);
    /**
     * Handles incoming channel posts
     */
    handleChannelPost(ctx: Context): Promise<void>;
    /**
     * Handles media posts (photo/video)
     */
    private handleMediaPost;
    /**
     * Handles text-only posts
     */
    private handleTextPost;
    /**
     * Sends a media post to target channel
     */
    private sendMediaPost;
    /**
     * Sends a text post to target channel
     */
    private sendTextPost;
}
//# sourceMappingURL=messageHandler.d.ts.map
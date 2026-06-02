"use strict";
/**
 * Main Bot Entry Point
 * Listens to source channels and processes incoming messages
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = require("telegraf");
const dotenv_1 = __importDefault(require("dotenv"));
const messageHandler_1 = require("./bot/messageHandler");
dotenv_1.default.config();
if (!process.env.BOT_TOKEN) {
    console.error('❌ BOT_TOKEN is required in .env file');
    process.exit(1);
}
const bot = new telegraf_1.Telegraf(process.env.BOT_TOKEN);
const messageHandler = new messageHandler_1.MessageHandler(bot);
// Handle channel posts
bot.on('channel_post', (ctx) => messageHandler.handleChannelPost(ctx));
// Handle errors
bot.catch((err, ctx) => {
    console.error('Bot error:', err);
});
// Start bot
bot.launch()
    .then(() => {
    console.log('🤖 Telegram Content Aggregator Bot Started');
    console.log('📡 Listening for channel posts...');
})
    .catch((error) => {
    console.error('Failed to start bot:', error);
    process.exit(1);
});
// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
//# sourceMappingURL=index.js.map
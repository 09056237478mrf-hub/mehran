"use strict";
/**
 * Dashboard Admin Panel Server
 * Express-based REST API for configuration management
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const configService_1 = __importDefault(require("../services/configService"));
const proxyService_1 = __importDefault(require("../services/proxyService"));
const postService_1 = __importDefault(require("../services/postService"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.DASHBOARD_PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
app.use(express_1.default.json());
app.use(express_1.default.static('public'));
// Simple authentication middleware
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${ADMIN_PASSWORD}`) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    next();
}
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Get current configuration
app.get('/api/config', authenticate, async (req, res) => {
    try {
        const config = await configService_1.default.getConfig();
        res.json(config);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch configuration' });
    }
});
// Update configuration
app.put('/api/config', authenticate, async (req, res) => {
    try {
        const updates = req.body;
        // Validate proxy_count range
        if (updates.proxy_count !== undefined) {
            if (updates.proxy_count < 1 || updates.proxy_count > 10) {
                res.status(400).json({ error: 'proxy_count must be between 1 and 10' });
                return;
            }
        }
        const updatedConfig = await configService_1.default.updateConfig(updates);
        res.json(updatedConfig);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update configuration' });
    }
});
// Get proxy statistics
app.get('/api/stats/proxies', authenticate, async (req, res) => {
    try {
        const stats = await proxyService_1.default.getStats();
        res.json(stats);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch proxy stats' });
    }
});
// Get queue statistics
app.get('/api/stats/queue', authenticate, async (req, res) => {
    try {
        const stats = await postService_1.default.getQueueStats();
        res.json(stats);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch queue stats' });
    }
});
// Reset all proxies (admin function)
app.post('/api/proxies/reset', authenticate, async (req, res) => {
    try {
        await proxyService_1.default.resetAllProxies();
        res.json({ message: 'All proxies reset successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to reset proxies' });
    }
});
// Get all statistics at once
app.get('/api/stats', authenticate, async (req, res) => {
    try {
        const [proxyStats, queueStats, config] = await Promise.all([
            proxyService_1.default.getStats(),
            postService_1.default.getQueueStats(),
            configService_1.default.getConfig()
        ]);
        res.json({
            proxies: proxyStats,
            queue: queueStats,
            config: {
                target_channel: config.target_channel_id,
                source_channels: config.source_channels,
                proxy_count: config.proxy_count
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});
// Start server
app.listen(PORT, () => {
    console.log(`🎛️  Dashboard Server Running on http://localhost:${PORT}`);
    console.log(`🔐 Admin Password: ${ADMIN_PASSWORD}`);
    console.log(`📡 Use Authorization header: Bearer ${ADMIN_PASSWORD}`);
});
exports.default = app;
//# sourceMappingURL=server.js.map
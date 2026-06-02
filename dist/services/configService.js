"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigService = void 0;
const client_1 = __importDefault(require("../database/client"));
class ConfigService {
    constructor() {
        this.cachedConfig = null;
        this.lastFetch = 0;
        this.CACHE_TTL = 30000; // 30 seconds
    }
    /**
     * Gets the current dashboard configuration
     */
    async getConfig() {
        const now = Date.now();
        // Return cached config if still valid
        if (this.cachedConfig && (now - this.lastFetch) < this.CACHE_TTL) {
            return this.cachedConfig;
        }
        const { data, error } = await client_1.default
            .from('dashboard_config')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        if (error) {
            console.error('Error fetching config:', error);
            throw new Error('Failed to fetch dashboard configuration');
        }
        if (!data) {
            throw new Error('No configuration found. Please set up dashboard config first.');
        }
        this.cachedConfig = data;
        this.lastFetch = now;
        return this.cachedConfig;
    }
    /**
     * Updates the dashboard configuration
     */
    async updateConfig(config) {
        const currentConfig = await this.getConfig();
        const { data, error } = await client_1.default
            .from('dashboard_config')
            .update({
            ...config,
            updated_at: new Date().toISOString()
        })
            .eq('id', currentConfig.id)
            .select()
            .single();
        if (error) {
            console.error('Error updating config:', error);
            throw new Error('Failed to update configuration');
        }
        // Invalidate cache
        this.cachedConfig = null;
        this.lastFetch = 0;
        return data;
    }
    /**
     * Creates initial configuration
     */
    async createConfig(config) {
        const { data, error } = await client_1.default
            .from('dashboard_config')
            .insert(config)
            .select()
            .single();
        if (error) {
            console.error('Error creating config:', error);
            throw new Error('Failed to create configuration');
        }
        return data;
    }
    /**
     * Clears the configuration cache
     */
    clearCache() {
        this.cachedConfig = null;
        this.lastFetch = 0;
    }
}
exports.ConfigService = ConfigService;
exports.default = new ConfigService();
//# sourceMappingURL=configService.js.map
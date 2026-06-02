"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyService = void 0;
const client_1 = __importDefault(require("../database/client"));
const proxyProcessor_1 = require("../utils/proxyProcessor");
class ProxyService {
    /**
     * Adds a new proxy to the pool if it's unique
     */
    async addProxy(proxyUrl) {
        try {
            const { normalized: fingerprint, type } = (0, proxyProcessor_1.normalizeProxyUrl)(proxyUrl);
            const proxyType = (0, proxyProcessor_1.getProxyType)(proxyUrl);
            // Check if proxy already exists
            const { data: existing } = await client_1.default
                .from('proxies_pool')
                .select('id')
                .eq('proxy_fingerprint', fingerprint)
                .single();
            if (existing) {
                console.log('Proxy already exists (duplicate):', proxyUrl.substring(0, 50));
                return false;
            }
            // Insert new proxy
            const { error } = await client_1.default
                .from('proxies_pool')
                .insert({
                proxy_url: proxyUrl,
                proxy_fingerprint: fingerprint,
                proxy_type: proxyType,
                used: false
            });
            if (error) {
                console.error('Error adding proxy:', error);
                return false;
            }
            console.log(`✅ Added new ${proxyType} proxy to pool`);
            return true;
        }
        catch (error) {
            console.error('Error in addProxy:', error);
            return false;
        }
    }
    /**
     * Gets N unused proxies and marks them as used
     */
    async dequeueProxies(count) {
        try {
            // Fetch unused proxies
            const { data: proxies, error } = await client_1.default
                .from('proxies_pool')
                .select('*')
                .eq('used', false)
                .order('created_at', { ascending: true })
                .limit(count);
            if (error) {
                console.error('Error fetching proxies:', error);
                return [];
            }
            if (!proxies || proxies.length < count) {
                console.log(`⚠️ Not enough proxies. Requested: ${count}, Available: ${proxies?.length || 0}`);
                return [];
            }
            // Mark proxies as used
            const proxyIds = proxies.map((p) => p.id);
            const { error: updateError } = await client_1.default
                .from('proxies_pool')
                .update({
                used: true,
                used_at: new Date().toISOString()
            })
                .in('id', proxyIds);
            if (updateError) {
                console.error('Error marking proxies as used:', updateError);
                return [];
            }
            return proxies.map((p) => p.proxy_url);
        }
        catch (error) {
            console.error('Error in dequeueProxies:', error);
            return [];
        }
    }
    /**
     * Gets count of available unused proxies
     */
    async getAvailableProxyCount() {
        const { count, error } = await client_1.default
            .from('proxies_pool')
            .select('*', { count: 'exact', head: true })
            .eq('used', false);
        if (error) {
            console.error('Error counting proxies:', error);
            return 0;
        }
        return count || 0;
    }
    /**
     * Resets all proxies to unused state (admin function)
     */
    async resetAllProxies() {
        const { error } = await client_1.default
            .from('proxies_pool')
            .update({ used: false, used_at: null })
            .eq('used', true);
        if (error) {
            console.error('Error resetting proxies:', error);
            throw error;
        }
        console.log('✅ All proxies reset to unused state');
    }
    /**
     * Gets proxy pool statistics
     */
    async getStats() {
        const { count: total } = await client_1.default
            .from('proxies_pool')
            .select('*', { count: 'exact', head: true });
        const { count: used } = await client_1.default
            .from('proxies_pool')
            .select('*', { count: 'exact', head: true })
            .eq('used', true);
        return {
            total: total || 0,
            used: used || 0,
            available: (total || 0) - (used || 0)
        };
    }
}
exports.ProxyService = ProxyService;
exports.default = new ProxyService();
//# sourceMappingURL=proxyService.js.map
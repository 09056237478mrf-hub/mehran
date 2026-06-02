export declare class ProxyService {
    /**
     * Adds a new proxy to the pool if it's unique
     */
    addProxy(proxyUrl: string): Promise<boolean>;
    /**
     * Gets N unused proxies and marks them as used
     */
    dequeueProxies(count: number): Promise<string[]>;
    /**
     * Gets count of available unused proxies
     */
    getAvailableProxyCount(): Promise<number>;
    /**
     * Resets all proxies to unused state (admin function)
     */
    resetAllProxies(): Promise<void>;
    /**
     * Gets proxy pool statistics
     */
    getStats(): Promise<{
        total: number;
        used: number;
        available: number;
    }>;
}
declare const _default: ProxyService;
export default _default;
//# sourceMappingURL=proxyService.d.ts.map
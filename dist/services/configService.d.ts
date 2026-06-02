import { DashboardConfig } from '../types';
export declare class ConfigService {
    private cachedConfig;
    private lastFetch;
    private readonly CACHE_TTL;
    /**
     * Gets the current dashboard configuration
     */
    getConfig(): Promise<DashboardConfig>;
    /**
     * Updates the dashboard configuration
     */
    updateConfig(config: Partial<DashboardConfig>): Promise<DashboardConfig>;
    /**
     * Creates initial configuration
     */
    createConfig(config: DashboardConfig): Promise<DashboardConfig>;
    /**
     * Clears the configuration cache
     */
    clearCache(): void;
}
declare const _default: ConfigService;
export default _default;
//# sourceMappingURL=configService.d.ts.map
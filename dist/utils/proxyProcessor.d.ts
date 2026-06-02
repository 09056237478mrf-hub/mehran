import { ProxyFingerprint } from '../types';
/**
 * Extracts all proxy URLs from text using comprehensive regex patterns
 */
export declare function extractProxyUrls(text: string): string[];
/**
 * Determines proxy type from URL
 */
export declare function getProxyType(url: string): 'vless' | 'vmess' | 'ss' | 'mtproto' | 'trojan' | 'other';
/**
 * Main normalization function that creates a unique fingerprint for each proxy
 */
export declare function normalizeProxyUrl(url: string): ProxyFingerprint;
/**
 * Cleans text by removing source channel tags and links
 */
export declare function cleanSourceText(text: string): string;
/**
 * Generates content hash for duplicate detection
 */
export declare function generateContentHash(content: string, mediaFileId?: string): string;
/**
 * Formats proxies as hyperlinks using the configured text
 */
export declare function formatProxiesAsHyperlinks(proxies: string[], hyperlinkText: string): string;
/**
 * Builds the complete message with cleaned text, proxies, and signature
 */
export declare function buildFinalMessage(cleanedText: string, proxies: string[], hyperlinkText: string, signatureText: string, signatureLink: string): string;
//# sourceMappingURL=proxyProcessor.d.ts.map
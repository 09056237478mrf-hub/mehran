"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractProxyUrls = extractProxyUrls;
exports.getProxyType = getProxyType;
exports.normalizeProxyUrl = normalizeProxyUrl;
exports.cleanSourceText = cleanSourceText;
exports.generateContentHash = generateContentHash;
exports.formatProxiesAsHyperlinks = formatProxiesAsHyperlinks;
exports.buildFinalMessage = buildFinalMessage;
const crypto = __importStar(require("crypto"));
/**
 * Extracts all proxy URLs from text using comprehensive regex patterns
 */
function extractProxyUrls(text) {
    if (!text)
        return [];
    const proxyPatterns = [
        /vless:\/\/[^\s]+/gi,
        /vmess:\/\/[^\s]+/gi,
        /ss:\/\/[^\s]+/gi,
        /trojan:\/\/[^\s]+/gi,
        /mtproto:\/\/[^\s]+/gi,
    ];
    const proxies = [];
    for (const pattern of proxyPatterns) {
        const matches = text.match(pattern);
        if (matches) {
            proxies.push(...matches);
        }
    }
    return proxies;
}
/**
 * Determines proxy type from URL
 */
function getProxyType(url) {
    const lower = url.toLowerCase();
    if (lower.startsWith('vless://'))
        return 'vless';
    if (lower.startsWith('vmess://'))
        return 'vmess';
    if (lower.startsWith('ss://'))
        return 'ss';
    if (lower.startsWith('mtproto://'))
        return 'mtproto';
    if (lower.startsWith('trojan://'))
        return 'trojan';
    return 'other';
}
/**
 * Normalizes VMESS URL by decoding, removing display name, sorting keys, and re-encoding
 */
function normalizeVmessUrl(url) {
    try {
        // Extract base64 part after vmess://
        const base64Part = url.replace(/^vmess:\/\//i, '');
        // Decode base64
        const decoded = Buffer.from(base64Part, 'base64').toString('utf-8');
        const config = JSON.parse(decoded);
        // Remove the display name field (ps)
        delete config.ps;
        // Sort keys alphabetically for consistent fingerprinting
        const sortedKeys = Object.keys(config).sort();
        const sortedConfig = {};
        for (const key of sortedKeys) {
            sortedConfig[key] = config[key];
        }
        // Re-encode to base64
        const normalizedJson = JSON.stringify(sortedConfig);
        const normalizedBase64 = Buffer.from(normalizedJson).toString('base64');
        return `vmess://${normalizedBase64}`;
    }
    catch (error) {
        console.error('Error normalizing VMESS URL:', error);
        // Fallback to simple normalization
        return url.split('#')[0].toLowerCase();
    }
}
/**
 * Normalizes standard proxy URLs by removing remarks and lowercasing
 */
function normalizeStandardUrl(url) {
    // Remove everything after # (remarks/channel tags)
    const withoutRemarks = url.split('#')[0];
    // Lowercase for consistency
    return withoutRemarks.toLowerCase().trim();
}
/**
 * Main normalization function that creates a unique fingerprint for each proxy
 */
function normalizeProxyUrl(url) {
    const type = getProxyType(url);
    let normalized;
    if (type === 'vmess') {
        normalized = normalizeVmessUrl(url);
    }
    else {
        normalized = normalizeStandardUrl(url);
    }
    // Create SHA256 hash of normalized URL for consistent fingerprinting
    const fingerprint = crypto
        .createHash('sha256')
        .update(normalized)
        .digest('hex');
    return {
        normalized: fingerprint,
        type
    };
}
/**
 * Cleans text by removing source channel tags and links
 */
function cleanSourceText(text) {
    if (!text)
        return '';
    let cleaned = text;
    // Remove @username mentions
    cleaned = cleaned.replace(/@[a-zA-Z0-9_]+/g, '');
    // Remove t.me links
    cleaned = cleaned.replace(/https?:\/\/(t\.me|telegram\.me)\/[^\s]*/gi, '');
    // Remove multiple spaces and trim
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    return cleaned;
}
/**
 * Generates content hash for duplicate detection
 */
function generateContentHash(content, mediaFileId) {
    const hashInput = mediaFileId ? `${content}:${mediaFileId}` : content;
    return crypto
        .createHash('sha256')
        .update(hashInput)
        .digest('hex');
}
/**
 * Formats proxies as hyperlinks using the configured text
 */
function formatProxiesAsHyperlinks(proxies, hyperlinkText) {
    if (!proxies || proxies.length === 0)
        return '';
    const formattedLinks = proxies.map((proxy, index) => {
        return `[${hyperlinkText} ${index + 1}](${proxy})`;
    });
    return '\n\n' + formattedLinks.join('\n');
}
/**
 * Builds the complete message with cleaned text, proxies, and signature
 */
function buildFinalMessage(cleanedText, proxies, hyperlinkText, signatureText, signatureLink) {
    let message = cleanedText;
    // Add formatted proxy links
    if (proxies.length > 0) {
        message += formatProxiesAsHyperlinks(proxies, hyperlinkText);
    }
    // Add signature with link
    if (signatureText && signatureLink) {
        message += `\n\n${signatureText}\n[Join Channel](${signatureLink})`;
    }
    else if (signatureText) {
        message += `\n\n${signatureText}`;
    }
    return message;
}
//# sourceMappingURL=proxyProcessor.js.map
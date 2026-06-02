export interface DashboardConfig {
    id?: string;
    target_channel_id: string;
    source_channels: string[];
    proxy_count: number;
    hyperlink_text: string;
    signature_text: string;
    signature_link: string;
    created_at?: string;
    updated_at?: string;
}
export interface ProxyPool {
    id?: string;
    proxy_url: string;
    proxy_fingerprint: string;
    proxy_type: 'vless' | 'vmess' | 'ss' | 'mtproto' | 'trojan' | 'other';
    used: boolean;
    created_at?: string;
    used_at?: string;
}
export interface ProcessedPost {
    id?: string;
    content_hash: string;
    source_channel: string;
    message_id: number;
    processed_at?: string;
}
export interface QueuedPost {
    id?: string;
    source_channel: string;
    message_id: number;
    media_type?: 'photo' | 'video' | 'text';
    media_file_id?: string;
    cleaned_text: string;
    content_hash: string;
    required_proxies: number;
    created_at?: string;
    retry_count?: number;
}
export interface ProxyFingerprint {
    normalized: string;
    type: string;
}
export interface VMESSConfig {
    v?: string;
    ps?: string;
    add?: string;
    port?: string | number;
    id?: string;
    aid?: string | number;
    scy?: string;
    net?: string;
    type?: string;
    host?: string;
    path?: string;
    tls?: string;
    sni?: string;
    alpn?: string;
    [key: string]: any;
}
//# sourceMappingURL=index.d.ts.map
/**
 * Simple in-memory rate limiter for API endpoints
 * 
 * Note: This is a per-instance limiter. For production with multiple instances,
 * consider using Redis or a distributed rate limiting solution.
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitStore: Map<string, RateLimitEntry> = new Map();

// Clean up old entries periodically (every 5 minutes)
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.resetTime < now) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
    maxRequests: number;      // Maximum requests allowed
    windowMs: number;         // Time window in milliseconds
    keyPrefix?: string;       // Prefix for the rate limit key
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfterMs?: number;
}

/**
 * Check if a request is allowed based on rate limiting rules
 * 
 * @param identifier - Unique identifier (usually userId or IP)
 * @param config - Rate limit configuration
 * @returns RateLimitResult
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig
): RateLimitResult {
    const now = Date.now();
    const key = `${config.keyPrefix || 'rl'}:${identifier}`;

    let entry = rateLimitStore.get(key);

    // Reset if window has passed
    if (!entry || entry.resetTime < now) {
        entry = {
            count: 0,
            resetTime: now + config.windowMs,
        };
    }

    // Check if limit exceeded
    if (entry.count >= config.maxRequests) {
        return {
            allowed: false,
            remaining: 0,
            resetTime: entry.resetTime,
            retryAfterMs: entry.resetTime - now,
        };
    }

    // Increment and save
    entry.count++;
    rateLimitStore.set(key, entry);

    return {
        allowed: true,
        remaining: config.maxRequests - entry.count,
        resetTime: entry.resetTime,
    };
}

/**
 * Preset rate limit configurations
 */
export const RATE_LIMITS = {
    // Payment operations: 10 requests per minute per user
    PAYMENT: {
        maxRequests: 10,
        windowMs: 60 * 1000,
        keyPrefix: 'payment',
    },

    // Webhook: 100 requests per minute (from Stripe)
    WEBHOOK: {
        maxRequests: 100,
        windowMs: 60 * 1000,
        keyPrefix: 'webhook',
    },

    // Email sending: 20 per minute per user
    EMAIL: {
        maxRequests: 20,
        windowMs: 60 * 1000,
        keyPrefix: 'email',
    },

    // Auth attempts: 5 per minute per IP
    AUTH: {
        maxRequests: 5,
        windowMs: 60 * 1000,
        keyPrefix: 'auth',
    },
} as const;

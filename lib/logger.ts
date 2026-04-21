/**
 * Environment-aware logger
 * Logs only in development mode
 */

const isDev = process.env.NODE_ENV === 'development';

export const logger = {
    log: (...args: any[]) => {
        if (isDev) console.log(...args);
    },
    warn: (...args: any[]) => {
        if (isDev) console.warn(...args);
    },
    error: (...args: any[]) => {
        // Errors always logged (important for debugging prod issues)
        console.error(...args);
    },
    info: (...args: any[]) => {
        if (isDev) console.info(...args);
    },
    debug: (...args: any[]) => {
        if (isDev) console.debug(...args);
    },
};

export default logger;

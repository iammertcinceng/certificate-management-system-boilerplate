#!/usr/bin/env node

/**
 * Accreditation Reminder Cron Script
 * 
 * Bu script PM2 veya Linux crontab ile günlük çalıştırılmalıdır.
 * 
 * PM2 ile çalıştırma:
 *   pm2 start scripts/cron-accreditation.js --cron "0 9 * * *" --no-autorestart
 * 
 * Linux crontab ile çalıştırma:
 *   0 9 * * * curl -X GET https://mertcin.com/api/cron/accreditation-reminders -H "x-cron-secret: YOUR_SECRET"
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.NEXTAUTH_URL || 'https://mertcin.com';
const CRON_SECRET = process.env.CRON_SECRET || '';
const ENDPOINT = '/api/cron/accreditation-reminders';

function runCron() {
    const url = new URL(ENDPOINT, BASE_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(CRON_SECRET && { 'x-cron-secret': CRON_SECRET })
        }
    };

    console.log(`[${new Date().toISOString()}] Running accreditation reminder cron...`);
    console.log(`URL: ${url.href}`);

    const req = client.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const result = JSON.parse(data);
                console.log(`[${new Date().toISOString()}] Cron completed:`, result);

                if (result.success) {
                    console.log(`  - Processed: ${result.processed}`);
                    console.log(`  - Sent: ${result.sent}`);
                    console.log(`  - Skipped: ${result.skipped}`);
                    if (result.errors && result.errors.length > 0) {
                        console.log(`  - Errors: ${result.errors.length}`);
                        result.errors.forEach(err => console.log(`    * ${err}`));
                    }
                } else {
                    console.error(`  - Error: ${result.error}`);
                }
            } catch (e) {
                console.log(`[${new Date().toISOString()}] Response:`, data);
            }
        });
    });

    req.on('error', (error) => {
        console.error(`[${new Date().toISOString()}] Cron request failed:`, error.message);
    });

    req.end();
}

// Run immediately
runCron();

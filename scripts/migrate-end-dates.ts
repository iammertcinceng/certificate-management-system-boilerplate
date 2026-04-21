import { db } from '../db/client';
import { certificates } from '../db/schema';
import { sql } from 'drizzle-orm';

async function migrateEndDates() {
    try {
        const result = await db.execute(sql`UPDATE certificates SET end_date = date_issued WHERE end_date IS NULL`);
        console.log('Updated existing certificates end_date from dateIssued');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrateEndDates();

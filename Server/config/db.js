import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config();
const isProduction = process.env.NODE_ENV === 'production';

export const db = new pg.Pool({
    user:process.env.DB_USER,
    password:process.env.DB_PASSWORD,
    database:process.env.DB_NAME,
    host:process.env.DB_HOST,
    port:Number(process.env.DB_PORT),
    connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    ssl: isProduction? { rejectUnauthorized: false } : false
});

db.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});


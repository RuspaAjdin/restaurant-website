import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import dotenv from 'dotenv';
import pool from './db.js';
import authRoutes from './authRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const PgSession = connectPgSimple(session);

app.use(express.json());
app.use(express.static('public'));

app.use(session({
    store: new PgSession({ pool, createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    }
}));

app.use('/api', authRoutes);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`server started at http://localhost:${PORT}`);
});

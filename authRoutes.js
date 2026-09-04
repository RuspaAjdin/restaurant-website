import express from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import pool from './db.js';
import { sendResetEmail } from './mailer.js';

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,50}$/;

router.post('/signup', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password || !emailPattern.test(email) || !passwordPattern.test(password)) {
        return res.status(400).json({ error: 'Invalid email or password format' });
    }

    try {
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'An account with that email already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
            [email, passwordHash]
        );

        req.session.userId = result.rows[0].id;
        res.json({ email: result.rows[0].email });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user || !user.password_hash) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        req.session.userId = user.id;
        res.json({ email: user.email });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

router.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.json({ ok: true });
    });
});

router.get('/session', async (req, res) => {
    if (!req.session.userId) {
        return res.json({ loggedIn: false });
    }

    try {
        const result = await pool.query('SELECT email FROM users WHERE id = $1', [req.session.userId]);
        if (result.rows.length === 0) {
            return res.json({ loggedIn: false });
        }
        res.json({ loggedIn: true, email: result.rows[0].email });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

router.post('/google-auth', async (req, res) => {
    const { credential } = req.body;

    if (!credential) {
        return res.status(400).json({ error: 'Missing credential' });
    }

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();

        const existing = await pool.query('SELECT * FROM users WHERE google_id = $1 OR email = $2', [payload.sub, payload.email]);
        let user = existing.rows[0];

        if (!user) {
            const inserted = await pool.query(
                'INSERT INTO users (email, google_id) VALUES ($1, $2) RETURNING id, email',
                [payload.email, payload.sub]
            );
            user = inserted.rows[0];
        } else if (!user.google_id) {
            await pool.query('UPDATE users SET google_id = $1 WHERE id = $2', [payload.sub, user.id]);
        }

        req.session.userId = user.id;
        res.json({ email: user.email });
    } catch (err) {
        console.error(err);
        res.status(401).json({ error: 'Invalid Google token' });
    }
});

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.json({ ok: true });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 1000 * 60 * 60);

        await pool.query(
            'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
            [token, expires, result.rows[0].id]
        );

        const resetLink = `${process.env.APP_URL}/reset-password.html?token=${token}`;
        await sendResetEmail(email, resetLink);

        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

router.post('/reset-password', async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password || !passwordPattern.test(password)) {
        return res.status(400).json({ error: 'Invalid request' });
    }

    try {
        const result = await pool.query(
            'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > now()',
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Token is invalid or expired' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        await pool.query(
            'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
            [passwordHash, result.rows[0].id]
        );

        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

export default router;

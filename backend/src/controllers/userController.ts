import { Request, Response } from 'express';
import pool from '../config/db';

export const getUsers = async (req: Request, res: Response) => {
    try {
        const [rows] = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error });
    }
};

export const createUser = async (req: Request, res: Response) => {
    const { name, email, role, status } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO users (name, email, role, status) VALUES (?, ?, ?, ?)',
            [name, email, role || 'user', status || 'active']
        );
        const insertId = (result as any).insertId;
        res.status(201).json({ id: insertId, name, email, role, status });
    } catch (error) {
        res.status(500).json({ message: 'Error creating user', error });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, email, role, status } = req.body;
    try {
        await pool.query(
            'UPDATE users SET name = ?, email = ?, role = ?, status = ? WHERE id = ?',
            [name, email, role, status, id]
        );
        res.json({ id, name, email, role, status });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user', error });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user', error });
    }
};

export const login = async (req: Request, res: Response) => {
    const { username, password } = req.body;
    // Hardcoded admin/admin as requested, but could be checked against DB
    if (username === 'admin' && password === 'admin') {
        res.json({
            isAuthenticated: true,
            user: { name: 'Admin User', role: 'admin' }
        });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
};

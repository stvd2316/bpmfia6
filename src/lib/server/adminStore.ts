// Penyimpanan daftar email admin — tabel admin_emails di Supabase (runtime CRUD).
import { pool } from './db';

export async function listAdminEmails(): Promise<string[]> {
	const r = await pool.query('SELECT email FROM admin_emails ORDER BY "createdAt"');
	return r.rows.map((x) => x.email as string);
}

export async function isAdminEmailDb(email: string | null | undefined): Promise<boolean> {
	if (!email) return false;
	const r = await pool.query('SELECT 1 FROM admin_emails WHERE email = $1', [email.toLowerCase().trim()]);
	return (r.rowCount ?? 0) > 0;
}

/** Tambah email admin. return: 'added' | 'exists' */
export async function addAdminEmail(email: string): Promise<'added' | 'exists'> {
	const e = email.toLowerCase().trim();
	if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return 'exists'; // format tidak valid → anggap gagal
	const r = await pool.query('INSERT INTO admin_emails (email) VALUES ($1) ON CONFLICT (email) DO NOTHING', [e]);
	return (r.rowCount ?? 0) > 0 ? 'added' : 'exists';
}

export async function removeAdminEmail(email: string): Promise<boolean> {
	const r = await pool.query('DELETE FROM admin_emails WHERE email = $1', [email.toLowerCase().trim()]);
	return (r.rowCount ?? 0) > 0;
}

import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

export interface AuthUser {
	id: number;
	nombre: string;
	email: string;
	rol: 'ADMIN' | 'CAJERO' | 'CONTROL_ENTRADAS';
	estado: string;
}

/**
 * Hashear contraseña
 */
export async function hashPassword(password: string): Promise<string> {
	return bcryptjs.hash(password, 10);
}

/**
 * Verificar contraseña
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
	return bcryptjs.compare(password, hash);
}

/**
 * Generar JWT token
 */
export function generateToken(user: AuthUser): string {
	return jwt.sign(
		{
			id: user.id,
			email: user.email,
			nombre: user.nombre,
			rol: user.rol
		},
		JWT_SECRET,
		{ expiresIn: '24h' }
	);
}

/**
 * Verificar y decodificar JWT token
 */
export function verifyToken(token: string): AuthUser | null {
	try {
		const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
		return decoded;
	} catch (error) {
		return null;
	}
}

/**
 * Extraer token de las cookies
 */
export function getTokenFromCookie(cookieHeader: string | null): string | null {
	if (!cookieHeader) return null;
	const cookies = cookieHeader.split(';');
	for (const cookie of cookies) {
		const [name, value] = cookie.trim().split('=');
		if (name === 'auth_token') {
			return decodeURIComponent(value);
		}
	}
	return null;
}

/**
 * Verificar permisos de rol
 */
export function hasPermission(userRole: string, requiredRole: string | string[]): boolean {
	const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
	if (userRole === 'ADMIN') return true; // Admin tiene todos los permisos
	return roles.includes(userRole);
}

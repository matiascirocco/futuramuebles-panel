import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import type { Usuario } from './types';

const COOKIE = 'fm_session';
const DIAS = 30;

const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET!);

export type Sesion = Pick<Usuario, 'id' | 'nombre' | 'email' | 'rol'>;

export async function crearSesion(u: Sesion) {
  const token = await new SignJWT({ ...u })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${DIAS}d`)
    .sign(secret());

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: DIAS * 24 * 60 * 60,
  });
}

export async function cerrarSesion() {
  (await cookies()).delete(COOKIE);
}

export async function getSesion(): Promise<Sesion | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as Sesion;
  } catch {
    return null;
  }
}

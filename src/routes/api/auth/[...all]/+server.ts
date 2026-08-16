// Endpoint Better Auth: /api/auth/* (sign-in OTP, session, sign-out, dll.)
import { auth } from '$lib/server/auth';
import { toSvelteKitHandler } from 'better-auth/svelte-kit';

const handler = toSvelteKitHandler(auth);

export const GET = ({ request }) => handler({ request });
export const POST = ({ request }) => handler({ request });

import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

// In a real production app this MUST come from an environment variable
// and never be committed. We fall back to a dev-only default so the app
// still runs locally out of the box, but every deployment should set
// JWT_SECRET explicitly.
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me';
const TOKEN_EXPIRY = '7d';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

export function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });
}

// Express middleware: requires a valid "Authorization: Bearer <token>"
// header. On success, attaches { id, email } to req.user. On failure,
// responds 401 so the frontend can redirect to /login.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ errors: ['Not authenticated.'] });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ errors: ['Session expired. Please log in again.'] });
  }
}

// Verifies the ID token Google's Sign-In button hands back to the
// frontend. Throws if it's missing, expired, or wasn't issued for our
// Client ID — never trust a token without checking the audience.
export async function verifyGoogleToken(idToken) {
  if (!googleClient) {
    throw new Error('Google sign-in is not configured on the server.');
  }
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name || payload.email.split('@')[0],
  };
}

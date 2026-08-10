import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

const COOKIE_NAME = 'etho_session';
const MAX_AGE_DAYS = 90;
const MAX_AGE_SECONDS = MAX_AGE_DAYS * 24 * 60 * 60;

/**
 * SessionMiddleware
 *
 * This middleware assigns a session ID to all requests for essential functionality
 * (cart persistence, user preferences, etc). This is a "strictly necessary" cookie
 * under GDPR and does not require user consent.
 *
 * Analytics tracking based on this session ID is separately gated by cookie consent
 * on the client side.
 */
@Injectable()
export class SessionMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    let sessionId = req.signedCookies?.[COOKIE_NAME];
    let adminSessionId = req.signedCookies?.['auth_token'];

    if (!sessionId && !adminSessionId) {
      sessionId = randomUUID();

      res.cookie(COOKIE_NAME, sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: MAX_AGE_SECONDS * 1000,
        path: '/',
        signed: true,
      });
    }

    if (adminSessionId) {
      res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      });
    }

    req.sessionId = sessionId;

    next();
  }
}
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../db';
import { AppError } from './errorHandler';
import { ShopMemberRole, UserRole } from '@chairly/shared';

export interface AuthUserPayload {
  userId: string;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
      shopMembership?: {
        shopId: string;
        role: ShopMemberRole;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required. Missing Bearer token.', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError('Invalid token format', 401);
    }

    const decoded = jwt.verify(token, config.jwtSecret) as AuthUserPayload;
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      next(new AppError('Invalid or expired authentication token', 401));
    } else {
      next(err);
    }
  }
};

/**
 * Optional authentication: attaches user if token is valid, continues if not
 */
export const optionalAuthenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret) as AuthUserPayload;
    req.user = decoded;
  } catch {
    // Ignore invalid tokens for optional endpoints
  }
  next();
};

/**
 * Enforce role-based access for shop management
 * Guarantees cross-tenant isolation: staff of Shop A cannot access Shop B!
 */
export const requireShopMember = (allowedRoles: ShopMemberRole[] = ['OWNER', 'MANAGER', 'BARBER']) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const shopId = req.params.shopId || req.body.shopId || (req.query.shopId as string);
      if (!shopId) {
        throw new AppError('Shop ID is required for shop operations', 400);
      }

      // If user is website platform super-admin/owner (every access), allow unrestricted access across all shops
      if (req.user.email === 'admin@chairly.app') {
        req.shopMembership = {
          shopId,
          role: 'OWNER',
        };
        return next();
      }

      // Query database for user's membership in this specific shop
      const membership = await prisma.shopMember.findUnique({
        where: {
          shopId_userId: {
            shopId,
            userId: req.user.userId,
          },
        },
      });

      if (!membership || !allowedRoles.includes(membership.role as ShopMemberRole)) {
        throw new AppError('You do not have permission to manage this barbershop', 403);
      }

      req.shopMembership = {
        shopId: membership.shopId,
        role: membership.role as ShopMemberRole,
      };

      next();
    } catch (err) {
      next(err);
    }
  };
};

/**
 * Enforce platform owner privileges (super-admin across all of Chairly)
 */
export const requirePlatformOwner = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true, role: true },
    });

    // Check if user has platform owner role
    if (!user || user.role !== 'OWNER' || user.email !== 'admin@chairly.app') {
      throw new AppError('Platform Owner access required for this action', 403);
    }

    next();
  } catch (err) {
    next(err);
  }
};


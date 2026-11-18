import { Request, Response, NextFunction } from "express";

export interface SessionUser {
  id: number;
  email: string;
  name: string | null;
  surname: string | null;
  isAdmin: boolean;
  isClient: boolean;
  phone: string | null;
  agencyId: number | null;
  agencyName: string | null;
  subscriptionPlan: string | null;
  agentType: string | null;
  networkId: number | null;
  agentUuid?: string;
  clientUuid?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

export type UserRole = 'agent' | 'admin' | 'client' | 'super_admin';

export interface AuthorizeOptions {
  allowSelf?: (user: SessionUser, req: Request) => boolean | Promise<boolean>;
  allowAdmin?: boolean;
  allowRoles?: UserRole[];
  custom?: (user: SessionUser, req: Request) => boolean | Promise<boolean>;
  /** Resolves the agency id of the request; grants access to its verified claim owner. */
  allowAgencyClaimOwner?: (req: Request) => number | null | undefined | Promise<number | null | undefined>;
}

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const sessionUser = (req as any).session?.user as SessionUser | undefined;

  if (!sessionUser) {
    res.status(401).json({ message: "Autenticación requerida" });
    return;
  }

  req.user = sessionUser;
  next();
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Autenticación requerida" });
      return;
    }

    const userRoles: UserRole[] = [];
    
    if (req.user.isClient) {
      userRoles.push('client');
    } else {
      userRoles.push('agent');
    }
    
    if (req.user.isAdmin) {
      userRoles.push('admin');
    }

    if (req.user.agentType === 'super_admin') {
      userRoles.push('super_admin');
    }

    const hasRequiredRole = roles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      res.status(403).json({ 
        message: "No tienes permisos para acceder a este recurso" 
      });
      return;
    }

    next();
  };
};

export const authorize = (options: AuthorizeOptions) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ message: "Autenticación requerida" });
      return;
    }

    let isAuthorized = false;

    if (options.allowAdmin && (req.user.isAdmin || req.user.agentType === 'super_admin')) {
      isAuthorized = true;
    }

    if (!isAuthorized && options.allowRoles) {
      const userRoles: UserRole[] = [];
      
      if (req.user.isClient) {
        userRoles.push('client');
      } else {
        userRoles.push('agent');
      }
      
      if (req.user.isAdmin) {
        userRoles.push('admin');
      }

      if (req.user.agentType === 'super_admin') {
        userRoles.push('super_admin');
      }

      isAuthorized = options.allowRoles.some(role => userRoles.includes(role));
    }

    if (!isAuthorized && options.allowSelf) {
      try {
        const result = options.allowSelf(req.user, req);
        isAuthorized = await Promise.resolve(result);
      } catch (error) {
        console.error('Error in allowSelf check:', error);
        isAuthorized = false;
      }
    }

    if (!isAuthorized && options.allowAgencyClaimOwner && !req.user.isClient) {
      try {
        const agencyId = await Promise.resolve(options.allowAgencyClaimOwner(req));
        isAuthorized = agencyId ? await isAgencyClaimOwner(req.user, agencyId) : false;
      } catch (error) {
        console.error('Error in agency claim owner check:', error);
        isAuthorized = false;
      }
    }

    if (!isAuthorized && options.custom) {
      try {
        const result = options.custom(req.user, req);
        isAuthorized = await Promise.resolve(result);
      } catch (error) {
        console.error('Error in custom authorization check:', error);
        isAuthorized = false;
      }
    }

    if (!isAuthorized) {
      res.status(403).json({ 
        message: "No tienes permisos para acceder a este recurso" 
      });
      return;
    }

    next();
  };
};

export const isAgencyAdmin = (user: SessionUser, agencyId: number): boolean => {
  return user.isAdmin && user.agencyId === agencyId;
};

/** True when the user holds the verified ownership claim for the agency. */
export const isAgencyClaimOwner = async (user: SessionUser, agencyId: number): Promise<boolean> => {
  if (user.isClient) return false;
  const { ownsAgencyClaim } = await import("../services/profileClaimStore");
  return ownsAgencyClaim("agent", user.id, agencyId);
};

export const isResourceOwner = (user: SessionUser, resourceUserId: number): boolean => {
  return user.id === resourceUserId;
};

export const requireSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.user) {
    res.status(401).json({ message: "Autenticación requerida" });
    return;
  }

  if (req.user.agentType !== "super_admin") {
    res.status(403).json({ message: "Acceso restringido a SuperAdmin" });
    return;
  }

  next();
};

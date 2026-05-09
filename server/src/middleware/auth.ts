import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Express Request to include user data
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: "student" | "admin";
      };
    }
  }
}

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is required in production");
  }

  return "dev-only-secret-change-me";
};

/**
 * Middleware to verify JWT token from Authorization header
 * Expected format: "Bearer <token>"
 */
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        error: "Unauthorized",
        message: "No valid authorization header provided",
      });
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    const decoded = jwt.verify(token, getJwtSecret());

    // Attach user data to request
    req.user = decoded as {
      id: string;
      email: string;
      role: "student" | "admin";
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Token has expired",
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid token",
      });
    } else {
      res.status(500).json({
        error: "Internal Server Error",
        message: String(error),
      });
    }
  }
};

/**
 * Middleware to check if user is admin
 * Must be used after authMiddleware
 */
export const adminMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      error: "Unauthorized",
      message: "User not authenticated",
    });
    return;
  }

  if (req.user.role !== "admin") {
    res.status(403).json({
      error: "Forbidden",
      message: "Admin access required",
    });
    return;
  }

  next();
};

/**
 * Generate JWT token
 */
export const generateToken = (payload: {
  id: string;
  email: string;
  role: "student" | "admin";
}): string => {
  const secret = getJwtSecret();
  const options: any = {
    expiresIn: process.env.JWT_EXPIRY || "7d",
  };
  return jwt.sign(payload, secret, options);
};

import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { generateToken } from "../middleware/auth.js";
import { findUserByEmail, createUser, emailExists, findUserById } from "../lib/queries/userQueries.js";

/**
 * Login user
 * POST /api/auth/login
 * Body: { email, password }
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({
        error: "Bad Request",
        message: "Email and password are required",
      });
      return;
    }

    // Query user from database
    const user = await findUserByEmail(email);

    if (!user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid email or password",
      });
      return;
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid email or password",
      });
      return;
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: String(error),
    });
  }
};

/**
 * Register new user
 * POST /api/auth/register
 * Body: { email, password, name }
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;
    const role = "student";

    // Validate input
    if (!email || !password || !name) {
      res.status(400).json({
        error: "Bad Request",
        message: "Email, password, and name are required",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        error: "Bad Request",
        message: "Invalid email format",
      });
      return;
    }

    // Validate password strength (at least 6 characters)
    if (password.length < 6) {
      res.status(400).json({
        error: "Bad Request",
        message: "Password must be at least 6 characters",
      });
      return;
    }

    // Check if email already exists in database
    const emailAlreadyExists = await emailExists(email);
    if (emailAlreadyExists) {
      res.status(409).json({
        error: "Conflict",
        message: "Email already registered",
      });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    // Create user in database
    const newUser = await createUser(userId, email, hashedPassword, name, role);

    if (!newUser) {
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to create user",
      });
      return;
    }

    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: String(error),
    });
  }
};

/**
 * Get current user profile
 * GET /api/auth/profile
 */
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "No user authenticated",
      });
      return;
    }

    // Fetch full user data from database
    const user = await findUserById(req.user.id);

    if (!user) {
      res.status(404).json({
        error: "Not Found",
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: String(error),
    });
  }
};

import { executeQuery, executeQuerySingle, executeNonQuery } from "../database";

/**
 * Query: Find user by email
 */
export const findUserByEmail = async (email: string) => {
  const query = `
    SELECT id, email, password, name, role, createdAt, updatedAt
    FROM Users
    WHERE email = @email
  `;
  return executeQuerySingle(query, { email });
};

/**
 * Query: Find user by ID
 */
export const findUserById = async (id: string) => {
  const query = `
    SELECT id, email, password, name, role, createdAt, updatedAt
    FROM Users
    WHERE id = @id
  `;
  return executeQuerySingle(query, { id });
};

/**
 * Query: Create new user
 */
export const createUser = async (
  id: string,
  email: string,
  password: string,
  name: string,
  role: "student" | "admin" = "student"
) => {
  const query = `
    INSERT INTO Users (id, email, password, name, role, createdAt, updatedAt)
    VALUES (@id, @email, @password, @name, @role, GETUTCDATE(), GETUTCDATE())
  `;

  const rowsAffected = await executeNonQuery(query, {
    id,
    email,
    password,
    name,
    role,
  });

  if (rowsAffected > 0) {
    return findUserById(id);
  }
  return null;
};

/**
 * Query: Check if email exists
 */
export const emailExists = async (email: string): Promise<boolean> => {
  const user = await findUserByEmail(email);
  return user !== null;
};

/**
 * Query: Get all users (admin only)
 */
export const getAllUsers = async () => {
  const query = `
    SELECT id, email, name, role, createdAt, updatedAt
    FROM Users
    ORDER BY createdAt DESC
  `;
  return executeQuery(query);
};

/**
 * Query: Update user profile
 */
export const updateUser = async (
  id: string,
  updates: Partial<{ name: string; role: string }>
) => {
  const setClause: string[] = [];
  const params: Record<string, any> = { id };

  if (updates.name !== undefined) {
    setClause.push("name = @name");
    params.name = updates.name;
  }

  if (updates.role !== undefined) {
    setClause.push("role = @role");
    params.role = updates.role;
  }

  if (setClause.length === 0) {
    return findUserById(id);
  }

  setClause.push("updatedAt = GETUTCDATE()");

  const query = `
    UPDATE Users
    SET ${setClause.join(", ")}
    WHERE id = @id
  `;

  await executeNonQuery(query, params);
  return findUserById(id);
};

/**
 * Query: Delete user (admin only)
 */
export const deleteUser = async (id: string): Promise<number> => {
  const query = `
    DELETE FROM Users
    WHERE id = @id
  `;
  return executeNonQuery(query, { id });
};

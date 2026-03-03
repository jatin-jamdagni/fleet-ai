export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = "AppError";
  }
}

// ─── Auth Errors ─────────────────────────────────────────────────────────────
export const Errors = {
  // Auth
  INVALID_CREDENTIALS: new AppError(
    "INVALID_CREDENTIALS",
    "Invalid email or password",
    401
  ),
  UNAUTHORIZED: new AppError(
    "UNAUTHORIZED",
    "You must be logged in to access this resource",
    401
  ),
  FORBIDDEN: new AppError(
    "FORBIDDEN",
    "You do not have permission to perform this action",
    403
  ),
  TOKEN_EXPIRED: new AppError(
    "TOKEN_EXPIRED",
    "Your session has expired. Please log in again",
    401
  ),
  TOKEN_INVALID: new AppError(
    "TOKEN_INVALID",
    "Invalid authentication token",
    401
  ),

  // Tenant
  TENANT_SLUG_TAKEN: new AppError(
    "TENANT_SLUG_TAKEN",
    "This organisation slug is already taken",
    409
  ),
  TENANT_NOT_FOUND: new AppError(
    "TENANT_NOT_FOUND",
    "Organisation not found",
    404
  ),

  // User
  EMAIL_TAKEN: new AppError(
    "EMAIL_TAKEN",
    "An account with this email already exists",
    409
  ),
  USER_NOT_FOUND: new AppError(
    "USER_NOT_FOUND",
    "User not found",
    404
  ),

  // Generic
  NOT_FOUND: (resource: string) =>
    new AppError("NOT_FOUND", `${resource} not found`, 404),
  VALIDATION: (msg: string) =>
    new AppError("VALIDATION_ERROR", msg, 422),
  INTERNAL: new AppError(
    "INTERNAL_SERVER_ERROR",
    "An unexpected error occurred",
    500
  ),
} as const;
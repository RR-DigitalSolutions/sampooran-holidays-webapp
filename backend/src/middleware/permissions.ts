import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth";

type PermissionModule =
  | "ALL"
  | "PACKAGES"
  | "DESTINATIONS"
  | "BLOGS"
  | "INQUIRIES"
  | "SUPPORT"
  | "FINANCE"
  | "BOOKINGS"
  | "TRANSPORT"
  | "SETTINGS"
  | "USERS";

/**
 * requirePermission middleware factory.
 * SUPERADMIN with ["ALL"] bypasses every check.
 * Other staff must have the specific module in their adminPermissions array.
 */
export function requirePermission(module: PermissionModule) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Allow SUPERADMIN always
    if (user.role === "SUPERADMIN") return next();

    // Parse permissions from JWT payload
    let permissions: string[] = [];
    try {
      permissions = Array.isArray(user.adminPermissions)
        ? user.adminPermissions
        : JSON.parse(user.adminPermissions || "[]");
    } catch {
      permissions = [];
    }

    if (permissions.includes("ALL") || permissions.includes(module)) {
      return next();
    }

    return res.status(403).json({
      error: `Access denied. You do not have permission for module: ${module}`,
    });
  };
}

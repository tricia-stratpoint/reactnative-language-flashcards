export const SUPER_ADMIN_EMAIL = "pocketlingo.admin@yopmail.com";

export type UserRole = "user" | "moderator" | "super_admin";

export const isSuperAdmin = (email?: string, role?: UserRole) =>
  email === SUPER_ADMIN_EMAIL || role === "super_admin";

export const isModerator = (role?: UserRole) => role === "moderator";

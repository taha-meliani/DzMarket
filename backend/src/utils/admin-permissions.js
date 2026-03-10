export const ADMIN_PERMISSION_VALUES = [
  "users",
  "products",
  "orders",
  "payments",
  "verification",
  "support",
  "admins",
];

export function normalizeAdminPermissions(value) {
  if (!Array.isArray(value)) return [];
  const unique = Array.from(new Set(value.filter((item) => typeof item === "string")));
  return unique.filter((item) => ADMIN_PERMISSION_VALUES.includes(item));
}

export function hasAdminPermission(permissions, permission) {
  const normalized = normalizeAdminPermissions(permissions);
  return normalized.includes(permission);
}

export function hasAnyAdminPermission(permissions, required) {
  const normalized = normalizeAdminPermissions(permissions);
  return required.some((permission) => normalized.includes(permission));
}

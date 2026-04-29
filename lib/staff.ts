export const STAFF_ROLES = ["MANAGER", "SALES_MANAGER", "CASHIER"] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export type StaffSession = {
  staffId: string;
  name: string;
  username: string;
  email: string | null;
  role: StaffRole;
  expiresAt: number;
};

export function isStaffRole(value: string): value is StaffRole {
  return STAFF_ROLES.includes(value as StaffRole);
}

export function getRoleLabel(role: StaffRole) {
  if (role === "MANAGER") {
    return "Manager";
  }

  if (role === "SALES_MANAGER") {
    return "Sales Manager";
  }

  return "Cashier";
}

export function canManageInventory(role: StaffRole) {
  return role === "MANAGER" || role === "SALES_MANAGER";
}

export function canManageStaff(role: StaffRole) {
  return role === "MANAGER";
}

export function canAccessPath(role: StaffRole, pathname: string) {
  if (pathname === "/staff" || pathname.startsWith("/staff/")) {
    return canManageStaff(role);
  }

  if (
    pathname === "/inventory" ||
    pathname.startsWith("/inventory/") ||
    pathname === "/api/inventory" ||
    pathname.startsWith("/api/inventory/")
  ) {
    return canManageInventory(role);
  }

  return true;
}

export function getRoleCapabilities(role: StaffRole) {
  if (role === "MANAGER") {
    return [
      "Full dashboard and POS access",
      "Customer and order visibility",
      "AI brief access",
      "Creative studio access",
      "Personal password reset",
      "Product editing, restocks, and stock adjustments",
      "Staff directory and role oversight",
    ];
  }

  if (role === "SALES_MANAGER") {
    return [
      "Dashboard and checkout access",
      "Customer and order visibility",
      "AI brief access",
      "Creative studio access",
      "Personal password reset",
      "Product editing, restocks, and stock adjustments",
      "No staff administration access",
    ];
  }

  return [
    "Checkout and order lookup access",
    "Customer capture visibility",
    "Daily dashboard visibility",
    "Creative studio access",
    "Personal password reset",
    "No inventory administration access",
    "No staff administration access",
  ];
}

export const STAFF_ROLES = ["MANAGER", "SALES_MANAGER"] as const;

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
  return role === "MANAGER" ? "Manager" : "Sales Manager";
}

export function canAccessPath(role: StaffRole, pathname: string) {
  if (pathname === "/staff" || pathname.startsWith("/staff/")) {
    return role === "MANAGER";
  }

  return true;
}

export function getRoleCapabilities(role: StaffRole) {
  if (role === "MANAGER") {
    return [
      "Full dashboard and POS access",
      "Customer and order visibility",
      "AI brief access",
      "Staff directory and role oversight",
    ];
  }

  return [
    "Dashboard and checkout access",
    "Customer and order visibility",
    "AI brief access",
    "No staff administration access",
  ];
}

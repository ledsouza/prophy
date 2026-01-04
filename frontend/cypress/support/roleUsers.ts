export const ROLE_USERS = [
    "admin_user",
    "client_user",
    "unit_manager_user",
    "comercial_user",
    "external_physicist_user",
    "internal_physicist_user",
] as const;

export type RoleUser = (typeof ROLE_USERS)[number];

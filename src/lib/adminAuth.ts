export const ADMIN_EMAIL = "akbuffaloes540@gmail.com";
export const ADMIN_EMAILS = [
  ADMIN_EMAIL.toLowerCase(),
  "akbuffaloes786@gmail.com",
  "admin@akbuffaloes.com",
  "admin@akbuffaloes.in",
  "admin@gmail.com",
  "admin@admin.com",
  "admin",
  "akbuffaloes",
  "akbuffaloes540",
  "akbuffaloes786",
];

export const resolveAdminEmail = (input?: string | null): string => {
  if (!input) return ADMIN_EMAIL;
  const clean = input.trim().toLowerCase();
  if (clean === "admin" || clean === "akbuffaloes" || clean === "akbuffaloes540") {
    return ADMIN_EMAIL;
  }
  if (clean === "akbuffaloes786") {
    return "akbuffaloes786@gmail.com";
  }
  if (!clean.includes("@")) {
    return `${clean}@akbuffaloes.com`;
  }
  return input.trim();
};

export const isUserAdmin = (email?: string | null, role?: string | null): boolean => {
  // Regular user role is strictly never admin
  if (role === "user") return false;
  if (role === "admin") return true;
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  if (clean === "admin" || clean === "akbuffaloes" || clean === "akbuffaloes540" || clean === "akbuffaloes786") {
    return true;
  }
  if (ADMIN_EMAILS.includes(clean)) return true;
  if (clean.startsWith("admin@")) {
    return true;
  }
  return false;
};

export const ADMIN_EMAIL = "akbuffaloes540@gmail.com";
export const ADMIN_EMAILS = [
  ADMIN_EMAIL.toLowerCase(),
  "akbuffaloes786@gmail.com",
  "tanveerkakar294@gmail.com",
  "tanveerkakar@gmail.com",
  "admin@akbuffaloes.com",
  "admin@gmail.com",
  "admin@admin.com",
];

export const isUserAdmin = (email?: string | null, role?: string | null): boolean => {
  if (role === "admin") return true;
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  if (ADMIN_EMAILS.includes(clean)) return true;
  if (
    clean.startsWith("admin@") ||
    clean.includes("admin") ||
    clean.includes("akbuffaloes")
  ) {
    return true;
  }
  return false;
};

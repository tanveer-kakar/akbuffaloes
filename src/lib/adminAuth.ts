export const ADMIN_EMAIL = "akbuffaloes540@gmail.com";
export const ADMIN_EMAILS = [
  ADMIN_EMAIL.toLowerCase(),
];

export const isUserAdmin = (email?: string | null, role?: string | null): boolean => {
  if (role === "admin") return true;
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
};

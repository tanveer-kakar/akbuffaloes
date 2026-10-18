import { z } from "zod";

export const nameSchema = z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name too long");

export const phoneSchema = z.string().trim().regex(/^[0-9]{10}$/, "Phone must be 10 digits");

export const phoneOptionalSchema = z.string().trim().regex(/^([0-9]{10})?$/, "Phone must be 10 digits").optional().or(z.literal(""));

export const emailSchema = z.string().trim().min(1, "Email is required").email("Invalid email address").max(255);

export const messageSchema = z.string().trim().min(5, "Message must be at least 5 characters").max(1000, "Message too long");

export const messageOptionalSchema = z.string().trim().max(500, "Message too long").optional().or(z.literal(""));

// Form schemas
export const consultationSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  email: emailSchema,
});

export const contactSchema = z.object({
  name: nameSchema,
  phone: phoneOptionalSchema,
  email: emailSchema,
  message: messageSchema,
});

export const buffaloEnquirySchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  email: emailSchema,
  message: messageSchema,
});

export const bookInquirySchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  email: emailSchema,
  message: messageSchema,
});

export const profileSchema = z.object({
  fullName: nameSchema,
  phone: phoneSchema,
});

export type ValidationErrors = Record<string, string>;

export const getValidationErrors = (error: z.ZodError): ValidationErrors => {
  const errors: ValidationErrors = {};
  error.errors.forEach((err) => {
    const path = err.path[0] as string;
    if (path && !errors[path]) errors[path] = err.message;
  });
  return errors;
};

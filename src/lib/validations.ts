import { z } from "zod";

// ==================== Auth Validations ====================

export const signUpSchema = z.object({
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .max(255, "Email must be less than 255 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be less than 128 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;

// ==================== Space Validations ====================

export const tefillahSchema = z.enum(["shacharis", "mincha", "maariv"]);
export const tefillahDbSchema = z.enum(["SHACHARIS", "MINCHA", "MAARIV"]);
export const spaceStatusSchema = z.enum(["OPEN", "LOCKED", "STARTED", "CANCELLED", "EXPIRED"]);

export const createSpaceSchema = z.object({
  tefillah: tefillahDbSchema,
  start_time: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime()) && date > new Date();
  }, "Start time must be a valid future date"),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  map_x: z.number().int().min(0).max(100),
  map_y: z.number().int().min(0).max(100),
  address: z
    .string()
    .max(500, "Address must be less than 500 characters")
    .nullable(),
  notes: z
    .string()
    .max(1000, "Notes must be less than 1000 characters")
    .nullable(),
  status: spaceStatusSchema.default("OPEN"),
  capacity: z.number().int().min(1).max(100).default(10),
  quorum_count: z.number().int().min(0).default(0),
  host_id: z.string().uuid("Invalid host ID"),
  presence_rule: z.string().max(500).nullable(),
});

export const updateSpaceSchema = z.object({
  id: z.string().uuid("Invalid space ID"),
  start_time: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, "Start time must be a valid date").optional(),
  address: z.string().max(500).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  status: spaceStatusSchema.optional(),
  capacity: z.number().int().min(1).max(100).optional(),
});

export type CreateSpaceInput = z.infer<typeof createSpaceSchema>;
export type UpdateSpaceInput = z.infer<typeof updateSpaceSchema>;

// ==================== Membership Validations ====================

export const joinSpaceSchema = z.object({
  spaceId: z.string().uuid("Invalid space ID"),
  userId: z.string().uuid("Invalid user ID"),
});

export const leaveSpaceSchema = z.object({
  spaceId: z.string().uuid("Invalid space ID"),
  userId: z.string().uuid("Invalid user ID"),
});

export type JoinSpaceInput = z.infer<typeof joinSpaceSchema>;
export type LeaveSpaceInput = z.infer<typeof leaveSpaceSchema>;

// ==================== Chat/Message Validations ====================

export const sendMessageSchema = z.object({
  spaceId: z.string().uuid("Invalid space ID"),
  userId: z.string().uuid("Invalid user ID"),
  text: z
    .string()
    .min(1, "Message cannot be empty")
    .max(2000, "Message must be less than 2000 characters")
    .transform((val) => val.trim()),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

// ==================== Profile Validations ====================

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes")
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ==================== Utility Functions ====================

export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errorMessage = result.error.issues.map((e) => e.message).join(", ");
  return { success: false, error: errorMessage };
}

// Sanitize user input to prevent XSS
export function sanitizeText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

import { ClientStatus, DealStage, DiscountType, LeadSource, LeadStatus, MeetingStatus, Role, TaskPriority, TaskStatus } from "@prisma/client";
import { z } from "zod";

const requiredString = (label: string, max = 120) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} must be ${max} characters or fewer.`);

const moneyField = z.coerce.number().positive("Enter a valid amount.");
const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? new Date(value) : undefined))
  .refine((value) => value === undefined || !Number.isNaN(value.getTime()), "Enter a valid date.");

const requiredDateTime = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .transform((value) => new Date(value))
    .refine((value) => !Number.isNaN(value.getTime()), "Enter a valid date.");

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const registerSchema = loginSchema
  .extend({
    name: requiredString("Name"),
    title: z.string().trim().max(100).optional().or(z.literal("")),
    confirmPassword: z.string().min(8, "Confirm your password."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const clientSchema = z.object({
  id: z.string().optional(),
  name: requiredString("Contact name"),
  company: requiredString("Company"),
  email: z.string().trim().email("Enter a valid email."),
  phone: requiredString("Phone", 40),
  status: z.nativeEnum(ClientStatus),
  segment: z.string().trim().max(80).optional().or(z.literal("")),
  location: z.string().trim().max(120).optional().or(z.literal("")),
  monthlyValue: moneyField,
  ownerId: requiredString("Owner"),
});

export const leadSchema = z.object({
  id: z.string().optional(),
  name: requiredString("Lead name"),
  company: requiredString("Company"),
  email: z.string().trim().email("Enter a valid email."),
  phone: requiredString("Phone", 40),
  source: z.nativeEnum(LeadSource),
  status: z.nativeEnum(LeadStatus),
  estimatedValue: moneyField,
  ownerId: requiredString("Owner"),
  nextFollowUpAt: optionalDate,
  clientId: z.string().optional().or(z.literal("")),
});

export const dealSchema = z.object({
  id: z.string().optional(),
  title: requiredString("Deal title"),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  stage: z.nativeEnum(DealStage),
  currency: z.string().trim().min(3).max(3).transform((value) => value.toUpperCase()),
  grossAmount: moneyField,
  closeDate: optionalDate,
  clientId: requiredString("Client"),
  leadId: z.string().optional().or(z.literal("")),
  ownerId: requiredString("Owner"),
  promoCode: z.string().trim().max(40).optional().or(z.literal("")),
});

export const promoCodeSchema = z
  .object({
    id: z.string().optional(),
    code: requiredString("Code", 40).transform((value) => value.toUpperCase()),
    description: z.string().trim().max(180).optional().or(z.literal("")),
    active: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => value !== "false"),
    expiresAt: optionalDate,
    usageLimit: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? Number(value) : undefined))
      .refine((value) => value === undefined || (Number.isInteger(value) && value > 0), "Enter a whole number."),
    discountType: z.nativeEnum(DiscountType),
    discountValue: moneyField,
  })
  .refine(
    (value) => !(value.discountType === DiscountType.PERCENT && value.discountValue > 100),
    {
      message: "Percent discounts cannot exceed 100.",
      path: ["discountValue"],
    },
  );

export const taskSchema = z.object({
  id: z.string().optional(),
  title: requiredString("Task title"),
  description: z.string().trim().max(280).optional().or(z.literal("")),
  status: z.nativeEnum(TaskStatus),
  priority: z.nativeEnum(TaskPriority),
  dueDate: z.coerce.date({ message: "Enter a valid due date." }),
  assignedToId: requiredString("Assignee"),
  clientId: z.string().optional().or(z.literal("")),
  leadId: z.string().optional().or(z.literal("")),
  dealId: z.string().optional().or(z.literal("")),
});

export const meetingSchema = z
  .object({
    id: z.string().optional(),
    title: requiredString("Meeting title"),
    description: z.string().trim().max(500).optional().or(z.literal("")),
    status: z.nativeEnum(MeetingStatus),
    startsAt: requiredDateTime("Start time"),
    endsAt: requiredDateTime("End time"),
    location: z.string().trim().max(160).optional().or(z.literal("")),
    meetingLink: z.string().trim().max(280).optional().or(z.literal("")),
    outcome: z.string().trim().max(500).optional().or(z.literal("")),
    clientId: requiredString("Client"),
    assignedToId: requiredString("Assignee"),
  })
  .refine((value) => value.endsAt > value.startsAt, {
    message: "Meeting end must be after the start time.",
    path: ["endsAt"],
  });

export const noteSchema = z.object({
  body: z.string().trim().min(3, "Enter a short note.").max(1000, "Note is too long."),
  clientId: z.string().optional().or(z.literal("")),
  leadId: z.string().optional().or(z.literal("")),
  dealId: z.string().optional().or(z.literal("")),
});

export const userSchema = z.object({
  id: z.string().optional(),
  name: requiredString("Name"),
  email: z.string().trim().email("Enter a valid email."),
  role: z.nativeEnum(Role),
  roleLabel: z.string().trim().max(60, "Custom role name must be 60 characters or fewer.").optional().or(z.literal("")),
  title: z.string().trim().max(100).optional().or(z.literal("")),
  password: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || value.length >= 8, "Passwords must be at least 8 characters."),
});

export const settingsSchema = z.object({
  name: requiredString("Name"),
  title: z.string().trim().max(100).optional().or(z.literal("")),
  avatarColor: z.string().trim().regex(/^#([A-Fa-f0-9]{6})$/, "Choose a valid hex color."),
});

export const promoCodePreviewSchema = z.object({
  code: z.string().trim().min(1, "Enter a promo code."),
  amount: moneyField,
});

export function getFieldErrors(error: z.ZodError) {
  return error.flatten().fieldErrors as Record<string, string[]>;
}

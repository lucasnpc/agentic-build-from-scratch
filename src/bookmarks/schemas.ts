import { z } from "zod";

const urlSchema = z
  .string({ required_error: "url is required" })
  .trim()
  .min(1, "url is required")
  .url("url must be a valid http(s) URL")
  .refine(
    (value) => {
      try {
        const parsed = new URL(value);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "url must use http or https" }
  );

const titleSchema = z
  .string({ required_error: "title is required" })
  .trim()
  .min(1, "title cannot be empty")
  .max(500, "title is too long");

const descriptionSchema = z
  .union([z.string().trim().max(2000, "description is too long"), z.null()])
  .optional();

const tagsSchema = z
  .array(z.string().trim().min(1, "tag cannot be empty").max(50, "tag is too long"))
  .max(20, "no more than 20 tags allowed")
  .optional();

export const CreateBookmarkSchema = z
  .object({
    url: urlSchema,
    title: titleSchema,
    description: descriptionSchema,
    tags: tagsSchema,
  })
  .strict();

export type CreateBookmarkPayload = z.infer<typeof CreateBookmarkSchema>;

export const UpdateBookmarkSchema = z
  .object({
    url: urlSchema.optional(),
    title: titleSchema.optional(),
    description: descriptionSchema,
    tags: tagsSchema,
  })
  .strict()
  .refine(
    (value) =>
      value.url !== undefined ||
      value.title !== undefined ||
      value.description !== undefined ||
      value.tags !== undefined,
    { message: "update body cannot be empty" }
  );

export type UpdateBookmarkPayload = z.infer<typeof UpdateBookmarkSchema>;

export const ListQuerySchema = z
  .object({
    tag: z.string().trim().min(1).max(50).optional(),
  })
  .strict();

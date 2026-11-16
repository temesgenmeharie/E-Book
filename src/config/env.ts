import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  APP_SECRET: z.string().min(32, "APP_SECRET must be at least 32 characters"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  
  // Storage
  STORAGE_ENDPOINT: z.string().default("localhost"),
  STORAGE_PORT: z.coerce.number().default(9000),
  STORAGE_USE_SSL: z.coerce.boolean().default(false),
  STORAGE_ACCESS_KEY: z.string().default("minio_admin"),
  STORAGE_SECRET_KEY: z.string().default("minio_secret_secure"),
  STORAGE_BUCKET_PRIVATE: z.string().default("ebook-private-assets"),
  STORAGE_BUCKET_PUBLIC: z.string().default("ebook-public-covers"),

  // Redis
  REDIS_URL: z.string().default("redis://localhost:6379"),

  // Cookies
  SESSION_COOKIE_NAME: z.string().default("ebook_session"),
  SESSION_MAX_AGE_SECONDS: z.coerce.number().default(604800),

  // Platform Defaults
  DEFAULT_COMMISSION_RATE: z.coerce.number().min(0).max(1).default(0.1500),
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  APP_SECRET: process.env.APP_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
  STORAGE_ENDPOINT: process.env.STORAGE_ENDPOINT,
  STORAGE_PORT: process.env.STORAGE_PORT,
  STORAGE_USE_SSL: process.env.STORAGE_USE_SSL,
  STORAGE_ACCESS_KEY: process.env.STORAGE_ACCESS_KEY,
  STORAGE_SECRET_KEY: process.env.STORAGE_SECRET_KEY,
  STORAGE_BUCKET_PRIVATE: process.env.STORAGE_BUCKET_PRIVATE,
  STORAGE_BUCKET_PUBLIC: process.env.STORAGE_BUCKET_PUBLIC,
  REDIS_URL: process.env.REDIS_URL,
  SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS: process.env.SESSION_MAX_AGE_SECONDS,
  DEFAULT_COMMISSION_RATE: process.env.DEFAULT_COMMISSION_RATE,
});


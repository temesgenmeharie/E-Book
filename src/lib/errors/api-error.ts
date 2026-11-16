import { NextResponse } from "next/server";

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  errors?: Record<string, string[]>;
}

export class AppError extends Error {
  public readonly status: number;
  public readonly type: string;
  public readonly errors?: Record<string, string[]>;

  constructor(params: {
    message: string;
    status?: number;
    type?: string;
    errors?: Record<string, string[]>;
  }) {
    super(params.message);
    this.name = "AppError";
    this.status = params.status || 400;
    this.type = params.type || "https://api.ebook.market/errors/bad-request";
    this.errors = params.errors;
  }

  static badRequest(message: string, errors?: Record<string, string[]>) {
    return new AppError({
      message,
      status: 400,
      type: "https://api.ebook.market/errors/bad-request",
      errors,
    });
  }

  static unauthorized(message = "Authentication required") {
    return new AppError({
      message,
      status: 401,
      type: "https://api.ebook.market/errors/unauthorized",
    });
  }

  static forbidden(message = "Access denied") {
    return new AppError({
      message,
      status: 403,
      type: "https://api.ebook.market/errors/forbidden",
    });
  }

  static notFound(resource = "Resource") {
    return new AppError({
      message: `${resource} not found`,
      status: 404,
      type: "https://api.ebook.market/errors/not-found",
    });
  }

  static conflict(message: string) {
    return new AppError({
      message,
      status: 409,
      type: "https://api.ebook.market/errors/conflict",
    });
  }

  static internal(message = "An unexpected error occurred") {
    return new AppError({
      message,
      status: 500,
      type: "https://api.ebook.market/errors/internal-server-error",
    });
  }
}

export function toProblemResponse(error: unknown, instance?: string): NextResponse<ProblemDetails> {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        type: error.type,
        title: error.name,
        status: error.status,
        detail: error.message,
        instance,
        errors: error.errors,
      },
      { status: error.status }
    );
  }

  const message = error instanceof Error ? error.message : "Internal server error";
  return NextResponse.json(
    {
      type: "https://api.ebook.market/errors/internal-server-error",
      title: "InternalServerError",
      status: 500,
      detail: message,
      instance,
    },
    { status: 500 }
  );
}


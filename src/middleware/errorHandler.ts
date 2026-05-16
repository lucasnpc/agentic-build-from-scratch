import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { HttpError } from "../errors";

interface ErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}

export const notFoundHandler: RequestHandler = (req, res) => {
  const body: ErrorBody = {
    error: {
      code: "not_found",
      message: `Route ${req.method} ${req.path} does not exist`,
      requestId: req.id as string | undefined,
    },
  };
  res.status(404).json(body);
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const requestId = req.id as string | undefined;

  if (err instanceof HttpError) {
    const body: ErrorBody = {
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId,
      },
    };
    res.status(err.status).json(body);
    return;
  }

  if (err instanceof ZodError) {
    const body: ErrorBody = {
      error: {
        code: "validation_error",
        message: "Request body is invalid",
        details: err.flatten(),
        requestId,
      },
    };
    res.status(400).json(body);
    return;
  }

  if (err instanceof SyntaxError && "body" in err) {
    const body: ErrorBody = {
      error: {
        code: "malformed_json",
        message: "Request body is not valid JSON",
        requestId,
      },
    };
    res.status(400).json(body);
    return;
  }

  req.log?.error({ err }, "unhandled error");
  const body: ErrorBody = {
    error: {
      code: "internal_error",
      message: "Something went wrong handling the request",
      requestId,
    },
  };
  res.status(500).json(body);
};

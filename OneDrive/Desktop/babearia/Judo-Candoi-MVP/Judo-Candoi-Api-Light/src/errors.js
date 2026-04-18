export class ApiError extends Error {
  constructor(status, error, message, details = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.error = error;
    this.details = details;
  }
}

export function badRequest(message, details = null) {
  return new ApiError(400, "BAD_REQUEST", message, details);
}

export function unauthorized(message, details = null) {
  return new ApiError(401, "UNAUTHORIZED", message, details);
}

export function notFound(message, details = null) {
  return new ApiError(404, "NOT_FOUND", message, details);
}

export function conflict(message, details = null) {
  return new ApiError(409, "CONFLICT", message, details);
}

export function internalServerError(message, details = null) {
  return new ApiError(500, "INTERNAL_SERVER_ERROR", message, details);
}

export function buildErrorBody(error) {
  return {
    status: error.status,
    error: error.error,
    message: error.message,
    timestamp: new Date().toISOString(),
    details: error.details
  };
}

export function errorHandler(error, _req, res, _next) {
  if (error instanceof ApiError) {
    return res.status(error.status).json(buildErrorBody(error));
  }

  if (error?.type === "entity.parse.failed") {
    const body = buildErrorBody(
      badRequest("Corpo da requisicao invalido.", error?.message ?? "JSON invalido")
    );
    return res.status(400).json(body);
  }

  if (error?.code === "LIMIT_FILE_SIZE") {
    const body = buildErrorBody(badRequest("Arquivo excede o tamanho maximo permitido."));
    return res.status(400).json(body);
  }

  const body = buildErrorBody(
    internalServerError("Erro interno inesperado.", error?.message ?? "Erro nao identificado")
  );

  return res.status(500).json(body);
}

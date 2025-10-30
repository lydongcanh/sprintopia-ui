import type { CreateGroomingSessionRequest, CreateGroomingSessionResponse, HTTPValidationError, GroomingSession } from "@/types/api";

const API_BASE_URL = "http://127.0.0.1:8000";

export class APIError extends Error {
  status: number;
  validationErrors?: HTTPValidationError;

  constructor(
    message: string,
    status: number,
    validationErrors?: HTTPValidationError
  ) {
    super(message);
    this.name = "APIError";
    this.status = status;
    this.validationErrors = validationErrors;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const errorData = await response.json();
      throw new APIError(
        `API Error: ${response.status} ${response.statusText}`,
        response.status,
        errorData
      );
    }
    throw new APIError(
      `API Error: ${response.status} ${response.statusText}`,
      response.status
    );
  }
  
  return response.json();
}

export const api = {
  async createGroomingSession(
    request: CreateGroomingSessionRequest
  ): Promise<CreateGroomingSessionResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/grooming-sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    return handleResponse<CreateGroomingSessionResponse>(response);
  },

  async getGroomingSession(sessionId: string): Promise<GroomingSession | null> {
    const response = await fetch(`${API_BASE_URL}/api/v1/grooming-sessions/${sessionId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status === 404) {
      return null;
    }

    return handleResponse<GroomingSession>(response);
  },
};

export default api;
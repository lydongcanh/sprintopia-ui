import type { CreateGroomingSessionRequest, CreateGroomingSessionResponse, HTTPValidationError, GroomingSession, CreateUserRequest, CreateUserResponse } from "@/types/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1";
const SERVER_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || "http://127.0.0.1:8000";

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
  async healthCheck(): Promise<{ status: 'online' | 'offline'; response_time?: number }> {
    const startTime = Date.now();
    try {
      const response = await fetch(`${SERVER_BASE_URL}/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Add a timeout to prevent hanging
        signal: AbortSignal.timeout(5000),
      });

      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        return { status: 'online', response_time: responseTime };
      } else {
        return { status: 'offline' };
      }
    } catch (error) {
      console.warn('Health check failed:', error);
      return { status: 'offline' };
    }
  },

  async createUser(
    request: CreateUserRequest
  ): Promise<CreateUserResponse> {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    return handleResponse<CreateUserResponse>(response);
  },

  async createGroomingSession(
    request: CreateGroomingSessionRequest
  ): Promise<CreateGroomingSessionResponse> {
    const response = await fetch(`${API_BASE_URL}/grooming-sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    return handleResponse<CreateGroomingSessionResponse>(response);
  },

  async getGroomingSession(sessionId: string): Promise<GroomingSession | null> {
    const response = await fetch(`${API_BASE_URL}/grooming-sessions/${sessionId}`, {
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

  async getAllGroomingSessions(): Promise<GroomingSession[]> {
    const response = await fetch(`${API_BASE_URL}/grooming-sessions`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    return handleResponse<GroomingSession[]>(response);
  },
};

export default api;
// API Types based on FastAPI OpenAPI schema

export type EntityStatus = "active" | "disabled" | "deleted";

export interface CreateGroomingSessionRequest {
  name: string;
}

export interface GroomingSession {
  id: string;
  created_at: string;
  updated_at: string;
  status: EntityStatus;
  name: string;
  real_time_channel_name: string;
}

export interface HTTPValidationError {
  detail?: ValidationError[];
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

// API Response types
export type CreateGroomingSessionResponse = GroomingSession | null;
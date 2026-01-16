import { Alert, AnalyticsSummary, AuthToken, Patient, Vital } from "./types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const tokenStorage = {
  get: () => localStorage.getItem("rpm_token") || "",
  set: (token: string) => localStorage.setItem("rpm_token", token),
  clear: () => localStorage.removeItem("rpm_token"),
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStorage.get();
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }
  return response.json();
}

export const api = {
  login: (username: string, password: string) =>
    request<AuthToken>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  getPatients: () => request<Patient[]>("/api/v1/patients"),
  getPatient: (patientId: string) => request<Patient>(`/api/v1/patients/${patientId}`),
  getVitals: (patientId: string, metric?: string) => {
    const params = new URLSearchParams();
    if (metric) params.append("metric", metric);
    return request<Vital[]>(`/api/v1/vitals/${patientId}?${params.toString()}`);
  },
  getAlerts: (patientId?: string) => {
    const params = new URLSearchParams();
    if (patientId) params.append("patient_id", patientId);
    return request<Alert[]>(`/api/v1/alerts?${params.toString()}`);
  },
  acknowledgeAlert: (alertId: string, note: string) =>
    request<Alert>(`/api/v1/alerts/${alertId}/acknowledge`, {
      method: "POST",
      body: JSON.stringify({ clinician_note: note }),
    }),
  getAnalytics: (patientId: string) =>
    request<AnalyticsSummary>(`/api/v1/analytics/summary?patient_id=${patientId}`),
};

export function createWebSocket(onMessage: (data: unknown) => void) {
  const token = tokenStorage.get();
  const wsUrl = `${API_URL.replace("http", "ws")}/ws/stream?token=${token}`;
  const socket = new WebSocket(wsUrl);
  socket.onmessage = (event) => {
    try {
      onMessage(JSON.parse(event.data));
    } catch {
      onMessage(event.data);
    }
  };
  return socket;
}

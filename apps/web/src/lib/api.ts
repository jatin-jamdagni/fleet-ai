import axios, {
  AxiosHeaders,
  type AxiosError,
  type AxiosRequestConfig,
} from "axios";
import type {
  AILogEntry,
  ApiError as SharedApiError,
  ApiResponse,
  AssignDriverRequest,
  AuthTokens,
  CreateVehicleRequest,
  Invoice,
  InvoiceStatus,
  LoginRequest,
  LoginResponse,
  ManualIngestionResponse,
  RegisterRequest,
  Role,
  Trip,
  TripStatus,
  UpdateInvoiceStatusRequest,
  UpdateVehicleRequest,
  Vehicle,
  VehicleStatus,
} from "@fleet/shared";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

type RetriableConfig = AxiosRequestConfig & { _retry?: boolean };

export interface DriverRef {
  id: string;
  name: string;
  email: string;
}

export interface VehicleWithDriver extends Vehicle {
  assignedDriver: DriverRef | null;
  updatedAt: string;
}

export interface VehicleStats {
  total: number;
  active: number;
  inTrip: number;
  inactive: number;
}

export interface TeamUserVehicle {
  id: string;
  licensePlate: string;
  make: string;
  model: string;
  status: VehicleStatus;
}

export interface TeamUser {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: Role;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  vehicle: TeamUserVehicle | null;
}

export interface TeamStats {
  total: number;
  managers: number;
  drivers: number;
  activeDrivers: number;
}

export interface InviteUserRequest {
  name: string;
  email: string;
  role: Role;
}

export interface InviteUserResponse {
  user: TeamUser;
  inviteUrl: string;
}

export interface InvoiceWithRelations extends Invoice {
  vehicle: {
    licensePlate: string;
    make: string;
    model: string;
  } | null;
  trip: {
    startTime: string;
    endTime: string | null;
    status: TripStatus;
  } | null;
}

export interface BillingSummary {
  totalInvoices: number;
  pendingCount: number;
  paidCount: number;
  voidCount: number;
  monthlyRevenue: number;
  totalRevenue: number;
  avgDistanceKm: string;
}

export interface TripInvoiceRef {
  id: string;
  totalAmount: number;
  status: InvoiceStatus;
}

export interface TripListItem extends Trip {
  vehicle: {
    licensePlate: string;
    make: string;
    model: string;
  };
  driver: {
    name: string;
    email: string;
  };
  invoice: TripInvoiceRef | null;
}

export interface AILogListItem extends Omit<AILogEntry, "tenantId"> {
  driver: {
    name: string;
    email: string;
  } | null;
}

export interface AIHealth {
  provider: string;
  available: boolean;
  embedTest: boolean;
  chatTest: boolean;
}

export interface LiveGpsPosition {
  vehicleId: string;
  tripId: string;
  driverId: string;
  driverName: string;
  licensePlate: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  timestamp: string;
}

export interface TripRoutePoint {
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  timestamp: string;
}

export interface TripRouteGeoJson {
  type: "Feature";
  geometry: {
    type: "LineString";
    coordinates: number[][];
  };
  properties: {
    tripId: string;
    pingCount: number;
    startTime: string | null;
    endTime: string | null;
  };
}

export type CurrentUser = LoginResponse["user"] & {
  tenantPlan?: string;
  lastLoginAt?: string | null;
  createdAt?: string;
};

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface VehicleListParams extends PaginationParams {
  search?: string;
  status?: VehicleStatus;
}

export interface UserListParams extends PaginationParams {
  search?: string;
  role?: Role;
}

export interface TripListParams extends PaginationParams {
  vehicleId?: string;
  driverId?: string;
  status?: TripStatus;
  from?: string;
  to?: string;
}

export interface InvoiceListParams extends PaginationParams {
  status?: InvoiceStatus;
  vehicleId?: string;
  driverId?: string;
  from?: string;
  to?: string;
}

export interface AILogListParams extends PaginationParams {
  vehicleId?: string;
  driverId?: string;
  from?: string;
  to?: string;
}

export type AnalyticsPeriod = "day" | "week" | "month";

export interface AnalyticsRangeParams {
  from?: string;
  to?: string;
  period?: AnalyticsPeriod;
}

export interface AnalyticsOverview {
  totalTrips: number;
  tripsThisMonth: number;
  tripDelta: number | null;
  totalDistanceKm: number;
  distanceThisMonth: number;
  distanceDelta: number | null;
  revenueThisMonth: number;
  revenueDelta: number | null;
  totalRevenue: number;
  avgTripDistanceKm: string;
  activeVehicles: number;
  totalDrivers: number;
}

export interface RevenueSeriesItem {
  period: string;
  revenue: number;
  count: number;
}

export interface DistanceSeriesItem {
  period: string;
  distanceKm: number;
  trips: number;
}

export interface DriverLeaderboardItem {
  rank: number;
  driverId: string;
  driverName: string;
  email: string;
  trips: number;
  distanceKm: string;
  revenue: string;
  avgDistance: string;
}

export interface VehicleUtilizationItem {
  vehicleId: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  trips: number;
  distanceKm: string;
  revenue: string;
  costPerKm: string;
  activeDays: number;
  efficiency: string;
}

export interface HourDistributionItem {
  hour: number;
  label: string;
  trips: number;
}

export interface MutationSuccess {
  message?: string;
  deleted?: boolean;
  userId?: string;
  vehicleId?: string;
}

export function getApiErrorMessage(error: unknown, fallback = "Failed"): string {
  if (axios.isAxiosError<SharedApiError>(error)) {
    return error.response?.data?.error?.message ?? fallback;
  }
  return fallback;
}

// Auto-attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    if (!config.headers) {
      config.headers = new AxiosHeaders();
    }
    if (config.headers instanceof AxiosHeaders) {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<SharedApiError>) => {
    const original = error.config as RetriableConfig | undefined;

    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem("refreshToken");
        if (!refresh) throw new Error("No refresh token");

        const response = await axios.post<ApiResponse<AuthTokens>>(
          `${API_URL}/auth/refresh`,
          { refreshToken: refresh }
        );
        const { accessToken, refreshToken } = response.data.data;

        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);

        if (!original.headers) {
          original.headers = new AxiosHeaders();
        }
        if (original.headers instanceof AxiosHeaders) {
          original.headers.set("Authorization", `Bearer ${accessToken}`);
        } else {
          (original.headers as Record<string, string>).Authorization = `Bearer ${accessToken}`;
        }

        return axios(original);
      } catch {
        localStorage.clear();
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

// API Methods
export const authApi = {
  register: (data: RegisterRequest) =>
    api.post<ApiResponse<LoginResponse>>("/auth/register", data),
  login: (data: LoginRequest) =>
    api.post<ApiResponse<LoginResponse>>("/auth/login", data),
  me: () => api.get<ApiResponse<CurrentUser>>("/auth/me"),
  logout: () => api.post<ApiResponse<{ message: string }>>("/auth/logout"),
};

export const vehiclesApi = {
  list: (params?: VehicleListParams) =>
    api.get<ApiResponse<VehicleWithDriver[]>>("/vehicles", { params }),
  stats: () => api.get<ApiResponse<VehicleStats>>("/vehicles/stats"),
  get: (id: string) => api.get<ApiResponse<VehicleWithDriver>>(`/vehicles/${id}`),
  create: (data: CreateVehicleRequest) =>
    api.post<ApiResponse<VehicleWithDriver>>("/vehicles", data),
  update: (id: string, data: UpdateVehicleRequest) =>
    api.patch<ApiResponse<VehicleWithDriver>>(`/vehicles/${id}`, data),
  remove: (id: string) =>
    api.delete<ApiResponse<MutationSuccess>>(`/vehicles/${id}`),
  assign: (id: string, data: AssignDriverRequest) =>
    api.post<ApiResponse<VehicleWithDriver>>(`/vehicles/${id}/assign`, data),
};

export const usersApi = {
  list: (params?: UserListParams) =>
    api.get<ApiResponse<TeamUser[]>>("/users", { params }),
  stats: () => api.get<ApiResponse<TeamStats>>("/users/stats"),
  invite: (data: InviteUserRequest) =>
    api.post<ApiResponse<InviteUserResponse>>("/users/invite", data),
  update: (id: string, data: { name?: string }) =>
    api.patch<ApiResponse<TeamUser>>(`/users/${id}`, data),
  remove: (id: string) => api.delete<ApiResponse<MutationSuccess>>(`/users/${id}`),
};

export const tripsApi = {
  active: () => api.get<ApiResponse<unknown>>("/trips/active"),
  all: (params?: TripListParams) =>
    api.get<ApiResponse<TripListItem[]>>("/trips/all", { params }),
  get: (id: string) => api.get<ApiResponse<TripListItem>>(`/trips/${id}`),
  forceEnd: (id: string) => api.post<ApiResponse<TripListItem>>(`/trips/${id}/force-end`),
};

export const invoicesApi = {
  list: (params?: InvoiceListParams) =>
    api.get<ApiResponse<InvoiceWithRelations[]>>("/invoices", { params }),
  summary: () => api.get<ApiResponse<BillingSummary>>("/invoices/summary"),
  get: (id: string) => api.get<ApiResponse<InvoiceWithRelations>>(`/invoices/${id}`),
  update: (id: string, data: UpdateInvoiceStatusRequest) =>
    api.patch<ApiResponse<InvoiceWithRelations>>(`/invoices/${id}/status`, data),
  pdfUrl: (id: string) => `${API_URL}/invoices/${id}/pdf`,
};

export const aiApi = {
  health: () => api.get<ApiResponse<AIHealth>>("/ai/health"),
  logs: (params?: AILogListParams) =>
    api.get<ApiResponse<AILogListItem[]>>("/ai/logs", { params }),
  uploadManual: (vehicleId: string, file: File) => {
    const form = new FormData();
    form.append("manual", file);
    return api.post<ApiResponse<ManualIngestionResponse>>(
      `/ai/vehicles/${vehicleId}/manual`,
      form,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
  },
  deleteManual: (vehicleId: string) =>
    api.delete<ApiResponse<{ deleted: number }>>(`/ai/vehicles/${vehicleId}/manual`),
};

export const gpsApi = {
  live: () => api.get<ApiResponse<LiveGpsPosition[]>>("/gps/live"),
  liveByVehicle: (vehicleId: string) =>
    api.get<ApiResponse<LiveGpsPosition>>(`/gps/live/${vehicleId}`),
  tripRoute: (tripId: string) =>
    api.get<ApiResponse<{ pings: TripRoutePoint[]; geojson: TripRouteGeoJson }>>(
      `/gps/trips/${tripId}/route`
    ),
  stats: () =>
    api.get<
      ApiResponse<{
        connectedDrivers: number;
        connectedManagers: number;
        activeVehicles: number;
        pendingPingTrips: number;
        tenantLiveVehicles: number;
      }>
    >("/gps/stats"),
};


export const analyticsApi = {
  overview: (params?: AnalyticsRangeParams) =>
    api.get<ApiResponse<AnalyticsOverview>>("/analytics/overview", { params }),
  revenue: (params?: AnalyticsRangeParams) =>
    api.get<ApiResponse<RevenueSeriesItem[]>>("/analytics/revenue", { params }),
  distance: (params?: AnalyticsRangeParams) =>
    api.get<ApiResponse<DistanceSeriesItem[]>>("/analytics/distance", { params }),
  drivers: (params?: AnalyticsRangeParams) =>
    api.get<ApiResponse<DriverLeaderboardItem[]>>("/analytics/drivers", { params }),
  vehicles: (params?: AnalyticsRangeParams) =>
    api.get<ApiResponse<VehicleUtilizationItem[]>>("/analytics/vehicles", { params }),
  hours: (params?: AnalyticsRangeParams) =>
    api.get<ApiResponse<HourDistributionItem[]>>("/analytics/hours", { params }),
  exportCsv: (params?: AnalyticsRangeParams) => {
    const token = localStorage.getItem("accessToken") ?? "";
    const searchParams = new URLSearchParams();

    if (params?.from) searchParams.set("from", params.from);
    if (params?.to) searchParams.set("to", params.to);
    if (params?.period) searchParams.set("period", params.period);

    const qs = searchParams.toString();
    const url = `${api.defaults.baseURL}/analytics/export/trips.csv${qs ? `?${qs}` : ""}`;

    return fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        if (!r.ok) {
          throw new Error(`CSV export failed (${r.status})`);
        }
        return r.blob();
      })
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `fleet-trips-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
      });
  },
};

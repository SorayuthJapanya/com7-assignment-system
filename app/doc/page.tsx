"use client";

import { useState } from "react";
import { Lock, Globe, ChevronDown, ChevronRight } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type Method = "GET" | "POST" | "PUT" | "DELETE";

interface Param {
  name: string;
  type: string;
  required: boolean;
  description: string;
  enum?: string[];
  default?: string;
}

interface ApiResponse {
  status: number;
  description: string;
  example?: unknown;
}

interface Endpoint {
  id: string;
  method: Method;
  path: string;
  title: string;
  description: string;
  auth: boolean;
  roles?: string[];
  queryParams?: Param[];
  body?: Param[];
  bodyFormat?: "json" | "form-data";
  responses: ApiResponse[];
}

interface Section {
  id: string;
  title: string;
  endpoints: Endpoint[];
}

// ─── Data ───────────────────────────────────────────────────────────────────

const BASE_URL = "/api";

const sections: Section[] = [
  {
    id: "authentication",
    title: "Authentication",
    endpoints: [
      {
        id: "login",
        method: "POST",
        path: `${BASE_URL}/auth/login`,
        title: "Login",
        description: "Authenticate a user and receive a JWT session cookie.",
        auth: false,
        body: [
          { name: "username", type: "string", required: true, description: "The user's username" },
          { name: "password", type: "string", required: true, description: "Password (min 5 characters)" },
        ],
        responses: [
          {
            status: 200,
            description: "Login successful",
            example: { message: "Login successful", user: { id: "uuid", username: "superadmin", email: "superadmin@com7.th", nickname: "Super Admin", role: "SUPER_ADMIN", createdAt: "2026-04-09T00:00:00.000Z" } },
          },
          { status: 400, description: "Missing required fields" },
          { status: 401, description: "Invalid password" },
          { status: 404, description: "User not found" },
        ],
      },
      {
        id: "register",
        method: "POST",
        path: `${BASE_URL}/auth/register`,
        title: "Register",
        description: "Self-register a new account. New accounts are assigned STAFF role by default.",
        auth: false,
        body: [
          { name: "username", type: "string", required: true, description: "Unique username (max 50 chars)" },
          { name: "password", type: "string", required: true, description: "Password (min 5 characters)" },
          { name: "email", type: "string", required: true, description: "Email address" },
          { name: "nickname", type: "string", required: true, description: "Display name" },
        ],
        responses: [
          { status: 201, description: "User created successfully", example: { message: "User created successfully", user: { id: "uuid", username: "newuser", role: "STAFF" } } },
          { status: 400, description: "Validation error or username/email already exists" },
        ],
      },
      {
        id: "logout",
        method: "POST",
        path: `${BASE_URL}/auth/logout`,
        title: "Logout",
        description: "Clear the authentication cookie and end the session.",
        auth: true,
        responses: [
          { status: 200, description: "Logged out successfully", example: { message: "Logout successful" } },
        ],
      },
      {
        id: "me",
        method: "GET",
        path: `${BASE_URL}/auth/me`,
        title: "Get Current User",
        description: "Return the authenticated user's profile from the JWT cookie.",
        auth: true,
        responses: [
          { status: 200, description: "Current user profile", example: { id: "uuid", username: "superadmin", email: "superadmin@com7.th", nickname: "Super Admin", role: "SUPER_ADMIN" } },
          { status: 401, description: "Unauthorized" },
        ],
      },
      {
        id: "create-user",
        method: "POST",
        path: `${BASE_URL}/auth`,
        title: "Create User (Admin)",
        description: "Create a new user with a specific role. Only SUPER_ADMIN and ADMIN can use this endpoint.",
        auth: true,
        roles: ["SUPER_ADMIN", "ADMIN"],
        body: [
          { name: "username", type: "string", required: true, description: "Unique username" },
          { name: "password", type: "string", required: true, description: "Password (min 5 chars)" },
          { name: "email", type: "string", required: true, description: "Email address" },
          { name: "nickname", type: "string", required: true, description: "Display name" },
          { name: "role", type: "string", required: false, default: "STAFF", description: "User role", enum: ["SUPER_ADMIN", "ADMIN", "STAFF"] },
        ],
        responses: [
          { status: 201, description: "User created successfully", example: { message: "User created successfully", user: { id: "uuid", role: "ADMIN" } } },
          { status: 400, description: "Validation error or duplicate username/email" },
          { status: 401, description: "Unauthorized or insufficient role" },
        ],
      },
      {
        id: "get-users",
        method: "GET",
        path: `${BASE_URL}/auth/get-users`,
        title: "Get All Users",
        description: "Retrieve a list of all users. Only accessible by SUPER_ADMIN and ADMIN.",
        auth: true,
        roles: ["SUPER_ADMIN", "ADMIN"],
        queryParams: [
          { name: "search", type: "string", required: false, description: "Filter by username or nickname" },
        ],
        responses: [
          { status: 200, description: "List of users", example: { users: [{ id: "uuid", username: "staff01", nickname: "Alice Staff", role: "STAFF" }] } },
          { status: 401, description: "Unauthorized" },
        ],
      },
      {
        id: "update-user",
        method: "PUT",
        path: `${BASE_URL}/auth/update/{id}`,
        title: "Update User",
        description: "Update a user's profile. Users can update their own profile. Only SUPER_ADMIN can change roles.",
        auth: true,
        body: [
          { name: "nickname", type: "string", required: false, description: "New display name" },
          { name: "email", type: "string", required: false, description: "New email address" },
          { name: "role", type: "string", required: false, description: "New role — SUPER_ADMIN only", enum: ["SUPER_ADMIN", "ADMIN", "STAFF"] },
        ],
        responses: [
          { status: 200, description: "User updated successfully", example: { message: "User updated successfully", data: { id: "uuid", nickname: "New Name" } } },
          { status: 403, description: "Cannot update another user's profile" },
          { status: 404, description: "User not found" },
        ],
      },
      {
        id: "delete-user",
        method: "DELETE",
        path: `${BASE_URL}/auth/delete/{id}`,
        title: "Delete User",
        description: "Permanently delete a user and all their data (cascade). Only SUPER_ADMIN can perform this action.",
        auth: true,
        roles: ["SUPER_ADMIN"],
        responses: [
          { status: 200, description: "User deleted successfully", example: { message: "User deleted successfully" } },
          { status: 403, description: "Access denied" },
          { status: 404, description: "User not found" },
        ],
      },
    ],
  },
  {
    id: "assignments",
    title: "Assignments",
    endpoints: [
      {
        id: "list-assignments",
        method: "GET",
        path: `${BASE_URL}/assignment`,
        title: "List Assignments",
        description: "Get a paginated list of assignments. ADMIN users only see assignments they created.",
        auth: true,
        queryParams: [
          { name: "search", type: "string", required: false, description: "Search by title, description, assignTo, or createdBy" },
          { name: "status", type: "string", required: false, default: "all", description: "Filter by status", enum: ["all", "not-submit", "Pending", "Approved", "Rejected"] },
          { name: "type", type: "string", required: false, default: "all", description: "Filter by type", enum: ["all", "Individual", "Group"] },
          { name: "myAssignments", type: "boolean", required: false, default: "false", description: "Only return the current user's assignments" },
          { name: "page", type: "number", required: false, default: "1", description: "Page number" },
          { name: "limit", type: "number", required: false, default: "10", description: "Items per page" },
        ],
        responses: [
          {
            status: 200,
            description: "Paginated assignment list",
            example: { assignments: [{ id: "uuid", title: "Task 1", status: "Pending", type: "Individual" }], pagination: { page: 1, limit: 10, total: 50, totalPages: 5, hasNext: true, hasPrev: false } },
          },
          { status: 401, description: "Unauthorized" },
        ],
      },
      {
        id: "create-assignment",
        method: "POST",
        path: `${BASE_URL}/assignment`,
        title: "Create Assignment",
        description: "Create a new assignment and assign it to one or more users. An email notification is sent to each assigned user. Only SUPER_ADMIN and ADMIN can create assignments.",
        auth: true,
        roles: ["SUPER_ADMIN", "ADMIN"],
        body: [
          { name: "title", type: "string", required: true, description: "Assignment title (max 100 chars)" },
          { name: "description", type: "string", required: true, description: "Detailed description" },
          { name: "type", type: "string", required: true, description: "Assignment type", enum: ["Individual", "Group"] },
          { name: "assignTo", type: "string[]", required: true, description: "Array of usernames to assign this task to" },
          { name: "reward", type: "number", required: true, description: "Points awarded upon approval" },
          { name: "deadline", type: "string", required: true, description: "Deadline in ISO 8601 format (e.g. 2026-05-01T23:59:00Z)" },
        ],
        responses: [
          { status: 200, description: "Assignments created for all users", example: { message: "All Assignment created successfully" } },
          { status: 400, description: "Invalid type or empty assignTo array" },
          { status: 401, description: "Insufficient role" },
          { status: 404, description: "An assigned user was not found" },
        ],
      },
      {
        id: "get-assignment",
        method: "GET",
        path: `${BASE_URL}/assignment/{id}`,
        title: "Get Assignment",
        description: "Retrieve a single assignment by its ID.",
        auth: true,
        responses: [
          { status: 200, description: "Assignment details", example: { id: "uuid", title: "Task 1", description: "...", type: "Individual", status: "Pending", deadline: "2026-04-30T00:00:00.000Z" } },
          { status: 404, description: "Assignment not found" },
        ],
      },
      {
        id: "rebuild-assignment",
        method: "POST",
        path: `${BASE_URL}/assignment/{id}/rebuild`,
        title: "Rebuild Assignment",
        description: "Duplicate an existing assignment with a new deadline. Sends an email notification. Only SUPER_ADMIN and ADMIN can rebuild.",
        auth: true,
        roles: ["SUPER_ADMIN", "ADMIN"],
        body: [
          { name: "deadline", type: "string", required: true, description: "New deadline in ISO 8601 format" },
        ],
        responses: [
          { status: 201, description: "Assignment rebuilt successfully", example: { message: "Assignment rebuilt successfully", assignment: { id: "new-uuid" } } },
          { status: 400, description: "Deadline is required" },
          { status: 403, description: "Access denied" },
          { status: 404, description: "Assignment or assigned user not found" },
        ],
      },
      {
        id: "submit-assignment",
        method: "PUT",
        path: `${BASE_URL}/assignment/submission/{id}`,
        title: "Submit Assignment",
        description: "Upload a file submission for an assignment. Accepts multipart/form-data. Files are stored in Cloudinary. Only the assigned user or SUPER_ADMIN can submit.",
        auth: true,
        bodyFormat: "form-data",
        body: [
          { name: "file", type: "File", required: true, description: "The submission file (PDF, image, etc.)" },
        ],
        responses: [
          { status: 200, description: "Submission uploaded", example: { message: "Assignment submitted successfully", file: { url: "https://res.cloudinary.com/...", size: 12345, format: "pdf" } } },
          { status: 400, description: "File is required or upload failed" },
          { status: 403, description: "Not authorized to submit this assignment" },
          { status: 404, description: "Assignment not found" },
        ],
      },
      {
        id: "review-assignment",
        method: "PUT",
        path: `${BASE_URL}/assignment/review/{id}`,
        title: "Review Assignment",
        description: "Review and grade a submitted assignment. Creates a Score record when Approved. Only the creating ADMIN or SUPER_ADMIN can review.",
        auth: true,
        roles: ["SUPER_ADMIN", "ADMIN"],
        body: [
          { name: "status", type: "string", required: true, description: "Review decision", enum: ["Pending", "Approved", "Rejected"] },
          { name: "finalScore", type: "number", required: false, description: "Score awarded — required when status is Approved", default: "0" },
          { name: "feedback", type: "string", required: false, description: "Feedback comment for the assignee" },
        ],
        responses: [
          { status: 200, description: "Assignment reviewed", example: { message: "Assignment reviewed successfully", assignment: { status: "Approved", finalScore: 85 }, score: { id: "uuid", score: 85 } } },
          { status: 400, description: "Invalid status or missing finalScore when Approved" },
          { status: 403, description: "Not authorized to review this assignment" },
          { status: 404, description: "Assignment not found" },
        ],
      },
      {
        id: "admin-dashboard",
        method: "GET",
        path: `${BASE_URL}/assignment/dashboard/admin`,
        title: "Admin Dashboard Data",
        description: "Get aggregated KPIs and chart data for the admin dashboard view. Only SUPER_ADMIN and ADMIN can access.",
        auth: true,
        roles: ["SUPER_ADMIN", "ADMIN"],
        queryParams: [
          { name: "year", type: "number", required: false, description: "Filter by year (e.g. 2026)" },
          { name: "month", type: "number", required: false, description: "Filter by month (1–12)" },
        ],
        responses: [
          { status: 200, description: "Dashboard KPIs and charts", example: { kpis: { totalAssignments: 120, totalSubmitted: 95, averageScore: 78, lateSubmissions: 12 }, charts: { monthlyTrend: [], statusDistribution: [], userAssignmentStatus: [] } } },
          { status: 403, description: "Access denied" },
        ],
      },
      {
        id: "user-dashboard",
        method: "GET",
        path: `${BASE_URL}/assignment/dashboard/user`,
        title: "User Dashboard Data",
        description: "Get personal KPIs and chart data for the authenticated user's own dashboard.",
        auth: true,
        queryParams: [
          { name: "year", type: "number", required: false, description: "Filter by year" },
          { name: "month", type: "number", required: false, description: "Filter by month (1–12)" },
        ],
        responses: [
          { status: 200, description: "Personal dashboard data", example: { kpis: { totalAssigned: 10, submitted: 8, approved: 6, totalScore: 480 } } },
          { status: 401, description: "Unauthorized" },
        ],
      },
    ],
  },
  {
    id: "levels",
    title: "Levels",
    endpoints: [
      {
        id: "list-levels",
        method: "GET",
        path: `${BASE_URL}/level`,
        title: "List Levels",
        description: "Retrieve all achievement levels ordered by minimum score.",
        auth: true,
        responses: [
          { status: 200, description: "List of levels", example: { levels: [{ id: "uuid", name: "Beginner", emoji: "🌱", minScore: 0, maxScore: 100, color: "#22c55e" }] } },
          { status: 401, description: "Unauthorized" },
        ],
      },
      {
        id: "create-level",
        method: "POST",
        path: `${BASE_URL}/level`,
        title: "Create Level",
        description: "Create a new achievement level. Only SUPER_ADMIN can manage levels.",
        auth: true,
        roles: ["SUPER_ADMIN"],
        body: [
          { name: "name", type: "string", required: true, description: "Level name (e.g. Bronze, Gold)" },
          { name: "emoji", type: "string", required: true, description: "Level emoji icon" },
          { name: "minScore", type: "number", required: true, description: "Minimum score threshold" },
          { name: "maxScore", type: "number", required: true, description: "Maximum score threshold" },
          { name: "color", type: "string", required: true, description: "Display color (CSS color value)" },
        ],
        responses: [
          { status: 201, description: "Level created", example: { message: "Level created successfully", level: { id: "uuid", name: "Gold", emoji: "⭐" } } },
          { status: 403, description: "Access denied" },
        ],
      },
      {
        id: "update-level",
        method: "PUT",
        path: `${BASE_URL}/level/{id}`,
        title: "Update Level",
        description: "Update an existing level. Only SUPER_ADMIN can manage levels.",
        auth: true,
        roles: ["SUPER_ADMIN"],
        body: [
          { name: "name", type: "string", required: false, description: "New level name" },
          { name: "emoji", type: "string", required: false, description: "New emoji icon" },
          { name: "minScore", type: "number", required: false, description: "New minimum score" },
          { name: "maxScore", type: "number", required: false, description: "New maximum score" },
          { name: "color", type: "string", required: false, description: "New display color" },
        ],
        responses: [
          { status: 200, description: "Level updated", example: { message: "Level updated successfully" } },
          { status: 403, description: "Access denied" },
          { status: 404, description: "Level not found" },
        ],
      },
    ],
  },
  {
    id: "leaderboard",
    title: "Leaderboard",
    endpoints: [
      {
        id: "admin-leaderboard",
        method: "GET",
        path: `${BASE_URL}/leaderboard`,
        title: "Admin Leaderboard",
        description: "Get all-time cumulative scores and rankings. Only accessible by SUPER_ADMIN.",
        auth: true,
        roles: ["SUPER_ADMIN"],
        queryParams: [
          { name: "limit", type: "number", required: false, default: "10", description: "Number of top users to return" },
        ],
        responses: [
          { status: 200, description: "Ranked user list", example: { leaderboard: [{ rank: 1, username: "staff01", nickname: "Alice Staff", totalScore: 850, level: { name: "Gold", emoji: "🥇" } }] } },
          { status: 403, description: "Access denied" },
        ],
      },
      {
        id: "public-leaderboard",
        method: "GET",
        path: `${BASE_URL}/leaderboard/public`,
        title: "Public Leaderboard",
        description: "Get the leaderboard visible to all authenticated users, optionally filtered by year and month.",
        auth: true,
        queryParams: [
          { name: "year", type: "number", required: false, description: "Filter by year" },
          { name: "month", type: "number", required: false, description: "Filter by month (1–12)" },
          { name: "limit", type: "number", required: false, default: "10", description: "Number of top users" },
        ],
        responses: [
          { status: 200, description: "Filtered leaderboard", example: { leaderboard: [{ rank: 1, username: "staff01", totalScore: 420, level: { name: "Silver" } }] } },
          { status: 401, description: "Unauthorized" },
        ],
      },
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const METHOD_STYLES: Record<Method, string> = {
  GET: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  POST: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  PUT: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
};

const STATUS_STYLES = (status: number) => {
  if (status >= 200 && status < 300) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400";
  if (status >= 400 && status < 500) return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400";
  return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400";
};

function MethodBadge({ method }: { method: Method }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono tracking-wide ${METHOD_STYLES[method]}`}>
      {method}
    </span>
  );
}

function StatusBadge({ status }: { status: number }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono ${STATUS_STYLES(status)}`}>
      {status}
    </span>
  );
}

function CodeBlock({ value }: { value: unknown }) {
  return (
    <pre className="mt-2 rounded-lg bg-zinc-900 text-zinc-100 text-xs p-4 overflow-x-auto leading-relaxed">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function ParamTable({ params, label }: { params: Param[]; label: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">{label}</p>
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground w-36">Name</th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground w-24">Type</th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground w-20">Required</th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {params.map((p) => (
              <tr key={p.name} className="bg-card">
                <td className="px-3 py-2.5 font-mono text-xs font-semibold text-foreground">{p.name}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-blue-600 dark:text-blue-400">{p.type}</td>
                <td className="px-3 py-2.5">
                  {p.required ? (
                    <span className="text-xs font-semibold text-red-600 dark:text-red-400">required</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">optional</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">
                  {p.description}
                  {p.enum && (
                    <span className="block mt-1">
                      {p.enum.map((v) => (
                        <code key={v} className="mr-1 px-1 py-0.5 rounded bg-muted font-mono text-[11px]">{v}</code>
                      ))}
                    </span>
                  )}
                  {p.default && (
                    <span className="block mt-0.5 text-[11px] text-muted-foreground">Default: <code className="font-mono">{p.default}</code></span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const [open, setOpen] = useState(false);

  return (
    <div id={endpoint.id} className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/40 transition-colors text-left"
      >
        <MethodBadge method={endpoint.method} />
        <code className="flex-1 text-sm font-mono text-foreground">{endpoint.path}</code>
        <span className="text-sm text-muted-foreground hidden sm:block">{endpoint.title}</span>
        <div className="flex items-center gap-2 ml-auto">
          {endpoint.auth ? (
            <Lock className="size-3.5 text-muted-foreground" />
          ) : (
            <Globe className="size-3.5 text-emerald-500" />
          )}
          {open ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Body */}
      {open && (
        <div className="border-t border-border px-5 py-5 space-y-5">
          {/* Description */}
          <div>
            <p className="text-sm text-foreground">{endpoint.description}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {endpoint.auth ? (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-full px-2.5 py-1">
                  <Lock className="size-3" /> Requires authentication
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 rounded-full px-2.5 py-1">
                  <Globe className="size-3" /> Public endpoint
                </span>
              )}
              {endpoint.roles?.map((r) => (
                <span key={r} className="text-xs text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900 rounded-full px-2.5 py-1 font-mono">
                  {r}
                </span>
              ))}
            </div>
          </div>

          {/* Query Params */}
          {endpoint.queryParams && endpoint.queryParams.length > 0 && (
            <ParamTable params={endpoint.queryParams} label="Query Parameters" />
          )}

          {/* Request Body */}
          {endpoint.body && endpoint.body.length > 0 && (
            <div>
              <ParamTable
                params={endpoint.body}
                label={`Request Body${endpoint.bodyFormat ? ` — ${endpoint.bodyFormat}` : " — application/json"}`}
              />
            </div>
          )}

          {/* Responses */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Responses</p>
            <div className="space-y-3">
              {endpoint.responses.map((r) => (
                <div key={r.status}>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={r.status} />
                    <span className="text-sm text-muted-foreground">{r.description}</span>
                  </div>
                  {r.example && <CodeBlock value={r.example} />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DocPage() {
  const totalEndpoints = sections.reduce((n, s) => n + s.endpoints.length, 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-sm ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-14 gap-4">
          <span className="font-bold text-base tracking-tight">COM7 API Docs</span>
          <span className="text-xs text-muted-foreground border border-border rounded px-2 py-0.5 font-mono">v1.0</span>
          <span className="ml-auto text-xs text-muted-foreground">{totalEndpoints} endpoints</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-8 py-8">
        {/* Sidebar */}
        <aside className="hidden lg:block w-52 shrink-0">
          <nav className="sticky top-20 space-y-4 overflow-y-auto h-[calc(100vh-6.5rem)] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Base URL</p>
              <code className="text-xs text-foreground bg-muted px-2 py-1 rounded block break-all">https://your-domain.com</code>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Auth</p>
              <p className="text-xs text-muted-foreground">JWT stored as <code className="font-mono bg-muted px-1 rounded">authorize</code> cookie (httpOnly, 7 days)</p>
            </div>
            <div className="border-t border-border pt-4 space-y-1">
              {sections.map((s) => (
                <div key={s.id}>
                  <a href={`#${s.id}`} className="block text-xs font-semibold text-foreground hover:text-primary py-1">{s.title}</a>
                  <div className="ml-2 space-y-0.5">
                    {s.endpoints.map((e) => (
                      <a key={e.id} href={`#${e.id}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground py-0.5 group">
                        <span className={`font-mono font-bold text-[10px] ${METHOD_STYLES[e.method]} px-1 rounded`}>{e.method}</span>
                        <span className="truncate group-hover:text-foreground">{e.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 space-y-12">
          {/* Intro */}
          <div className="rounded-xl border border-border bg-card px-6 py-6">
            <h1 className="text-2xl font-bold mb-2">COM7 Assignment System — API Reference</h1>
            <p className="text-muted-foreground text-sm mb-4">
              RESTful API for managing assignments, users, levels, and leaderboards. All protected endpoints require a valid <code className="font-mono bg-muted px-1 rounded text-xs">authorize</code> cookie obtained via the Login endpoint.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="rounded-lg bg-muted/50 px-4 py-3">
                <p className="text-xs text-muted-foreground mb-1">Authentication</p>
                <p className="font-medium">JWT Cookie</p>
              </div>
              <div className="rounded-lg bg-muted/50 px-4 py-3">
                <p className="text-xs text-muted-foreground mb-1">Content-Type</p>
                <p className="font-mono text-sm">application/json</p>
              </div>
              <div className="rounded-lg bg-muted/50 px-4 py-3">
                <p className="text-xs text-muted-foreground mb-1">Roles</p>
                <p className="font-medium">SUPER_ADMIN · ADMIN · STAFF</p>
              </div>
            </div>
          </div>

          {/* Sections */}
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-20 space-y-3">
              <div className="flex items-center gap-3 pb-2 border-b border-border">
                <h2 className="text-lg font-bold">{section.title}</h2>
                <span className="text-xs text-muted-foreground">{section.endpoints.length} endpoints</span>
              </div>
              {section.endpoints.map((endpoint) => (
                <EndpointCard key={endpoint.id} endpoint={endpoint} />
              ))}
            </section>
          ))}

          {/* Footer */}
          <footer className="border-t border-border pt-6 text-xs text-muted-foreground text-center pb-8">
            COM7 Assignment System · API v1.0 · Generated 2026-04-09
          </footer>
        </main>
      </div>
    </div>
  );
}

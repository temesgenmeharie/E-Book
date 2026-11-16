"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Shield,
  UserCheck,
  UserX,
  Loader2,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";

interface UserItem {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  roles: string[];
  sellerProfile: {
    id: string;
    businessName: string;
    sellerType: string;
    verificationStatus: string;
  } | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load user directory");
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function toggleStatus(userId: string, currentStatus: boolean) {
    setActionLoadingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.detail || "Action failed");
      }
      loadUsers();
    } catch {
      // ignore
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleAssignRole(userId: string, role: string) {
    try {
      const res = await fetch(`/api/admin/users/${userId}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.detail || "Role assignment failed");
      }
      loadUsers();
    } catch {
      // ignore
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="h-7 w-7 text-indigo-600" />
            <span className="font-bold text-lg text-slate-900">User Administration</span>
          </div>
          <Link href="/" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
            Back to Storefront
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">User Accounts & Roles</h1>
            <p className="text-sm text-slate-500">
              Manage accounts, assign operational staff roles, and oversee platform access.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadUsers();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user..."
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800"
            >
              Search
            </button>
          </form>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-slate-600">User</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-600">Roles</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-600">Seller Studio</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-600">Status</th>
                  <th className="px-6 py-3 text-right font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{u.fullName}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((r, i) => (
                          <span
                            key={i}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              r === "ADMINISTRATOR"
                                ? "bg-purple-100 text-purple-700"
                                : r === "CONTENT_MODERATOR"
                                ? "bg-indigo-100 text-indigo-700"
                                : r === "FINANCE_MANAGER"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {u.sellerProfile ? (
                        <div>
                          <span className="font-semibold text-slate-800">{u.sellerProfile.businessName}</span>
                          <span className="block text-[10px] text-slate-500">
                            {u.sellerProfile.sellerType} &middot; {u.sellerProfile.verificationStatus}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Standard Reader</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          u.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {u.isActive ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <select
                        onChange={(e) => {
                          if (e.target.value) handleAssignRole(u.id, e.target.value);
                        }}
                        defaultValue=""
                        className="text-xs border rounded px-2 py-1 text-slate-600"
                      >
                        <option value="" disabled>
                          + Assign Role
                        </option>
                        <option value="CONTENT_MODERATOR">Content Moderator</option>
                        <option value="FINANCE_MANAGER">Finance Manager</option>
                        <option value="ADMINISTRATOR">Administrator</option>
                      </select>

                      <button
                        onClick={() => toggleStatus(u.id, u.isActive)}
                        disabled={actionLoadingId === u.id}
                        className={`px-2.5 py-1 rounded text-xs font-semibold ${
                          u.isActive
                            ? "bg-red-50 text-red-700 hover:bg-red-100"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        {u.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

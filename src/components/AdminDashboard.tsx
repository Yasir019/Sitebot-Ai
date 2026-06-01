import { useState, useEffect } from "react";
import { 
  Building2, Users, CreditCard, Bot, ArrowRight, ShieldCheck, 
  Search, ToggleLeft, Activity, RefreshCw, Layers, CheckCircle, Ban 
} from "lucide-react";
import { User, Business, SubscriptionPlan } from "../types";

interface AdminDashboardProps {
  onLogout: () => void;
  currentUser: User;
}

export default function AdminDashboard({ onLogout, currentUser }: AdminDashboardProps) {
  const [data, setData] = useState<{
    summary: any;
    businesses: any[];
    users: any[];
    plans: SubscriptionPlan[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "businesses" | "users" | "plans">("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchUsersTerm, setSearchUsersTerm] = useState("");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const fetchSummary = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/superadmin/summary");
      if (!response.ok) {
        throw new Error("Failed to load platform master logs.");
      }
      const val = await response.json();
      setData(val);
      setError("");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleToggleBusinessStatus = async (businessId: string, currentStatus: string) => {
    setIsUpdating(businessId);
    const newStatus = currentStatus === "active" ? "disabled" : "active";
    try {
      const response = await fetch(`/api/superadmin/businesses/${businessId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error("Could not update status.");
      }
      
      // Update local state without fetching all summaries again!
      if (data) {
        setData({
          ...data,
          businesses: data.businesses.map(b => 
            b.id === businessId ? { ...b, status: newStatus } : b
          )
        });
      }
    } catch (err: any) {
      alert(err.message || "Status modification error.");
    } finally {
      setIsUpdating(null);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center">
        <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
        <span className="text-sm font-bold text-slate-600 mt-4 uppercase tracking-wider">Accessing admin cluster...</span>
      </div>
    );
  }

  const filteredBusinesses = data?.businesses.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.category.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredUsers = data?.users.filter(u => 
    u.name.toLowerCase().includes(searchUsersTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchUsersTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchUsersTerm.toLowerCase())
  ) || [];

  return (
    <div id="admin-dashboard-root" className="flex h-screen w-full bg-[#f8fafc] text-[#0f172a] font-sans overflow-hidden">
      {/* Sidebar - Desktop Layout style */}
      <aside className="w-64 bg-[#1e293b] text-slate-300 shrink-0 flex flex-col justify-between hidden md:flex h-full">
        <div className="flex flex-col flex-1 min-h-0">
          <div className="p-6 shrink-0">
            <div className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center font-bold text-lg italic shadow-sm">A</div>
              <span className="text-xl font-bold tracking-tight italic">Admin Panel</span>
            </div>
            <div className="mt-1 text-[10px] text-purple-400 font-mono tracking-wider uppercase font-bold">
              SiteBot Platform
            </div>
          </div>
          
          <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all text-xs font-semibold text-left cursor-pointer ${
                activeTab === "overview" ? "bg-purple-600 text-white" : "text-slate-300 hover:bg-slate-850"
              }`}
            >
              <Activity className="w-4 h-4 shrink-0" /> Platform Logs
            </button>

            <button
              onClick={() => setActiveTab("businesses")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all text-xs font-semibold text-left cursor-pointer ${
                activeTab === "businesses" ? "bg-purple-600 text-white" : "text-slate-300 hover:bg-slate-850"
              }`}
            >
              <Building2 className="w-4 h-4 shrink-0" /> Client Businesses ({data?.businesses.length})
            </button>

            <button
              onClick={() => setActiveTab("users")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all text-xs font-semibold text-left cursor-pointer ${
                activeTab === "users" ? "bg-purple-600 text-white" : "text-slate-300 hover:bg-slate-850"
              }`}
            >
              <Users className="w-4 h-4 shrink-0" /> Registered Users ({data?.users.length})
            </button>

            <button
              onClick={() => setActiveTab("plans")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all text-xs font-semibold text-left cursor-pointer ${
                activeTab === "plans" ? "bg-purple-600 text-white" : "text-slate-300 hover:bg-slate-850"
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" /> Plan Limits & Pricing
            </button>
          </nav>
        </div>

        {/* Outer User Info Profile */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-purple-700/80 flex items-center justify-center text-xs text-white font-bold shrink-0">
              {currentUser.name ? currentUser.name.split(" ").map(n => n[0]).join("").toUpperCase() : "AD"}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-white font-medium truncate leading-tight">{currentUser.name}</p>
              <p className="text-[11px] text-[#c084fc] capitalize truncate leading-normal">Platform Admin Desk</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Envelope */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 shrink-0">
          <div>
            <h1 className="text-lg font-semibold text-slate-800 capitalize leading-tight">
              Platform {activeTab.replace("_", " ")}
            </h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase leading-none mt-0.5">
              Super administrator dashboard
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={fetchSummary}
              className="px-3.5 py-2 hover:bg-slate-50 text-slate-750 rounded-lg text-xs font-semibold border border-slate-200 transition-all cursor-pointer bg-white flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh summary
            </button>
            <button 
              onClick={onLogout}
              className="px-4 py-2 text-slate-750 hover:text-slate-950 hover:bg-slate-100 rounded-lg text-xs font-semibold border border-slate-200 transition-all cursor-pointer bg-white"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Scrollable page body */}
        <div className="flex-1 bg-[#f8fafc] overflow-y-auto p-8 relative space-y-6">
          {error && (
            <div className="bg-rose-50 border-l-4 border-rose-600 p-4 rounded text-xs text-rose-700 font-bold mb-4">
              {error}
            </div>
          )}

        {/* Overview View */}
        {activeTab === "overview" && data && (
          <div className="space-y-6">
            {/* Top Cards Statistics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Clients</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">{data.summary.totalBusinesses}</div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">SaaS ARR Revenue</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">${data.summary.totalRevenue}<span className="text-xs text-slate-400 font-medium">/mo</span></div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Platform Messages</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">{data.summary.totalConversations}</div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">User Sessions</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">{data.summary.totalUsers}</div>
                </div>
              </div>
            </div>

            {/* Quick Actions and Stats Review */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-600" /> Platform Billing Distribution
                </h3>
                <div className="space-y-3.5">
                  {data.plans.map(p => {
                    const count = data.businesses.filter(b => b.planId === p.id).length;
                    const percent = data.businesses.length > 0 ? (count / data.businesses.length) * 100 : 0;
                    return (
                      <div key={p.id} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-700">{p.name} (${p.price}/mo)</span>
                          <span className="text-slate-500 font-mono font-bold">{count} workspaces ({Math.round(percent)}%)</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-600 rounded-full" style={{ width: `${percent}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Quick Sandbox Helper
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    You are logged in as a <strong>platform Super Administrator</strong>. From this dashboard, you can monitor individual telemetry lines across different businesses or audit user security permissions.
                  </p>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200 flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-slate-700">Need to check a customer business workspace?</div>
                    <div className="text-slate-500">Go to Client Businesses, toggle active status, or switch views.</div>
                  </div>
                  <button 
                    onClick={() => setActiveTab("businesses")} 
                    className="text-xs text-purple-600 font-bold flex items-center gap-1 shrink-0"
                  >
                    View Clients <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Businesses Manager Tab */}
        {activeTab === "businesses" && data && (
          <div className="space-y-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Client Businesses</h3>
                <p className="text-xs text-slate-500 mt-0.5">Audit and manage subscription levels, database volumes, or suspend client accounts.</p>
              </div>
              <div className="w-full md:w-80 relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search business name or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-purple-550 focus:border-transparent bg-slate-50"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-widest bg-slate-50">
                    <th className="py-3 px-4 font-bold">Business Name</th>
                    <th className="py-3 px-3 font-bold">Category</th>
                    <th className="py-3 px-3 font-bold">Billing Plan</th>
                    <th className="py-3 px-3 text-center font-bold">Knowledge base files</th>
                    <th className="py-3 px-3 text-center font-bold font-sans">Leads tracked</th>
                    <th className="py-3 px-3 font-bold">Status</th>
                    <th className="py-3 px-4 text-right font-bold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredBusinesses.map((b: any) => (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 font-bold text-slate-950">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl bg-slate-100 w-8 h-8 rounded-lg flex items-center justify-center shrink-0">{b.logo || "🏢"}</span>
                          <div>
                            <div>{b.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono italic">{b.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-3 font-medium text-slate-650">{b.category}</td>
                      <td className="py-4 px-3 uppercase tracking-wide font-bold">
                        <span className={`px-2.5 py-1 rounded text-[10px] ${b.planId === "pro" ? "bg-blue-50 text-blue-700 border border-blue-200" : b.planId === "business" ? "bg-purple-50 text-purple-700 border border-purple-200" : "bg-slate-100 text-slate-700"}`}>
                          {b.planId}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-center font-mono font-bold text-slate-700">{b.documentsCount} documents</td>
                      <td className="py-4 px-3 text-center font-mono font-bold text-slate-700">{b.leadsCount} leads</td>
                      <td className="py-4 px-3 font-bold">
                        <span className={`flex items-center gap-1.5 ${b.status === "active" ? "text-emerald-600" : "text-rose-500"}`}>
                          {b.status === "active" ? (
                            <>
                              <CheckCircle className="w-4 h-4" /> Active
                            </>
                          ) : (
                            <>
                              <Ban className="w-4 h-4" /> Suspended
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          disabled={isUpdating === b.id}
                          onClick={() => handleToggleBusinessStatus(b.id, b.status)}
                          className={`text-xs px-3 py-1.5 rounded-lg border font-bold transition-all shadow-sm ${b.status === "active" ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"}`}
                        >
                          {isUpdating === b.id 
                            ? "Processing..." 
                            : b.status === "active" 
                              ? "Suspend Workspace" 
                              : "Unsuspend Workspace"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredBusinesses.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400 text-xs italic">
                        No businesses matched your search query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users manager Tab */}
        {activeTab === "users" && data && (
          <div className="space-y-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">User Accounts List</h3>
                <p className="text-xs text-slate-500 mt-0.5">Full audited registry of login credentials, employee permissions types, and security roles on the platform.</p>
              </div>
              <div className="w-full md:w-80 relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user name, email, or role..."
                  value={searchUsersTerm}
                  onChange={(e) => setSearchUsersTerm(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-purple-550 focus:border-transparent bg-slate-50"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-widest bg-slate-50">
                    <th className="py-3 px-4 font-bold">User</th>
                    <th className="py-3 px-3 font-bold">Email</th>
                    <th className="py-3 px-3 font-bold">System Role</th>
                    <th className="py-3 px-3 font-bold">Associated Client Workspace</th>
                    <th className="py-3 px-4 text-right font-bold">Registered Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredUsers.map((u: any) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="py-4 px-4 font-bold text-slate-900">{u.name}</td>
                      <td className="py-4 px-3 text-slate-600 font-mono">{u.email}</td>
                      <td className="py-4 px-3 font-bold">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${
                          u.role === "super_admin" 
                            ? "bg-purple-100 text-purple-700" 
                            : u.role === "business_owner" 
                              ? "bg-blue-100 text-blue-700" 
                              : "bg-slate-100 text-slate-700"
                        }`}>
                          {u.role.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-4 px-3 font-medium text-slate-700">{u.businessName}</td>
                      <td className="py-4 px-4 text-right text-slate-400 font-mono text-[10px]">
                        {new Date(u.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Subscription Plan details tab */}
        {activeTab === "plans" && data && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900">SaaS Master Plan Limits</h3>
              <p className="text-xs text-slate-500 mt-1">Review standard subscription plan guidelines configured globally in the system databases.</p>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              {data.plans.map(p => (
                <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h4 className="font-bold text-slate-900 text-base">{p.name}</h4>
                    <div className="text-xl font-extrabold text-slate-800 mt-1">${p.price}<span className="text-xs text-slate-400 font-medium">/month</span></div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Hard Limits</div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Max Chatbots:</span>
                      <span className="font-bold text-slate-800">{p.limits.chatbots}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Max Knowledge Files:</span>
                      <span className="font-bold text-slate-800">{p.limits.documents} files</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Max AI Messages/mo:</span>
                      <span className="font-bold text-slate-800 font-mono">{p.limits.messagesPerMonth.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Max Leads Capture limit:</span>
                      <span className="font-bold text-slate-800 font-sans">{p.limits.leads.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Staff Support Seats:</span>
                      <span className="font-bold text-slate-800">{p.limits.staffMembers} accounts</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}

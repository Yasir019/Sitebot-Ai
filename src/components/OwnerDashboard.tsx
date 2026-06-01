import React, { useState, useEffect } from "react";
import { 
  Building2, Users, MessageSquare, LifeBuoy, FileText, Settings, Code, Sparkles, 
  Database, Plus, Trash2, Edit2, Check, RefreshCw, BarChart3, Mail, ToggleLeft, 
  HelpCircle, Globe, ShieldAlert, CheckCircle, ArrowRight, Play, Heart, BookOpen
} from "lucide-react";
import { User, Business, KBDocument, FAQ, Lead, Ticket, ChatbotSettings, SubscriptionPlan } from "../types";
import ChatbotWidget from "./ChatbotWidget";
import { createFirebaseStaffAccount } from "../services/firebaseAuth";

interface OwnerDashboardProps {
  onLogout: () => void;
  currentUser: User;
  initialBusiness: Business;
}

export default function OwnerDashboard({ onLogout, currentUser, initialBusiness }: OwnerDashboardProps) {
  const [business, setBusiness] = useState<Business>(initialBusiness);
  const [activeTab, setActiveTab] = useState<
    "analytics" | "knowledge_base" | "customs" | "embed_generator" | "leads_tickets" | "staff" | "plan"
  >("analytics");

  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  // Knowledge Base Documents
  const [documents, setDocuments] = useState<KBDocument[]>([]);
  const [newDocName, setNewDocName] = useState("");
  const [newDocText, setNewDocText] = useState("");
  const [newDocType, setNewDocType] = useState<"txt" | "pdf" | "docx">("txt");
  const [isUploading, setIsUploading] = useState(false);

  // Manual FAQ manager
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [newFAQQuestion, setNewFAQQuestion] = useState("");
  const [newFAQAnswer, setNewFAQAnswer] = useState("");
  const [isAddingFAQ, setIsAddingFAQ] = useState(false);
  const [editingFAQId, setEditingFAQId] = useState<string | null>(null);
  const [editFAQQuestion, setEditFAQQuestion] = useState("");
  const [editFAQAnswer, setEditFAQAnswer] = useState("");

  // Leads & Support Tickets Desk
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  // Staff Management
  const [staffList, setStaffList] = useState<User[]>([]);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffPassword, setNewStaffPassword] = useState("");
  const [isAddingStaff, setIsAddingStaff] = useState(false);

  // Chatbot configuration customizations settings
  const [botName, setBotName] = useState(business.chatbotSettings.botName);
  const [welcomeMessage, setWelcomeMessage] = useState(business.chatbotSettings.welcomeMessage);
  const [fallbackMessage, setFallbackMessage] = useState(business.chatbotSettings.fallbackMessage);
  const [primaryColor, setPrimaryColor] = useState(business.chatbotSettings.primaryColor);
  const [botLogo, setBotLogo] = useState(business.chatbotSettings.logo);
  const [botTone, setBotTone] = useState(business.chatbotSettings.tone);
  const [hoursEnabled, setHoursEnabled] = useState(business.chatbotSettings.businessHours.enabled);
  const [hoursStart, setHoursStart] = useState(business.chatbotSettings.businessHours.start);
  const [hoursEnd, setHoursEnd] = useState(business.chatbotSettings.businessHours.end);
  const [hoursTimezone, setHoursTimezone] = useState(business.chatbotSettings.businessHours.timezone);
  const [awayMessage, setAwayMessage] = useState(business.chatbotSettings.businessHours.awayMessage);
  const [capName, setCapName] = useState(business.chatbotSettings.leadCaptureFields.name);
  const [capEmail, setCapEmail] = useState(business.chatbotSettings.leadCaptureFields.email);
  const [capPhone, setCapPhone] = useState(business.chatbotSettings.leadCaptureFields.phone);
  const [capReq, setCapReq] = useState(business.chatbotSettings.leadCaptureFields.requiredBeforeChat);

  // Staging Sandbox options
  const [stageTheme, setStageTheme] = useState<"restaurant" | "apparel" | "medical" | "real_estate">("restaurant");
  const [sandboxRefreshKey, setSandboxRefreshKey] = useState(0);

  const businessId = business.id;

  // Initialize Data fetch
  const fetchWorkspaceData = async () => {
    setIsLoading(true);
    try {
      const docRes = await fetch(`/api/business/${businessId}/documents`);
      const faqRes = await fetch(`/api/business/${businessId}/faqs`);
      const leadRes = await fetch(`/api/business/${businessId}/leads`);
      const tickRes = await fetch(`/api/business/${businessId}/tickets`);
      const staffRes = await fetch(`/api/business/${businessId}/staff`);
      const analyRes = await fetch(`/api/business/${businessId}/analytics`);

      if (docRes.ok) setDocuments(await docRes.json());
      if (faqRes.ok) setFaqs(await faqRes.json());
      if (leadRes.ok) setLeads(await leadRes.json());
      if (tickRes.ok) setTickets(await tickRes.json());
      if (staffRes.ok) setStaffList(await staffRes.json());
      if (analyRes.ok) setAnalytics(await analyRes.json());

      setErrorText("");
    } catch (err) {
      setErrorText("Telemetry loading failure. Please reload dashboards.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, [businessId]);

  // Handle Customize updates
  const handleSaveCustomizations = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const settings: ChatbotSettings = {
      botName,
      welcomeMessage,
      fallbackMessage,
      primaryColor,
      logo: botLogo,
      tone: botTone,
      businessHours: {
        enabled: hoursEnabled,
        start: hoursStart,
        end: hoursEnd,
        timezone: hoursTimezone,
        awayMessage
      },
      leadCaptureFields: {
        name: capName,
        email: capEmail,
        phone: capPhone,
        message: false,
        requiredBeforeChat: capReq
      }
    };

    try {
      const response = await fetch(`/api/business/${businessId}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatbotSettings: settings })
      });

      if (!response.ok) throw new Error("Could not preserve customizations config.");
      const updatedBusiness = await response.json();
      setBusiness(updatedBusiness);
      alert("Chatbot customization settings saved successfully!");
      setSandboxRefreshKey(p => p + 1); // refresh preview sandbox immediately!
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Upload Document RAG
  const handleDocUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim() || !newDocText.trim()) return;

    setIsUploading(true);
    setErrorText("");

    try {
      const response = await fetch(`/api/business/${businessId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newDocName.trim().endsWith(`.${newDocType}`) ? newDocName.trim() : `${newDocName.trim()}.${newDocType}`,
          type: newDocType,
          content: newDocText.trim(),
          uploadedBy: currentUser.name
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to commit knowledge file.");
      }

      setDocuments([...documents, data]);
      setNewDocName("");
      setNewDocText("");
      alert("Document uploaded and parsed successfully! RAG index rebuilt.");
      fetchWorkspaceData(); // refresh analytics
    } catch (err: any) {
      alert(err.message || "Fail upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDocDelete = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this file from the knowledge base? This action instantly deletes RAG embeddings.")) return;

    try {
      const response = await fetch(`/api/business/${businessId}/documents/${docId}`, {
        method: "DELETE"
      });

      if (!response.ok) throw new Error("Could not remove knowledge item.");
      setDocuments(documents.filter(d => d.id !== docId));
      fetchWorkspaceData(); // refresh analytics
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Add Manual FAQ
  const handleAddFAQSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFAQQuestion.trim() || !newFAQAnswer.trim()) return;

    setIsAddingFAQ(true);
    try {
      const response = await fetch(`/api/business/${businessId}/faqs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: newFAQQuestion, answer: newFAQAnswer })
      });

      if (!response.ok) throw new Error("Failed to post Q&A.");
      const data = await response.json();
      setFaqs([...faqs, data]);
      setNewFAQQuestion("");
      setNewFAQAnswer("");
      alert("FAQ item registered in manual rules database!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsAddingFAQ(false);
    }
  };

  const handleStartEditFAQ = (faq: FAQ) => {
    setEditingFAQId(faq.id);
    setEditFAQQuestion(faq.question);
    setEditFAQAnswer(faq.answer);
  };

  const handleSaveEditFAQ = async (faqId: string) => {
    try {
      const response = await fetch(`/api/business/${businessId}/faqs/${faqId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: editFAQQuestion, answer: editFAQAnswer })
      });
      if (response.ok) {
        const updated = await response.json();
        setFaqs(faqs.map(f => f.id === faqId ? updated : f));
        setEditingFAQId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFAQDelete = async (faqId: string) => {
    try {
      const response = await fetch(`/api/business/${businessId}/faqs/${faqId}`, {
        method: "DELETE"
      });
      if (response.ok) {
        setFaqs(faqs.filter(f => f.id !== faqId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Invite Staff CRUD
  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffEmail.trim() || !newStaffPassword.trim()) return;

    setIsAddingStaff(true);
    try {
      const firebaseStaff = await createFirebaseStaffAccount({
        name: newStaffName,
        email: newStaffEmail,
        password: newStaffPassword,
        businessId
      });

      setStaffList([...staffList, firebaseStaff]);
      setNewStaffName("");
      setNewStaffEmail("");
      setNewStaffPassword("");

      const response = await fetch(`/api/business/${businessId}/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newStaffName,
          email: newStaffEmail,
          password: newStaffPassword
        })
      });

      const data = await response.json();
      if (!response.ok) {
        console.warn("Local demo staff route skipped:", data.error || "Failed registration.");
        alert("Staff Firebase account created. They can now login from Staff Admin.");
        return;
      }

      setStaffList((prev) => prev.map((st) => st.id === firebaseStaff.id ? firebaseStaff : st).concat(
        staffList.some((st) => st.id === data.id) ? [] : []
      ));
      alert("Staff account registered beautifully! Provide details to login.");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsAddingStaff(false);
    }
  };

  const handleRemoveStaff = async (staffId: string) => {
    if (!confirm("Remove this staff team seat? They will lose access to support dashboards.")) return;

    try {
      const response = await fetch(`/api/business/${businessId}/staff/${staffId}`, {
        method: "DELETE"
      });
      if (response.ok) {
        setStaffList(staffList.filter(s => s.id !== staffId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Switch SaaS billing options
  const handleSwitchBillingPlan = async (pId: string) => {
    try {
      const response = await fetch(`/api/business/${businessId}/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: pId })
      });
      if (response.ok) {
        const val = await response.json();
        setBusiness({ ...business, planId: val.planId });
        alert(`Successfully upgraded subscription to [${pId.toUpperCase()}] tier! Limits updated.`);
        fetchWorkspaceData(); // update analytics limits horizontal bars
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Form details presets
  const logoList = ["🍕", "👕", "🏠", "💇", "👁️", "💼", "⭐", "🛍️", "🩺", "🏫", "🤖"];

  return (
    <div id="workspace-master-layout" className="flex h-screen w-full bg-[#f8fafc] text-[#0f172a] font-sans overflow-hidden">
      {/* Sidebar - Desktop Layout style */}
      <aside className="w-64 bg-[#1e293b] text-slate-300 shrink-0 flex flex-col justify-between hidden md:flex h-full">
        <div className="flex flex-col flex-1 min-h-0">
          <div className="p-6 shrink-0">
            <div className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-lg italic shadow-sm">S</div>
              <span className="text-xl font-bold tracking-tight italic">SiteBot AI</span>
            </div>
            <div className="mt-1 text-[10px] text-blue-400 font-mono tracking-wider uppercase font-bold">
              {business.category} Console
            </div>
          </div>
          
          <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
            <button
              onClick={() => setActiveTab("analytics")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all text-xs font-semibold text-left cursor-pointer ${
                activeTab === "analytics" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-850"
              }`}
            >
              <BarChart3 className="w-4 h-4 shrink-0" /> Performance Stats
            </button>

            <button
              onClick={() => setActiveTab("knowledge_base")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all text-xs font-semibold text-left cursor-pointer ${
                activeTab === "knowledge_base" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-850"
              }`}
            >
              <Database className="w-4 h-4 shrink-0" /> RAG Knowledge Base
            </button>

            <button
              onClick={() => setActiveTab("customs")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all text-xs font-semibold text-left cursor-pointer ${
                activeTab === "customs" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-850"
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" /> Customize Bot
            </button>

            <button
              onClick={() => setActiveTab("embed_generator")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all text-xs font-semibold text-left cursor-pointer ${
                activeTab === "embed_generator" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-850"
              }`}
            >
              <Code className="w-4 h-4 shrink-0" /> Widget & Sandbox
            </button>

            <button
              onClick={() => setActiveTab("leads_tickets")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all text-xs font-semibold text-left cursor-pointer ${
                activeTab === "leads_tickets" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-850"
              }`}
            >
              <Mail className="w-4 h-4 shrink-0" /> Inbox & Desk Tickets
            </button>

            <button
              onClick={() => setActiveTab("staff")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all text-xs font-semibold text-left cursor-pointer ${
                activeTab === "staff" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-850"
              }`}
            >
              <Users className="w-4 h-4 shrink-0" /> Staff Specialists
            </button>

            <button
              onClick={() => setActiveTab("plan")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all text-xs font-semibold text-left cursor-pointer ${
                activeTab === "plan" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-850"
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0" /> SaaS Subscription
            </button>
          </nav>
        </div>

        {/* Outer User Info Profile */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white font-bold shrink-0">
              {currentUser.name ? currentUser.name.split(" ").map(n => n[0]).join("").toUpperCase() : "JD"}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-white font-medium truncate leading-tight">{currentUser.name}</p>
              <p className="text-[11px] text-slate-400 capitalize truncate leading-normal">{business.name}</p>
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
              {activeTab.replace("_", " ")} Overview
            </h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase leading-none mt-0.5">
              {business.planId.toUpperCase()} Subscription Workspace
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={onLogout}
              className="px-4 py-2 text-slate-750 hover:text-slate-950 hover:bg-slate-100 rounded-lg text-xs font-semibold border border-slate-200 transition-all cursor-pointer bg-white"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Workspace Central Content Frame */}
        <section className="flex-1 bg-[#f8fafc] overflow-y-auto p-8 relative">
          {errorText && (
            <div className="bg-rose-50 border-l-4 border-rose-600 p-3.5 rounded text-xs text-rose-700 font-bold mb-4">
              {errorText}
            </div>
          )}

          {/* Tab 1: Performance stats analytics */}
          {activeTab === "analytics" && analytics && (
            <div className="space-y-6">
              {/* Analytics Header Row */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">Performance Analytics Overview</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Real-time engagement ratios and training status of your customized floating chatbot widget.</p>
                </div>
                <button 
                  onClick={fetchWorkspaceData}
                  className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3 py-2 rounded-lg flex items-center gap-1.5 hover:bg-slate-50 shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Re-Fetch Analytics
                </button>
              </div>

              {/* Stat Boxes */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider uppercase">Conversations sessions</div>
                  <div className="text-2xl font-black text-slate-900">{analytics.totalConversations}</div>
                  <span className="text-[9px] text-emerald-500 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded font-black inline-block mt-1">+14% vs last week</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider uppercase">High-Intent Leads</div>
                  <div className="text-2xl font-black text-slate-900">{analytics.totalLeads}</div>
                  <span className="text-[9px] text-emerald-500 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded font-black inline-block mt-1">Conversions rate: 24%</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider uppercase font-sans">Inquiry Tickets Open</div>
                  <div className="text-2xl font-black text-slate-900">{analytics.openTickets} <span className="text-xs font-normal text-slate-400">/ {analytics.totalTickets} total</span></div>
                  <span className="text-[9px] text-indigo-500 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded font-black inline-block mt-1">Resolution progress: {Math.round((analytics.resolvedTickets / (analytics.totalTickets || 1)) * 100)}%</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider uppercase">Successful AI queries</div>
                  <div className="text-2xl font-black text-slate-900">{analytics.aiAnswered} <span className="text-xs font-normal text-slate-400">answered</span></div>
                  <span className="text-[9px] text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded font-black inline-block mt-1">Fail fallbacks: {analytics.aiUnanswered} cases</span>
                </div>
              </div>

              {/* Visual custom bar charts */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
                  <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle className="w-4.5 h-4.5 text-blue-600" /> Interactive Monthly Chat Volumes
                  </h3>
                  
                  {/* Monthly volume blocks */}
                  <div className="h-44 flex items-end justify-between px-4 pb-2 pt-6 gap-3">
                    {analytics.monthlyUsage.map((m: any, i: number) => {
                      const maxVal = Math.max(...analytics.monthlyUsage.map((item: any) => item.messagesCount));
                      const percent = maxVal > 0 ? (m.messagesCount / maxVal) * 100 : 0;
                      return (
                        <div key={i} className="flex-1 flex flex-col justify-end items-center h-full space-y-2">
                          <div className="text-[10px] font-bold text-blue-600 font-mono">{m.messagesCount} msgs</div>
                          <div 
                            className="w-full bg-blue-600 rounded-lg transition-all hover:opacity-90 shadow-sm"
                            style={{ height: `${percent}%`, minHeight: "8px" }}
                          ></div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{m.month}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
                  <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-4.5 h-4.5 text-indigo-600" /> Top Customer Search Queries
                  </h3>
                  <div className="space-y-3.5">
                    {analytics.mostAskedQuestions.slice(0, 4).map((faq: any, i: number) => {
                      const maxVal = Math.max(...analytics.mostAskedQuestions.map((item: any) => item.count));
                      const percent = maxVal > 0 ? (faq.count / maxVal) * 100 : 0;
                      return (
                        <div key={i} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-700 italic">&quot;{faq.question}&quot;</span>
                            <span className="text-slate-500 font-mono font-bold">{faq.count} searches</span>
                          </div>
                          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${percent}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: RAG Knowledge base management */}
          {activeTab === "knowledge_base" && (
            <div className="space-y-8">
              {/* Top description */}
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">RAG Knowledge Base & Documents</h2>
                <p className="text-xs text-slate-500 mt-0.5">Drop files or manual guidelines FAQs below. SiteBot AI parses, chunks, and uses them to answer visitor queries with zero-hallucinations.</p>
              </div>

              {/* Tab 2 Inner Sub-sections: Files and Manual FAQ */}
              <div className="grid lg:grid-cols-3 gap-6 items-start">
                {/* Upload Form side */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="font-bold text-xs text-slate-400 uppercase tracking-widest flex items-center gap-1"><FileText className="w-4 h-4 text-slate-400" /> Add Resource File</h3>
                  
                  <form onSubmit={handleDocUpload} className="space-y-4 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Document Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Return_Policy, Summer_Menu"
                        value={newDocName}
                        onChange={(e) => setNewDocName(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">File Format</label>
                      <div className="grid grid-cols-3 gap-2">
                        {["txt", "pdf", "docx"].map((ext) => (
                          <button
                            key={ext}
                            type="button"
                            onClick={() => setNewDocType(ext as any)}
                            className={`text-xs px-3 py-2 border rounded-xl font-bold uppercase transition-all tracking-wider ${
                              newDocType === ext ? "bg-slate-900 text-white border-transparent" : "bg-white border-slate-200 text-slate-600"
                            }`}
                          >
                            .{ext}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Text Content / Catalog guidelines</label>
                      <textarea
                        required
                        rows={6}
                        placeholder="Paste or write the entire text detailing product pricing, delivery costs, return policies or location directions..."
                        value={newDocText}
                        onChange={(e) => setNewDocText(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-xl p-3 bg-slate-50 focus:outline-none"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      disabled={isUploading}
                      className="w-full py-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md cursor-pointer disabled:opacity-40"
                    >
                      {isUploading ? "Chunking & Indexing Text..." : "Upload Document & Re-Index RAG"}
                    </button>
                  </form>
                </div>

                {/* Table list side */}
                <div className="lg:col-span-2 space-y-6">
                  {/* File List */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="font-bold text-xs text-slate-400 uppercase tracking-widest">Active Indexed Documents</h3>
                    
                    <div className="overflow-x-auto text-xs">
                      <table className="w-full text-left font-sans">
                        <thead>
                          <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                            <th className="py-2.5">File Name</th>
                            <th className="py-2.5">Type</th>
                            <th className="py-2.5">Uploaded By</th>
                            <th className="py-2.5 text-center">Status</th>
                            <th className="py-2.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {documents.map((doc) => (
                            <tr key={doc.id} className="hover:bg-slate-50">
                              <td className="py-3 font-bold text-slate-900">{doc.name}</td>
                              <td className="py-3 uppercase font-mono font-bold text-slate-500 text-[10px]">.{doc.type}</td>
                              <td className="py-3 text-slate-600">{doc.uploadedBy}</td>
                              <td className="py-3 text-center">
                                <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold font-sans">
                                  <Check className="w-3 h-3" /> Processed
                                </span>
                              </td>
                              <td className="py-3 text-right">
                                <button
                                  onClick={() => handleDocDelete(doc.id)}
                                  className="text-xs text-rose-600 hover:text-rose-800 font-bold p-1 hover:bg-rose-50 rounded"
                                >
                                  <Trash2 className="w-4 h-4 inline-block" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Manual FAQs component */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="font-bold text-xs text-slate-400 uppercase tracking-widest">In-Line FAQ List</h3>
                    
                    {/* Inline FAQ Adder */}
                    <form onSubmit={handleAddFAQSubmit} className="grid md:grid-cols-3 gap-3 items-end bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Question</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Do you accept Apple Pay?"
                          value={newFAQQuestion}
                          onChange={(e) => setNewFAQQuestion(e.target.value)}
                          className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Exact Answer</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Yes! We accept Apple Pay, Google Pay..."
                          value={newFAQAnswer}
                          onChange={(e) => setNewFAQAnswer(e.target.value)}
                          className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isAddingFAQ}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-4 h-4 animate-spin-once" /> Add FAQ Q&A
                      </button>
                    </form>

                    {/* FAQ item List */}
                    <div className="space-y-3.5">
                      {faqs.map((faq) => {
                        const isEditing = editingFAQId === faq.id;
                        return (
                          <div key={faq.id} className="bg-slate-50/50 p-3 rounded-xl border border-slate-200 text-xs flex justify-between items-start gap-4">
                            {isEditing ? (
                              <div className="flex-1 space-y-2">
                                <input
                                  type="text"
                                  value={editFAQQuestion}
                                  onChange={(e) => setEditFAQQuestion(e.target.value)}
                                  className="w-full border p-2 bg-white text-xs"
                                />
                                <input
                                  type="text"
                                  value={editFAQAnswer}
                                  onChange={(e) => setEditFAQAnswer(e.target.value)}
                                  className="w-full border p-2 bg-white text-xs"
                                />
                                <button onClick={() => handleSaveEditFAQ(faq.id)} className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded">Save Update</button>
                              </div>
                            ) : (
                              <div className="flex-1 space-y-1">
                                <div className="font-extrabold text-slate-900 flex items-start gap-1">FAQ Question: <span className="font-bold text-slate-700 italic">&quot;{faq.question}&quot;</span></div>
                                <div className="text-slate-600">Answer: {faq.answer}</div>
                              </div>
                            )}

                            {!isEditing && (
                              <div className="flex gap-2 shrink-0">
                                <button onClick={() => handleStartEditFAQ(faq)} className="text-slate-400 hover:text-slate-600"><Edit2 className="w-3.5 h-3.5" /></button>
                                <button onClick={() => handleFAQDelete(faq.id)} className="text-rose-500 hover:text-rose-700"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Chatbot Customization forms */}
          {activeTab === "customs" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">Custom Chatbot Styler & Brand Guardrails</h2>
                <p className="text-xs text-slate-500 mt-0.5">Configure theme styling palettes, customized brand warnings, away hours and lead forms.</p>
              </div>

              <div className="grid lg:grid-cols-5 gap-6 items-start">
                {/* Custom Form Block */}
                <form onSubmit={handleSaveCustomizations} className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Chatbot System Name</label>
                      <input
                        type="text"
                        required
                        value={botName}
                        onChange={(e) => setBotName(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 bg-slate-50"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Personality Tone</label>
                      <select
                        value={botTone}
                        onChange={(e) => setBotTone(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl px-3 py-2.5 bg-slate-50 text-xs text-slate-700"
                      >
                        <option value="friendly">Friendly & Outgoing</option>
                        <option value="professional">Professional & Technical</option>
                        <option value="playful">Playful & Witty</option>
                        <option value="empathetic">Empathetic & Supportive</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Chatbot Avatar Logo</label>
                      <div className="flex flex-wrap gap-1.5">
                        {logoList.map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setBotLogo(emoji)}
                            className={`w-10 h-10 border rounded-lg text-lg flex items-center justify-center transition-all ${
                              botLogo === emoji ? "bg-slate-900 text-white border-transparent" : "bg-white border-slate-200"
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Primary Accent Hex</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-12 h-10 p-0 border border-slate-200 rounded-lg cursor-pointer bg-white"
                        />
                        <input
                          type="text"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          placeholder="#000000"
                          className="flex-1 shrink-0 px-3 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-xs font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Dynamic Greeting Welcome Message</label>
                    <textarea
                      rows={3}
                      required
                      value={welcomeMessage}
                      onChange={(e) => setWelcomeMessage(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-xl p-3 bg-slate-50"
                    ></textarea>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">RAG Fail Fallback Message</label>
                    <textarea
                      rows={3}
                      required
                      value={fallbackMessage}
                      onChange={(e) => setFallbackMessage(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-xl p-3 bg-slate-50"
                    ></textarea>
                  </div>

                  {/* Lead Capture Controls */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3.5">
                    <h4 className="font-bold text-slate-800 flex items-center gap-1 uppercase text-[10px] tracking-wider text-slate-500">Lead Capture Form Configuration</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center gap-2 font-bold text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={capName}
                          onChange={(e) => setCapName(e.target.checked)}
                          className="rounded border-slate-300"
                        /> Ask for Name
                      </label>
                      <label className="flex items-center gap-2 font-bold text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={capEmail}
                          onChange={(e) => setCapEmail(e.target.checked)}
                          className="rounded border-slate-300"
                        /> Ask for Email
                      </label>
                      <label className="flex items-center gap-2 font-bold text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={capPhone}
                          onChange={(e) => setCapPhone(e.target.checked)}
                          className="rounded border-slate-300"
                        /> Ask for Phone Number
                      </label>
                      <label className="flex items-center gap-2 font-bold text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={capReq}
                          onChange={(e) => setCapReq(e.target.checked)}
                          className="rounded border-slate-300 text-blue-600"
                        /> Require form prior to chat
                      </label>
                    </div>
                  </div>

                  {/* Operational Business Hours */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-4">
                    <label className="flex items-center gap-2 font-black text-xs text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hoursEnabled}
                        onChange={(e) => setHoursEnabled(e.target.checked)}
                        className="rounded text-blue-600"
                      /> Enable Custom Office / Service Hours
                    </label>

                    {hoursEnabled && (
                      <div className="space-y-4 pt-1 border-t border-slate-200">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wide">Start Time</label>
                            <input
                              type="time"
                              value={hoursStart}
                              onChange={(e) => setHoursStart(e.target.value)}
                              className="border rounded p-2 text-xs w-full bg-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wide">End Time</label>
                            <input
                              type="time"
                              value={hoursEnd}
                              onChange={(e) => setHoursEnd(e.target.value)}
                              className="border rounded p-2 text-xs w-full bg-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wide">Timezone</label>
                            <input
                              type="text"
                              value={hoursTimezone}
                              onChange={(e) => setHoursTimezone(e.target.value)}
                              placeholder="EST, UTC"
                              className="border rounded p-2 text-xs w-full bg-white font-mono"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wide">Off-Hours / Away Auto Response</label>
                          <textarea
                            rows={2}
                            placeholder="Message shown when visitor writes during off hours..."
                            value={awayMessage}
                            onChange={(e) => setAwayMessage(e.target.value)}
                            className="border rounded-lg p-2.5 text-xs w-full bg-white"
                          ></textarea>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full text-white bg-slate-900 hover:bg-slate-800 font-bold py-3 px-4 rounded-xl text-xs shadow-md mt-6 cursor-pointer"
                  >
                    Save Custom Style Configurations
                  </button>
                </form>

                {/* Stencil Live Widget mockup right side */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 shrink-0">
                    <h3 className="font-bold text-xs text-slate-400 tracking-wider uppercase">Interactive Staging Preview</h3>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      This represents how your active chatbot will look with your live configurations (Primary hex, avatar emoji, default welcome lines).
                    </p>
                  </div>

                  {/* Inline widget renderer */}
                  <div className="h-[480px] bg-slate-900 border border-slate-950 rounded-2xl overflow-hidden relative shadow-inner">
                    <ChatbotWidget
                      key={sandboxRefreshKey}
                      businessId={businessId}
                      chatbotSettings={{
                        botName,
                        welcomeMessage,
                        fallbackMessage,
                        primaryColor,
                        logo: botLogo,
                        tone: botTone,
                        businessHours: { enabled: hoursEnabled, start: hoursStart, end: hoursEnd, timezone: hoursTimezone, awayMessage },
                        leadCaptureFields: { name: capName, email: capEmail, phone: capPhone, message: false, requiredBeforeChat: false }
                      }}
                      businessName={business.name}
                      inline={true}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Widget Integration script Embed code */}
          {activeTab === "embed_generator" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">Embed Workspace Script</h2>
                <p className="text-xs text-slate-500 mt-0.5">Simply paste the custom compiled script tags into any body elements on your website.</p>
              </div>

              <div className="grid lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5 text-xs">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">SiteBot AI Widget Embed Snippet</h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">Copy and paste this script directly before the closing body block of your HTML page. No coding required.</p>
                  </div>

                  {/* Embed Snippet Container */}
                  <div className="bg-slate-950 font-mono text-[11px] text-slate-300 p-4 rounded-xl border border-slate-800 relative select-all leading-relaxed">
                    <code>
                      {`<!-- SiteBot AI Chatbot Widget Embed Code -->
<script>
  window.SiteBotAIConfig = {
    botId: "${business.id}",
    primaryColor: "${business.chatbotSettings.primaryColor}",
    botName: "${business.chatbotSettings.botName}"
  };
</script>
<script src="${import.meta.env.VITE_APP_URL || "https://sitebot.ai"}/cdn/embed.min.js" async></script>`}
                    </code>
                  </div>

                  <div className="bg-blue-50 border-l-3 border-blue-600 p-4 rounded-r-xl flex gap-3 text-xs leading-relaxed text-blue-800">
                    <Sparkles className="w-5.5 h-5.5 shrink-0" />
                    <div>
                      <strong>Need to test staging right now?</strong>
                    </div>
                  </div>
                </div>

                {/* Simulated Website backdrops lists */}
                <div className="space-y-4">
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="font-bold text-xs text-slate-400 tracking-wider uppercase">Website Backdrop Sandbox</h3>
                    <p className="text-[11px] text-slate-500">
                      Switch between different business backdrop frames to preview how the chatbot widget integrates into a dummy customer-facing website.
                    </p>

                    <div className="space-y-2">
                      <button
                        onClick={() => setStageTheme("restaurant")}
                        className={`w-full text-xs text-left p-3 border rounded-xl font-bold flex justify-between items-center ${stageTheme === "restaurant" ? "bg-slate-900 border-transparent text-white shadow" : "bg-slate-50 hover:bg-slate-100"}`}
                      >
                        🍕 Italian Diner Website Staging
                        {stageTheme === "restaurant" && <ArrowRight className="w-4 h-4 text-blue-500" />}
                      </button>
                      <button
                        onClick={() => setStageTheme("apparel")}
                        className={`w-full text-xs text-left p-3 border rounded-xl font-bold flex justify-between items-center ${stageTheme === "apparel" ? "bg-slate-900 border-transparent text-white shadow" : "bg-slate-50 hover:bg-slate-100"}`}
                      >
                        🛍️ TrendVibe Apparel Boutique Shop
                        {stageTheme === "apparel" && <ArrowRight className="w-4 h-4 text-blue-500" />}
                      </button>
                      <button
                        onClick={() => setStageTheme("medical")}
                        className={`w-full text-xs text-left p-3 border rounded-xl font-bold flex justify-between items-center ${stageTheme === "medical" ? "bg-slate-900 border-transparent text-white shadow" : "bg-slate-50 hover:bg-slate-100"}`}
                      >
                        🩺 Clinic Optometry Portal Staging
                        {stageTheme === "medical" && <ArrowRight className="w-4 h-4 text-blue-500" />}
                      </button>
                    </div>

                    {/* Preview link wrapper */}
                    <div className="border-t pt-4 space-y-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Direct Simulation Website Sandbox</span>
                      <a
                        href={`/?botId=${business.id}&demoType=${stageTheme}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-3 rounded-lg block text-center flex items-center justify-center gap-1.5"
                      >
                        <Play className="w-4 h-4" /> Open Live Sandbox Website in New Tab
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Leads & Support Tickets Table list review */}
          {activeTab === "leads_tickets" && (
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">Chats, Leads & Ticket Registry</h2>
                <p className="text-xs text-slate-500 mt-0.5">Track contact cards and customer inquiries logged from floating chatbot forms.</p>
              </div>

              <div className="grid lg:grid-cols-2 gap-6 items-start">
                {/* Captured Leads */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="font-bold text-xs text-slate-400 uppercase tracking-widest flex items-center gap-1"><CheckCircle className="w-4.5 h-4.5 text-blue-600" /> High-Intent Captured Leads</h3>

                  <div className="overflow-x-auto text-xs font-sans">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-50">
                          <th className="py-2.5 px-3">Lead Contact</th>
                          <th className="py-2.5 px-3">Inquiry detail</th>
                          <th className="py-2.5 px-3 text-right">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {leads.map((l) => (
                          <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-3 font-bold text-slate-900">
                              <div>{l.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{l.email} • {l.phone || "No phone"}</div>
                            </td>
                            <td className="py-3 px-3 text-slate-600 max-w-64 truncate">{l.message}</td>
                            <td className="py-3 px-3 text-right font-mono text-[10px] text-slate-400">
                              {new Date(l.timestamp).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Customer support Tickets */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="font-bold text-xs text-slate-400 uppercase tracking-widest flex items-center gap-1"><LifeBuoy className="w-5 h-5 text-indigo-500" /> Support Desk Tickets</h3>

                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-50">
                          <th className="py-2.5 px-3">Ticket Information</th>
                          <th className="py-2.5 px-3">Priority</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Registered</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150">
                        {tickets.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3.5 px-3 font-bold text-slate-900">
                              <div>{t.title}</div>
                              <div className="text-[10px] text-slate-400 font-medium">By {t.visitorName} ({t.visitorEmail})</div>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`text-[9px] uppercase font-mono font-black border px-1.5 py-0.5 rounded ${t.priority === "high" || t.priority === "urgent" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
                                {t.priority}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-bold">
                              <span className={`uppercase text-[9px] ${t.status === "open" ? "text-amber-600" : t.status === "resolved" ? "text-emerald-600" : "text-blue-600"}`}>
                                {t.status.replace("_", " ")}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right text-slate-400 font-mono text-[10px]">
                              {new Date(t.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 6: Staff seats management CRUD */}
          {activeTab === "staff" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">Staff Team Specialists</h2>
                <p className="text-xs text-slate-500 mt-0.5">Invite, assign, and manage support desk seats allowed on your platform profile.</p>
              </div>

              <div className="grid lg:grid-cols-3 gap-6 items-start">
                {/* Invite Staff form */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="font-bold text-xs text-slate-400 uppercase tracking-widest">Register Team Seat</h3>
                  
                  <form onSubmit={handleAddStaffSubmit} className="space-y-4 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Luigi Pizza, Sara Bloom"
                        value={newStaffName}
                        onChange={(e) => setNewStaffName(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="staff@brand.com"
                        value={newStaffEmail}
                        onChange={(e) => setNewStaffEmail(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Password</label>
                      <input
                        type="password"
                        required
                        placeholder="6+ characters"
                        value={newStaffPassword}
                        onChange={(e) => setNewStaffPassword(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isAddingStaff}
                      className="w-full py-3 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md cursor-pointer disabled:opacity-40"
                    >
                      {isAddingStaff ? "Processing seat..." : "Invite Support Agent"}
                    </button>
                  </form>
                </div>

                {/* Staff List Table */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <h3 className="font-bold text-xs text-slate-400 uppercase tracking-widest">Active Staff Team Members</h3>
                  
                  <div className="overflow-x-auto text-xs font-sans">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase font-black tracking-widest bg-slate-50">
                          <th className="py-2.5 px-3">Seat Name</th>
                          <th className="py-2.5 px-3">Email Desk Address</th>
                          <th className="py-2.5 px-3">Assigned Role</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {staffList.map((st) => (
                          <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-3 font-bold text-slate-900">{st.name}</td>
                            <td className="py-3 px-3 font-mono text-slate-600">{st.email}</td>
                            <td className="py-3 px-3 font-bold uppercase tracking-wider text-[10px] text-rose-600 bg-rose-50/50 border border-rose-100 px-2 py-0.5 rounded font-mono inline-block mt-1">
                              Support Staff
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => handleRemoveStaff(st.id)}
                                className="text-xs text-rose-600 hover:text-rose-800 font-bold p-1 hover:bg-rose-50 rounded"
                              >
                                <Trash2 className="w-4 h-4 inline-block" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 7: SaaS Plan upgrade selector page and current limits Horizontal progress bars! */}
          {activeTab === "plan" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">SaaS Subscription Management</h2>
                <p className="text-xs text-slate-500 mt-0.5">View active usage limits matching your current system plan, or switch levels to simulate billing structures.</p>
              </div>

              {/* Current Usage Horizontal Progress bars */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider">Active Workspace Resource Usage</h3>
                
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Chatbots limit */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-700">Bots Created:</span>
                      <span className="font-bold font-mono text-slate-800">1 / {business.planId === "free" || business.planId === "basic" ? "1" : business.planId === "pro" ? "3" : "Unlimited"}</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: business.planId === "free" || business.planId === "basic" ? "100%" : "33%" }}></div>
                    </div>
                  </div>

                  {/* Documents limit */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-700">RAG Files Uploaded:</span>
                      <span className="font-bold font-mono text-slate-800">{documents.length} / {business.planId === "free" ? "2" : business.planId === "basic" ? "10" : business.planId === "pro" ? "50" : "200"} files</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 rounded-full" 
                        style={{ width: `${(documents.length / (business.planId === "free" ? 2 : business.planId === "basic" ? 10 : business.planId === "pro" ? 50 : 200)) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Captured Leads limit */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-700">Leads Captured:</span>
                      <span className="font-bold font-mono text-slate-800">{leads.length} / {business.planId === "free" ? "10" : business.planId === "basic" ? "100" : business.planId === "pro" ? "500" : "9999"} capture leads</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-600 rounded-full" 
                        style={{ width: `${(leads.length / (business.planId === "free" ? 10 : business.planId === "basic" ? 100 : business.planId === "pro" ? 500 : 9999)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Plans Options Selector */}
              <div className="grid md:grid-cols-4 gap-4 max-w-5xl">
                {[
                  { id: "free", name: "Free Trial", price: 0 },
                  { id: "basic", name: "Basic Startup", price: 19 },
                  { id: "pro", name: "Pro Growth", price: 49 },
                  { id: "business", name: "Enterprise Business", price: 99 }
                ].map((plan) => {
                  const isActive = business.planId === plan.id;
                  return (
                    <div 
                      key={plan.id} 
                      className={`bg-white border rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between ${
                        isActive ? "border-blue-600 border-2" : "border-slate-200"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-900">{plan.name}</span>
                          {isActive && <span className="text-[9px] bg-blue-100 text-blue-700 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">Active</span>}
                        </div>
                        <div className="text-xl font-black text-slate-800 mt-1">${plan.price}<span className="text-xs text-slate-400 font-medium">/mo</span></div>
                      </div>

                      <button
                        onClick={() => handleSwitchBillingPlan(plan.id)}
                        disabled={isActive}
                        className={`w-full py-2.5 rounded-lg text-xs font-bold tracking-wide transition-all ${
                          isActive 
                            ? "bg-slate-100 text-slate-400 pointer-events-none" 
                            : "bg-slate-900 hover:bg-slate-800 text-white cursor-pointer"
                        }`}
                      >
                        {isActive ? "Current Active Level" : "Switch Plan"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Mobile Sidebar Footer Selector */}
      <div className="bg-slate-950 text-slate-400 border-t border-slate-900/80 p-3 flex justify-around md:hidden text-[10px] font-bold shrink-0">
        <button onClick={() => setActiveTab("analytics")} className={`p-1 ${activeTab === "analytics" ? "text-white" : ""}`}>Stats</button>
        <button onClick={() => setActiveTab("knowledge_base")} className={`p-1 ${activeTab === "knowledge_base" ? "text-white" : ""}`}>Knowledge</button>
        <button onClick={() => setActiveTab("customs")} className={`p-1 ${activeTab === "customs" ? "text-white" : ""}`}>Customize</button>
        <button onClick={() => setActiveTab("embed_generator")} className={`p-1 ${activeTab === "embed_generator" ? "text-white" : ""}`}>Embed</button>
        <button onClick={() => setActiveTab("leads_tickets")} className={`p-1 ${activeTab === "leads_tickets" ? "text-white" : ""}`}>Inbox</button>
      </div>
    </div>
  );
}

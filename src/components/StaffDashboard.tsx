import React, { useState, useEffect } from "react";
import { 
  Users, MessageSquare, LifeBuoy, AlertCircle, RefreshCw, Send, CheckCircle, 
  HelpCircle, Plus, Trash, Search, ArrowRight, CornerDownRight, CheckSquare, Clock 
} from "lucide-react";
import { User, ChatSession, ChatMessage, Ticket, FAQ } from "../types";

interface StaffDashboardProps {
  onLogout: () => void;
  currentUser: User;
}

export default function StaffDashboard({ onLogout, currentUser }: StaffDashboardProps) {
  const businessId = currentUser.businessId || "";

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState("");
  const [ticketStatusFilter, setTicketStatusFilter] = useState("all");

  const [unansweredList, setUnansweredList] = useState<any[]>([]);
  const [newFAQAnswers, setNewFAQAnswers] = useState<{ [id: string]: string }>({});

  const [activeSubTab, setActiveSubTab] = useState<"assigned_chats" | "support_tickets" | "review_ai">("assigned_chats");
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Initialize
  const loadStaffLogs = async () => {
    if (!businessId) return;
    setIsLoading(true);
    try {
      const sessRes = await fetch(`/api/business/${businessId}/chats`);
      const tickRes = await fetch(`/api/business/${businessId}/tickets`);
      const unanRes = await fetch(`/api/business/${businessId}/unanswered`);

      if (sessRes.ok) {
        const sData = await sessRes.json();
        setSessions(sData);
        // Default select first session if we don't have one selected or if selected is stale
        if (sData.length > 0 && !selectedSession) {
          handleSelectSession(sData[0]);
        }
      }

      if (tickRes.ok) {
        const tData = await tickRes.json();
        setTickets(tData);
        if (tData.length > 0 && !selectedTicket) {
          setSelectedTicket(tData[0]);
        }
      }

      if (unanRes.ok) {
        setUnansweredList(await unanRes.json());
      }
      
      setErrorText("");
    } catch (err) {
      setErrorText("Telemetry logs failed to load. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStaffLogs();
  }, [businessId]);

  // Load select chat messages
  const handleSelectSession = async (session: ChatSession) => {
    setSelectedSession(session);
    try {
      const res = await fetch(`/api/chats/${session.id}/messages`);
      if (res.ok) {
        setMessages(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Reply to chat
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedSession) return;

    setIsSending(true);
    const text = inputText.trim();
    setInputText("");

    try {
      const response = await fetch("/api/chats/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          chatId: selectedSession.id,
          sender: "staff",
          senderName: currentUser.name,
          message: text
        })
      });

      if (!response.ok) throw new Error("Could not relay text.");
      const result = await response.json();

      setMessages(prev => [...prev, result.incoming]);

      // If session was on bot mode, transfer status to staff active automatically!
      if (selectedSession.status === "bot_active" || selectedSession.status === "human_requested") {
        await fetch(`/api/chats/session/${selectedSession.id}/update`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "staff_active", assignedTo: currentUser.id })
        });
        // refresh session list
        const refreshedSessions = sessions.map(s => 
          s.id === selectedSession.id ? { ...s, status: "staff_active" as const, assignedTo: currentUser.id } : s
        );
        setSessions(refreshedSessions);
        setSelectedSession({ ...selectedSession, status: "staff_active", assignedTo: currentUser.id });
      }

    } catch (err: any) {
      alert(err.message || "Failed to deliver message.");
    } finally {
      setIsSending(false);
    }
  };

  // Assign chat to myself manually
  const handleAssignToMe = async () => {
    if (!selectedSession) return;
    try {
      const response = await fetch(`/api/chats/session/${selectedSession.id}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "staff_active", assignedTo: currentUser.id })
      });
      if (response.ok) {
        const updated = await response.json();
        setSessions(sessions.map(s => s.id === updated.id ? updated : s));
        setSelectedSession(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Mark Chat session as resolved/closed
  const handleResolveSession = async () => {
    if (!selectedSession) return;
    try {
      const response = await fetch(`/api/chats/session/${selectedSession.id}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" })
      });
      if (response.ok) {
        const updated = await response.json();
        setSessions(sessions.map(s => s.id === updated.id ? updated : s));
        setSelectedSession(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Reply to ticket
  const handleSendTicketReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketReplyText.trim() || !selectedTicket) return;

    const replyMsg = ticketReplyText.trim();
    setTicketReplyText("");

    try {
      const response = await fetch(`/api/business/${businessId}/tickets/${selectedTicket.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName: currentUser.name,
          senderRole: "staff",
          message: replyMsg,
          status: "waiting_for_customer" // update status when staff replies!
        })
      });

      if (!response.ok) throw new Error("Could not log ticket response.");
      const updatedTicket = await response.json();

      setTickets(tickets.map(t => t.id === updatedTicket.id ? updatedTicket : t));
      setSelectedTicket(updatedTicket);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/business/${businessId}/tickets/${ticketId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName: currentUser.name,
          senderRole: "staff",
          message: `Ticket status updated to [${newStatus.replace("_", " ").toUpperCase()}] by support agent.`,
          status: newStatus
        })
      });

      if (response.ok) {
        const updated = await response.json();
        setTickets(tickets.map(t => t.id === updated.id ? updated : t));
        setSelectedTicket(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Unanswered AI question to FAQ converter
  const handleAddToFAQ = async (uqId: string, question: string) => {
    const answer = newFAQAnswers[uqId];
    if (!answer || !answer.trim()) {
      alert("Please enter a custom FAQ answer to save training information.");
      return;
    }

    try {
      // 1. Save as FAQ in database FAQ module!
      const faqRes = await fetch(`/api/business/${businessId}/faqs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, answer })
      });

      if (!faqRes.ok) throw new Error("Failed to insert FAQ.");

      // 2. Clear unanswered question row from unanswered list logs!
      await fetch(`/api/business/${businessId}/unanswered/${uqId}`, {
        method: "DELETE"
      });

      // Update local state
      setUnansweredList(unansweredList.filter(uq => uq.id !== uqId));
      alert("Successfully converted to active business FAQ! Chatbot will now resolve duplicates instantly.");
    } catch (err: any) {
      alert(err.message || "FAQ creation error.");
    }
  };

  const filteredTickets = tickets.filter(t => {
    if (ticketStatusFilter === "all") return true;
    if (ticketStatusFilter === "open") return t.status === "open" || t.status === "in_progress";
    if (ticketStatusFilter === "resolved") return t.status === "resolved" || t.status === "closed";
    return t.status === ticketStatusFilter;
  });

  return (
    <div id="staff-workspace-root" className="flex h-screen w-full bg-[#f8fafc] text-[#0f172a] font-sans overflow-hidden">
      {/* Sidebar - Desktop Layout style */}
      <aside className="w-64 bg-[#1e293b] text-slate-300 shrink-0 flex flex-col justify-between hidden md:flex h-full">
        <div className="flex flex-col flex-1 min-h-0">
          <div className="p-6 shrink-0">
            <div className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 bg-rose-600 rounded-lg flex items-center justify-center font-bold text-lg italic shadow-sm">S</div>
              <span className="text-xl font-bold tracking-tight italic">Support Desk</span>
            </div>
            <div className="mt-1 text-[10px] text-rose-400 font-mono tracking-wider uppercase font-bold">
              SiteBot Office Specialist
            </div>
          </div>
          
          <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
            <button
              onClick={() => setActiveSubTab("assigned_chats")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all text-xs font-semibold text-left cursor-pointer ${
                activeSubTab === "assigned_chats" ? "bg-rose-600 text-white" : "text-slate-300 hover:bg-slate-850"
              }`}
            >
              <MessageSquare className="w-4 h-4 shrink-0" /> Active Chats ({sessions.filter(s => s.status !== "resolved").length})
            </button>

            <button
              onClick={() => setActiveSubTab("support_tickets")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all text-xs font-semibold text-left cursor-pointer ${
                activeSubTab === "support_tickets" ? "bg-rose-600 text-white" : "text-slate-300 hover:bg-slate-850"
              }`}
            >
              <LifeBuoy className="w-4 h-4 shrink-0" /> Support Tickets ({tickets.filter(t => t.status !== "closed" && t.status !== "resolved").length})
            </button>

            <button
              onClick={() => setActiveSubTab("review_ai")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all text-xs font-semibold text-left cursor-pointer ${
                activeSubTab === "review_ai" ? "bg-rose-600 text-white" : "text-slate-300 hover:bg-slate-850"
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0" /> Learn Loop FAQS ({unansweredList.length})
            </button>
          </nav>
        </div>

        {/* Outer User Info Profile */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-rose-700/80 flex items-center justify-center text-xs text-white font-bold shrink-0">
              {currentUser.name ? currentUser.name.split(" ").map(n => n[0]).join("").toUpperCase() : "SP"}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-white font-medium truncate leading-tight">{currentUser.name}</p>
              <p className="text-[11px] text-rose-400 capitalize truncate leading-normal">Office Specialist</p>
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
              Support {activeSubTab.replace("_", " ")}
            </h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase leading-none mt-0.5">
              Live Agent Help Center
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={loadStaffLogs}
              className="px-3.5 py-2 hover:bg-slate-50 text-slate-750 bg-white rounded-lg text-xs font-semibold border border-slate-200 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Synchronize Logs
            </button>
            <button 
              onClick={onLogout}
              className="px-4 py-2 text-slate-755 hover:text-slate-950 hover:bg-slate-100 rounded-lg text-xs font-semibold border border-slate-200 transition-all cursor-pointer bg-white"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Scrollable page body */}
        <div className="flex-1 bg-[#f8fafc] overflow-y-auto p-8 relative flex flex-col min-h-0">
          {errorText && (
            <div className="bg-rose-50 border-l-4 border-rose-600 p-3.5 rounded text-xs text-rose-700 font-bold mb-4 shrink-0">
              {errorText}
            </div>
          )}

        {/* LOADING BOX */}
        {isLoading && sessions.length === 0 && (
          <div className="flex-1 flex flex-col justify-center items-center">
            <RefreshCw className="w-8 h-8 text-rose-600 animate-spin" />
            <span className="text-xs text-slate-500 font-extrabold uppercase mt-3 tracking-wider">Acquiring client sessions...</span>
          </div>
        )}

        {/* 1. Chats Window Layout */}
        {activeSubTab === "assigned_chats" && !isLoading && (
          <div className="flex-1 flex gap-5 min-h-0 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {/* List side */}
            <div className="w-80 border-r border-slate-100 flex flex-col shrink-0">
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-900 text-sm">Active Message Queues</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Real-time sessions requesting human reply desks.</p>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {sessions.map((sess) => {
                  const isSelected = selectedSession?.id === sess.id;
                  const waitingStaff = sess.status === "human_requested";
                  return (
                    <button
                      key={sess.id}
                      onClick={() => handleSelectSession(sess)}
                      className={`w-full text-left p-4 flex gap-3 transition-colors ${isSelected ? "bg-rose-50/50" : "hover:bg-slate-50"}`}
                    >
                      <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 shrink-0 font-bold">
                        {sess.visitorName ? sess.visitorName.charAt(0) : "G"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-900 block truncate">{sess.visitorName || "Guest User"}</span>
                          <span className="text-[9px] text-slate-400 font-mono">{new Date(sess.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">{sess.visitorEmail || "No contact info saved"}</div>
                        
                        <div className="flex items-center gap-1.5 mt-2">
                          {waitingStaff ? (
                            <span className="text-[8px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider animate-pulse">Request Handoff</span>
                          ) : sess.status === "resolved" ? (
                            <span className="text-[8px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium uppercase tracking-wider">Resolved</span>
                          ) : (
                            <span className="text-[8px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium uppercase tracking-wider">Staff Desk</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {sessions.length === 0 && (
                  <div className="text-center p-8 text-slate-400 text-xs italic">
                    No active chat sessions registered today.
                  </div>
                )}
              </div>
            </div>

            {/* Content Inbox Chat Pane */}
            <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
              {selectedSession ? (
                <>
                  {/* Top Bar info */}
                  <div className="bg-white border-b border-slate-100 p-4 shrink-0 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{selectedSession.visitorName || "Anonymous Visitor"}</h4>
                      <p className="text-[10px] text-slate-500">{selectedSession.visitorEmail || "Incomplete lead profile form"} • {selectedSession.visitorPhone || "No phone limit"}</p>
                    </div>

                    <div className="flex gap-2">
                      {selectedSession.status !== "resolved" && (
                        <button
                          onClick={handleResolveSession}
                          className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-2 rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Resolve Conversation
                        </button>
                      )}

                      {selectedSession.assignedTo !== currentUser.id && selectedSession.status !== "resolved" && (
                        <button
                          onClick={handleAssignToMe}
                          className="text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3.5 py-2 rounded-lg"
                        >
                          Claim Chat Queue
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Messages list */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3.5 flex flex-col">
                    {messages.map((m) => {
                      const isMe = m.sender === "staff";
                      const isBot = m.sender === "bot";
                      return (
                        <div key={m.id} className={`flex flex-col max-w-[80%] ${isMe ? "self-end" : "self-start"}`}>
                          <div className="text-[9px] text-slate-400 font-bold px-1 mb-0.5">
                            {isMe ? `👤 You (Staff)` : isBot ? `🤖 ${m.senderName} (Auto AI)` : `👤 Customer`}
                          </div>
                          <div className={`p-3 rounded-2xl text-xs leading-relaxed ${isMe ? "bg-rose-600 text-white rounded-tr-none" : isBot ? "bg-white text-slate-600 border border-slate-200 rounded-tl-none" : "bg-slate-200 text-slate-800 rounded-tl-none"}`}>
                            {m.message}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Reply Input */}
                  {selectedSession.status !== "resolved" ? (
                    <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                      <form onSubmit={handleSendChatMessage} className="flex gap-3">
                        <input
                          type="text"
                          required
                          placeholder="Type customer reply message here..."
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          className="flex-1 text-xs px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-transparent text-slate-800"
                        />
                        <button
                          type="submit"
                          disabled={!inputText.trim() || isSending}
                          className="bg-rose-600 hover:bg-rose-750 text-white px-5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow cursor-pointer disabled:opacity-40"
                        >
                          Send <Send className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-100 text-slate-500 font-medium text-xs border-t border-slate-200 text-center shrink-0">
                      Conversation closed. Click active user sessions to change.
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex flex-col justify-center items-center text-slate-400 text-xs italic">
                  Select a registered chat workspace from the queue to start helper answering!
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. Support Tickets View */}
        {activeSubTab === "support_tickets" && !isLoading && (
          <div className="flex-1 flex gap-5 min-h-0">
            {/* List tickets */}
            <div className="w-80 bg-white border border-slate-200 rounded-2xl flex flex-col shrink-0 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col gap-2.5">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-900 text-xs">Customer Support Tickets</h3>
                  <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-extrabold uppercase font-mono">{filteredTickets.length} items</span>
                </div>
                
                {/* Search / Filter */}
                <select
                  value={ticketStatusFilter}
                  onChange={(e) => setTicketStatusFilter(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg p-2 bg-white"
                >
                  <option value="all">All Ticket Statuses</option>
                  <option value="open">Active (Open & In-Progress)</option>
                  <option value="resolved">Resolved & Closed</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In-Progress</option>
                  <option value="waiting_for_customer">Waiting on Customer</option>
                </select>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-150">
                {filteredTickets.map((t) => {
                  const isSel = selectedTicket?.id === t.id;
                  const isHigh = t.priority === "high" || t.priority === "urgent";
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTicket(t)}
                      className={`w-full text-left p-4 flex flex-col transition-colors ${isSel ? "bg-rose-50/50" : "hover:bg-slate-50"}`}
                    >
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-xs font-bold text-slate-900 block truncate leading-tight flex-1">{t.title}</span>
                        <span className={`text-[8px] font-mono font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${isHigh ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"}`}>
                          {t.priority}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal mt-1 block truncate w-full">{t.description}</p>
                      
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-[9px] text-slate-400 font-bold block truncate max-w-40">👤 {t.visitorName}</span>
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${t.status === "open" ? "text-amber-600" : t.status === "in_progress" ? "text-blue-600" : t.status === "resolved" ? "text-emerald-600" : "text-slate-500"}`}>
                          {t.status.replace("_", " ")}
                        </span>
                      </div>
                    </button>
                  );
                })}

                {filteredTickets.length === 0 && (
                  <div className="text-center p-8 text-slate-400 text-xs italic">
                    No tickets found matching current status filter.
                  </div>
                )}
              </div>
            </div>

            {/* Resolution detailed chat side */}
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-sm">
              {selectedTicket ? (
                <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
                  {/* Top ticket bar */}
                  <div className="bg-white border-b border-slate-100 p-4 shrink-0 flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-slate-900 text-sm leading-tight">{selectedTicket.title}</h4>
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-600 border px-1.5 py-0.5 rounded font-black">{selectedTicket.id}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">Opened by <strong>{selectedTicket.visitorName}</strong> ({selectedTicket.visitorEmail}) on {new Date(selectedTicket.createdAt).toLocaleDateString()}</p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <select
                        value={selectedTicket.status}
                        onChange={(e) => handleUpdateTicketStatus(selectedTicket.id, e.target.value)}
                        className="text-xs border border-slate-200 bg-white rounded-lg p-2 font-bold focus:outline-none"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In-Progress</option>
                        <option value="waiting_for_customer">Waiting on Customer</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed / Solved</option>
                      </select>
                    </div>
                  </div>

                  {/* Replied conversation list */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
                    <div className="bg-amber-50 rounded-xl p-3 border border-amber-200/50 flex gap-2.5 items-start text-xs leading-relaxed self-center max-w-[95%]">
                      <AlertCircle className="w-5.5 h-5.5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Initial Customer Issue:</strong>
                        <p className="text-slate-700 mt-1">{selectedTicket.description}</p>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 my-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">Ticket Reply Logs</div>

                    {selectedTicket.replies.slice(1).map((rep) => {
                      const isStaff = rep.senderRole === "staff";
                      return (
                        <div key={rep.id} className={`flex flex-col max-w-[80%] ${isStaff ? "self-end" : "self-start"}`}>
                          <div className="text-[9px] text-slate-400 font-bold px-1 mb-0.5">
                            {rep.senderName} ({isStaff ? "Staff Specialist" : "Client Visitor"})
                          </div>
                          <div className={`p-3 rounded-xl text-xs leading-relaxed ${isStaff ? "bg-rose-600 text-white rounded-tr-none" : "bg-slate-200 text-slate-800 rounded-tl-none"}`}>
                            {rep.message}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Reply Input Form */}
                  {selectedTicket.status !== "closed" && selectedTicket.status !== "resolved" ? (
                    <div className="bg-white p-4 border-t border-slate-100 shrink-0">
                      <form onSubmit={handleSendTicketReply} className="space-y-2">
                        <textarea
                          required
                          rows={3}
                          placeholder="Type detailed resolution response steps here (submits reply and sets status to 'Waiting for Customer')..."
                          value={ticketReplyText}
                          onChange={(e) => setTicketReplyText(e.target.value)}
                          className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                        ></textarea>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-[10px] text-slate-400">Response will be emailed to: <strong>{selectedTicket.visitorEmail}</strong></span>
                          <button
                            type="submit"
                            className="bg-rose-600 hover:bg-rose-755 text-white px-4 py-2 text-xs font-bold rounded-lg shadow cursor-pointer flex items-center gap-1"
                          >
                            Send Resolution <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="bg-slate-100 text-slate-400 font-medium text-xs p-4 text-center border-t border-slate-200 shrink-0">
                      This ticket is marked as finalized (Resolved/Closed). Adjust status to re-open for conversational input.
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-center items-center text-slate-400 text-xs italic">
                  Select a customer support issue ticket to see replies logs.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. Learn Loop FAQs AI Reviewer Tab */}
        {activeSubTab === "review_ai" && !isLoading && (
          <div className="space-y-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5"><AlertCircle className="w-5 h-5 text-rose-600" /> FAQ Training Generator</h3>
              <p className="text-xs text-slate-500 mt-1 font-sans">
                Below are real customer questions that hit the bot&apos;s <strong>Fallback message</strong> because the knowledge base lacked corresponding details. Give them a quick text answer to create full-fledged active FAQs and train the bot instantly.
              </p>
            </div>

            <div className="space-y-4 mt-6">
              {unansweredList.map((uq) => (
                <div key={uq.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded font-mono">Unanswered Question</span>
                      <span className="text-[10px] text-slate-400 font-bold flex items-center gap-0.5"><Clock className="w-3.5 h-3.5" /> Triggered {uq.count} times</span>
                    </div>
                    <p className="font-bold text-slate-900 text-sm italic">&quot;{uq.question}&quot;</p>
                  </div>

                  <div className="w-full md:w-[480px] space-y-2 shrink-0">
                    <textarea
                      required
                      placeholder="Write the correct answer to train your AI chatbot..."
                      value={newFAQAnswers[uq.id] || ""}
                      onChange={(e) => setNewFAQAnswers({ ...newFAQAnswers, [uq.id]: e.target.value })}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800"
                    ></textarea>
                    
                    <button
                      onClick={() => handleAddToFAQ(uq.id, uq.question)}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center gap-1 ml-auto cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add to FAQ & Train Bot ✨
                    </button>
                  </div>
                </div>
              ))}

              {unansweredList.length === 0 && (
                <div className="text-center text-slate-400 text-xs py-10 italic space-y-1">
                  <HelpCircle className="w-9 h-9 mx-auto text-slate-300 mb-2" />
                  <div>No pending training inquiries found!</div>
                  <div className="text-[10px] text-slate-300">Your AI bot has successfully responded to all recent customer searches using the files.</div>
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, X, AlertCircle, Sparkles, User, UserCheck, ShieldAlert, LifeBuoy, Check } from "lucide-react";
import { ChatbotSettings, ChatMessage, ChatSession } from "../types";

interface ChatbotWidgetProps {
  key?: any;
  businessId: string;
  chatbotSettings: ChatbotSettings;
  businessName: string;
  onLeadCaptured?: (lead: { name: string; email: string; phone?: string }) => void;
  inline?: boolean; // if we want to display it statically in the customize view
}

export default function ChatbotWidget({ businessId, chatbotSettings, businessName, onLeadCaptured, inline = false }: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(inline);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [visitorSessionId, setVisitorSessionId] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [errorNotice, setErrorNotice] = useState("");

  // Lead capture state
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadCaptured, setLeadCaptured] = useState(false);

  // Ticket creation state inside the chat window!
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketDesc, setTicketDesc] = useState("");
  const [ticketPriority, setTicketPriority] = useState<"low" | "medium" | "high">("medium");
  const [ticketSuccess, setTicketSuccess] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize simulated visitor session ID
  useEffect(() => {
    let token = localStorage.getItem(`sitebot_visitor_${businessId}`);
    if (!token) {
      token = "vs_" + Math.random().toString(36).substr(2, 9);
      localStorage.setItem(`sitebot_visitor_${businessId}`, token);
    }
    setVisitorSessionId(token);
  }, [businessId]);

  // Handle auto scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  // Fetch session history once visitorSessionId is ready
  useEffect(() => {
    if (!visitorSessionId || !isOpen || inline) return;

    const initChatSession = async () => {
      try {
        const response = await fetch("/api/chats/session/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessId,
            visitorSessionId,
            requiredLeadCaptured: chatbotSettings.leadCaptureFields.requiredBeforeChat
          })
        });

        if (!response.ok) throw new Error("Could not construct visitor gateway.");
        const data = await response.json();
        setSession(data);

        // Preload past message history
        const msgResponse = await fetch(`/api/chats/${data.id}/messages`);
        if (msgResponse.ok) {
          const fetchedMessages = await msgResponse.json();
          setMessages(fetchedMessages);
        }

        if (data.visitorName && data.visitorEmail) {
          setLeadCaptured(true);
        }
      } catch (err: any) {
        setErrorNotice(err.message || "Failed to initialize active bot connection.");
      }
    };

    initChatSession();
  }, [visitorSessionId, isOpen, businessId]);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName.trim() || !leadEmail.trim()) return;

    try {
      const response = await fetch("/api/chats/session/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          visitorSessionId,
          visitorName: leadName,
          visitorEmail: leadEmail,
          visitorPhone: leadPhone,
          requiredLeadCaptured: true
        })
      });

      if (!response.ok) throw new Error("Credentials gateway failed.");
      const data = await response.json();
      setSession(data);
      setLeadCaptured(true);
      setErrorNotice("");

      if (onLeadCaptured) {
        onLeadCaptured({ name: leadName, email: leadEmail, phone: leadPhone });
      }

      // Pre-add a welcome message once lead forms complete!
      setMessages([
        {
          id: "sys_welcome",
          businessId,
          chatId: data.id,
          sender: "bot",
          senderName: chatbotSettings.botName,
          message: chatbotSettings.welcomeMessage,
          timestamp: new Date().toISOString()
        }
      ]);
    } catch (err: any) {
      setErrorNotice(err.message);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !session) return;

    const userText = inputText.trim();
    setInputText("");
    setIsTyping(true);

    const tempMsg: ChatMessage = {
      id: "temp_" + Date.now(),
      businessId,
      chatId: session.id,
      sender: "visitor",
      senderName: session.visitorName || "Guest",
      message: userText,
      timestamp: new Date().toISOString()
    };

    // Optimistically add user query
    setMessages(prev => [...prev, tempMsg]);

    try {
      const response = await fetch("/api/chats/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          chatId: session.id,
          sender: "visitor",
          message: userText
        })
      });

      if (!response.ok) throw new Error("AI engine failed to process.");
      const result = await response.json();

      setMessages(prev => [...prev, result.reply]);
    } catch (err: any) {
      setErrorNotice("AI engine didn't reply. Checking connection...");
    } finally {
      setIsTyping(false);
    }
  };

  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketTitle.trim() || !ticketDesc.trim()) return;

    try {
      const response = await fetch(`/api/business/${businessId}/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: ticketTitle,
          description: ticketDesc,
          visitorName: session?.visitorName || leadName || "Guest User",
          visitorEmail: session?.visitorEmail || leadEmail || "guest@email.com",
          visitorPhone: session?.visitorPhone || leadPhone || "",
          priority: ticketPriority
        })
      });

      if (!response.ok) throw new Error("Database validation failed for support ticket request.");
      setTicketSuccess(true);
      setTicketTitle("");
      setTicketDesc("");
      setTimeout(() => {
        setShowTicketForm(false);
        setTicketSuccess(false);
      }, 3500);
    } catch (err: any) {
      setErrorNotice(err.message);
    }
  };

  // Standard inline customized mock messages preview
  const mockPreviewMessages: ChatMessage[] = [
    {
      id: "m_welcome",
      businessId,
      chatId: "preview",
      sender: "bot",
      senderName: chatbotSettings.botName,
      message: chatbotSettings.welcomeMessage,
      timestamp: new Date().toISOString()
    },
    {
      id: "m_user_p",
      businessId,
      chatId: "preview",
      sender: "visitor",
      senderName: "Client Reviewer",
      message: "Do you have gluten free crust options?",
      timestamp: new Date().toISOString()
    },
    {
      id: "m_bot_p",
      businessId,
      chatId: "preview",
      sender: "bot",
      senderName: chatbotSettings.botName,
      message: "Yes! We offer thin gluten-free pizza crust options that can support any of our toppings for an extra $3 fee! (Source: Dinner_Menu.pdf)",
      timestamp: new Date().toISOString(),
      sources: ["Dinner_Menu.pdf"]
    }
  ];

  const activeMessages = inline ? mockPreviewMessages : messages;

  return (
    <div id="chatbot-widget-block" className={inline ? "w-full h-full text-xs flex flex-col bg-white rounded-xl border border-slate-200" : "fixed bottom-5 right-5 z-50 font-sans"}>
      {/* Floating Button layout */}
      {!inline && !isOpen && (
        <button
          id="toggle-widget-open"
          onClick={() => setIsOpen(true)}
          style={{ backgroundColor: chatbotSettings.primaryColor }}
          className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 transition-all outline-none border-none cursor-pointer group"
        >
          <MessageSquare className="w-6 h-6 transition-transform group-hover:rotate-6" />
        </button>
      )}

      {/* Actual Chat Window layout */}
      {isOpen && (
        <div 
          id="chat-widget-window" 
          className={
            inline 
              ? "w-full h-full flex flex-col bg-white" 
              : "w-[360px] md:w-[380px] h-[520px] bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col transition-all translate-y-0"
          }
        >
          {/* Header Panel */}
          <div 
            id="widget-header" 
            style={{ backgroundColor: chatbotSettings.primaryColor }}
            className="px-4 py-4 text-white shrink-0 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-2xl bg-white/12 w-9 h-9 rounded-xl flex items-center justify-center text-white">{chatbotSettings.logo || "🤖"}</span>
              <div>
                <div className="font-bold text-sm tracking-tight flex items-center gap-1">
                  {chatbotSettings.botName} <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block animate-pulse"></span>
                </div>
                <div className="text-[10px] text-white/70 italic">AI Support at {businessName}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Reset session button */}
              {!inline && (
                <button
                  title="Create Support Ticket"
                  onClick={() => setShowTicketForm(!showTicketForm)}
                  className="text-xs font-bold text-white bg-white/12 hover:bg-white/20 px-2.5 py-1 rounded"
                >
                  {showTicketForm ? "Back to Chat" : "Get Help"}
                </button>
              )}
              {!inline && (
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white bg-transparent p-1 rounded-md hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Error Banner */}
          {errorNotice && (
            <div className="bg-rose-50 px-3 py-1.5 text-[10px] text-rose-700 font-bold border-b border-rose-100 uppercase tracking-wide flex items-center gap-1 shrink-0">
              <AlertCircle className="w-3 h-3 shrink-0" /> {errorNotice}
            </div>
          )}

          {/* Ticket Creation Screen */}
          {showTicketForm ? (
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 text-xs">
              {ticketSuccess ? (
                <div className="h-full flex flex-col justify-center items-center text-center p-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4 scale-110">
                    <Check className="w-6 h-6 animate-bounce" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Ticket Raised Successfully!</h4>
                  <p className="text-slate-500 mt-1 leading-relaxed">
                    Your inquiry has been stored. Our support staff team will review this query and respond to you via email: <strong>{session?.visitorEmail || leadEmail}</strong> very shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleCreateTicketSubmit} className="space-y-4">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Create Support Ticket 🧑‍💻</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Need human intervention? Open a ticket directly inside our database logs.</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Subject / Issue</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Booking adjustment requested or refund help"
                      value={ticketTitle}
                      onChange={(e) => setTicketTitle(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Detailed Problem Description</label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Detail dates, details, or errors here so staff can resolve it quickly."
                      value={ticketDesc}
                      onChange={(e) => setTicketDesc(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:outline-none"
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Priority</label>
                      <select
                        value={ticketPriority}
                        onChange={(e) => setTicketPriority(e.target.value as any)}
                        className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Email Contact</label>
                      <input
                        type="text"
                        disabled
                        value={session?.visitorEmail || leadEmail || "N/A - Please fill out lead first"}
                        className="w-full border border-slate-200 bg-slate-100 rounded-lg p-2 text-slate-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    style={{ backgroundColor: chatbotSettings.primaryColor }}
                    className="w-full text-white font-bold py-3.5 rounded-xl border-none outline-none shadow cursor-pointer mt-2"
                  >
                    Submit Support Ticket
                  </button>
                </form>
              )}
            </div>
          ) : (
            <>
              {/* Chat Window messages history */}
              <div id="widget-messages-pane" className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-3 flex flex-col">
                
                {/* Lead Form Constraint */}
                {!inline && chatbotSettings.leadCaptureFields.requiredBeforeChat && !leadCaptured ? (
                  <form onSubmit={handleLeadSubmit} className="my-auto space-y-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-xs">
                    <div className="text-center">
                      <Sparkles className="w-6 h-6 text-indigo-500 mx-auto" />
                      <h4 className="font-bold text-slate-800 text-sm mt-1.5">Welcome!</h4>
                      <p className="text-[11px] text-slate-500">Please introduce yourself to start chatting with {chatbotSettings.botName}.</p>
                    </div>

                    {chatbotSettings.leadCaptureFields.name && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Full Name</label>
                        <input
                          type="text"
                          required
                          value={leadName}
                          onChange={(e) => setLeadName(e.target.value)}
                          placeholder="Marco Smith"
                          className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none"
                        />
                      </div>
                    )}

                    {chatbotSettings.leadCaptureFields.email && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Email Address</label>
                        <input
                          type="email"
                          required
                          value={leadEmail}
                          onChange={(e) => setLeadEmail(e.target.value)}
                          placeholder="msmith@gmail.com"
                          className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none"
                        />
                      </div>
                    )}

                    {chatbotSettings.leadCaptureFields.phone && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Phone Number</label>
                        <input
                          type="tel"
                          value={leadPhone}
                          onChange={(e) => setLeadPhone(e.target.value)}
                          placeholder="+1 (555) 123-4567"
                          className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none"
                        />
                      </div>
                    )}

                    <button
                      type="submit"
                      style={{ backgroundColor: chatbotSettings.primaryColor }}
                      className="w-full text-white font-bold py-2.5 rounded-lg border-none shadow cursor-pointer mt-1"
                    >
                      Start Conversation
                    </button>
                  </form>
                ) : (
                  <>
                    {/* Standard Message loops */}
                    {activeMessages.length === 0 && (
                      <div className="text-center text-slate-400 py-6 text-xs italic space-y-1 my-auto">
                        <MessageSquare className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <div>No messages yet in this session.</div>
                        <div className="text-[10px] text-slate-300">Type a question below to trigger the RAG query agent.</div>
                      </div>
                    )}

                    {activeMessages.map((msg) => {
                      const isBot = msg.sender === "bot";
                      const isStaff = msg.sender === "staff";
                      return (
                        <div 
                          key={msg.id} 
                          className={`flex flex-col max-w-[85%] ${isBot || isStaff ? "self-start" : "self-end"}`}
                        >
                          <div className="flex items-center gap-1 mb-0.5 text-[9px] text-slate-400 font-bold px-1 uppercase tracking-wider">
                            {isBot ? `🤖 ${msg.senderName}` : isStaff ? `🧑‍💻 ${msg.senderName} (Staff)` : `👤 You`}
                          </div>
                          
                          <div 
                            className={`p-3 rounded-2xl text-xs leading-relaxed break-words shadow-sm ${
                              isBot 
                                ? "bg-white text-slate-800 rounded-tl-none border border-slate-200/60" 
                                : isStaff 
                                  ? "bg-slate-800 text-white rounded-tl-none font-medium"
                                  : "bg-blue-600 text-white rounded-tr-none"
                            }`}
                            style={(!isBot && !isStaff) ? { backgroundColor: chatbotSettings.primaryColor } : {}}
                          >
                            {msg.message}
                            
                            {/* Sources tags citation */}
                            {isBot && msg.sources && msg.sources.length > 0 && (
                              <div className="border-t border-slate-100 mt-2 pt-1.5 flex flex-wrap gap-1 items-center">
                                <span className="text-[8px] text-slate-400 font-bold tracking-wider uppercase mr-1">Source:</span>
                                {msg.sources.map((src, i) => (
                                  <span key={i} className="text-[9px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded font-mono">
                                    {src}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Chat session transferred details */}
                    {session?.status === "human_requested" && (
                      <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex gap-2 items-start self-center max-w-[90%] my-2">
                        <ShieldAlert className="w-4.5 h-4.5 text-amber-600 shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-amber-800">Support Handover Initialized</p>
                          <p className="text-[9px] text-amber-700 leading-normal mt-0.5">Physical staff members have been alerted! They will grab this queue thread live as soon as possible.</p>
                        </div>
                      </div>
                    )}

                    {isTyping && (
                      <div className="self-start flex flex-col max-w-[80%]">
                        <div className="text-[9px] text-slate-400 font-bold px-1 uppercase tracking-wider mb-0.5">
                          {chatbotSettings.botName} is typing...
                        </div>
                        <div className="bg-white border border-slate-200/80 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-sm">
                          <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></span>
                          <span className="w-2 h-2 bg-slate-305 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                          <span className="w-2 h-2 bg-slate-310 rounded-full animate-bounce [animation-delay:0.3s]"></span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Chat Window footer input */}
              {(!chatbotSettings.leadCaptureFields.requiredBeforeChat || leadCaptured || inline) && (
                <div className="p-3 bg-white border-t border-slate-100 shrink-0">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="text"
                      disabled={isTyping}
                      placeholder={
                        session?.status === "human_requested" 
                          ? "Message support team..." 
                          : "Ask any question about our services..."
                      }
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="flex-1 text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-transparent text-slate-800"
                    />
                    <button
                      type="submit"
                      disabled={!inputText.trim() || isTyping}
                      style={{ backgroundColor: chatbotSettings.primaryColor }}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 hover:opacity-90 transition-all border-none outline-none shadow-sm shadow-blue-200/50 cursor-pointer disabled:opacity-40"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                  <div className="text-center text-[8px] text-slate-400 font-mono mt-2 uppercase tracking-widest flex items-center justify-center gap-1">
                    Powered by <span className="font-extrabold text-slate-500">SiteBot AI</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

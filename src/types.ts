export type UserRole = 'super_admin' | 'business_owner' | 'staff' | 'visitor';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  businessId?: string; // empty for super_admin
  createdAt: string;
}

export interface Business {
  id: string;
  name: string;
  category: string;
  websiteUrl: string;
  logo: string;
  status: 'active' | 'disabled';
  planId: string; // 'free' | 'basic' | 'pro' | 'business'
  createdAt: string;
  chatbotSettings: ChatbotSettings;
}

export interface ChatbotSettings {
  botName: string;
  welcomeMessage: string;
  fallbackMessage: string;
  primaryColor: string;
  logo: string;
  tone: string; // 'friendly' | 'professional' | 'playful' | 'empathetic'
  businessHours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
    awayMessage: string;
  };
  leadCaptureFields: {
    name: boolean;
    email: boolean;
    phone: boolean;
    message: boolean;
    requiredBeforeChat: boolean;
  };
}

export interface KBDocument {
  id: string;
  businessId: string;
  name: string;
  type: 'pdf' | 'docx' | 'txt' | 'url';
  content: string; // Raw text contents extracted and chunked
  uploadDate: string;
  uploadedBy: string;
  status: 'processing' | 'processed' | 'failed';
}

export interface FAQ {
  id: string;
  businessId: string;
  question: string;
  answer: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  businessId: string;
  visitorSessionId: string;
  visitorName?: string;
  visitorEmail?: string;
  visitorPhone?: string;
  status: 'bot_active' | 'human_requested' | 'staff_active' | 'resolved';
  assignedTo?: string; // staff user id
  lastMessageAt: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  businessId: string;
  chatId: string;
  sender: 'visitor' | 'bot' | 'staff';
  senderName: string;
  message: string;
  timestamp: string;
  sources?: string[]; // list of document names or URL used as source
}

export interface Lead {
  id: string;
  businessId: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  sourcePage: string;
  timestamp: string;
  status: 'new' | 'contacted' | 'qualified' | 'lost';
}

export interface TicketReply {
  id: string;
  senderName: string;
  senderRole: UserRole;
  message: string;
  timestamp: string;
}

export interface Ticket {
  id: string;
  businessId: string;
  title: string;
  description: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  assignedTo?: string; // staff user id
  createdAt: string;
  replies: TicketReply[];
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  limits: {
    chatbots: number;
    documents: number;
    messagesPerMonth: number;
    staffMembers: number;
    leads: number;
  };
}

export interface BusinessAnalytics {
  totalConversations: number;
  totalLeads: number;
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  aiAnswered: number;
  aiUnanswered: number;
  monthlyUsage: { month: string; messagesCount: number }[];
  mostAskedQuestions: { question: string; count: number }[];
  topDocuments: { docName: string; matchesCount: number }[];
}

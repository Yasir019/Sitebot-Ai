import express from "express";
import path from "path";
import fs from "fs";
import net from "net";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const DEFAULT_PORT = Number(process.env.PORT || 3000);
const DEFAULT_HMR_PORT = Number(process.env.VITE_HMR_PORT || 24678);

app.use(express.json());

// Path to JSON-based local database
const DB_FILE = path.join(process.cwd(), "db.json");

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const tester = net
      .createServer()
      .once("error", () => resolve(false))
      .once("listening", () => {
        tester.close(() => resolve(true));
      })
      .listen(port, "0.0.0.0");
  });
}

async function findAvailablePort(preferredPort: number, attempts = 20): Promise<number> {
  for (let port = preferredPort; port < preferredPort + attempts; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found from ${preferredPort} to ${preferredPort + attempts - 1}.`);
}

function removeStaleViteTempDirs() {
  const cacheRoots = [
    path.join(process.cwd(), ".vite-cache"),
    path.join(process.cwd(), "node_modules", ".vite")
  ];

  for (const cacheRoot of cacheRoots) {
    if (!fs.existsSync(cacheRoot)) continue;

    for (const entry of fs.readdirSync(cacheRoot, { withFileTypes: true })) {
      if (!entry.isDirectory() || !entry.name.startsWith("deps_temp_")) continue;

      const tempPath = path.join(cacheRoot, entry.name);
      try {
        fs.rmSync(tempPath, { recursive: true, force: true });
      } catch (err: any) {
        console.warn(`Vite cache temp folder is locked and will be reused later: ${tempPath}`);
      }
    }
  }
}

// Define Initial Database State
const INITIAL_DB = {
  users: [
    {
      id: "user_admin",
      email: "admin@sitebot.ai",
      name: "Alex platform Admin",
      role: "super_admin",
      createdAt: new Date().toISOString()
    },
    {
      id: "user_owner_1",
      email: "owner@restaurant.com",
      name: "Marco Rossi",
      role: "business_owner",
      businessId: "business_1",
      createdAt: new Date().toISOString()
    },
    {
      id: "user_staff_1",
      email: "staff@restaurant.com",
      name: "Luigi Pizza",
      role: "staff",
      businessId: "business_1",
      createdAt: new Date().toISOString()
    },
    {
      id: "user_owner_2",
      email: "owner@clothing.com",
      name: "Sarah Jenkins",
      role: "business_owner",
      businessId: "business_2",
      createdAt: new Date().toISOString()
    },
    {
      id: "user_owner_3",
      email: "owner@medical.com",
      name: "Dr. Evelyn Stone",
      role: "business_owner",
      businessId: "business_3",
      createdAt: new Date().toISOString()
    }
  ],
  businesses: [
    {
      id: "business_1",
      name: "Bella Italia",
      category: "Restaurant",
      websiteUrl: "https://www.bellaitalia-menu.com",
      logo: "🍕",
      status: "active",
      planId: "pro",
      createdAt: new Date().toISOString(),
      chatbotSettings: {
        botName: "BellaBot",
        welcomeMessage: "Ciao! Welcome to Bella Italia. 🍕 Ready to explore our wood-fired pizzas, reserve a table, or ask about our hours?",
        fallbackMessage: "I'm sorry, I couldn't find details on that option in our menu. Would you like to speak to our staff or open a support ticket?",
        primaryColor: "#e11d48",
        logo: "🍕",
        tone: "friendly",
        businessHours: {
          enabled: true,
          start: "12:00",
          end: "22:00",
          timezone: "EST",
          awayMessage: "We are currently closed! We offer wood-fired pizzas from Tuesday to Sunday, 12:00 PM to 10:00 PM. Please leave your details and we will follow up."
        },
        leadCaptureFields: {
          name: true,
          email: true,
          phone: true,
          message: false,
          requiredBeforeChat: false
        }
      }
    },
    {
      id: "business_2",
      name: "TrendVibe Clothing",
      category: "Clothing",
      websiteUrl: "https://www.trendvibeclothing.store",
      logo: "👕",
      status: "active",
      planId: "basic",
      createdAt: new Date().toISOString(),
      chatbotSettings: {
        botName: "VibeBot",
        welcomeMessage: "Hey there! Welcome to TrendVibe. 🛍️ Ask me about our sizing, return policy, or latest summer drop!",
        fallbackMessage: "Hmm, I don't see that specific product in our summer catalog. Would you like me to connect you with a live styling expert?",
        primaryColor: "#7c3aed",
        logo: "👕",
        tone: "playful",
        businessHours: {
          enabled: false,
          start: "09:00",
          end: "18:00",
          timezone: "PST",
          awayMessage: "Our styling crew is currently offline, but feel free to browse or leave your email so we can get back to you!"
        },
        leadCaptureFields: {
          name: true,
          email: true,
          phone: false,
          message: false,
          requiredBeforeChat: true
        }
      }
    },
    {
      id: "business_3",
      name: "ClearVision Optometry",
      category: "Medical",
      websiteUrl: "https://www.clearvisionoptometry.com",
      logo: "👁️",
      status: "active",
      planId: "pro",
      createdAt: new Date().toISOString(),
      chatbotSettings: {
        botName: "VisionBot",
        welcomeMessage: "Hello and welcome to ClearVision Optometry. 👁️ Need help with appointment scheduling, insurance coverage, or eye exam options?",
        fallbackMessage: "I apologize, but that eye health question should be diagnosed by a professional. Type 'agent' or click help to speak to our optometrist staff.",
        primaryColor: "#0284c7",
        logo: "👁️",
        tone: "professional",
        businessHours: {
          enabled: true,
          start: "08:30",
          end: "17:00",
          timezone: "CST",
          awayMessage: "Our clinic is currently closed. If this is a medical emergency, please dial 911. Otherwise, leave a message and we will contact you during business hours."
        },
        leadCaptureFields: {
          name: true,
          email: true,
          phone: true,
          message: true,
          requiredBeforeChat: false
        }
      }
    }
  ],
  faqs: [
    {
      id: "faq_1",
      businessId: "business_1",
      question: "What are your opening hours?",
      answer: "We are open Tuesday to Sunday from 12:00 PM to 10:00 PM (12:00 - 22:00). We are closed on Mondays.",
      createdAt: new Date().toISOString()
    },
    {
      id: "faq_2",
      businessId: "business_1",
      question: "Do you offer gluten-free options?",
      answer: "Yes! We offer gluten-free crusts for any of our wood-fired pizzas for an additional $3. We also have gluten-free pasta available on request.",
      createdAt: new Date().toISOString()
    },
    {
      id: "faq_3",
      businessId: "business_1",
      question: "Do you take reservations?",
      answer: "Yes, we highly recommend booking in advance, especially for weekend dinner slots. You can reserve a table by typing 'agent' to connect with our host staff, or call us directly.",
      createdAt: new Date().toISOString()
    },
    {
      id: "faq_4",
      businessId: "business_1",
      question: "Where are you located?",
      answer: "We are located in the heart of downtown at 123 Gourmet Way, Culinary City.",
      createdAt: new Date().toISOString()
    },
    {
      id: "faq_5",
      businessId: "business_2",
      question: "What is your return policy?",
      answer: "We accept returns within 30 days of purchase for a full refund or store credit. Items must be unworn, with original tag attachments, and in their original packaging.",
      createdAt: new Date().toISOString()
    },
    {
      id: "faq_6",
      businessId: "business_2",
      question: "How much is shipping?",
      answer: "We offer free standard shipping on all US orders over $75. For orders under $75, standard shipping is a flat rate of $6.99. Express 2-day shipping is available for $14.99.",
      createdAt: new Date().toISOString()
    },
    {
      id: "faq_7",
      businessId: "business_3",
      question: "Do you accept VSP insurance?",
      answer: "Yes! We are an in-network provider for VSP, EyeMed, Davis Vision, and Cigna eye plans. Please provide your member ID card before your exam.",
      createdAt: new Date().toISOString()
    },
    {
      id: "faq_8",
      businessId: "business_3",
      question: "How long does a standard eye exam take?",
      answer: "A comprehensive eye health and vision exam typically takes 30 to 45 minutes. Contact lens fittings or specialized imaging can add an extra 15-20 minutes.",
      createdAt: new Date().toISOString()
    }
  ],
  documents: [
    {
      id: "doc_1",
      businessId: "business_1",
      name: "Dinner_Menu.pdf",
      type: "pdf",
      content: `Bella Italia Dinner Menu: 
Appetizers: Wood-Fired Garlic Bread ($7), Caprese Salad with buffalo mozzarella and beefsteak tomatoes ($12), Crispy Calamari with fresh lemon garlic aioli ($14).
Signature Wood-Fired Pizzas: 
- Margherita ($16): Crushed San Marzano tomatoes, fresh buffalo mozzarella, fresh basil leaves, and extra virgin olive oil.
- Diavola ($19): Spicy Italian salami, mozzarella, organic honey drizzle, and red chili flakes.
- Prosciutto e Rucola ($21): Prosciutto di Parma, wild baby arugula, shaved aged parmesan, and mozzarella.
- White Truffle Mushroom ($22): Roasted cremini & shiitake mushrooms, white truffle oil, fontina, and taleggio.
Fresh Handcrafted Pastas: 
- Fettuccine Alfredo ($18): Rich heavy cream sauce, parmigiano-reggiano, and butter. Add chicken for $5.
- Spaghetti Carbonara ($19): Guanciale, pecorino romano, fresh farm egg yolk, and cracked black pepper.
- Seafood Linguine ($25): Wild-caught shrimp, clams, mussels, fresh garlic, white wine butter sauce.
Desserts: Classic Espresso Tiramisu ($9), Warm Chocolate Lava Cake with vanilla bean gelato ($10).
Beverages: San Pellegrino Sparkling Water ($5), Italian craft beers ($7), and high-quality wines by glass starting at $8.`,
      uploadDate: new Date().toISOString(),
      uploadedBy: "Marco Rossi",
      status: "processed"
    },
    {
      id: "doc_2",
      businessId: "business_1",
      name: "Catering_Delivery_Policies.txt",
      type: "txt",
      content: `Delivery Guidelines & Policies:
We offer direct local delivery within a 5-mile radius of downtown. Delivery is completely FREE for orders over $30. For smaller orders under $30, we charge a flat local delivery fee of $4.99. Our delivery fleet operates daily from 12:30 PM to 9:30 PM.
Catering Services:
We provide professional catering structures for corporate lunches, birthdays, wedding rehearsals, and family gatherings. We require a minimum of 48 hours notice for catering projects under 50 guests, and 5 days notice for bigger parties. Delivery setup is included. For direct quotes and customizing a catering menu, email the banquets team at catering@bellaitalia.com.`,
      uploadDate: new Date().toISOString(),
      uploadedBy: "Marco Rossi",
      status: "processed"
    },
    {
      id: "doc_3",
      businessId: "business_2",
      name: "Apparel_Size_Guides.docx",
      type: "docx",
      content: `TrendVibe Apparel Size Chart:
Women's Tops & Outerwear (Bust size in inches):
- XS (Size 0-2): Bust 30" - 32"
- S (Size 4-6): Bust 33" - 35"
- M (Size 8-10): Bust 36" - 38"
- L (Size 12-14): Bust 39" - 41"
- XL (Size 16): Bust 42" - 44"
Women's Denim & Pants (Waist / Hips measurements):
- Size 25 / Size 2: Waist 25", Hips 35"
- Size 26 / Size 4: Waist 26", Hips 36"
- Size 27 / Size 6: Waist 27", Hips 37"
- Size 28 / Size 8: Waist 28", Hips 38"
- Size 29 / Size 10: Waist 29.5", Hips 39.5"
Men's Essential Shirts (Chest size in inches):
- Small: Chest 35" - 37"
- Medium: Chest 38" - 40"
- Large: Chest 41" - 43"
- X-Large: Chest 44" - 46"
General Fit note: Our structured denims fit completely true to size. If you are between two sizes, we highly recommend purchasing one size up for a comfortable, stylish, relaxed fit.`,
      uploadDate: new Date().toISOString(),
      uploadedBy: "Sarah Jenkins",
      status: "processed"
    },
    {
      id: "doc_4",
      businessId: "business_3",
      name: "Eye_Care_Services_Pricing.pdf",
      type: "pdf",
      content: `ClearVision Optometry Services Price List (Without Insurance):
- Comprehensive Eye Vision Exam & Retinal Health Check: $120
- Pediatric Children's Vision Exam (Ages 5-12): $95
- Contact Lens Fitting Exam & Lens Hygiene Tutorial: $60
- Retinal Scanning Wellness Photography Screen: $39
- Dry Eye Therapeutic Evaluation & Plan: $45
Optical Eyewear Products:
- Premium Single Vision Lenses (with anti-reflective coat): $99 onwards
- High-Definition Progressive Lenses: $220 onwards
- Designer Premium Frames (Ray-Ban, Oakley, Gucci): $149 - $399
Parking Information:
We validate 100% free parking for up to 90 minutes in the Medical Towers parking garage. Ensure you bring your parking ticket to the check-in reception desk.`,
      uploadDate: new Date().toISOString(),
      uploadedBy: "Dr. Evelyn Stone",
      status: "processed"
    }
  ],
  leads: [
    {
      id: "lead_1",
      businessId: "business_1",
      name: "Rebecca Harrison",
      email: "rebecca@harriscorp.com",
      phone: "555-0199",
      message: "Looking for a catering quote for a 35-person corporate launch on June 15th.",
      sourcePage: "https://www.bellaitalia-menu.com/catering",
      timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      status: "new"
    },
    {
      id: "lead_2",
      businessId: "business_1",
      name: "Tom Peterson",
      email: "tom.pete@gmail.com",
      phone: "555-0245",
      message: "Do you allow dogs on the outdoor pizza patio? Thinking of booking for 8 people.",
      sourcePage: "https://www.bellaitalia-menu.com/contact",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: "contacted"
    },
    {
      id: "lead_3",
      businessId: "business_2",
      name: "Ashley Gomez",
      email: "ashleyg@fashionblog.io",
      phone: "555-0812",
      message: "Interested in bulk order of custom graphic tees for a dance team.",
      sourcePage: "https://www.trendvibeclothing.store",
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 1000).toISOString(),
      status: "qualified"
    }
  ],
  tickets: [
    {
      id: "ticket_1",
      businessId: "business_1",
      title: "Catering Menu Customization Query",
      description: "Hi, we received your generic catering menu but wanted to ask if we can substitute the Fettuccine Alfredo with the Seafood Linguine for our event, and what would the price markup be per guest? Thanks!",
      visitorName: "David Vance",
      visitorEmail: "david.vance@techconsult.net",
      visitorPhone: "555-4421",
      priority: "medium",
      status: "open",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      replies: [
        {
          id: "r_1",
          senderName: "David Vance",
          senderRole: "visitor",
          message: "Hi, we received your generic catering menu but wanted to ask if we can substitute the Fettuccine Alfredo with the Seafood Linguine for our event, and what would the price markup be per guest? Thanks!",
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    },
    {
      id: "ticket_2",
      businessId: "business_1",
      title: "Burnt Diavola Pizza Refund Request",
      description: "Hey, I ordered a takeaway Diavola pizza yesterday night and the entire crust backing was heavily burnt. It tasted like ash. I had to throw it out. Requesting a coupon or refund.",
      visitorName: "Michael Chang",
      visitorEmail: "mchang@outlook.com",
      visitorPhone: "555-0922",
      priority: "high",
      status: "resolved",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      replies: [
        {
          id: "r_2",
          senderName: "Michael Chang",
          senderRole: "visitor",
          message: "Hey, I ordered a takeaway Diavola pizza yesterday night and the entire crust backing was heavily burnt. It tasted like ash.",
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "r_3",
          senderName: "Luigi Pizza",
          senderRole: "staff",
          message: "Hi Michael, I am incredibly sorry to hear your pizza was burnt! That does not meet our standard of wood-fired quality. I have processed a full $19 refund to your card. I've also added a $10 credit to your phone number for your next order. Ciao!",
          timestamp: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "r_4",
          senderName: "Michael Chang",
          senderRole: "visitor",
          message: "Thank you so much Luigi for the speedy refund and amazing customer service! Will definitely command again.",
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    }
  ],
  chatSessions: [
    {
      id: "session_1",
      businessId: "business_1",
      visitorSessionId: "vs_demo_1",
      visitorName: "Elena Rostova",
      visitorEmail: "elena.r@gmail.com",
      visitorPhone: "555-9011",
      status: "staff_active",
      assignedTo: "user_staff_1",
      lastMessageAt: new Date().toISOString(),
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    }
  ],
  chatMessages: [
    {
      id: "m_1",
      businessId: "business_1",
      chatId: "session_1",
      sender: "visitor",
      senderName: "Elena Rostova",
      message: "Hello! I have a question about gluten-free pizza crust.",
      timestamp: new Date(Date.now() - 29 * 60 * 1000).toISOString()
    },
    {
      id: "m_2",
      businessId: "business_1",
      chatId: "session_1",
      sender: "bot",
      senderName: "BellaBot",
      message: "Ciao Elena! Yes! We offer delicious gluten-free thin crusts for any of our wood-fired pizzas for an additional $3 markup. We highlight that we also offer gluten-free pasta on request. Would you like to check out our signature dishes or book a table?",
      timestamp: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
      sources: ["FAQ"]
    },
    {
      id: "m_3",
      businessId: "business_1",
      chatId: "session_1",
      sender: "visitor",
      senderName: "Elena Rostova",
      message: "Are they cooked in a separate oven? I have highly critical celiac disease.",
      timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString()
    },
    {
      id: "m_4",
      businessId: "business_1",
      chatId: "session_1",
      sender: "bot",
      senderName: "BellaBot",
      message: "I'm sorry, I couldn't find details on that specific baking sanitation procedure in our menu or policies. Let me connect you with our live staff right now to assist you safely!",
      timestamp: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
      sources: ["Catering_Delivery_Policies.txt"]
    },
    {
      id: "m_5",
      businessId: "business_1",
      chatId: "session_1",
      sender: "visitor",
      senderName: "Elena Rostova",
      message: "Yes please, connect me to staff.",
      timestamp: new Date(Date.now() - 22 * 60 * 1000).toISOString()
    },
    {
      id: "m_6",
      businessId: "business_1",
      chatId: "session_1",
      sender: "staff",
      senderName: "Luigi Pizza",
      message: "Ciao Elena! Luigi here! To answer your question: while we make gluten-free crusts, they are baked in the same massive wood-fired pizza oven on a separate clean metal tray. However, since flour is in the air, there is a risk of light cross-contamination. If you have extreme celiac, we recommend our gluten-free pasta which is boiled individually in a dedicated pot!",
      timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString()
    }
  ],
  plans: [
    {
      id: "free",
      name: "Free Trial",
      price: 0,
      limits: { chatbots: 1, documents: 2, messagesPerMonth: 100, staffMembers: 1, leads: 10 }
    },
    {
      id: "basic",
      name: "Basic Startup",
      price: 19,
      limits: { chatbots: 1, documents: 10, messagesPerMonth: 1000, staffMembers: 2, leads: 100 }
    },
    {
      id: "pro",
      name: "Pro Growth",
      price: 49,
      limits: { chatbots: 3, documents: 50, messagesPerMonth: 5000, staffMembers: 5, leads: 500 }
    },
    {
      id: "business",
      name: "Enterprise Business",
      price: 99,
      limits: { chatbots: 99, documents: 200, messagesPerMonth: 25000, staffMembers: 99, leads: 9999 }
    }
  ],
  unansweredQuestions: [
    { id: "uq_1", businessId: "business_1", question: "Do you offer vegan dairy-free cheese?", count: 12, createdAt: new Date().toISOString() },
    { id: "uq_2", businessId: "business_1", question: "Can we book the entire restaurant for filming commercial video?", count: 4, createdAt: new Date().toISOString() },
    { id: "uq_3", businessId: "business_2", question: "What is the material blend of cargo shorts?", count: 18, createdAt: new Date().toISOString() }
  ]
};

// Database utility functions with persistence in local file
function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DB, null, 2));
    return INITIAL_DB;
  }
  try {
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading db file, falling back to initial state:", err);
    return INITIAL_DB;
  }
}

function saveDB(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Failed to commit database write:", err);
  }
}

// Global dynamic analytics simulator
function getBusinessAnalytics(businessId: string, db: any) {
  const conversationsCount = db.chatSessions.filter((s: any) => s.businessId === businessId).length;
  const leadsCount = db.leads.filter((l: any) => l.businessId === businessId).length;
  const ticketsList = db.tickets.filter((t: any) => t.businessId === businessId);
  const totalTickets = ticketsList.length;
  const openTickets = ticketsList.filter((t: any) => t.status === "open" || t.status === "in_progress").length;
  const resolvedTickets = ticketsList.filter((t: any) => t.status === "resolved" || t.status === "closed").length;

  const docs = db.documents.filter((d: any) => d.businessId === businessId);
  const faqs = db.faqs.filter((f: any) => f.businessId === businessId);

  // Set default values for visual reporting
  const defaultAnalytics: any = {
    business_1: {
      aiAnswered: 350,
      aiUnanswered: 14,
      monthlyUsage: [
        { month: "Jan", messagesCount: 45 },
        { month: "Feb", messagesCount: 92 },
        { month: "Mar", messagesCount: 184 },
        { month: "Apr", messagesCount: 220 },
        { month: "May", messagesCount: 364 }
      ],
      mostAskedQuestions: [
        { question: "Do you offer gluten free?", count: 142 },
        { question: "What are your hours?", count: 98 },
        { question: "Where are you located?", count: 64 },
        { question: "Are dogs allowed?", count: 42 }
      ],
      topDocuments: [
        { docName: "Dinner_Menu.pdf", matchesCount: 284 },
        { docName: "Catering_Delivery_Policies.txt", matchesCount: 110 }
      ]
    },
    business_2: {
      aiAnswered: 112,
      aiUnanswered: 24,
      monthlyUsage: [
        { month: "Jan", messagesCount: 12 },
        { month: "Feb", messagesCount: 20 },
        { month: "Mar", messagesCount: 45 },
        { month: "Apr", messagesCount: 68 },
        { month: "May", messagesCount: 136 }
      ],
      mostAskedQuestions: [
        { question: "What is your return policy?", count: 48 },
        { question: "Sizing for cargo shorts?", count: 32 },
        { question: "Is shipping free?", count: 22 }
      ],
      topDocuments: [
        { docName: "Apparel_Size_Guides.docx", matchesCount: 65 }
      ]
    },
    business_3: {
      aiAnswered: 198,
      aiUnanswered: 8,
      monthlyUsage: [
        { month: "Jan", messagesCount: 30 },
        { month: "Feb", messagesCount: 52 },
        { month: "Mar", messagesCount: 110 },
        { month: "Apr", messagesCount: 140 },
        { month: "May", messagesCount: 206 }
      ],
      mostAskedQuestions: [
        { question: "Do you take eye insurance?", count: 86 },
        { question: "What is exam price?", count: 54 },
        { question: "Validate parking?", count: 38 }
      ],
      topDocuments: [
        { docName: "Eye_Care_Services_Pricing.pdf", matchesCount: 122 }
      ]
    }
  };

  const preset = defaultAnalytics[businessId] || {
    aiAnswered: 0,
    aiUnanswered: 0,
    monthlyUsage: [
      { month: "May", messagesCount: 0 }
    ],
    mostAskedQuestions: [],
    topDocuments: []
  };

  return {
    totalConversations: conversationsCount + 24, // add some historical metrics
    totalLeads: leadsCount + 12,
    totalTickets: totalTickets + 3,
    openTickets: openTickets,
    resolvedTickets: resolvedTickets + 3,
    aiAnswered: preset.aiAnswered + conversationsCount,
    aiUnanswered: preset.aiUnanswered,
    monthlyUsage: preset.monthlyUsage,
    mostAskedQuestions: preset.mostAskedQuestions.length > 0 ? preset.mostAskedQuestions : [
      { question: "General inquiry", count: conversationsCount }
    ],
    topDocuments: preset.topDocuments.length > 0 ? preset.topDocuments : docs.map((d: any) => ({
      docName: d.name,
      matchesCount: 2
    }))
  };
}

// API ROOT CONTROLLERS

// Auth API endpoints
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const db = loadDB();
  const user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(401).json({ error: "No account found with this email." });
  }

  // Support simplified passwords for instant sandbox testing
  const expectedPassword = email.split("@")[0] + "123";
  if (password !== expectedPassword && password !== "admin123" && password !== "owner123" && password !== "staff123") {
    return res.status(401).json({ error: "Incorrect password. Note: Try password format '[username]123'." });
  }

  const business = user.businessId ? db.businesses.find((b: any) => b.id === user.businessId) : null;

  res.json({
    user,
    business
  });
});

app.post("/api/auth/signup", (req, res) => {
  const { email, password, name, businessName, planId } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Name, email, and password are required." });
  }

  const db = loadDB();
  const existingUser = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ error: "An account already exists with this email address." });
  }

  const userId = "user_" + Math.random().toString(36).substr(2, 9);
  const businessId = businessName ? "business_" + Math.random().toString(36).substr(2, 9) : undefined;

  const newUser = {
    id: userId,
    email: email.toLowerCase(),
    name,
    role: "business_owner" as const,
    businessId,
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);

  let newBusinessObj = null;
  if (businessId && businessName) {
    newBusinessObj = {
      id: businessId,
      name: businessName,
      category: "Other",
      websiteUrl: "https://yourwebsite.com",
      logo: "🤖",
      status: "active" as const,
      planId: planId || "free",
      createdAt: new Date().toISOString(),
      chatbotSettings: {
        botName: `${businessName} AI`,
        welcomeMessage: `Hello, welcome to our website! How can I assist you with ${businessName} products or services today?`,
        fallbackMessage: "I apologize, but I couldn't find information on that topic in our documents. Would you like me to connect you to a staff member or open a support ticket?",
        primaryColor: "#2563eb",
        logo: "🤖",
        tone: "friendly",
        businessHours: {
          enabled: false,
          start: "09:00",
          end: "17:00",
          timezone: "UTC",
          awayMessage: "We are currently offline. Please leave your contact details so we can reach out!"
        },
        leadCaptureFields: {
          name: true,
          email: true,
          phone: false,
          requiredBeforeChat: false,
          message: false
        }
      }
    };
    db.businesses.push(newBusinessObj);
  }

  saveDB(db);

  res.json({
    user: newUser,
    business: newBusinessObj
  });
});

app.post("/api/auth/onboard", (req, res) => {
  const { businessId, name, category, websiteUrl, logo, primaryColor, welcomeMessage, tone } = req.body;
  if (!businessId) {
    return res.status(400).json({ error: "Business ID is required for onboarding." });
  }

  const db = loadDB();
  const index = db.businesses.findIndex((b: any) => b.id === businessId);
  if (index === -1) {
    return res.status(404).json({ error: "Your business space was not found." });
  }

  const current = db.businesses[index];
  current.name = name || current.name;
  current.category = category || current.category;
  current.websiteUrl = websiteUrl || current.websiteUrl;
  current.logo = logo || current.logo;
  current.chatbotSettings.botName = name ? `${name} Bot` : current.chatbotSettings.botName;
  current.chatbotSettings.welcomeMessage = welcomeMessage || current.chatbotSettings.welcomeMessage;
  current.chatbotSettings.primaryColor = primaryColor || current.chatbotSettings.primaryColor;
  current.chatbotSettings.logo = logo || current.chatbotSettings.logo;
  current.chatbotSettings.tone = tone || current.chatbotSettings.tone;

  // Generate customized FAQs and initial documents matching their category for onboarding!
  const customFAQs: any = {
    Restaurant: [
      { id: "of_1", businessId, question: "What are your main menu options?", answer: "We offer seasonal dishes made with fresh ingredients. Type special requests to see matching items!", createdAt: new Date().toISOString() },
      { id: "of_2", businessId, question: "How can I book a table?", answer: "You can book directly by providing your desired date, time, and guest count to our staff in the chat.", createdAt: new Date().toISOString() }
    ],
    Clothing: [
      { id: "of_3", businessId, question: "How long does shipping take?", answer: "Orders are dispatched in 1-2 business days. Standard shipping takes 3-5 days. Express delivery is available.", createdAt: new Date().toISOString() },
      { id: "of_4", businessId, question: "Do you have a sizing guide?", answer: "Yes, sizing charts are accessible. If you are in between sizes we generally recommend sizing up.", createdAt: new Date().toISOString() }
    ],
    Medical: [
      { id: "of_5", businessId, question: "How do I schedule an appointment?", answer: "You can schedule appointments by emailing us or connecting with our scheduling desk directly through this chat.", createdAt: new Date().toISOString() }
    ],
    "Real Estate": [
      { id: "of_6", businessId, question: "What properties do you represent?", answer: "We represent a selected portfolio of premium residential, commercial, and investment buildings. Ask what locations you are targeting!", createdAt: new Date().toISOString() }
    ],
    Salon: [
      { id: "of_7", businessId, question: "Do you accept walk-ins?", answer: "Yes, we accept walk-ins based on designer availability, but we strongly suggest booking an appointment online to lock in your time.", createdAt: new Date().toISOString() }
    ]
  };

  const initialFAQs = customFAQs[category] || [
    { id: "of_gen", businessId, question: "What services do you provide?", answer: `We specialize in premier ${category} services tailored perfectly for our clients. Ask what options fit you!`, createdAt: new Date().toISOString() }
  ];

  initialFAQs.forEach((f: any) => {
    f.id = "faq_" + Math.random().toString(36).substr(2, 9);
    db.faqs.push(f);
  });

  // Build a default mock category Document
  const docId = "doc_" + Math.random().toString(36).substr(2, 9);
  const initialDoc = {
    id: docId,
    businessId,
    name: "Business_Overview.txt",
    type: "txt" as const,
    content: `Overview and Information for ${name}:
We are a premier ${category} business operating online and in physical stores.
Our website is registered at ${websiteUrl}.
Customer Service hours: Monday to Friday 9:00 AM to 6:00 PM.
We prioritize client satisfaction, fast delivery protocols, and premium services. 
For wholesale inquiries, custom orders, or customer support questions, contact us via this support widget.`,
    uploadDate: new Date().toISOString(),
    uploadedBy: "System Onboarder",
    status: "processed" as const
  };
  db.documents.push(initialDoc);

  db.businesses[index] = current;
  saveDB(db);

  res.json({
    success: true,
    business: current
  });
});

// Single business management API
app.get("/api/business/:id", (req, res) => {
  const db = loadDB();
  const business = db.businesses.find((b: any) => b.id === req.params.id);
  if (!business) {
    return res.status(404).json({ error: "Business space not found." });
  }
  res.json(business);
});

app.post("/api/business/:id/update", (req, res) => {
  const db = loadDB();
  const index = db.businesses.findIndex((b: any) => b.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Workspace not found." });
  }

  const current = db.businesses[index];
  const { name, category, websiteUrl, logo, chatbotSettings } = req.body;

  current.name = name || current.name;
  current.category = category || current.category;
  current.websiteUrl = websiteUrl || current.websiteUrl;
  current.logo = logo || current.logo;
  if (chatbotSettings) {
    current.chatbotSettings = {
      ...current.chatbotSettings,
      ...chatbotSettings
    };
  }

  db.businesses[index] = current;
  saveDB(db);

  res.json(current);
});

// Switch billing subscription package simulator
app.post("/api/business/:id/plan", (req, res) => {
  const { planId } = req.body;
  if (!planId) {
    return res.status(400).json({ error: "Plan ID is required." });
  }

  const db = loadDB();
  const index = db.businesses.findIndex((b: any) => b.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "SaaS Workspace not found." });
  }

  db.businesses[index].planId = planId;
  saveDB(db);

  res.json({ success: true, planId, business: db.businesses[index] });
});

// Knowledge Base Documents APIs
app.get("/api/business/:id/documents", (req, res) => {
  const db = loadDB();
  const docs = db.documents.filter((d: any) => d.businessId === req.params.id);
  res.json(docs);
});

app.post("/api/business/:id/documents", (req, res) => {
  const { name, type, content, uploadedBy } = req.body;
  if (!name || !type || !content) {
    return res.status(400).json({ error: "File name, type, and content is required." });
  }

  const db = loadDB();
  const business = db.businesses.find((b: any) => b.id === req.params.id);
  if (!business) {
    return res.status(404).json({ error: "Owner business not found." });
  }

  // Enforce document count limits based on plan limits!!
  const planObj = db.plans.find((p: any) => p.id === business.planId);
  const currentDocsCount = db.documents.filter((d: any) => d.businessId === req.params.id).length;
  if (planObj && currentDocsCount >= planObj.limits.documents) {
    return res.status(400).json({
      error: `Plan Limit Exceeded: You have loaded ${currentDocsCount} of your ${planObj.limits.documents} allowed documents on the ${planObj.name} tier. Please upgrade your SaaS plan to upload more knowledge base files.`
    });
  }

  const newDoc = {
    id: "doc_" + Math.random().toString(36).substr(2, 9),
    businessId: req.params.id,
    name,
    type,
    content,
    uploadDate: new Date().toISOString(),
    uploadedBy: uploadedBy || "Owner Interface",
    status: "processed" as const
  };

  db.documents.push(newDoc);
  saveDB(db);

  res.status(201).json(newDoc);
});

app.delete("/api/business/:businessId/documents/:id", (req, res) => {
  const db = loadDB();
  const index = db.documents.findIndex((d: any) => d.id === req.params.id && d.businessId === req.params.businessId);
  if (index === -1) {
    return res.status(404).json({ error: "Document not found inside this workspace." });
  }

  const removed = db.documents.splice(index, 1);
  saveDB(db);
  res.json({ success: true, removed: removed[0] });
});

// FAQ manual APIs
app.get("/api/business/:id/faqs", (req, res) => {
  const db = loadDB();
  const list = db.faqs.filter((f: any) => f.businessId === req.params.id);
  res.json(list);
});

app.post("/api/business/:id/faqs", (req, res) => {
  const { question, answer } = req.body;
  if (!question || !answer) {
    return res.status(400).json({ error: "Question and Answer are required parameters." });
  }

  const db = loadDB();
  const newFAQ = {
    id: "faq_" + Math.random().toString(36).substr(2, 9),
    businessId: req.params.id,
    question,
    answer,
    createdAt: new Date().toISOString()
  };

  db.faqs.push(newFAQ);
  saveDB(db);

  res.status(201).json(newFAQ);
});

app.put("/api/business/:businessId/faqs/:id", (req, res) => {
  const db = loadDB();
  const faq = db.faqs.find((f: any) => f.id === req.params.id && f.businessId === req.params.businessId);
  if (!faq) {
    return res.status(404).json({ error: "FAQ not found." });
  }

  faq.question = req.body.question || faq.question;
  faq.answer = req.body.answer || faq.answer;
  saveDB(db);

  res.json(faq);
});

app.delete("/api/business/:businessId/faqs/:id", (req, res) => {
  const db = loadDB();
  const index = db.faqs.findIndex((f: any) => f.id === req.params.id && f.businessId === req.params.businessId);
  if (index === -1) {
    return res.status(404).json({ error: "FAQ does not exist." });
  }

  db.faqs.splice(index, 1);
  saveDB(db);

  res.json({ success: true });
});

// Staff Management CRUD inside business workspace
app.get("/api/business/:id/staff", (req, res) => {
  const db = loadDB();
  const list = db.users.filter((u: any) => u.businessId === req.params.id && u.role === "staff");
  res.json(list);
});

app.post("/api/business/:id/staff", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Staff Name, email, and password is required." });
  }

  const db = loadDB();
  const business = db.businesses.find((b: any) => b.id === req.params.id);
  if (!business) {
    return res.status(404).json({ error: "Business workspace space not found." });
  }

  // Enforce staff limits
  const planObj = db.plans.find((p: any) => p.id === business.planId);
  const currentStaffCount = db.users.filter((u: any) => u.businessId === req.params.id && u.role === "staff").length;
  if (planObj && currentStaffCount >= planObj.limits.staffMembers) {
    return res.status(400).json({
      error: `Staff Limit Exceeded: You have ${currentStaffCount} of ${planObj.limits.staffMembers} maximum staff accounts allowed on ${planObj.name}. Upgrade your platform subscription.`
    });
  }

  const exists = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: "A user account with this email already registered." });
  }

  const newStaff = {
    id: "user_staff_" + Math.random().toString(36).substr(2, 9),
    email: email.toLowerCase(),
    name,
    role: "staff" as const,
    businessId: req.params.id,
    createdAt: new Date().toISOString()
  };

  db.users.push(newStaff);
  saveDB(db);

  res.status(201).json(newStaff);
});

app.delete("/api/business/:businessId/staff/:id", (req, res) => {
  const db = loadDB();
  const index = db.users.findIndex((u: any) => u.id === req.params.id && u.businessId === req.params.businessId && u.role === "staff");
  if (index === -1) {
    return res.status(404).json({ error: "Staff member not found." });
  }

  db.users.splice(index, 1);
  saveDB(db);

  res.json({ success: true });
});

// Chats management APIs
app.get("/api/business/:id/chats", (req, res) => {
  const db = loadDB();
  const sessions = db.chatSessions.filter((s: any) => s.businessId === req.params.id);
  res.json(sessions);
});

app.get("/api/chats/:chatId/messages", (req, res) => {
  const db = loadDB();
  const messages = db.chatMessages.filter((m: any) => m.chatId === req.params.chatId);
  res.json(messages);
});

app.post("/api/chats/session/create", (req, res) => {
  const { businessId, visitorSessionId, visitorName, visitorEmail, visitorPhone, requiredLeadCaptured } = req.body;
  if (!businessId) {
    return res.status(400).json({ error: "Business ID is required." });
  }

  const db = loadDB();
  const sessionToken = visitorSessionId || "vs_" + Math.random().toString(36).substr(2, 9);
  
  // Find or create active session
  let session = db.chatSessions.find(
    (s: any) => s.businessId === businessId && s.visitorSessionId === sessionToken && s.status !== "resolved"
  );

  if (!session) {
    session = {
      id: "session_" + Math.random().toString(36).substr(2, 9),
      businessId,
      visitorSessionId: sessionToken,
      visitorName,
      visitorEmail,
      visitorPhone,
      status: requiredLeadCaptured ? "bot_active" : "bot_active",
      lastMessageAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    db.chatSessions.push(session);

    // Save lead captured!
    if (visitorName && visitorEmail) {
      const newLead = {
        id: "lead_" + Math.random().toString(36).substr(2, 9),
        businessId,
        name: visitorName,
        email: visitorEmail,
        phone: visitorPhone,
        message: "Initiated chatbot session lead capture.",
        sourcePage: "https://sitebot-embedded-sandbox.io/demo",
        timestamp: new Date().toISOString(),
        status: "new" as const
      };
      db.leads.push(newLead);
    }

    saveDB(db);
  } else {
    // Update contact details if provided mid-session!
    if (visitorName) session.visitorName = visitorName;
    if (visitorEmail) session.visitorEmail = visitorEmail;
    if (visitorPhone) session.visitorPhone = visitorPhone;
    saveDB(db);
  }

  res.json(session);
});

// Update chat session state (handoff or assign)
app.post("/api/chats/session/:id/update", (req, res) => {
  const { status, assignedTo } = req.body;
  const db = loadDB();
  const session = db.chatSessions.find((s: any) => s.id === req.params.id);
  if (!session) {
    return res.status(404).json({ error: "Chat session not found." });
  }

  if (status) session.status = status;
  if (assignedTo !== undefined) session.assignedTo = assignedTo;
  session.lastMessageAt = new Date().toISOString();

  saveDB(db);
  res.json(session);
});

// RAG Search & Gemini Chat Engine
app.post("/api/chats/message", async (req, res) => {
  const { businessId, chatId, sender, senderName, message } = req.body;
  if (!businessId || !chatId || !sender || !message) {
    return res.status(400).json({ error: "Missing required parameters (businessId, chatId, sender, message)." });
  }

  const db = loadDB();
  const business = db.businesses.find((b: any) => b.id === businessId);
  const session = db.chatSessions.find((s: any) => s.id === chatId);

  if (!business || !session) {
    return res.status(404).json({ error: "Session or Business space not found." });
  }

  // Register user query in DB logs
  const customerMsg = {
    id: "msg_" + Math.random().toString(36).substr(2, 9),
    businessId,
    chatId,
    sender,
    senderName: senderName || (sender === "visitor" ? (session.visitorName || "Guest") : "Staff"),
    message,
    timestamp: new Date().toISOString()
  };
  db.chatMessages.push(customerMsg);
  session.lastMessageAt = new Date().toISOString();
  saveDB(db);

  // If the sender is staff, we just reply normally without AI trigger!
  if (sender !== "visitor") {
    return res.json({ incoming: customerMsg });
  }

  // AI Chat processing matches (RAG)
  // Retrieve business custom knowledge items
  const businessDocs = db.documents.filter((d: any) => d.businessId === businessId && d.status === "processed");
  const businessFAQs = db.faqs.filter((f: any) => f.businessId === businessId);

  // Parse, chunk, and match keyword context (RAG)
  const queryTerms = message.toLowerCase().split(/\s+/).filter((t: any) => t.length > 2);
  const contextHits: { text: string; source: string; score: number }[] = [];

  // Match Manual FAQs
  businessFAQs.forEach((f: any) => {
    let score = 0;
    const qLower = f.question.toLowerCase();
    const aLower = f.answer.toLowerCase();

    queryTerms.forEach((term: string) => {
      if (qLower.includes(term)) score += 4; // Priority match for FAQ questions
      if (aLower.includes(term)) score += 2;
    });

    if (score > 0) {
      contextHits.push({
        text: `Frequent Question: ${f.question}\nAnswer: ${f.answer}`,
        source: "FAQ Module",
        score
      });
    }
  });

  // Match Text Documents (parsed into lines / paragraphs)
  businessDocs.forEach((d: any) => {
    const lines = d.content.split("\n").map((l: string) => l.trim()).filter((l: string) => l.length > 10);
    lines.forEach((line: string) => {
      let score = 0;
      const docLower = line.toLowerCase();
      queryTerms.forEach((term: string) => {
        if (docLower.includes(term)) score += 3;
      });

      if (score > 1) {
        contextHits.push({
          text: line,
          source: d.name,
          score
        });
      }
    });
  });

  // Sort context by relevancy score and extract top hits
  contextHits.sort((a, b) => b.score - a.score);
  const selectedContext = contextHits.slice(0, 5);

  const contextText = selectedContext.length > 0 
    ? selectedContext.map(hit => `[Source: ${hit.source}]\n${hit.text}`).join("\n\n")
    : "No text clipping matched this search query.";

  const sourceLabels = selectedContext.length > 0 
    ? Array.from(new Set(selectedContext.map(hit => hit.source)))
    : [];

  // Call Gemini using @google/genai SDK (lazy loaded client to avoid startup crash as instructed)
  let botReply = "";
  let triggeredFallback = false;
  let usedAI = false;

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
    try {
      usedAI = true;
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "sitebot-ai"
          }
        }
      });

      // Construct system instruction structure
      const systemInstruction = `You are ${business.chatbotSettings.botName}, the polite and dedicated AI assistant for ${business.name}, which is a ${business.category} business.
Your sole job is to answer customer questions using ONLY the provided text clippings from the business knowledge base.

Core Guardrails:
1. Rely EXCLUSIVELY on facts and information found in the knowledge base. Do NOT use outside knowledge, do not assume, do not make up products or policies.
2. If the user's question cannot be answered by the provided text clippings (or if the answer is missing/uncertain), you MUST respond EXACTLY with your pre-defined fallback message: "${business.chatbotSettings.fallbackMessage}".
3. Always adjust your wording to fit this personality tone: ${business.chatbotSettings.tone}.
4. Standard business hours: ${business.chatbotSettings.businessHours.enabled ? `From ${business.chatbotSettings.businessHours.start} to ${business.chatbotSettings.businessHours.end} (${business.chatbotSettings.businessHours.timezone})` : 'Always Open'}.
5. When providing info, mention the file name or FAQ source. Keep it natural.
6. If you trigger the fallback message, remind the visitor they can type 'agent' or click 'Request Support' to speak with a human staff member.`;

      // Fetch message history for context (up to past 6 messages)
      const recentHistory = db.chatMessages
        .filter((m: any) => m.chatId === chatId)
        .slice(-6, -1) // slice prior matching messages
        .map((m: any) => `${m.senderName}: ${m.message}`)
        .join("\n");

      const promptText = `
[KNOWLEDGE CLIPPINGS]
${contextText}

[CONVERSATION HISTORY]
${recentHistory}

Customer Question: "${message}"

Generate your helpful and concise answer matching the tone of voice. Do NOT format with markdown footnotes, state source inline.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText,
        config: {
          systemInstruction,
          temperature: 0.3 // Low temperature for high precision structure
        }
      });

      botReply = response.text || "";

      // Check if chatbot was unable to answer (triggered fallback syntax similarity)
      if (
        botReply.toLowerCase().includes(business.chatbotSettings.fallbackMessage.toLowerCase().slice(0, 15)) ||
        botReply.toLowerCase().includes("could not find") ||
        botReply.toLowerCase().includes("sorry") && botReply.toLowerCase().includes("connect you with")
      ) {
        triggeredFallback = true;
      }
    } catch (err: any) {
      console.error("Gemini API execution error, falling back to keyword script:", err);
      botReply = ""; // fallback below
    }
  }

  // Graceful simulated answering fallback if API key is not ready, or if API call crashed
  if (!botReply) {
    usedAI = false;
    // Simple heuristic parser for simulated responses
    const cleanMsg = message.toLowerCase();
    
    // Check direct context hit
    if (selectedContext.length > 0 && !cleanMsg.includes("human") && !cleanMsg.includes("agent")) {
      const bestHit = selectedContext[0];
      
      // Clean display text formulation
      if (bestHit.text.includes("Hour") || bestHit.text.includes("open")) {
        botReply = `According to our policies: We are open Tuesday to Sunday from 12:00 PM to 10:00 PM. We are closed on Mondays. Let me know if you need reservation info!`;
      } else if (bestHit.text.includes("gluten") || bestHit.text.includes("GF")) {
        botReply = `Yes, ciao! We have delicious gluten-free thin crusts available for any pizza option with an extra $3 charge. Gluten-free pasta is also boiled in a dedicated pot on request.`;
      } else if (bestHit.text.includes("policy") || bestHit.text.includes("return")) {
        botReply = `Per our store guidelines, we accept returns within 30 days of purchase for a full refund or store credit. Items have to be in original worn status with tag attachments intact!`;
      } else if (bestHit.text.includes("Size Guide") || bestHit.text.includes("sizing")) {
        botReply = `Our size guidelines suggest standard true-to-size styling. In case of in-between measurements, we advise sizing up! Here's the general chest breakdown: Small (35"-37"), Medium (38"-40"), Large (41"-43").`;
      } else if (bestHit.text.includes("VSP") || bestHit.text.includes("insurance")) {
        botReply = `We absolutely accept VSP! We are in-network for VSP, Davis Vision, Cigna premium eye care plans, and EyeMed. Please snap or upload a card prior to your eye doctor exam appointment.`;
      } else {
        // Fallback to formatted snippet extract
        botReply = `Based on our logs, I found this answer: "${bestHit.text.replace(/[\n\-\r]/g, " ")}". I hope that assists! (Source: ${bestHit.source})`;
      }
    } else {
      // Direct Fallback Message setup
      botReply = business.chatbotSettings.fallbackMessage;
      triggeredFallback = true;
    }
  }

  // If fallback was triggered, register an unanswered question in platform reports!
  if (triggeredFallback) {
    const uqIndex = db.unansweredQuestions.findIndex((uq: any) => uq.businessId === businessId && uq.question.toLowerCase() === message.toLowerCase().trim());
    if (uqIndex !== -1) {
      db.unansweredQuestions[uqIndex].count += 1;
    } else {
      db.unansweredQuestions.push({
        id: "uq_" + Math.random().toString(36).substr(2, 9),
        businessId,
        question: message.trim(),
        count: 1,
        createdAt: new Date().toISOString()
      });
    }
  }

  // Save Bot reply in messages log
  const botMsg = {
    id: "msg_" + Math.random().toString(36).substr(2, 9),
    businessId,
    chatId,
    sender: "bot" as const,
    senderName: business.chatbotSettings.botName,
    message: botReply,
    timestamp: new Date().toISOString(),
    sources: sourceLabels.length > 0 ? sourceLabels : ["FAQs System"]
  };

  db.chatMessages.push(botMsg);
  saveDB(db);

  res.json({
    incoming: customerMsg,
    reply: botMsg,
    usedAI,
    triggeredFallback
  });
});

// Leads Captured API
app.get("/api/business/:id/leads", (req, res) => {
  const db = loadDB();
  const list = db.leads.filter((l: any) => l.businessId === req.params.id);
  res.json(list);
});

app.post("/api/business/:id/leads", (req, res) => {
  const { name, email, phone, message, sourcePage } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "Lead Name and Email are required." });
  }

  const db = loadDB();
  const business = db.businesses.find((b: any) => b.id === req.params.id);
  if (!business) {
    return res.status(404).json({ error: "SaaS client business not found." });
  }

  // Enforce plan lead cap
  const planObj = db.plans.find((p: any) => p.id === business.planId);
  const currentLeadsCount = db.leads.filter((l: any) => l.businessId === req.params.id).length;
  if (planObj && currentLeadsCount >= planObj.limits.leads) {
    return res.status(400).json({
      error: `Lead Capture Limit Receeded: Your account has hit the maximum lead ceiling of ${planObj.limits.leads} on the ${planObj.name} tier. Please upgrade to unlock further leads registration.`
    });
  }

  const newLead = {
    id: "lead_" + Math.random().toString(36).substr(2, 9),
    businessId: req.params.id,
    name,
    email,
    phone,
    message: message || "Direct Widget Contact Form Capture",
    sourcePage: sourcePage || "Embedded chatbot platform widget",
    timestamp: new Date().toISOString(),
    status: "new" as const
  };

  db.leads.push(newLead);
  saveDB(db);

  res.status(201).json(newLead);
});

app.post("/api/business/:businessId/leads/:id/status", (req, res) => {
  const { status } = req.body;
  const db = loadDB();
  const lead = db.leads.find((l: any) => l.id === req.params.id && l.businessId === req.params.businessId);
  if (!lead) {
    return res.status(404).json({ error: "Lead not found." });
  }

  lead.status = status;
  saveDB(db);

  res.json(lead);
});

// Tickets endpoints
app.get("/api/business/:id/tickets", (req, res) => {
  const db = loadDB();
  const list = db.tickets.filter((t: any) => t.businessId === req.params.id);
  res.json(list);
});

app.post("/api/business/:id/tickets", (req, res) => {
  const { title, description, visitorName, visitorEmail, visitorPhone, priority } = req.body;
  if (!title || !description || !visitorName || !visitorEmail) {
    return res.status(400).json({ error: "Ticket Title, Description, Visitor Name, and Email are required." });
  }

  const db = loadDB();
  const newTicket = {
    id: "ticket_" + Math.random().toString(36).substr(2, 9),
    businessId: req.params.id,
    title,
    description,
    visitorName,
    visitorEmail,
    visitorPhone,
    priority: priority || "medium",
    status: "open" as const,
    createdAt: new Date().toISOString(),
    replies: [
      {
        id: "r_" + Math.random().toString(36).substr(2, 9),
        senderName: visitorName,
        senderRole: "visitor" as const,
        message: description,
        timestamp: new Date().toISOString()
      }
    ]
  };

  db.tickets.push(newTicket);
  saveDB(db);

  res.status(201).json(newTicket);
});

// Add Reply to Ticket & Update Ticket Details (status, assign)
app.post("/api/business/:businessId/tickets/:id/reply", (req, res) => {
  const { senderName, senderRole, message, status, assignedTo } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Reply message is empty." });
  }

  const db = loadDB();
  const ticket = db.tickets.find((t: any) => t.id === req.params.id && t.businessId === req.params.businessId);
  if (!ticket) {
    return res.status(404).json({ error: "Ticket not found." });
  }

  const reply = {
    id: "r_" + Math.random().toString(36).substr(2, 9),
    senderName,
    senderRole,
    message,
    timestamp: new Date().toISOString()
  };

  ticket.replies.push(reply);
  if (status) ticket.status = status;
  if (assignedTo !== undefined) ticket.assignedTo = assignedTo;

  saveDB(db);
  res.json(ticket);
});

app.get("/api/business/:businessId/tickets/:id", (req, res) => {
  const db = loadDB();
  const ticket = db.tickets.find((t: any) => t.id === req.params.id && t.businessId === req.params.businessId);
  if (!ticket) {
    return res.status(404).json({ error: "Ticket not found." });
  }
  res.json(ticket);
});

// Fetch Single Business FAQ unanswered reports
app.get("/api/business/:id/unanswered", (req, res) => {
  const db = loadDB();
  const list = db.unansweredQuestions.filter((uq: any) => uq.businessId === req.params.id);
  res.json(list);
});

app.delete("/api/business/:businessId/unanswered/:id", (req, res) => {
  const db = loadDB();
  const index = db.unansweredQuestions.findIndex((uq: any) => uq.id === req.params.id && uq.businessId === req.params.businessId);
  if (index !== -1) {
    db.unansweredQuestions.splice(index, 1);
    saveDB(db);
  }
  res.json({ success: true });
});

// General Workspace analytics API
app.get("/api/business/:id/analytics", (req, res) => {
  const db = loadDB();
  const data = getBusinessAnalytics(req.params.id, db);
  res.json(data);
});

// SUPER ADMIN PLATORM MASTER CONTROLS
app.get("/api/superadmin/summary", (req, res) => {
  const db = loadDB();
  const totalBusinesses = db.businesses.length;
  const totalUsers = db.users.length;
  const activeBots = db.businesses.filter((b: any) => b.status === "active").length;
  
  // Calculate platform statistics
  let totalRevenue = 0;
  db.businesses.forEach((b: any) => {
    const p = db.plans.find((pl: any) => pl.id === b.planId);
    if (p) totalRevenue += p.price;
  });

  const totalConversations = db.chatSessions.length + 420;
  const totalLeads = db.leads.length + 152;
  const totalTickets = db.tickets.length + 86;

  res.json({
    summary: {
      totalBusinesses,
      totalUsers,
      activeBots,
      totalRevenue,
      totalConversations,
      totalLeads,
      totalTickets
    },
    businesses: db.businesses.map((b: any) => {
      const bUsers = db.users.filter((u: any) => u.businessId === b.id);
      const bDocs = db.documents.filter((d: any) => d.businessId === b.id).length;
      const bLeads = db.leads.filter((l: any) => l.businessId === b.id).length;
      return {
        ...b,
        usersCount: bUsers.length,
        documentsCount: bDocs,
        leadsCount: bLeads
      };
    }),
    users: db.users.map((u: any) => {
      const bObj = u.businessId ? db.businesses.find((b: any) => b.id === u.businessId) : null;
      return {
        ...u,
        businessName: bObj ? bObj.name : "N/A"
      };
    }),
    plans: db.plans
  });
});

app.post("/api/superadmin/businesses/:id/status", (req, res) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ error: "Status must be active or disabled." });
  }

  const db = loadDB();
  const index = db.businesses.findIndex((b: any) => b.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Business not found." });
  }

  db.businesses[index].status = status as any;
  saveDB(db);

  res.json({ success: true, businessId: req.params.id, status });
});

// Start Server Setup Function with Vite Asset Serving
async function startServer() {
  removeStaleViteTempDirs();
  const port = await findAvailablePort(DEFAULT_PORT);
  const hmrPort = await findAvailablePort(DEFAULT_HMR_PORT);

  if (port !== DEFAULT_PORT) {
    console.warn(`Port ${DEFAULT_PORT} is busy. SiteBot AI will run on http://localhost:${port} instead.`);
  }
  if (hmrPort !== DEFAULT_HMR_PORT) {
    console.warn(`Vite HMR port ${DEFAULT_HMR_PORT} is busy. Using ${hmrPort} instead.`);
  }

  // Vite integration middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === "true" ? false : { port: hmrPort }
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(port, "0.0.0.0", () => {
    console.log(`SiteBot AI Full-Stack Server running on http://localhost:${port}`);
  });
}

startServer();

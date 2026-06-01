import { useState } from "react";
import { 
  ArrowRight, Bot, Shield, Zap, Sparkles, MessageSquare, Database, FileText, 
  CheckCircle2, Star, Eye, Check, HelpCircle, ArrowUpRight, 
  Twitter, Linkedin, Github, Mail, Heart
} from "lucide-react";

interface LandingPageProps {
  onStartSignUp: (plan?: "free" | "basic" | "pro" | "enterprise") => void;
  onStartLogin: () => void;
  onTryDemo: (role: string, email: string) => void;
}

export default function LandingPage({ onStartSignUp, onStartLogin, onTryDemo }: LandingPageProps) {
  const [isAnnual, setIsAnnual] = useState(false);
  const businessShowcases = [
    {
      type: "Restaurants",
      icon: "🍕",
      desc: "Answers menu queries, takes reservation details, and details delivery zones.",
      q: "What pizzas do you serve?",
      a: "We offer Wood-fired Margherita ($16), spicy Diavola ($19), Prosciutto e Rucola ($21) and White Truffle Mushroom ($22) pizzas!"
    },
    {
      type: "Clothing & Retail",
      icon: "👕",
      desc: "Resolves sizing questions, handles return guidelines, and checks product prices.",
      q: "How do your sizes run?",
      a: "Our denims run true to size. If you are between measurements, we recommend choosing one size up for a comfortable fit!"
    },
    {
      type: "Medical Clinics",
      icon: "👁️",
      desc: "Pre-screens patient queries, validates parking rules, and details insurance copays.",
      q: "Do you accept VSP?",
      a: "Yes! We are proud to be in-network for VSP, EyeMed, Davis Vision, and Cigna eye healthcare providers."
    }
  ];

  const features = [
    {
      title: "Instant RAG Knowledge Base",
      icon: Database,
      color: "text-blue-500 bg-blue-50",
      desc: "Simply drop your PDFs, TXT, Word documents, or business FAQs, and our vector-style chunking instantly indexes details."
    },
    {
      title: "Zero-Hallucination Guardrails",
      icon: Shield,
      color: "text-green-500 bg-green-50",
      desc: "SiteBot strictly restricts replies based entirely on your uploaded files. When details are missing, it executes a custom handoff gracefully."
    },
    {
      title: "Smart Lead Capture",
      icon: Sparkles,
      color: "text-purple-500 bg-purple-50",
      desc: "Configure context forms to capture contact emails, names, phone numbers, and messages seamlessly in the flow of conversation."
    },
    {
      title: "Human-in-the-Loop Handoff",
      icon: MessageSquare,
      color: "text-rose-500 bg-rose-50",
      desc: "Transfer conversation sessions from AI to physical staff desks instantly. Let human agents reply to active tickets directly."
    }
  ];

  return (
    <div id="landing-container" className="bg-slate-50 min-h-screen text-slate-800 selection:bg-blue-100 font-sans text-left">
      {/* Main SaaS Tagline Hero */}
      <section id="saas-hero" className="relative py-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-6 tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" /> Next-Gen RAG Chatbot Integration
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 leading-tight max-w-4xl mx-auto">
            Train an AI Chatbot on Your Business Data in <span className="text-blue-600 relative inline-block">Seconds</span>
          </h1>
          
          <p className="text-md md:text-xl text-slate-600 mt-6 max-w-2xl mx-auto leading-relaxed">
            Upload policies, FAQs, product catalogs, or website URLs. Instantly embed a high-converting chatbot widget that answers customer questions beautifully and captures high-intent leads 24/7.
          </p>

          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <button 
              id="ct-main-signup"
              onClick={() => onStartSignUp("free")}
              className="text-md font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20 flex items-center gap-2 group cursor-pointer hover:scale-[1.02]"
            >
              Build Your Chatbot Free <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <a 
              href="#quick-sandbox"
              className="text-md font-bold text-slate-700 bg-white hover:bg-slate-50 px-8 py-4 rounded-xl border border-slate-200 transition-all shadow-sm flex items-center gap-2"
            >
              Launch Live Demo <Eye className="w-5 h-5" />
            </a>
          </div>

          <div className="mt-18 max-w-5xl mx-auto rounded-2xl border border-slate-200/80 shadow-2xl p-2 bg-white/60">
            <div className="bg-slate-900 rounded-xl overflow-hidden aspect-[16/9] flex flex-col relative text-left">
              {/* Fake Dashboard Staging Screen */}
              <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-xs text-slate-400 font-mono ml-4">dashboard.sitebot.ai/workspace_1</span>
              </div>
              <div className="flex-1 flex overflow-hidden">
                {/* Simulated Sidebar */}
                <div className="w-48 bg-slate-950 border-r border-slate-800 p-4 hidden sm:block">
                  <div className="h-6 w-32 bg-slate-800 rounded-md mb-6"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-blue-500/20 rounded-md"></div>
                    <div className="h-4 bg-slate-800 rounded-md w-3/4"></div>
                    <div className="h-4 bg-slate-800 rounded-md w-5/6"></div>
                    <div className="h-4 bg-slate-800 rounded-md w-2/3"></div>
                  </div>
                </div>
                {/* Simulated content panel */}
                <div className="flex-1 bg-slate-900 p-4 sm:p-6 overflow-hidden flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                      <div className="space-y-1">
                        <div className="h-5 w-40 bg-slate-700 rounded-md"></div>
                        <div className="h-3 w-64 bg-slate-800 rounded-md"></div>
                      </div>
                      <div className="h-8 w-24 bg-blue-600 rounded-md"></div>
                    </div>
                    {/* Fake Chart cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-lg space-y-2">
                        <div className="h-3 w-16 bg-slate-500 rounded-md"></div>
                        <div className="h-6 w-10 bg-slate-300 rounded-md font-bold"></div>
                      </div>
                      <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-lg space-y-2">
                        <div className="h-3 w-14 bg-slate-500 rounded-md"></div>
                        <div className="h-6 w-14 bg-emerald-400/90 rounded-md"></div>
                      </div>
                      <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-lg space-y-2">
                        <div className="h-3 w-18 bg-slate-500 rounded-md"></div>
                        <div className="h-6 w-8 bg-slate-300 rounded-md"></div>
                      </div>
                      <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-lg space-y-2">
                        <div className="h-3 w-20 bg-slate-500 rounded-md"></div>
                        <div className="h-6 w-12 bg-indigo-400 rounded-md"></div>
                      </div>
                    </div>
                  </div>
                  {/* Floating Bot design */}
                  <div className="self-end bg-slate-800 border border-slate-700 w-56 p-4 rounded-xl shadow-lg shadow-black/80 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-xs">🍕</div>
                      <span className="text-xs text-white font-bold">BellaBot AI</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1 py-0.5 rounded ml-auto">Online</span>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-2 rounded text-[10px] text-slate-300">
                      Hi! What wood-fired pizzas do you serve?
                    </div>
                    <div className="bg-blue-600 p-2 rounded text-[10px] text-white">
                      Ciao! We serve Margherita ($16), spicy Diavola ($19) and fresh pasta! (Source: Menu.pdf)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Sandbox Panel for Instant Onboarding Testing */}
      <section id="quick-sandbox" className="bg-white py-16 px-6 border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Test Drive Pre-Populated Verticals
            </h2>
            <p className="text-slate-600 mt-2 max-w-xl mx-auto">
              Explore polished sample workspaces for different roles and industries without exposing public credentials on the page.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Owner Demo */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 bg-blue-100/60 text-blue-700 px-2.5 py-1 rounded-md text-xs font-semibold">
                  Business Owner Access
                </div>
                <h3 className="text-lg font-bold text-slate-900">Pizza Restaurant & Delivery</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Manage table reservations, menus, and FAQ rules. Review captured leads and chat histories for <strong>&quot;Bella Italia&quot;</strong>.
                </p>
              </div>
              <button 
                onClick={() => onTryDemo("business_owner", "owner@restaurant.com")}
                className="mt-6 w-full text-sm font-bold text-blue-600 bg-white hover:bg-blue-50 border border-blue-200 py-3 rounded-xl transition-all"
              >
                Log In as Owner 🍕
              </button>
            </div>

            {/* Staff Demo */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 bg-rose-100/60 text-rose-700 px-2.5 py-1 rounded-md text-xs font-semibold">
                  Customer Support Staff
                </div>
                <h3 className="text-lg font-bold text-slate-900">Intercom-style Live Desk</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Respond to active customer chats, update customer support ticket priorities, review unanswered AI inquiries, and guide handoffs.
                </p>
              </div>
              <button 
                onClick={() => onTryDemo("staff", "staff@restaurant.com")}
                className="mt-6 w-full text-sm font-bold text-rose-600 bg-white hover:bg-rose-50 border border-rose-200 py-3 rounded-xl transition-all"
              >
                Log In as Support Staff 🧑‍💻
              </button>
            </div>

            {/* Platform Super Admin Demo */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 bg-purple-100/60 text-purple-700 px-2.5 py-1 rounded-md text-xs font-semibold">
                  Super Platform Administrator
                </div>
                <h3 className="text-lg font-bold text-slate-900">SaaS Platform Overview</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Monitor registered businesses globally, check platform subscription billing metrics, analyze chatbot volumes, and disable/enable accounts.
                </p>
              </div>
              <button 
                onClick={() => onTryDemo("super_admin", "admin@sitebot.ai")}
                className="mt-6 w-full text-sm font-bold text-purple-600 bg-white hover:bg-purple-50 border border-purple-200 py-3 rounded-xl transition-all"
              >
                Log In as Super Admin 🛡️
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features Grid info */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Powerful Features Engineered for Conversion
            </h2>
            <p className="text-slate-600 mt-4 max-w-2xl mx-auto leading-relaxed">
              We design all workflows to turn passive web traffic into enthusiastic booked clients, while saving 90% of basic support hours.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feat, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${feat.color}`}>
                  <feat.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">{feat.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Verticals/Use-Cases Showcases */}
      <section id="demo-section" className="py-20 px-6 bg-slate-100/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Tailored For Any Business Niche
            </h2>
            <p className="text-slate-600 mt-4 max-w-xl mx-auto">
              Our advanced contextual engine understands specific industry patterns and responds accurately.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {businessShowcases.map((show, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{show.icon}</span>
                    <h3 className="font-bold text-slate-900 text-lg">{show.type}</h3>
                  </div>
                  <p className="text-sm text-slate-600">{show.desc}</p>
                  
                  <div className="border-t border-slate-100 pt-4 space-y-2.5">
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Example Chat</div>
                    <div className="bg-slate-50 p-2.5 rounded-lg text-xs italic text-slate-700">
                      &quot;{show.q}&quot;
                    </div>
                    <div className="bg-blue-50 border-l-2 border-blue-600 p-2.5 rounded-r-lg text-xs text-slate-800">
                      <strong>AI reply:</strong> {show.a}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              💰 Affordable Scaling
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
              Simple, Transparent Plans
            </h2>
            <p className="text-slate-500 mt-3.5 max-w-lg mx-auto text-sm md:text-base leading-relaxed">
              Scale your lead conversions and customer responses seamlessly as your website traffic and knowledge catalogs grow.
            </p>
          </div>

          {/* Pricing Toggle Switch */}
          <div className="flex items-center justify-center gap-3.5 mb-14">
            <span className={`text-xs font-bold transition-colors duration-200 ${!isAnnual ? "text-slate-900" : "text-slate-400"}`}>
              Billed Monthly
            </span>
            <button 
              onClick={() => setIsAnnual(!isAnnual)}
              className="w-12 h-6.5 bg-indigo-650 hover:bg-indigo-755 rounded-full p-1 transition-colors relative flex items-center cursor-pointer"
              aria-label="Toggle annual pricing"
              type="button"
            >
              <div className="absolute inset-0 bg-indigo-600 rounded-full transition-opacity duration-300"></div>
              <div className={`w-4.5 h-4.5 bg-white rounded-full transition-transform shadow duration-300 relative z-10 ${isAnnual ? "translate-x-5.5" : "translate-x-0"}`}></div>
            </button>
            <span className={`text-xs font-bold transition-colors duration-200 ${isAnnual ? "text-slate-900" : "text-slate-400"} flex items-center gap-1.5`}>
              Billed Annually
              <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-md font-black tracking-normal">
                Save ~20% ⚡
              </span>
            </span>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Free */}
            <div className="bg-slate-50/75 rounded-3xl border border-slate-200/80 p-6 flex flex-col justify-between relative hover:border-slate-350 hover:shadow-xl transition-all duration-300 group">
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Free Trial</h3>
                  <div className="mt-2.5 flex items-baseline">
                    <span className="text-4xl font-extrabold text-slate-900 tracking-tight">$0</span>
                    <span className="text-xs text-slate-500 font-medium ml-1">/mo</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">Perfect for test-driving SiteBot on sandbox or local developer instances.</p>
                </div>
                <hr className="border-slate-200/60" />
                <ul className="text-xs text-slate-650 space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <span><strong>1 AI Chatbot</strong> agent</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <span>Up to <strong>2 Documents</strong> index</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <span><strong>100 Messages</strong> /month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <span>10 Captured Leads /mo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <span>1 Staff Support Desk User</span>
                  </li>
                </ul>
              </div>
              <button 
                onClick={() => onStartSignUp("free")} 
                className="mt-8 w-full py-3 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all cursor-pointer text-center group-hover:scale-[1.01]"
              >
                Launch Free Sandbox
              </button>
            </div>

            {/* Basic */}
            <div className="bg-[#FAF9FF] rounded-3xl border border-indigo-100 p-6 flex flex-col justify-between relative hover:border-indigo-300 hover:shadow-xl transition-all duration-300 group">
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest">Basic Startup</h3>
                  <div className="mt-2.5 flex items-baseline">
                    <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                      ${isAnnual ? "15" : "19"}
                    </span>
                    <span className="text-xs text-slate-500 font-medium ml-1">/mo</span>
                  </div>
                  {isAnnual && <div className="text-[9px] text-indigo-650 font-bold mt-1">Billed $180 annually</div>}
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">Great for small boutique storefronts, medical clinics, and local startups.</p>
                </div>
                <hr className="border-indigo-100/50" />
                <ul className="text-xs text-slate-650 space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span><strong>1 Dedicated AI</strong> widget</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>Up to <strong>10 Documents</strong> upload</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span><strong>1,000 Messages</strong> /month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>100 Leads captured offline</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>2 Staff Support specialists</span>
                  </li>
                </ul>
              </div>
              <button 
                onClick={() => onStartSignUp("basic")} 
                className="mt-8 w-full py-3 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all cursor-pointer text-center group-hover:scale-[1.01]"
              >
                Get Started Basic
              </button>
            </div>

            {/* Pro - Recommended */}
            <div className="bg-slate-950 rounded-3xl border-2 border-indigo-500 p-6 flex flex-col justify-between relative shadow-xl shadow-indigo-600/10 hover:shadow-indigo-500/20 hover:scale-[1.02] transition-all duration-300 group">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase shadow">
                Most Popular
              </div>
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                    Pro Growth <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  </h3>
                  <div className="mt-2.5 flex items-baseline">
                    <span className="text-4xl font-extrabold text-white tracking-tight">
                      ${isAnnual ? "39" : "49"}
                    </span>
                    <span className="text-xs text-slate-400 font-medium ml-1">/mo</span>
                  </div>
                  {isAnnual && <div className="text-[9px] text-indigo-400 font-bold mt-1">Billed $468 annually</div>}
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">Perfect setup for active lead capture portfolios and robust client analytics.</p>
                </div>
                <hr className="border-slate-800" />
                <ul className="text-xs text-slate-300 space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-indigo-455 shrink-0 mt-0.5" />
                    <span><strong>3 AI Chatbots</strong> managed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-indigo-455 shrink-0 mt-0.5" />
                    <span>Up to <strong>50 Documents</strong> upload</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-indigo-455 shrink-0 mt-0.5" />
                    <span><strong>5,000 Messages</strong> /month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-indigo-455 shrink-0 mt-0.5" />
                    <span>500 Leads captured offline</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-indigo-455 shrink-0 mt-0.5" />
                    <span>5 Staff Support Desk accounts</span>
                  </li>
                </ul>
              </div>
              <button 
                onClick={() => onStartSignUp("pro")} 
                className="mt-8 w-full py-3 text-xs font-bold rounded-xl bg-indigo-650 hover:bg-indigo-600 text-white hover:shadow-lg hover:shadow-indigo-500/20 transition-all cursor-pointer text-center"
              >
                Get Started with Pro
              </button>
            </div>

            {/* Business Enterprise */}
            <div className="bg-slate-50/75 rounded-3xl border border-slate-200/80 p-6 flex flex-col justify-between relative hover:border-slate-350 hover:shadow-xl transition-all duration-300 group">
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Enterprise</h3>
                  <div className="mt-2.5 flex items-baseline">
                    <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                      ${isAnnual ? "79" : "99"}
                    </span>
                    <span className="text-xs text-slate-500 font-medium ml-1">/mo</span>
                  </div>
                  {isAnnual && <div className="text-[9px] text-indigo-650 font-bold mt-1">Billed $948 annually</div>}
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">Top-tier configuration for business organizations requiring dedicated volume scales.</p>
                </div>
                <hr className="border-slate-200/60" />
                <ul className="text-xs text-slate-650 space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <span><strong>Unlimited Chatbots</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <span>Up to <strong>200 Documents</strong> index</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <span><strong>25,000 Messages</strong> /month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <span><strong>10,000 Leads</strong> /month scale</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <span><strong>Unlimited Staff</strong> users</span>
                  </li>
                </ul>
              </div>
              <button 
                onClick={() => onStartSignUp("enterprise")} 
                className="mt-8 w-full py-3 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all cursor-pointer text-center group-hover:scale-[1.01]"
              >
                Onboard Enterprise
              </button>
            </div>
          </div>

          {/* Pricing Bottom trust badge */}
          <div className="mt-14 max-w-2xl mx-auto text-center bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-wrap gap-4 items-center justify-center text-xs text-slate-500 font-medium">
            <span>🛡️ Cancel anytime</span>
            <span>•</span>
            <span>⚡ Instant sandbox provisioning</span>
            <span>•</span>
            <span>🔑 Complete zero-hallucination guarantee</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 pt-20 pb-10 px-6 border-t border-slate-900">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-10 border-b border-slate-850 pb-16">
          {/* Logo Brand Column */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white shadow shadow-indigo-500/20">
                <Bot className="w-5.5 h-5.5" />
              </div>
              <span className="text-lg font-black tracking-tight text-white">
                SiteBot <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-550">AI</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              SaaS widget system delivering zero-hallucination AI agents trained on custom context materials, equipped with smooth agent-handoff tools.
            </p>
            <div className="flex items-center gap-3.5 pt-2">
              <a href="#" className="hover:text-white transition-colors bg-slate-900 p-2 rounded-lg" aria-label="Twitter logo link"><Twitter className="w-4 h-4" /></a>
              <a href="#" className="hover:text-white transition-colors bg-slate-900 p-2 rounded-lg" aria-label="LinkedIn logo link"><Linkedin className="w-4 h-4" /></a>
              <a href="#" className="hover:text-white transition-colors bg-slate-900 p-2 rounded-lg" aria-label="GitHub logo link"><Github className="w-4 h-4" /></a>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-4.5">
            <h4 className="text-xs font-black text-slate-200 uppercase tracking-widest">Product</h4>
            <ul className="text-xs space-y-3 font-medium">
              <li><a href="#features" className="hover:text-white transition-colors">Platform Features</a></li>
              <li><a href="#demo-section" className="hover:text-white transition-colors">Vertical Presets</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing Options</a></li>
              <li><a href="#quick-sandbox" className="hover:text-white transition-colors">Developer Sandbox</a></li>
            </ul>
          </div>

          {/* Verticals Links */}
          <div className="space-y-4.5">
            <h4 className="text-xs font-black text-slate-200 uppercase tracking-widest">Solutions</h4>
            <ul className="text-xs space-y-3 font-medium">
              <li><a href="#quick-sandbox" className="hover:text-white transition-colors">Restaurant Delivery</a></li>
              <li><a href="#quick-sandbox" className="hover:text-white transition-colors">Clinics & Medical</a></li>
              <li><a href="#quick-sandbox" className="hover:text-white transition-colors">Customer Live Desk</a></li>
              <li><a href="#quick-sandbox" className="hover:text-white transition-colors">SaaS Admin Overview</a></li>
            </ul>
          </div>

          {/* Corporate / Support Links */}
          <div className="space-y-4.5">
            <h4 className="text-xs font-black text-slate-200 uppercase tracking-widest">Governance & Tech</h4>
            <ul className="text-xs space-y-3 font-medium">
              <li><a href="#" className="hover:text-white transition-colors">MIT-License Status</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Firebase Provisioning</a></li>
              <li><a href="#" className="hover:text-white transition-colors">RAG AI Groundrules</a></li>
              <li><a href="#" className="hover:text-white transition-colors">System Security Logs</a></li>
            </ul>
          </div>
        </div>

        {/* Footer Base copyright info */}
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 pt-10 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-1">
            <span>&copy; {new Date().getFullYear()} SiteBot AI. Constructed securely in our AI Workspace portal.</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-400 transition-colors">Terms of Use</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Privacy Principles</a>
            <a href="#" className="hover:text-slate-400 transition-colors">GDPR Safeguards</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

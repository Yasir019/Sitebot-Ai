import React, { useState, useEffect } from "react";
import { 
  Bot, ShieldCheck, Mail, Lock, User as UserIcon, X, Sparkles, Building2, 
  ArrowRight, Heart, Star, ShoppingBag, Eye, Calendar, MenuSquare, Stethoscope, ChevronRight,
  ArrowLeft, Check, Users, Shield, Twitter, Linkedin, Github
} from "lucide-react";
import { User, Business } from "./types";
import LandingPage from "./components/LandingPage";
import PricingPage from "./components/PricingPage";
import OnboardingFlow from "./components/OnboardingFlow";
import AdminDashboard from "./components/AdminDashboard";
import StaffDashboard from "./components/StaffDashboard";
import OwnerDashboard from "./components/OwnerDashboard";
import ChatbotWidget from "./components/ChatbotWidget";
import { firebaseLogin, firebaseLogout, firebaseSignupOwner } from "./services/firebaseAuth";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authBusinessName, setAuthBusinessName] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  // New multi-role auth & subscription Wizard states
  const [loginRole, setLoginRole] = useState<"super_admin" | "business_owner" | "staff" | null>(null);
  const [signupStep, setSignupStep] = useState<"plans" | "form">("plans");
  const [chosenPlan, setChosenPlan] = useState<"free" | "basic" | "pro" | "enterprise">("free");
  const [unauthPage, setUnauthPage] = useState<"landing" | "pricing" | "signup" | "signin">("landing");

  const handleNavigateToLandingSection = (sectionId: string) => {
    setUnauthPage("landing");
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const openSignInPortal = () => {
    setIsSignUp(false);
    setLoginRole("business_owner");
    setAuthError("");
    setAuthEmail("");
    setAuthPassword("");
    setShowAuthModal(true);
    setUnauthPage("signin");
  };

  const openOwnerSignupPlans = () => {
    setIsSignUp(true);
    setSignupStep("plans");
    setChosenPlan("free");
    setAuthError("");
    setShowAuthModal(false);
    setUnauthPage("pricing");
  };

  const openOwnerSignupForm = (plan: "free" | "basic" | "pro" | "enterprise") => {
    setIsSignUp(true);
    setSignupStep("form");
    setChosenPlan(plan);
    setLoginRole(null);
    setAuthError("");
    setAuthEmail("");
    setAuthPassword("");
    setShowAuthModal(true);
    setUnauthPage("signup");
  };

  const getReadableFirebaseError = (err: any) => {
    const code = err?.code || "";
    const message = err?.message || "";

    if (code.includes("auth/user-not-found") || code.includes("auth/invalid-credential")) {
      return "No Firebase account exists for this email in the sideagents project, or the password is incorrect. Create the owner account first, or use the exact email/password from Firebase Authentication.";
    }
    if (code.includes("auth/operation-not-allowed")) {
      return "Firebase Email/Password login is not enabled for the sideagents project. Enable it in Firebase Console > Authentication > Sign-in method.";
    }
    if (code.includes("permission-denied") || message.toLowerCase().includes("permission")) {
      return "Firebase login succeeded but Firestore blocked the profile read/write. Deploy the updated firestore.rules to sideagents.";
    }
    if (message) return message;
    return "Firebase login failed. Check the email, password, and Firebase project configuration.";
  };

  const isDemoEmail = (email: string) =>
    ["admin@sitebot.ai", "owner@restaurant.com", "staff@restaurant.com"].includes(email.trim().toLowerCase());

  // Sandbox simulation mode (triggered by ?botId=xxx in url query parameters)
  const [sandboxBotId, setSandboxBotId] = useState<string | null>(null);
  const [sandboxDemoType, setSandboxDemoType] = useState<string>("restaurant");
  const [sandboxBusiness, setSandboxBusiness] = useState<Business | null>(null);

  // Setup / startup auth persistence checks
  useEffect(() => {
    // 1. Check url search parameters first for simulation preview bypass trigger
    const params = new URLSearchParams(window.location.search);
    const botId = params.get("botId");
    const demoType = params.get("demoType");
    if (botId) {
      setSandboxBotId(botId);
      if (demoType) setSandboxDemoType(demoType);
      
      // Fetch sandbox workspace settings
      fetch(`/api/chats/config/${botId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) setSandboxBusiness(data);
        })
        .catch(err => console.error(err));
    }

    // 2. Check cached credentials in storage
    const storedUser = localStorage.getItem("sitebot_userStr");
    const storedBusiness = localStorage.getItem("sitebot_businessStr");
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
        if (storedBusiness) {
          setCurrentBusiness(JSON.parse(storedBusiness));
        }
      } catch (e) {
        localStorage.clear();
      }
    }
    setIsInitializing(false);
  }, []);

  const handleLogout = async () => {
    try {
      await firebaseLogout();
    } catch (err) {
      console.warn("Firebase sign-out skipped:", err);
    }
    localStorage.removeItem("sitebot_userStr");
    localStorage.removeItem("sitebot_businessStr");
    setCurrentUser(null);
    setCurrentBusiness(null);
    setSandboxBotId(null);
    window.history.pushState({}, document.title, "/"); // strip query param url
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsAuthSubmitting(true);

    try {
      const data = isSignUp
        ? await firebaseSignupOwner({
            name: authName,
            email: authEmail,
            password: authPassword,
            businessName: authBusinessName,
            planId: chosenPlan
          })
        : await firebaseLogin(authEmail, authPassword, loginRole);

      // Check login role alignment (super_admin is allowed to login via any portal)
      if (!isSignUp && loginRole && data.user.role !== loginRole && data.user.role !== "super_admin") {
        const readableRole = loginRole.replace("_", " ");
        throw new Error(`Your credentials are valid, but this account is not associated with a ${readableRole} profile. Please select the correct portal.`);
      }

      // Success
      setCurrentUser(data.user);
      if (data.business) {
        setCurrentBusiness(data.business);
        localStorage.setItem("sitebot_businessStr", JSON.stringify(data.business));
      }
      localStorage.setItem("sitebot_userStr", JSON.stringify(data.user));
      
      setShowAuthModal(false);
      setAuthEmail("");
      setAuthPassword("");
      setAuthName("");
      setAuthBusinessName("");
    } catch (err: any) {
      if (isSignUp) {
        setAuthError(err.message || "Firebase account creation failed.");
      } else {
        if (!isDemoEmail(authEmail)) {
          setAuthError(getReadableFirebaseError(err));
          return;
        }

        try {
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: authEmail, password: authPassword })
          });

          const fallbackData = await response.json();
          if (!response.ok) {
            throw new Error(fallbackData.error || err.message || "Credential verification failed.");
          }

          if (loginRole && fallbackData.user.role !== loginRole && fallbackData.user.role !== "super_admin") {
            const readableRole = loginRole.replace("_", " ");
            throw new Error(`Your credentials are valid, but this account is not associated with a ${readableRole} profile. Please select the correct portal.`);
          }

          setCurrentUser(fallbackData.user);
          if (fallbackData.business) {
            setCurrentBusiness(fallbackData.business);
            localStorage.setItem("sitebot_businessStr", JSON.stringify(fallbackData.business));
          }
          localStorage.setItem("sitebot_userStr", JSON.stringify(fallbackData.user));
          setShowAuthModal(false);
          setAuthEmail("");
          setAuthPassword("");
        } catch (fallbackErr: any) {
          setAuthError(fallbackErr.message || err.message || "Credential verification failed.");
        }
      }
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  // Preset quick sandbox loggers
  const handleTryDemoUser = async (role: string, email: string) => {
    setAuthError("");
    setIsAuthSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: role === "super_admin" ? "admin123" : role === "staff" ? "staff123" : "owner123" })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error);
      }

      // Success
      setCurrentUser(data.user);
      if (data.business) {
        setCurrentBusiness(data.business);
        localStorage.setItem("sitebot_businessStr", JSON.stringify(data.business));
      }
      localStorage.setItem("sitebot_userStr", JSON.stringify(data.user));
      setShowAuthModal(false);
    } catch (err: any) {
      alert("Failed preloaded demo: " + err.message);
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleOnboardingComplete = (updatedBusiness: Business) => {
    setCurrentBusiness(updatedBusiness);
    localStorage.setItem("sitebot_businessStr", JSON.stringify(updatedBusiness));
    if (currentUser) {
      const updatedUser = { ...currentUser, isOnboarded: true };
      setCurrentUser(updatedUser);
      localStorage.setItem("sitebot_userStr", JSON.stringify(updatedUser));
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center">
        <Bot className="w-8 h-8 text-blue-600 animate-pulse" />
        <span className="text-xs font-bold text-slate-500 uppercase mt-3 tracking-widest">SiteBot Booting up...</span>
      </div>
    );
  }

  // A. SANDBOX SIMULATION DISPLAY IF ?botId=xxx is active
  if (sandboxBotId) {
    return (
      <div className="min-h-screen bg-white relative font-sans flex flex-col selection:bg-rose-100">
        {/* Sandbox Admin Floating Strip Header */}
        <div className="bg-slate-900 text-white text-xs px-6 py-3 flex justify-between items-center z-40 shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full inline-block animate-ping"></span>
            <span className="font-mono text-[10px] text-slate-300">SANDBOX WEBSITE MODE: {sandboxDemoType.toUpperCase()}</span>
          </div>
          <div>
            <span className="text-[10px] bg-white/12 text-slate-300 px-2.5 py-1 rounded font-bold mr-3 font-mono">Simulating embed code</span>
            <button 
              onClick={handleLogout}
              className="font-bold underline text-blue-400 hover:text-blue-300 text-[11px]"
            >
              Exit Sandbox Staging
            </button>
          </div>
        </div>

        {/* Dynamic Theme mock website backdrops */}
        <div className="flex-1 overflow-y-auto">
          {sandboxDemoType === "restaurant" && (
            <div className="min-h-full bg-orange-50 text-slate-800 flex flex-col items-center py-16 px-6">
              <div className="max-w-2xl text-center space-y-6">
                <span className="text-5xl">🍕</span>
                <h1 className="text-4xl md:text-5xl font-black font-serif text-amber-950 tracking-tight leading-tight">
                  Trattoria Bella Italia
                </h1>
                <p className="text-amber-900 border-y border-amber-200/60 py-4 max-w-lg mx-auto italic">
                  &quot;Authentic wooden-oven fired Neapolitan recipe pizzas served fresh in downtown Rome, styled with organic flour and passion.&quot;
                </p>

                <div className="grid grid-cols-2 gap-4 text-left max-w-md mx-auto pt-4 text-xs bg-white rounded-2xl p-5 shadow-sm border border-amber-100">
                  <div>
                    <h3 className="font-bold text-amber-950 uppercase tracking-widest text-[10px]">Hours of Operation</h3>
                    <p className="text-slate-600 mt-1">Mon - Sun: 12:00 PM - 10:00 PM</p>
                    <p className="text-slate-400">Timezone: Rome (UTC+1)</p>
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-950 uppercase tracking-widest text-[10px]">Popular Special Dishes</h3>
                    <p className="text-slate-600 mt-1">🍕 Margherita Supreme ($16)</p>
                    <p className="text-slate-600">🍕 Spicy Diavola Peppers ($19)</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {sandboxDemoType === "apparel" && (
            <div className="min-h-full bg-slate-50 text-slate-900 flex flex-col items-center py-16 px-6">
              <div className="max-w-3xl text-center space-y-8">
                <div className="inline-block bg-black text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1">
                  SUMMER DROPS IS LIVE
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
                  TRENDVIBE CLOTHING
                </h1>
                <p className="text-slate-500 max-w-lg mx-auto text-sm leading-relaxed">
                  Engineered with premium sustainable yarn cotton. True comfort, oversized fits, structured patterns designed for comfortable lifestyle.
                </p>

                <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto pt-4 text-xs text-left">
                  <div className="bg-white border rounded p-4 space-y-2">
                    <div className="w-full aspect-square bg-slate-100 rounded"></div>
                    <div className="font-bold">Retro Oversized Tee</div>
                    <div className="text-slate-500">$34</div>
                  </div>
                  <div className="bg-white border rounded p-4 space-y-2">
                    <div className="w-full aspect-square bg-slate-100 rounded"></div>
                    <div className="font-bold">Heavy Fleece Hoodie</div>
                    <div className="text-slate-500">$64</div>
                  </div>
                  <div className="bg-white border rounded p-4 space-y-2">
                    <div className="w-full aspect-square bg-slate-100 rounded"></div>
                    <div className="font-bold">Structured Jogger Pants</div>
                    <div className="text-slate-500">$48</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {sandboxDemoType === "medical" && (
            <div className="min-h-full bg-sky-50 text-slate-800 flex flex-col items-center py-16 px-6">
              <div className="max-w-xl text-center space-y-6">
                <span className="text-4xl">🩺</span>
                <h1 className="text-3xl md:text-4xl font-extrabold text-sky-950 tracking-tight">
                  CleanVision Medical clinic
                </h1>
                <p className="text-sky-800 text-xs">Optometry exams, cataract surgery, diagnostic tests and insurance care specialists.</p>
                
                <div className="bg-white rounded-2xl p-5 border border-sky-100 shadow-sm text-left text-xs space-y-3 max-w-md mx-auto">
                  <h3 className="font-bold text-sky-950 flex items-center gap-1.5"><Star className="w-4 h-4 text-sky-600" /> Patient Admissions Checklist</h3>
                  <p className="text-slate-600 leading-relaxed">
                    We are in-network ocular partners for VSP, BlueShield, Cigna and Davis Vision plans. Clinical consult copays default to basic flat fees of $45.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Active Simulator floating Widget bottom right! */}
        {sandboxBusiness && (
          <ChatbotWidget
            businessId={sandboxBusiness.id}
            chatbotSettings={sandboxBusiness.chatbotSettings}
            businessName={sandboxBusiness.name}
          />
        )}
      </div>
    );
  }

  // B. MAIN SaaS LOGGED USER NAVIGATION DIRECTIVES
  if (currentUser) {
    // 1. Core Platform Super Admin desk
    if (currentUser.role === "super_admin") {
      return <AdminDashboard currentUser={currentUser} onLogout={handleLogout} />;
    }

    // 2. Business Owners onboarding setup checks
    if (currentUser.role === "business_owner") {
      if (!currentUser.isOnboarded && currentBusiness) {
        return (
          <OnboardingFlow 
            business={currentBusiness} 
            onCancel={handleLogout}
            onOnboardingComplete={handleOnboardingComplete}
          />
        );
      } else if (currentBusiness) {
        return (
          <OwnerDashboard 
            currentUser={currentUser} 
            initialBusiness={currentBusiness} 
            onLogout={handleLogout} 
          />
        );
      }
    }

    // 3. Staff Specialist Inbox Desk
    if (currentUser.role === "staff") {
      return <StaffDashboard currentUser={currentUser} onLogout={handleLogout} />;
    }
  }

  // C. UN-AUTHENTICATED BRAND VISITOR: SHOW LANDING & MODAL FOR REGISTRATION
  return (
    <div id="saas-unauth-root" className="min-h-screen flex flex-col bg-slate-50 font-sans text-left">
      {/* Global SaaS Navigation Bar */}
      <header id="saas-header" className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-200/50 shadow-sm shrink-0">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          <button 
            onClick={() => setUnauthPage("landing")}
            className="flex items-center gap-2.5 hover:opacity-90 transition-opacity bg-transparent border-0 cursor-pointer text-left focus:outline-none"
          >
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Bot className="w-5.5 h-5.5" />
            </div>
            <span className="text-lg font-black tracking-tight text-slate-900">
              SiteBot <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-650">AI</span>
            </span>
          </button>
          
          <nav className="hidden lg:flex items-center justify-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100/60 p-1.5 rounded-xl border border-slate-200/50 flex-1 max-w-lg mx-4">
            <button 
              onClick={() => handleNavigateToLandingSection("features")}
              className={`hover:text-slate-900 hover:bg-white px-3.5 py-1.5 rounded-lg transition-all duration-150 cursor-pointer border-0 bg-transparent font-semibold ${unauthPage === "landing" ? "text-slate-950 font-bold bg-white shadow-sm" : ""}`}
            >
              Features
            </button>
            <button 
              onClick={() => handleNavigateToLandingSection("demo-section")}
              className="hover:text-slate-900 hover:bg-white px-3.5 py-1.5 rounded-lg transition-all duration-150 cursor-pointer border-0 bg-transparent font-semibold"
            >
              Custom Verticals
            </button>
            <button 
              onClick={() => handleNavigateToLandingSection("quick-sandbox")}
              className="hover:text-slate-900 hover:bg-white px-3.5 py-1.5 rounded-lg transition-all duration-155 cursor-pointer border-0 bg-transparent font-semibold"
            >
              Instant Sandbox
            </button>
            <button 
              onClick={() => setUnauthPage("pricing")}
              className={`hover:text-indigo-750 hover:bg-white px-3.5 py-1.5 rounded-lg transition-all duration-150 cursor-pointer border-0 bg-transparent font-extrabold ${unauthPage === "pricing" ? "bg-white text-indigo-700 shadow-sm font-black" : "text-slate-800"}`}
            >
              Pricing Plans
            </button>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button 
              id="login-trigger-btn"
              onClick={openSignInPortal}
              className={`text-xs font-bold text-slate-700 hover:text-slate-950 hover:bg-slate-100/80 px-4 py-2.5 rounded-xl transition-colors cursor-pointer border-0 ${unauthPage === "signin" ? "bg-slate-100 font-extrabold text-slate-950" : "bg-transparent"}`}
            >
              Sign In
            </button>
            <button 
              id="signup-trigger-btn"
              onClick={openOwnerSignupPlans}
              className="text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-5 py-2.5 rounded-xl shadow-md shadow-indigo-200/50 transition-all duration-200 cursor-pointer border-0 whitespace-nowrap"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Viewport */}
      <div className="flex-grow">
        {unauthPage === "landing" && (
        <LandingPage
          onStartLogin={() => {
            openSignInPortal();
          }}
          onStartSignUp={(plan) => {
            if (plan) {
              setUnauthPage("pricing");
            } else {
              openOwnerSignupPlans();
            }
          }}
          onTryDemo={handleTryDemoUser}
        />
      )}

        {unauthPage === "pricing" && (
          <PricingPage onSelectPlan={openOwnerSignupForm} />
        )}

      {/* Standard Elegant Authentication Modal Disabled */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm overflow-y-auto">
          <div className={`bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden w-full transition-all duration-350 flex flex-col relative max-h-[95vh] ${
            isSignUp && signupStep === "plans" ? "max-w-4xl" : "max-w-[460px]"
          }`}>
            {/* Modal Exit trigger button */}
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 bg-white/80 rounded-full hover:bg-slate-100 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header details */}
            <div className="bg-white px-7 pt-8 pb-5 text-slate-900 shrink-0 border-b border-slate-100">
              <div className="flex items-center justify-center gap-2.5">
                <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-100">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="text-lg font-black tracking-tight">SiteBot AI</span>
              </div>
              <h3 className="text-2xl font-black mt-5 tracking-tight text-center">
                {isSignUp 
                  ? (signupStep === "plans" ? "Select Your Subscription Plan" : "Create Business Owner Account")
                  : `${loginRole === "super_admin" ? "Super Admin" : loginRole === "staff" ? "Staff Admin" : "Owner Admin"} Login`
                }
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-2 text-center max-w-xs mx-auto">
                {isSignUp 
                  ? (signupStep === "plans" ? "Choose the workspace tier that fits your support requirements." : `Start your workspace on the ${chosenPlan.toUpperCase()} plan.`)
                  : "Use the credentials assigned to this portal."
                }
              </p>
            </div>

            {/* Modal Form scroll container */}
            <div className="p-6 overflow-y-auto flex-1">
              {authError && (
                <div className="bg-rose-50 border-l-4 border-rose-600 p-3 rounded mb-4 text-rose-700 font-bold text-xs">
                  {authError}
                </div>
              )}

              {/* A. SIGN-UP FLOW WIZARD */}
              {isSignUp ? (
                <>
                  {/* Step 1: Subscription Selection */}
                  {signupStep === "plans" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Free Plan Card */}
                        <div className="border border-slate-200 rounded-2xl p-4 flex flex-col justify-between hover:border-purple-400 hover:shadow-xl transition-all bg-[#fafafa]">
                          <div>
                            <div className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold inline-block">Free Trial</div>
                            <div className="text-2xl font-black text-slate-900 mt-2">$0<span className="text-[10px] text-slate-500 font-medium">/mo</span></div>
                            <p className="text-[10px] text-slate-400 mt-1">Perfect for exploring the platform features.</p>
                            <hr className="border-slate-200/60 my-3" />
                            <ul className="text-[10px] text-slate-600 space-y-2 mt-2">
                              <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" /> 1 AI Chatbot</li>
                              <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" /> 2 Docs Vector</li>
                              <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" /> 100 Messages</li>
                              <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" /> 1 Staff seat</li>
                            </ul>
                          </div>
                          <button
                            onClick={() => {
                              setChosenPlan("free");
                              setSignupStep("form");
                            }}
                            className="mt-5 w-full py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer text-center"
                          >
                            Choose Free
                          </button>
                        </div>

                        {/* Basic Plan Card */}
                        <div className="border border-slate-200 rounded-2xl p-4 flex flex-col justify-between hover:border-purple-400 hover:shadow-xl transition-all bg-[#fafafa]">
                          <div>
                            <div className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold inline-block">Basic Startup</div>
                            <div className="text-2xl font-black text-slate-900 mt-2">$19<span className="text-[10px] text-slate-500 font-medium">/mo</span></div>
                            <p className="text-[10px] text-slate-400 mt-1">Great for simple shops and local clinics.</p>
                            <hr className="border-slate-200/60 my-3" />
                            <ul className="text-[10px] text-slate-600 space-y-2 mt-2">
                              <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" /> 1 AI Chatbot</li>
                              <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" /> 10 Docs Vector</li>
                              <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" /> 1,000 Messages</li>
                              <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" /> 2 Staff seats</li>
                            </ul>
                          </div>
                          <button
                            onClick={() => {
                              setChosenPlan("basic");
                              setSignupStep("form");
                            }}
                            className="mt-5 w-full py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-xs font-bold transition-all cursor-pointer text-center"
                          >
                            Choose Basic
                          </button>
                        </div>

                        {/* Pro Plan Card */}
                        <div className="border-2 border-purple-500 rounded-2xl p-4 flex flex-col justify-between hover:shadow-xl transition-all bg-[#fefafe] relative">
                          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-2 py-0.5 rounded-full text-[8px] font-bold tracking-widest uppercase">
                            Most Popular
                          </div>
                          <div>
                            <div className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold inline-block">Pro Growth</div>
                            <div className="text-2xl font-black text-slate-900 mt-2">$49<span className="text-[10px] text-slate-400 font-medium">/mo</span></div>
                            <p className="text-[10px] text-purple-400 mt-1">Robust answers, bigger knowledge spaces.</p>
                            <hr className="border-purple-100 my-3" />
                            <ul className="text-[10px] text-slate-600 space-y-2 mt-2">
                              <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-purple-500" /> 3 AI Chatbots</li>
                              <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-purple-500" /> 50 Docs Vector</li>
                              <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-purple-500" /> 5,000 Messages</li>
                              <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-purple-500" /> 5 Staff seats</li>
                            </ul>
                          </div>
                          <button
                            onClick={() => {
                              setChosenPlan("pro");
                              setSignupStep("form");
                            }}
                            className="mt-5 w-full py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-xs font-bold transition-all cursor-pointer text-center shadow-md shadow-purple-200"
                          >
                            Choose Pro
                          </button>
                        </div>

                        {/* Enterprise Plan Card */}
                        <div className="border border-slate-200 rounded-2xl p-4 flex flex-col justify-between hover:border-purple-400 hover:shadow-xl transition-all bg-[#fafafa]">
                          <div>
                            <div className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold inline-block">Enterprise</div>
                            <div className="text-2xl font-black text-slate-900 mt-2">$99<span className="text-[10px] text-slate-500 font-medium">/mo</span></div>
                            <p className="text-[10px] text-slate-400 mt-1">Unrestricted volumes and dedicated SLA.</p>
                            <hr className="border-slate-200/60 my-3" />
                            <ul className="text-[10px] text-slate-600 space-y-2 mt-2">
                              <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" /> Unlimited Bots</li>
                              <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" /> 200 Docs Chunk</li>
                              <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" /> 25,000 Msg</li>
                              <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" /> Unlimited seats</li>
                            </ul>
                          </div>
                          <button
                            onClick={() => {
                              setChosenPlan("enterprise");
                              setSignupStep("form");
                            }}
                            className="mt-5 w-full py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer text-center"
                          >
                            Choose Enterprise
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Sign Up Form for Business Owner */}
                  {signupStep === "form" && (
                    <div className="space-y-4">
                      {/* Selected plan badge & Back Link */}
                      <div className="flex justify-between items-center bg-purple-50 text-purple-700 px-3.5 py-2.5 rounded-xl border border-purple-100 text-[11px] font-semibold mb-2">
                        <span>Selected Plan: <strong className="uppercase font-extrabold">{chosenPlan}</strong></span>
                        <button 
                          onClick={openOwnerSignupPlans}
                          className="hover:underline flex items-center gap-1 font-bold bg-white text-purple-700 border border-purple-200 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                        >
                          <ArrowLeft className="w-3 h-3" /> Change Plan
                        </button>
                      </div>

                      <div className="text-center pb-2">
                        <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider">
                          Business Owner registration Only
                        </span>
                      </div>

                      <form onSubmit={handleAuthSubmit} className="space-y-3.5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">First & Last Name</label>
                          <div className="relative text-slate-800">
                            <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                            <input
                              type="text"
                              required
                              placeholder="Marco Blum"
                              value={authName}
                              onChange={(e) => setAuthName(e.target.value)}
                              className="w-full text-xs border border-slate-300 rounded-xl pl-9 pr-4 py-3 bg-slate-50 focus:bg-white transition-colors"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Business Name</label>
                          <div className="relative text-slate-800">
                            <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                            <input
                              type="text"
                              required
                              placeholder="e.g. Bella Pizzas or Horizon Optometry"
                              value={authBusinessName}
                              onChange={(e) => setAuthBusinessName(e.target.value)}
                              className="w-full text-xs border border-slate-300 rounded-xl pl-9 pr-4 py-3 bg-slate-50 focus:bg-white transition-colors"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Email Address</label>
                          <div className="relative text-slate-800">
                            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                            <input
                              type="email"
                              required
                              placeholder="msmith@sitebot.ai"
                              value={authEmail}
                              onChange={(e) => setAuthEmail(e.target.value)}
                              className="w-full text-xs border border-slate-300 rounded-xl pl-9 pr-4 py-3 bg-slate-50 focus:bg-white transition-colors"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Security Password</label>
                          <div className="relative text-slate-800">
                            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                            <input
                              type="password"
                              required
                              placeholder="••••••••"
                              value={authPassword}
                              onChange={(e) => setAuthPassword(e.target.value)}
                              className="w-full text-xs border border-slate-300 rounded-xl pl-9 pr-4 py-3 bg-slate-50 focus:bg-white transition-colors"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isAuthSubmitting}
                          className="w-full py-3.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-50 mt-2"
                        >
                          {isAuthSubmitting ? "Building Workspace Profile..." : "Build Workspace Profile"}
                        </button>
                      </form>
                    </div>
                  )}
                </>
              ) : (
                /* B. SIGN-IN MULTI-ROLE PORTALS */
                <>
                  {/* Step 1: Role Selector Menu */}
                  {false && (
                    <div className="space-y-3.5">
                      <p className="text-[11px] text-slate-500 mb-2 font-medium text-center">
                        Choose your operational login screen:
                      </p>

                      {/* Owner Admin selector card */}
                      <button
                        onClick={() => setLoginRole("business_owner")}
                        className="w-full text-left p-4 rounded-2xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50/50 transition-all flex items-start gap-3.5 group cursor-pointer shadow-sm"
                      >
                        <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform font-bold">
                          💼
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-purple-700 flex items-center gap-1.5 leading-tight">
                            Owner Admin Portal <ArrowRight className="w-3.5 h-3.5" />
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                            Control AI models, train knowledge files, customize widget CSS, review analytics, and onboard team staff.
                          </p>
                        </div>
                      </button>

                      {/* Staff Support Admin selector card */}
                      <button
                        onClick={() => setLoginRole("staff")}
                        className="w-full text-left p-4 rounded-2xl border border-slate-200 hover:border-rose-500 hover:bg-rose-50/50 transition-all flex items-start gap-3.5 group cursor-pointer shadow-sm"
                      >
                        <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform font-bold">
                          🧑‍💻
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-rose-700 flex items-center gap-1.5 leading-tight">
                            Staff Support Desk <ArrowRight className="w-3.5 h-3.5" />
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                            Respond to live customer sessions, update helpdesk supporting tickets, and review unanswered RAG loops.
                          </p>
                        </div>
                      </button>

                      {/* Super Admin selector card */}
                      <button
                        onClick={() => setLoginRole("super_admin")}
                        className="w-full text-left p-4 rounded-2xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 transition-all flex items-start gap-3.5 group cursor-pointer shadow-sm"
                      >
                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform font-bold">
                          🛡️
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-amber-700 flex items-center gap-1.5 leading-tight">
                            Super Platform Desk <ArrowRight className="w-3.5 h-3.5" />
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                            Monitor globally registered clients, update plan pricing, and debug low-level platform error reports.
                          </p>
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Step 2: Individual Login Page for specific role */}
                  {loginRole !== null && (
                    <div className="space-y-4">
                      {/* Back button to return to Roles */}
                      <button 
                        onClick={() => setLoginRole(null)}
                        className="hidden"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> ← Back to Login Roles
                      </button>

                      {/* Banner helper indicator */}
                      <div className={`p-3 rounded-xl text-left border text-[10px] leading-relaxed font-semibold flex items-center gap-2 ${
                        loginRole === "super_admin" ? "bg-amber-50 border-amber-200 text-amber-800" :
                        loginRole === "staff" ? "bg-rose-50 border-rose-200 text-rose-850" :
                        "bg-purple-50 border-purple-200 text-purple-850"
                      }`}>
                        <span>🔑</span>
                        <div>
                          <strong>{
                            loginRole === "super_admin" ? "Platform Administrator Mode" :
                            loginRole === "staff" ? "Support Agent Specialist Mode" :
                            "Business Owner Administrator Mode"
                          }</strong>
                          <span className="block font-medium text-[9.5px] text-slate-550">
                            {
                              loginRole === "super_admin" ? "Access metrics with master developer email." :
                              loginRole === "staff" ? "Login using the credentials assigned in your workspace's staff settings." :
                              "Access your client's chatbots, documents, and leads."
                            }
                          </span>
                        </div>
                      </div>

                      <form onSubmit={handleAuthSubmit} className="space-y-3.5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Secure Email</label>
                          <div className="relative text-slate-800">
                            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                            <input
                              type="email"
                              required
                              placeholder={
                                loginRole === "super_admin" ? "admin@sitebot.ai" :
                                loginRole === "staff" ? "staff@restaurant.com" :
                                "owner@restaurant.com"
                              }
                              value={authEmail}
                              onChange={(e) => setAuthEmail(e.target.value)}
                              className="w-full text-xs border border-slate-300 rounded-xl pl-9 pr-4 py-3 bg-slate-50 focus:bg-white transition-colors"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Security Password</label>
                          <div className="relative text-slate-800">
                            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                            <input
                              type="password"
                              required
                              placeholder="••••••••"
                              value={authPassword}
                              onChange={(e) => setAuthPassword(e.target.value)}
                              className="w-full text-xs border border-slate-300 rounded-xl pl-9 pr-4 py-3 bg-slate-50 focus:bg-white transition-colors"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isAuthSubmitting}
                          className={`w-full py-3.5 text-xs font-bold text-white rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-50 mt-2 ${
                            loginRole === "super_admin" ? "bg-amber-600 hover:bg-amber-700" :
                            loginRole === "staff" ? "bg-rose-600 hover:bg-rose-700" :
                            "bg-purple-600 hover:bg-purple-700"
                          }`}
                        >
                          {isAuthSubmitting ? "Authenticating Session..." : `Sign In to Portal`}
                        </button>
                      </form>
                    </div>
                  )}
                </>
              )}

              {/* Toggle Section footer */}
              <div className="text-center py-4 border-t border-slate-100 text-slate-500 text-[11px] mt-6">
                {isSignUp ? (
                  <>
                    Already registered?{" "}
                    <button
                      type="button"
                      onClick={openSignInPortal}
                      className="font-extrabold text-purple-600 hover:underline cursor-pointer inline-block ml-1"
                    >
                      Log In instead
                    </button>
                  </>
                ) : (
                  <>
                    Are you a Business Owner?{" "}
                    <button
                      type="button"
                      onClick={openOwnerSignupPlans}
                      className="font-extrabold text-[#9333ea] hover:underline cursor-pointer inline-block ml-1"
                    >
                      Get Started Free
                    </button>
                  </>
                )}
              </div>

              {!isSignUp && (
              <div className="border-t border-slate-100 pt-4 mt-2">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest text-center block mb-2.5">
                  Choose login portal
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      setLoginRole("business_owner");
                      setAuthError("");
                    }}
                    className={`p-2 border text-[10px] font-bold rounded-xl text-center transition-all cursor-pointer ${loginRole === "business_owner" ? "border-purple-300 bg-purple-50 text-purple-700" : "border-slate-200 hover:border-purple-300 hover:bg-purple-50 text-slate-700"}`}
                  >
                    <div className="text-sm">🍕</div>
                    <div className="leading-tight font-black">Owner Admin</div>
                  </button>

                  <button
                    onClick={() => {
                      setLoginRole("staff");
                      setAuthError("");
                    }}
                    className={`p-2 border text-[10px] font-bold rounded-xl text-center transition-all cursor-pointer ${loginRole === "staff" ? "border-rose-300 bg-rose-50 text-rose-700" : "border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-700"}`}
                  >
                    <div className="text-sm">🧑‍💻</div>
                    <div className="leading-tight font-black">Staff Admin</div>
                  </button>

                  <button
                    onClick={() => {
                      setLoginRole("super_admin");
                      setAuthError("");
                    }}
                    className={`p-2 border text-[10px] font-bold rounded-xl text-center transition-all cursor-pointer ${loginRole === "super_admin" ? "border-amber-300 bg-amber-50 text-amber-700" : "border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-700"}`}
                  >
                    <div className="text-sm">🛡️</div>
                    <div className="leading-tight font-black">Super Admin</div>
                  </button>
                </div>
              </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

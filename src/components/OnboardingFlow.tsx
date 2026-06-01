import { useState } from "react";
import { ArrowLeft, ArrowRight, Bot, Check, Sparkles, Wand2 } from "lucide-react";
import { Business } from "../types";
import { updateFirebaseBusiness } from "../services/firebaseAuth";

interface OnboardingFlowProps {
  business: Business;
  onOnboardingComplete: (updatedBusiness: Business) => void;
  onCancel: () => void;
}

export default function OnboardingFlow({ business, onOnboardingComplete, onCancel }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState(business.name || "");
  const [category, setCategory] = useState("Other");
  const [websiteUrl, setWebsiteUrl] = useState(business.websiteUrl || "https://");
  const [logo, setLogo] = useState("🤖");
  const [primaryColor, setPrimaryColor] = useState("#2563eb");
  const [welcomeMessage, setWelcomeMessage] = useState(
    "Hi there! Welcome to our website. 🤖 How can I help you today?"
  );
  const [tone, setTone] = useState("friendly");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const categories = [
    { value: "Restaurant", label: "🍕 Restaurant & Catering" },
    { value: "Clothing", label: "👕 Clothing Brand" },
    { value: "Shoes", label: "👟 Shoe Store" },
    { value: "Medical", label: "👁️ Medical / Clinic" },
    { value: "Real Estate", label: "🏠 Real Estate Agency" },
    { value: "Salon", label: "💇 Salon & Spa" },
    { value: "School", label: "🏫 School & Education" },
    { value: "Agency", label: "💼 Agency" },
    { value: "Other", label: "📦 Other Services" }
  ];

  const logoPresets = ["🤖", "🍕", "👕", "🏠", "💇", "👁️", "💼", "⭐", "🛍️", "🩺", "🏫"];

  const themeColors = [
    { name: "Blue / Trust", value: "#2563eb" },
    { name: "Purple / Trendy", value: "#7c3aed" },
    { name: "Red / Passion", value: "#e11d48" },
    { name: "Green / Clean", value: "#10b981" },
    { name: "Sky / Health", value: "#0284c7" },
    { name: "Orange / Service", value: "#f97316" },
    { name: "Black / Modern", value: "#0f172a" }
  ];

  const handleNext = () => {
    // Validate fields before proceeding
    if (step === 1 && !name.trim()) {
      setSubmitError("Please fill in your business name to proceed.");
      return;
    }
    setSubmitError("");
    setStep(step + 1);
  };

  const handlePrev = () => {
    setStep(step - 1);
  };

  const handleSuggestWelcome = () => {
    if (category === "Restaurant") {
      setWelcomeMessage("Ciao! Welcome to our restaurant. 🍕 Ask about our wood-fired special dishes, hours, or request to book a table!");
    } else if (category === "Clothing" || category === "Shoes") {
      setWelcomeMessage("Hey details-seeker! 🛍️ Welcome to our store. Need sizing advisor help, shipping policy info, or summer drops catalog?");
    } else if (category === "Medical") {
      setWelcomeMessage("Hello! Welcome to our clinic workspace. 🩺 Need eye check booking steps, operating timings, or parking validation guidelines?");
    } else if (category === "Real Estate") {
      setWelcomeMessage("Good day! 🏠 Ready to find your dream property? Ask me about listings, pricing, locations, or request agent contact info!");
    } else if (category === "Salon") {
      setWelcomeMessage("Welcome! 💇 Looking to refresh your hairstyle or book with your favorite designer? Let me guide you through prices and timings.");
    } else {
      setWelcomeMessage(`Hello! Welcome to our ${category || "business"} workspace. ⚙️ Let me know how I can answer your questions today!`);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const updatedBusiness: Business = {
        ...business,
        name,
        category,
        websiteUrl,
        logo,
        chatbotSettings: {
          ...business.chatbotSettings,
          welcomeMessage,
          primaryColor,
          logo,
          tone
        }
      };

      try {
        await updateFirebaseBusiness(updatedBusiness);
      } catch (firebaseErr) {
        console.warn("Firebase onboarding sync skipped; continuing with local workspace state.", firebaseErr);
      }

      const response = await fetch("/api/auth/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          name,
          category,
          websiteUrl,
          logo,
          primaryColor,
          welcomeMessage,
          tone
        })
      });

      const data = await response.json();
      if (!response.ok) {
        console.warn("Local demo onboarding route skipped:", data.error || "Failed to finalize onboarding setup.");
        onOnboardingComplete(updatedBusiness);
        return;
      }

      onOnboardingComplete(data.business);
    } catch (err: any) {
      setSubmitError(err.message || "An unexpected error occurred during setup.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="onboarding-wizard" className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-6">
      <div className="max-w-xl mx-auto w-full bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col">
        {/* Header Indicator Progress */}
        <div className="bg-slate-900 px-6 py-8 text-white relative">
          <div className="absolute top-4 right-4 bg-white/15 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
            Step {step} of 3
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-semibold tracking-widest text-slate-300 uppercase">SiteBot SaaS Setup</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight mt-2 text-white">Let&apos;s build your AI assistant</h2>
          <p className="text-xs text-slate-400 mt-1">Configure your workspace defaults to pre-generate targeted FAQs and docs.</p>
          
          {/* Visual Step Dots */}
          <div className="flex gap-2 mt-6">
            <div className={`h-2 flex-1 rounded-full transition-colors ${step >= 1 ? "bg-blue-500" : "bg-slate-700"}`}></div>
            <div className={`h-2 flex-1 rounded-full transition-colors ${step >= 2 ? "bg-blue-500" : "bg-slate-700"}`}></div>
            <div className={`h-2 flex-1 rounded-full transition-colors ${step >= 3 ? "bg-blue-500" : "bg-slate-700"}`}></div>
          </div>
        </div>

        {/* Form Body Areas */}
        <div className="p-6 flex-1 space-y-6">
          {submitError && (
            <div className="bg-rose-50 border-l-4 border-rose-600 p-4 rounded text-xs text-rose-700 font-medium">
              {submitError}
            </div>
          )}

          {/* Step 1: Business Basics */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900">1. Basic Workspace Profile</h3>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Business Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Blue Ginger Grill, Retro Apparel"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Industry / Category</label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => {
                        setCategory(cat.value);
                        // Trigger immediate welcome default update
                        const messageTemplates: any = {
                          Restaurant: "Ciao! Welcome to our restaurant. 🍕 Ask about our wood-fired special dishes, hours, or table bookings!",
                          Clothing: "Hey details-seeker! 🛍️ Welcome to our store. Need details on sizing guidelines, standard shipping, or return policies?",
                          Medical: "Hello! Welcome to CleanVision. 🩺 Need details on optical exam pricing, hours, or diagnostic options?",
                          "Real Estate": "Good day! 🏠 Ready to explore listings? Ask me about properties, pricing, booking visits, or agent contacts!",
                          Salon: "Welcome! 💇 Ask me about our hair style designer prices, booking schedules, or spa service descriptions."
                        };
                        setWelcomeMessage(
                          messageTemplates[cat.value] || `Hello, welcome to our website! Ask me about our ${cat.value} services.`
                        );
                      }}
                      className={`text-left text-xs px-3.5 py-3 rounded-xl border font-bold transition-all ${
                        category === cat.value
                          ? "bg-slate-900 text-white border-transparent shadow shadow-slate-900/10"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block font-sans">Website URL</label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50"
                />
              </div>
            </div>
          )}

          {/* Step 2: Styling & Brand Colors */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900">2. Chatbot Identity & Style</h3>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Chatbot Logo / Avatar Shortcut</label>
                <div className="flex flex-wrap gap-2">
                  {logoPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setLogo(preset)}
                      className={`w-11 h-11 text-xl rounded-xl border flex items-center justify-center transition-all ${
                        logo === preset ? "bg-slate-900 border-transparent text-white" : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Primary Accent Theme Color</label>
                <div className="grid grid-cols-2 gap-2">
                  {themeColors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setPrimaryColor(color.value)}
                      className={`text-xs px-3 py-2.5 rounded-xl border flex items-center gap-2 font-bold font-sans transition-all ${
                        primaryColor === color.value ? "bg-slate-100 border-transparent" : "bg-white border-slate-200"
                      }`}
                    >
                      <span className="w-4.5 h-4.5 rounded-full block border shadow-sm border-white" style={{ backgroundColor: color.value }}></span>
                      {color.name}
                      {primaryColor === color.value && <Check className="w-3.5 h-3.5 ml-auto text-blue-600" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">AI Bot tone of voice</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {["friendly", "professional", "playful", "empathetic"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTone(t)}
                      className={`text-xs uppercase tracking-wider px-3 py-3 rounded-xl border font-bold transition-all text-center ${
                        tone === t ? "bg-slate-900 text-white" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Greeting and Autogenerating FAQs info */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900">3. Welcoming & Initial Training</h3>
              
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Default Greeting Message</label>
                  <button
                    type="button"
                    onClick={handleSuggestWelcome}
                    className="text-[10px] text-blue-600 font-bold uppercase tracking-wider hover:underline flex items-center gap-1"
                  >
                    <Wand2 className="w-3 h-3" /> Auto-Write for Brand
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder="Create a friendly message to greet guests."
                  className="w-full text-sm border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50"
                ></textarea>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl flex gap-3.5 items-start">
                <div className="w-9 h-9 bg-blue-100/80 text-blue-700 rounded-xl flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-800">Auto-training system activated</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Based on your category choice (<strong>{category}</strong>), our system will automatically build template document guidelines and relevant manual FAQ checklists to bootstrap your dashboard instantly!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="bg-slate-50 border-t border-slate-100 p-6 flex justify-between items-center">
          {step > 1 ? (
            <button
              onClick={handlePrev}
              disabled={isSubmitting}
              className="text-sm font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <button onClick={onCancel} className="text-sm font-bold text-slate-500 hover:text-slate-700">
              Cancel
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={handleNext}
              className="text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 px-6 py-2.5 rounded-xl shadow-md shadow-slate-900/10 flex items-center gap-1.5"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-7 py-3 rounded-xl shadow-md shadow-blue-200 flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? "Generating Knowledge Base..." : "Activate Chatbot ✨"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { Business, User } from "../types";
import { deleteApp, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { firebaseAuth, firebaseConfig, firebaseDb } from "../firebase";

type AuthResult = {
  user: User;
  business?: Business | null;
};

const FIREBASE_TIMEOUT_MS = 12000;

function withTimeout<T>(promise: Promise<T>, label: string, ms = FIREBASE_TIMEOUT_MS): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`${label} timed out. Check that Firestore is enabled, rules are deployed, and your network is not blocking Firebase.`));
    }, ms);

    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
}

const defaultChatbotSettings = (businessName: string) => ({
  botName: `${businessName} AI`,
  welcomeMessage: `Hello, welcome to our website! How can I assist you with ${businessName} products or services today?`,
  fallbackMessage: "I apologize, but I couldn't find information on that topic in our documents. Would you like me to connect you to a staff member or open a support ticket?",
  primaryColor: "#2563eb",
  logo: "BOT",
  tone: "friendly",
  businessHours: {
    enabled: false,
    start: "09:00",
    end: "17:00",
    timezone: "EST",
    awayMessage: "Our team is currently offline. Please leave your details and we will follow up soon."
  },
  leadCaptureFields: {
    name: true,
    email: true,
    phone: false,
    message: false,
    requiredBeforeChat: false
  }
});

const mapPlanId = (planId: string) => (planId === "enterprise" ? "business" : planId);

const superAdminEmails = String(import.meta.env.VITE_SUPER_ADMIN_EMAILS || "admin@sitebot.ai")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const superAdminUids = String(import.meta.env.VITE_SUPER_ADMIN_UIDS || "")
  .split(",")
  .map((uid) => uid.trim())
  .filter(Boolean);

const fallbackBusinessName = (email: string) => {
  const prefix = email.split("@")[0] || "Business";
  return `${prefix.replace(/[._-]+/g, " ")} Workspace`;
};

function buildOwnerRecords(params: {
  uid: string;
  email: string;
  name: string;
  businessName: string;
  planId: string;
}) {
  const businessId = `business_${params.uid.slice(0, 12)}`;
  const createdAt = new Date().toISOString();
  const business: Business = {
    id: businessId,
    name: params.businessName,
    category: "Other",
    websiteUrl: "",
    logo: "BOT",
    status: "active",
    planId: mapPlanId(params.planId),
    createdAt,
    chatbotSettings: defaultChatbotSettings(params.businessName)
  };

  const user: User & { isOnboarded?: boolean } = {
    id: params.uid,
    email: params.email,
    name: params.name,
    role: "business_owner",
    businessId,
    createdAt,
    isOnboarded: false
  };

  return { user, business };
}

async function saveOwnerRecords(user: User & { isOnboarded?: boolean }, business: Business, ownerId: string) {
  await withTimeout(
    setDoc(doc(firebaseDb, "users", user.id), {
      ...user,
      createdServerAt: serverTimestamp()
    }),
    "Saving user profile"
  );

  await withTimeout(
    setDoc(doc(firebaseDb, "businesses", business.id), {
      ...business,
      ownerId,
      createdServerAt: serverTimestamp()
    }),
    "Saving business workspace"
  );
}

function saveOwnerRecordsInBackground(user: User & { isOnboarded?: boolean }, business: Business, ownerId: string) {
  saveOwnerRecords(user, business, ownerId).catch((err) => {
    console.warn("Firebase owner profile sync failed. The app will keep using the local session and retry on next login.", err);
  });
}

async function loadBusiness(businessId?: string): Promise<Business | null> {
  if (!businessId) return null;
  const businessSnap = await withTimeout(getDoc(doc(firebaseDb, "businesses", businessId)), "Loading business workspace");
  return businessSnap.exists() ? (businessSnap.data() as Business) : null;
}

async function createSuperAdminProfile(uid: string, email: string): Promise<User> {
  if (!superAdminEmails.includes(email.toLowerCase()) && !superAdminUids.includes(uid)) {
    throw new Error("This email is not allowed to bootstrap a Super Admin profile.");
  }

  const user: User = {
    id: uid,
    email,
    name: "Platform Admin",
    role: "super_admin",
    createdAt: new Date().toISOString()
  };

  await withTimeout(
    setDoc(doc(firebaseDb, "users", uid), {
      ...user,
      createdServerAt: serverTimestamp()
    }),
    "Creating Super Admin profile"
  );

  return user;
}

export async function firebaseLogin(
  email: string,
  password: string,
  requestedRole?: "super_admin" | "business_owner" | "staff" | null
): Promise<AuthResult> {
  let credential;
  try {
    credential = await withTimeout(signInWithEmailAndPassword(firebaseAuth, email, password), "Firebase sign-in");
  } catch (err: any) {
    if (requestedRole !== "super_admin" || !superAdminEmails.includes(email.toLowerCase())) {
      throw err;
    }

    credential = await withTimeout(
      createUserWithEmailAndPassword(firebaseAuth, email, password),
      "Creating Super Admin Firebase account"
    );
  }

  const userSnap = await withTimeout(getDoc(doc(firebaseDb, "users", credential.user.uid)), "Loading user profile");

  if (!userSnap.exists()) {
    if (requestedRole === "super_admin") {
      const user = await createSuperAdminProfile(credential.user.uid, email);
      return { user, business: null };
    }

    const businessName = fallbackBusinessName(email);
    const { user, business } = buildOwnerRecords({
      uid: credential.user.uid,
      email,
      name: credential.user.displayName || businessName,
      businessName,
      planId: "free"
    });

    saveOwnerRecordsInBackground(user, business, credential.user.uid);
    return { user, business };
  }

  const user = userSnap.data() as User;

  if (requestedRole === "super_admin" && user.role !== "super_admin") {
    if (superAdminEmails.includes(email.toLowerCase()) || superAdminUids.includes(credential.user.uid)) {
      user.role = "super_admin";
      delete user.businessId;
      await withTimeout(
        setDoc(doc(firebaseDb, "users", credential.user.uid), {
          ...user,
          role: "super_admin",
          businessId: null,
          updatedServerAt: serverTimestamp()
        }, { merge: true }),
        "Upgrading existing profile to Super Admin"
      );
      return { user, business: null };
    }
  }

  const business = await loadBusiness(user.businessId).catch(() => {
    const businessName = fallbackBusinessName(user.email);
    const recovered = buildOwnerRecords({
      uid: user.id,
      email: user.email,
      name: user.name || businessName,
      businessName,
      planId: "free"
    });
    saveOwnerRecordsInBackground(recovered.user, recovered.business, user.id);
    return recovered.business;
  });
  return { user, business };
}

export async function firebaseSignupOwner(params: {
  name: string;
  email: string;
  password: string;
  businessName: string;
  planId: string;
}): Promise<AuthResult> {
  const credential = await withTimeout(
    createUserWithEmailAndPassword(firebaseAuth, params.email, params.password),
    "Firebase account creation"
  );
  await withTimeout(updateProfile(credential.user, { displayName: params.name }), "Saving display name").catch((err) => {
    console.warn("Firebase display name update failed; continuing signup.", err);
  });

  const { user, business } = buildOwnerRecords({
    uid: credential.user.uid,
    email: params.email,
    name: params.name,
    businessName: params.businessName,
    planId: params.planId
  });

  saveOwnerRecordsInBackground(user, business, credential.user.uid);

  return { user, business };
}

export async function firebaseLogout() {
  await withTimeout(signOut(firebaseAuth), "Firebase sign-out");
}

export async function updateFirebaseBusiness(business: Business): Promise<void> {
  await withTimeout(
    updateDoc(doc(firebaseDb, "businesses", business.id), {
      ...business,
      updatedServerAt: serverTimestamp()
    }),
    "Updating business workspace"
  );
}

export async function createFirebaseStaffAccount(params: {
  name: string;
  email: string;
  password: string;
  businessId: string;
}): Promise<User> {
  const secondaryApp = initializeApp(firebaseConfig, `staff-create-${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);
  const secondaryDb = getFirestore(secondaryApp);

  try {
    const credential = await withTimeout(
      createUserWithEmailAndPassword(secondaryAuth, params.email, params.password),
      "Creating staff Firebase account"
    );
    await withTimeout(updateProfile(credential.user, { displayName: params.name }), "Saving staff display name").catch((err) => {
      console.warn("Staff display name update failed; continuing.", err);
    });

    const user: User = {
      id: credential.user.uid,
      email: params.email,
      name: params.name,
      role: "staff",
      businessId: params.businessId,
      createdAt: new Date().toISOString()
    };

    await withTimeout(
      setDoc(doc(secondaryDb, "users", credential.user.uid), {
        ...user,
        createdServerAt: serverTimestamp()
      }),
      "Saving staff profile"
    );

    await signOut(secondaryAuth).catch(() => undefined);
    return user;
  } finally {
    await deleteApp(secondaryApp).catch(() => undefined);
  }
}

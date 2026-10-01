import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  Auth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  User,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
};

export const getFirebaseApp = (): FirebaseApp | null => {
  if (typeof window === "undefined") return null;
  if (!isFirebaseConfigured()) return null;

  try {
    return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  } catch (err) {
    console.error("Firebase initialization failed:", err);
    return null;
  }
};

export const getFirebaseAuth = (): Auth | null => {
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    return getAuth(app);
  } catch (err) {
    console.error("Firebase auth initialization failed:", err);
    return null;
  }
};

/**
 * Initializes invisible reCAPTCHA on the given HTML element container ID.
 */
export const initRecaptchaVerifier = (
  containerId: string
): RecaptchaVerifier | null => {
  if (typeof window === "undefined") return null;
  const auth = getFirebaseAuth();
  if (!auth) return null;

  try {
    // Clear existing verifier if any
    const existing = (window as unknown as { recaptchaVerifier?: RecaptchaVerifier }).recaptchaVerifier;
    if (existing) {
      try {
        existing.clear();
      } catch {}
    }

    const verifier = new RecaptchaVerifier(auth, containerId, {
      size: "invisible",
      callback: () => {
        // reCAPTCHA solved - will allow signInWithPhoneNumber
      },
      "expired-callback": () => {
        console.warn("reCAPTCHA expired, please try again.");
      },
    });

    (window as unknown as { recaptchaVerifier?: RecaptchaVerifier }).recaptchaVerifier = verifier;
    return verifier;
  } catch (err) {
    console.error("Failed to initialize reCAPTCHA verifier:", err);
    return null;
  }
};

/**
 * Sends real SMS OTP via Firebase Phone Authentication.
 * Formats 10-digit Indian numbers to E.164 (+91...).
 */
export const sendPhoneOtp = async (
  phoneNumber: string,
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult> => {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase Auth is not configured");

  // Format to E.164 standard
  let formattedNumber = phoneNumber.trim().replace(/\s+/g, "");
  if (!formattedNumber.startsWith("+")) {
    if (formattedNumber.length === 10) {
      formattedNumber = `+91${formattedNumber}`;
    } else {
      formattedNumber = `+${formattedNumber}`;
    }
  }

  return await signInWithPhoneNumber(auth, formattedNumber, verifier);
};

/**
 * Confirms OTP code against the confirmation result from Firebase.
 */
export const confirmPhoneOtp = async (
  confirmationResult: ConfirmationResult,
  otpCode: string
): Promise<User> => {
  const userCredential = await confirmationResult.confirm(otpCode);
  return userCredential.user;
};

/**
 * Formats Firebase error codes into helpful, actionable messages for users and developers.
 */
export const formatFirebaseError = (err: unknown): string => {
  const firebaseErr = err as { code?: string; message?: string };
  const code = firebaseErr?.code || "";
  const rawMsg = firebaseErr?.message || (err instanceof Error ? err.message : String(err));
  const currentHost = typeof window !== "undefined" ? window.location.hostname : "your domain";

  if (code === "auth/operation-not-allowed") {
    return "Phone Auth is disabled. Go to Firebase Console > Authentication > Sign-in method and enable 'Phone'.";
  }
  if (code === "auth/unauthorized-domain") {
    return `Domain "${currentHost}" is not authorized. Add "${currentHost}" in Firebase Console > Authentication > Settings > Authorized domains.`;
  }
  if (code === "auth/invalid-phone-number") {
    return "Invalid phone number format. Please enter a valid 10-digit mobile number.";
  }
  if (code === "auth/quota-exceeded") {
    return "Daily Firebase SMS quota reached. In Firebase Console > Authentication > Sign-in method > Phone, add your number to 'Phone numbers for testing' for unlimited free testing.";
  }
  if (code === "auth/too-many-requests") {
    return "Too many attempts from this number. Please wait a few minutes before trying again.";
  }
  if (code === "auth/captcha-check-failed") {
    return "reCAPTCHA check failed. Please refresh the page and try again.";
  }
  if (code === "auth/invalid-app-credential") {
    return "App verification failed. In Firebase Console, ensure Phone Auth is enabled and domain is authorized.";
  }
  if (code) {
    return `Firebase (${code}): ${rawMsg.replace(/Firebase:\s*/, "")}`;
  }
  return rawMsg;
};

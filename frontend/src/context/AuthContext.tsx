"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import AuthModal from "@/components/AuthModal";
import DeviceLimitExceededModal from "@/components/DeviceLimitExceededModal";
import { registerOrVerifyCurrentDevice, DeviceRegistrationResult, getClientDeviceMetadata } from "@/lib/deviceFingerprint";

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string;
  dob?: string;
  gender?: string;
  qualification?: string;
  preparation_level?: string;
  college?: string;
  college_name?: string;
  target_branch?: string;
  target_exam?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
  role?: "student" | "teacher" | "admin" | string;
  is_onboarded?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authModalOpen: boolean;
  authTab: "login" | "signup";
  authDestination: "dashboard" | "test-series";
  openAuthModal: (tab?: "login" | "signup", destination?: "dashboard" | "test-series") => void;
  closeAuthModal: () => void;
  setAuthTab: (tab: "login" | "signup") => void;
  setAuthDestination: (dest: "dashboard" | "test-series") => void;
  loginUser: (userData: User) => void;
  updateUser: (userData: Partial<User>) => void;
  logoutUser: () => void;
  deviceBlockedModalOpen: boolean;
  triggerDeviceLimitExceeded: (details?: any) => void;
  closeDeviceBlockedModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "sims_gate_auth_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "signup">("login");
  const [authDestination, setAuthDestination] = useState<"dashboard" | "test-series">("dashboard");
  const [isLoading, setIsLoading] = useState(false);

  // Anti-account sharing device limit state
  const [deviceBlockedModalOpen, setDeviceBlockedModalOpen] = useState(false);
  const [blockedDeviceData, setBlockedDeviceData] = useState<any>(null);

  const triggerDeviceLimitExceeded = useCallback((details?: any) => {
    setBlockedDeviceData(details || null);
    setDeviceBlockedModalOpen(true);
  }, []);

  const closeDeviceBlockedModal = useCallback(() => {
    setDeviceBlockedModalOpen(false);
  }, []);

  // Restore and verify stored user on client mount against Django
  useEffect(() => {
    let isMounted = true;
    async function restoreSession() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.id) {
            if (isMounted) setUser(parsed);

            // Register / verify device with backend
            registerOrVerifyCurrentDevice(parsed.id).then((devRes) => {
              if (isMounted && !devRes.success && devRes.status === "LIMIT_EXCEEDED") {
                triggerDeviceLimitExceeded(devRes);
              }
            });

            try {
              const res = await fetch(`http://127.0.0.1:8000/api/auth/me/?user_id=${parsed.id}`, {
                credentials: "include",
              });
              if (res.ok) {
                const data = await res.json();
                if (data.authenticated && data.user) {
                  if (isMounted) setUser(data.user);
                  return;
                }
              }
            } catch (err) {
              console.warn("Backend auth verification check failed, retaining local session:", err);
              return;
            }
            try {
              localStorage.removeItem(STORAGE_KEY);
            } catch {}
            if (isMounted) setUser(null);
          }
        }
      } catch (e) {
        console.warn("Failed to restore auth session:", e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    restoreSession();
    return () => {
      isMounted = false;
    };
  }, [triggerDeviceLimitExceeded]);

  const openAuthModal = useCallback((tab: "login" | "signup" = "login", destination?: "dashboard" | "test-series") => {
    setAuthTab(tab);
    if (destination) {
      setAuthDestination(destination);
    }
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.has("auth")) {
          url.searchParams.delete("auth");
          const cleanUrl = url.pathname + (url.search ? url.search : "") + (url.hash ? url.hash : "");
          window.history.replaceState({}, "", cleanUrl);
        }
      } catch (e) {
        console.warn("Failed to clean auth param from URL:", e);
      }
    }
  }, []);

  const loginUser = useCallback((userData: User) => {
    setUser(userData);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    } catch (e) {
      console.warn("Failed to store user:", e);
    }
    closeAuthModal();

    // Verify / register device upon login
    registerOrVerifyCurrentDevice(userData.id).then((devRes) => {
      if (!devRes.success && devRes.status === "LIMIT_EXCEEDED") {
        triggerDeviceLimitExceeded(devRes);
      }
    });
  }, [closeAuthModal, triggerDeviceLimitExceeded]);

  const updateUser = useCallback((userData: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...userData };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn("Failed to update user in storage:", e);
      }
      return updated;
    });
  }, []);

  const logoutUser = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn("Failed to remove user:", e);
    }
    closeAuthModal();
  }, [closeAuthModal]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !isLoading && !!user,
        isLoading,
        authModalOpen,
        authTab,
        authDestination,
        openAuthModal,
        closeAuthModal,
        setAuthTab,
        setAuthDestination,
        loginUser,
        updateUser,
        logoutUser,
        deviceBlockedModalOpen,
        triggerDeviceLimitExceeded,
        closeDeviceBlockedModal,
      }}
    >
      {children}
      <AuthModal />
      <DeviceLimitExceededModal
        isOpen={deviceBlockedModalOpen}
        onClose={closeDeviceBlockedModal}
        attemptedDevice={blockedDeviceData?.attempted_device || getClientDeviceMetadata()}
        registeredDevices={blockedDeviceData?.registered_devices || []}
        studentUserId={user?.id}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { AuthUI } from "@/components/ui/auth-ui";

export default function AuthModal() {
  const { authModalOpen, closeAuthModal, authTab, authDestination, setAuthDestination } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAuthModal();
    };
    if (authModalOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [authModalOpen, closeAuthModal]);

  return (
    <AnimatePresence>
      {authModalOpen && (
        <motion.div
          key="auth-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeInOut" }}
          className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-6 bg-[#071322]/75 backdrop-blur-xl"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAuthModal();
          }}
          aria-modal="true"
          role="dialog"
        >
          <motion.div
            key="auth-modal-card"
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 14 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            className="w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-3xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <AuthUI
              isModal={true}
              initialTab={authTab}
              initialDestination={authDestination}
              onDestinationChange={setAuthDestination}
              onClose={closeAuthModal}
              signInContent={{
                image: {
                  src: "/sims-logo.png",
                  alt: "SIMS GATE Golden Tree Logo",
                },
                quote: {
                  text: "Excellence is not an accident; it is the result of disciplined execution.",
                  author: "SIMS Academic Directorate",
                },
              }}
              signUpContent={{
                image: {
                  src: "/sims-logo.png",
                  alt: "SIMS GATE Golden Tree Logo",
                },
                quote: {
                  text: "Shaping Minds, Building Futures — Join India's Top 1% in GATE Ranks.",
                  author: "SIMS GATE Faculty Council",
                },
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

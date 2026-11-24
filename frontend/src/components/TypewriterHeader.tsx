"use client";

import { useState, useEffect } from "react";

interface TypewriterHeaderProps {
  words: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export default function TypewriterHeader({
  words,
  typingSpeed = 90,
  deletingSpeed = 45,
  pauseDuration = 2400,
  prefix = "",
  suffix = "",
  className = "",
}: TypewriterHeaderProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState(words && words.length > 0 ? words[0] : "");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!words || words.length === 0) return;

    const currentWord = words[currentWordIndex];
    let timeout: NodeJS.Timeout;

    if (!isDeleting) {
      // Typing phase
      if (currentText.length < currentWord.length) {
        timeout = setTimeout(() => {
          setCurrentText(currentWord.slice(0, currentText.length + 1));
        }, typingSpeed);
      } else {
        // Finished typing word, pause before deleting
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, pauseDuration);
      }
    } else {
      // Deleting phase
      if (currentText.length > 0) {
        timeout = setTimeout(() => {
          setCurrentText(currentWord.slice(0, currentText.length - 1));
        }, deletingSpeed);
      } else {
        // Finished deleting, brief pause then move to next word
        timeout = setTimeout(() => {
          setIsDeleting(false);
          setCurrentWordIndex((prev) => (prev + 1) % words.length);
        }, 200);
      }
    }

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentWordIndex, words, typingSpeed, deletingSpeed, pauseDuration]);

  const fullWord = words[currentWordIndex] || "";

  return (
    <span
      className={`typewriter-inline-wrap ${className}`}
      aria-label={`${prefix}${fullWord}${suffix}`}
    >
      {prefix && <span className="typewriter-prefix">{prefix}</span>}
      <span className="typewriter-text" aria-hidden="true">
        {currentText}
      </span>
      <span className="typewriter-cursor" aria-hidden="true">
        |
      </span>
      {suffix && <span className="typewriter-suffix">{suffix}</span>}
    </span>
  );
}

"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

const sampleTexts = [
  {
    original: "The utilization of artificial intelligence technology has revolutionized numerous industries.",
    humanized: "Artificial intelligence has completely transformed countless industries."
  },
  {
    original: "It is imperative that we optimize our operational efficiency.",
    humanized: "We need to make our operations more efficient."
  },
  {
    original: "The implementation of this solution will facilitate enhanced productivity.",
    humanized: "This solution will help us work more productively."
  }
];

export function LightningFastDemo() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayText, setDisplayText] = useState("");
  const [showHumanized, setShowHumanized] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    const startAnimation = () => {
      setIsAnimating(true);
      setShowHumanized(false);
      setDisplayText("");
      
      const idx = indexRef.current;
      // Type out original text
      const original = sampleTexts[idx].original;
      let charIndex = 0;
      const typeInterval = setInterval(() => {
        if (charIndex < original.length) {
          setDisplayText(original.slice(0, charIndex + 1));
          charIndex++;
        } else {
          clearInterval(typeInterval);
          
          // Wait a moment, then transform
          setTimeout(() => {
            setShowHumanized(true);
            // Animate transformation
            const humanized = sampleTexts[idx].humanized;
            let humanizedIndex = 0;
            const humanizeInterval = setInterval(() => {
              if (humanizedIndex < humanized.length) {
                setDisplayText(humanized.slice(0, humanizedIndex + 1));
                humanizedIndex++;
              } else {
                clearInterval(humanizeInterval);
                setIsAnimating(false);
              }
            }, 30);
          }, 500);
        }
      }, 30);
    };

    // Start first animation
    startAnimation();

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % sampleTexts.length;
        indexRef.current = next;
        return next;
      });
      startAnimation();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full min-h-[160px] flex flex-col items-center justify-center">
      {/* Lightning bolt indicator */}
      <motion.div
        animate={{
          scale: isAnimating ? [1, 1.2, 1] : 1,
          opacity: isAnimating ? [0.5, 1, 0.5] : 0.6,
        }}
        transition={{
          duration: 0.5,
          repeat: isAnimating ? Infinity : 0,
        }}
        className="absolute top-2 right-2"
      >
        <Zap className="w-4 h-4 text-yellow-400" fill="currentColor" />
      </motion.div>

      {/* Text container */}
      <div className="w-full space-y-2">

        {/* Humanized text (appearing) */}
        {displayText && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-white font-medium leading-relaxed"
          >
            {displayText}
            {!showHumanized && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="inline-block w-1 h-3 bg-white ml-1"
              />
            )}
          </motion.div>
        )}

        {/* Processing indicator */}
        {isAnimating && !showHumanized && displayText.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-[10px] text-yellow-400 mt-2"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full"
            />
            <span>Humanizing...</span>
          </motion.div>
        )}

        {/* Success indicator */}
        {showHumanized && displayText && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 text-[10px] text-green-400 mt-2"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-3 h-3 rounded-full bg-green-400/20 border border-green-400 flex items-center justify-center"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            </motion.div>
            <span>Humanized!</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}


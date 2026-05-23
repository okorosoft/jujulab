"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Ana Bibikova",
    role: "Content Creator",
    company: "TechFlow",
    image: "/landing/testimonial-ana-bibikova.png",
    quote: "The AI humanization feature has completely transformed my content workflow. I can now confidently publish AI-generated content knowing it will bypass all major detectors.",
    rating: 5
  },
  {
    name: "David Ho",
    role: "Marketing Director",
    company: "InnovateSphere",
    image: "/landing/testimonial-david-ho.png",
    quote: "Implementation was seamless and the results exceeded our expectations. The platform's ability to humanize content while preserving meaning is remarkable.",
    rating: 5
  },
  {
    name: "Max Panych",
    role: "Operations Director",
    company: "CloudScale",
    image: "/landing/testimonial-max-panych.png",
    quote: "This solution has significantly improved our team's productivity. The AI detection feature helps us ensure authenticity before publishing any content.",
    rating: 5
  },
  {
    name: "Olly",
    role: "Engineering Lead",
    company: "DataPro",
    image: "/landing/testimonial-olly.png",
    quote: "Outstanding support and robust features. It's rare to find a product that delivers on all its promises. The 99.9% success rate is real!",
    rating: 5
  },
  {
    name: "Thomas Lucy",
    role: "VP of Technology",
    company: "FutureNet",
    image: "/landing/testimonial-thomas-lucy.png",
    quote: "The scalability and performance have been game-changing for our organization. Highly recommend to any business looking to humanize AI content.",
    rating: 5
  },
  {
    name: "Yann Ilunga",
    role: "Content Strategist",
    company: "CreativeWorks",
    image: "/landing/testimonial-yann-ilunga.png",
    quote: "Best investment we've made for our content team. The translation feature combined with humanization creates natural, multilingual content effortlessly.",
    rating: 5
  }
];

export function InfiniteTestimonials() {
  // Duplicate testimonials multiple times for seamless infinite scroll
  const duplicatedTestimonials = [...testimonials, ...testimonials, ...testimonials];
  const cardWidth = 400;
  const gap = 24;
  const totalWidth = (cardWidth + gap) * testimonials.length;

  return (
    <div className="relative w-full overflow-hidden py-12">
      {/* Gradient overlays for fade effect */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black via-black/80 to-transparent z-10 pointer-events-none"></div>
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black via-black/80 to-transparent z-10 pointer-events-none"></div>
      
      <motion.div
        className="flex gap-6"
        animate={{
          x: [0, -totalWidth],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {duplicatedTestimonials.map((testimonial, idx) => (
          <div
            key={`${testimonial.name}-${idx}`}
            className="flex-shrink-0 w-[400px] bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-white/20">
                <Image
                  src={testimonial.image}
                  alt={testimonial.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h4 className="text-white font-semibold mb-1">{testimonial.name}</h4>
                <p className="text-gray-400 text-sm">{testimonial.role}</p>
                <p className="text-gray-500 text-xs">{testimonial.company}</p>
              </div>
            </div>
            
            <div className="flex gap-1 mb-4">
              {[...Array(testimonial.rating)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            
            <p className="text-gray-300 text-sm leading-relaxed italic">
              &ldquo;{testimonial.quote}&rdquo;
            </p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}


"use client";

import { motion } from "framer-motion";

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export const Skeleton = ({ className = "", width, height }: SkeletonProps) => {
  return (
    <div
      className={`bg-white/10 rounded animate-pulse ${className}`}
      style={{ width, height }}
    />
  );
};

export const SkeletonCard = () => {
  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <Skeleton className="w-20 h-5 rounded" />
      </div>
      <Skeleton className="w-24 h-8 rounded mb-2" />
      <Skeleton className="w-32 h-4 rounded" />
    </div>
  );
};

export const SkeletonTextArea = () => {
  return (
    <div className="space-y-4">
      <Skeleton className="w-full h-64 rounded-xl" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  );
};

export const SkeletonPage = ({ type, noWrapper }: { type: 'ai-humanize' | 'ai-detector' | 'documents' | 'profile'; noWrapper?: boolean }) => {
  const content = (
    <>
      {/* Header Skeleton */}
      <div className="mb-8">
        <Skeleton className="w-64 h-8 rounded-lg mb-2" />
        <Skeleton className="w-96 h-4 rounded" />
      </div>

      {type === 'ai-humanize' || type === 'ai-detector' ? (
            <>
              {/* Text Areas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <SkeletonTextArea />
                <SkeletonTextArea />
              </div>
              
              {/* Settings Section */}
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10 mb-6">
                <Skeleton className="w-48 h-6 rounded mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Skeleton className="w-full h-12 rounded-lg" />
                  <Skeleton className="w-full h-12 rounded-lg" />
                  <Skeleton className="w-full h-12 rounded-lg" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Skeleton className="h-12 w-40 rounded-xl" />
                <Skeleton className="h-12 w-40 rounded-xl" />
              </div>
            </>
          ) : type === 'documents' ? (
            <>
              {/* Search and Filters */}
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/10 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <Skeleton className="flex-1 h-12 rounded-lg" />
                  <Skeleton className="w-32 h-12 rounded-lg" />
                  <Skeleton className="w-32 h-12 rounded-lg" />
                </div>
              </div>

              {/* Document Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/10">
                    <div className="flex items-start justify-between mb-4">
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <Skeleton className="w-16 h-5 rounded" />
                    </div>
                    <Skeleton className="w-full h-6 rounded mb-2" />
                    <Skeleton className="w-32 h-4 rounded mb-4" />
                    <Skeleton className="w-full h-20 rounded" />
                  </div>
                ))}
              </div>
            </>
          ) : type === 'profile' ? (
            <>
              {/* Profile Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/10">
                  <Skeleton className="w-32 h-8 rounded mb-4" />
                  <Skeleton className="w-full h-12 rounded-lg mb-4" />
                  <Skeleton className="w-full h-12 rounded-lg mb-4" />
                  <Skeleton className="w-full h-12 rounded-lg" />
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/10">
                  <Skeleton className="w-40 h-8 rounded mb-4" />
                  <Skeleton className="w-full h-24 rounded-lg mb-4" />
                  <Skeleton className="w-full h-24 rounded-lg" />
                </div>
              </div>
              
              {/* Usage Section */}
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/10">
                <Skeleton className="w-48 h-8 rounded mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Skeleton className="w-full h-20 rounded-xl" />
                  <Skeleton className="w-full h-20 rounded-xl" />
                  <Skeleton className="w-full h-20 rounded-xl" />
                </div>
              </div>
            </>
          ) : null}
    </>
  );

  if (noWrapper) {
    return content;
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="lg:pl-64 pt-16 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          {content}
        </div>
      </div>
    </div>
  );
};


'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { PhotoIcon } from '@heroicons/react/24/outline';

interface ImageGeneratorProps {
  onSubmit: (prompt: string, size: string) => Promise<void>;
  isLoading: boolean;
}

export default function ImageGenerator({ onSubmit, isLoading }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState('2x2'); // Default size
  const [showTooltip, setShowTooltip] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    // Cleanup timeout on component unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleTooltipClick = () => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setShowTooltip(!showTooltip);

    // Set new timeout if tooltip is being shown
    if (!showTooltip) {
      timeoutRef.current = setTimeout(() => {
        setShowTooltip(false);
      }, 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit(prompt, size);
    } catch (error) {
      console.error('Error generating images:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
            Describe your tattoo design
          </label>
          <div className="relative">
            <textarea
              id="prompt"
              rows={4}
              className="block w-full rounded-2xl border-2 border-purple-100 bg-white/80 shadow-sm text-gray-800 placeholder-gray-400 p-4 pr-12 backdrop-blur-sm transition-all duration-300 focus:outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-200 focus:shadow-[0_0_15px_rgba(168,85,247,0.2)] focus:scale-[1.01]"
              placeholder="A minimalist mountain range with a crescent moon..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              required
            />
            <div className="absolute right-4 top-4">
              <button
                type="button"
                onClick={handleTooltipClick}
                className="relative cursor-not-allowed focus:outline-none"
              >
                <div className="text-indigo-600 hover:text-purple-600 transition-colors">
                  <PhotoIcon className="h-6 w-6" />
                </div>
                {showTooltip && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute top-full right-0 mt-2 px-3 py-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white text-xs rounded-lg whitespace-nowrap shadow-lg z-10"
                  >
                    Image upload coming soon
                  </motion.div>
                )}
              </button>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-2">
            Tattoo Size (inches)
          </label>
          <select
            id="size"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="block w-full rounded-2xl border-2 border-purple-100 bg-white/80 shadow-sm text-gray-800 p-4 backdrop-blur-sm transition-all duration-300 focus:outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-200 focus:shadow-[0_0_15px_rgba(168,85,247,0.2)] focus:scale-[1.01]"
          >
            <option value="1x1">1" x 1" (Minimal)</option>
            <option value="2x2">2" x 2" (Small)</option>
            <option value="3x3">3" x 3" (Medium)</option>
            <option value="4x4">4" x 4" (Large)</option>
            <option value="5x5">5" x 5" (Extra Large)</option>
          </select>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-2xl shadow-lg shadow-indigo-200 text-base font-medium text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2" />
              Generating designs...
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-full mr-2 border-2 border-white/30">
                <PhotoIcon className="h-5 w-5" />
              </div>
              Generate with Tattooz
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
} 
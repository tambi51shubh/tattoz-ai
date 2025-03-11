'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface ImageStatus {
  url: string | null;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

interface ImagePreviewProps {
  imageStatuses: ImageStatus[];
  isLoading: boolean;
  error: string | null;
}

export default function ImagePreview({ imageStatuses, isLoading, error }: ImagePreviewProps) {
  console.log('ImagePreview received:', { imageStatuses, isLoading, error }); // Debug log

  if (isLoading && imageStatuses.every(status => status.status === 'pending')) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-4xl mx-auto bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-indigo-100 flex items-center justify-center p-12"
      >
        <div className="flex flex-col items-center space-y-6">
          <div className="w-16 h-16 border-t-2 border-b-2 border-purple-400 rounded-full animate-spin" />
          <p className="text-gray-700 text-xl font-medium">Generating your tattoo designs...</p>
          <p className="text-gray-500 text-sm">This may take a few moments</p>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-4xl mx-auto bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-indigo-100 flex items-center justify-center p-12"
      >
        <div className="text-center">
          <p className="text-red-500 text-xl font-medium mb-3">Error generating images</p>
          <p className="text-gray-600">{error}</p>
        </div>
      </motion.div>
    );
  }

  if (imageStatuses.every(status => status.status === 'pending')) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {imageStatuses.map((status, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative aspect-square bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-indigo-100 overflow-hidden group"
          >
            {status.status === 'success' && status.url ? (
              <>
                <Image
                  src={status.url}
                  alt={`Generated tattoo design ${index + 1}`}
                  fill
                  className="object-contain p-4"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <a
                    href={status.url}
                    download={`tattoo-design-${index + 1}.png`}
                    className="bg-white text-indigo-600 px-6 py-2 rounded-full hover:bg-white/90 transition-colors font-medium shadow-lg"
                  >
                    Download
                  </a>
                </div>
              </>
            ) : status.status === 'error' ? (
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <p className="text-red-500 text-center">{status.error || 'Failed to generate image'}</p>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-t-2 border-b-2 border-purple-400 rounded-full animate-spin" />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
} 
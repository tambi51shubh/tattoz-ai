'use client';

import { useState } from 'react';
import ImageGenerator from '@/components/ImageGenerator';
import ImagePreview from '@/components/ImagePreview';
import BackgroundPattern from '@/components/BackgroundPattern';

interface ImageStatus {
  url: string | null;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

const NUM_IMAGES = 3; // Match the backend constant

export default function Home() {
  const [imageStatuses, setImageStatuses] = useState<ImageStatus[]>(Array(NUM_IMAGES).fill({ url: null, status: 'pending' }));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateImage = async (prompt: string, size: string) => {
    setIsLoading(true);
    setError(null);
    // Reset all images to pending state
    setImageStatuses(Array(NUM_IMAGES).fill({ url: null, status: 'pending' }));
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, size }),
      });

      const data = await response.json();
      console.log('Received response:', data);

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate images');
      }

      // Update all image statuses
      setImageStatuses(data.imageUrls.map((url: string) => ({
        url,
        status: 'success'
      })));

    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate images');
      setImageStatuses(Array(NUM_IMAGES).fill({
        url: null,
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to generate images'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <BackgroundPattern />
      <main className="min-h-screen relative">
        <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold text-gray-800 mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                Tattooz
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Transform your ideas into beautiful tattoo designs using artificial intelligence
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-white/80 backdrop-blur-3xl rounded-3xl shadow-xl"></div>
            <div className="relative space-y-8 p-8">
              <ImageGenerator onSubmit={handleGenerateImage} isLoading={isLoading} />
              <ImagePreview 
                imageStatuses={imageStatuses} 
                isLoading={isLoading}
                error={error}
              />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

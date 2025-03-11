import { NextResponse } from 'next/server';

// Simple rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 5000; // 5 seconds between requests
const NUM_IMAGES = 2; // Reduced from 3 to 2 images
const TIMEOUT = 25000; // 25 second timeout for each request
const DELAY_BETWEEN_IMAGES = 3000; // 3 seconds between image generations

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateSingleImage(prompt: string, retries: number, baseDelay: number): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    while (retries > 0) {
      try {
        console.log('Starting image generation... (attempts left:', retries, ')');
        
        const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt: prompt
            }),
            signal: controller.signal
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error:', errorText);
          
          if (response.status === 429) {
            // Rate limit hit - wait longer
            await delay(baseDelay);
            baseDelay *= 2; // Exponential backoff
            retries--;
            continue;
          }
          
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Get the response as an ArrayBuffer
        const arrayBuffer = await response.arrayBuffer();
        console.log('Received image data');

        // Convert ArrayBuffer to base64
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const imageUrl = `data:image/png;base64,${base64}`;
        console.log('Generated image URL');

        return imageUrl;
      } catch (error: any) {
        if (error.name === 'AbortError') {
          throw new Error('Request timed out');
        }

        console.error('Error generating image:', error);
        retries--;
        
        if (retries === 0) {
          throw error;
        } else {
          // Wait before retrying with exponential backoff
          await delay(baseDelay);
          baseDelay *= 2;
        }
      }
    }
    throw new Error('Failed to generate image after all retries');
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function POST(req: Request) {
  try {
    const { prompt, size } = await req.json();
    console.log('Received prompt:', prompt, 'size:', size);

    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await delay(MIN_REQUEST_INTERVAL - timeSinceLastRequest);
    }
    lastRequestTime = Date.now();

    // Generate images sequentially instead of in parallel
    const imageUrls = [];
    for (let i = 0; i < NUM_IMAGES; i++) {
      try {
        // Add delay between generations
        if (i > 0) {
          await delay(DELAY_BETWEEN_IMAGES);
        }
        
        const imageUrl = await generateSingleImage(
          `${prompt}, pure white background, only circles and straight lines allowed, ${getSizeConstraints(size)}`,
          2, // Reduced retries
          5000
        );
        imageUrls.push(imageUrl);
      } catch (error) {
        console.error(`Error generating image ${i + 1}:`, error);
        // Continue with next image even if one fails
      }
    }

    // Return whatever images we successfully generated
    return NextResponse.json({
      success: true,
      imageUrls,
      status: 'success'
    });
  } catch (error) {
    console.error('Error in image generation:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate images',
      status: 'error'
    }, { status: 500 });
  }
}

// Separate function for size constraints
function getSizeConstraints(size: string): string {
  const baseConstraints = 'ultra minimal design, extremely simple geometric composition, clean white background, no shading, no color, no details, no background elements, no textures, no gradients, no crosshatching, no stippling, no dotwork, no watercolor effects, no realistic elements, no 3D effects, no perspective, flat design, iconic style, timeless tattoo design, classic flash art tattoo sketch, extremely simplified version, minimal detail, bold and clean, easy to tattoo, tattoo artist friendly, simple enough to be recognizable from a distance, iconic and memorable with minimal elements, like drawn with a single pen in one continuous motion, hand sketched quality, organic line work, imperfect but charming, like a quick doodle, extremely basic and simple, like drawn by a human hand in 5 seconds, pure geometric minimalism, clean white background, no extra elements, no decorative details, no ornamental elements, no complex patterns, no intricate details, no fine lines, no thin lines, no small elements, no tiny details, no small shapes, no complex shapes, no overlapping shapes, no intersecting lines, no crossing lines, no curved lines except circles, only circles and straight lines, basic geometric forms, elementary shapes, fundamental shapes, primitive shapes, essential shapes only, pure geometric minimalism, absolute minimalism, extreme simplicity, pure white background, clean white space, empty white background, solid white background, clean white background, minimalist geometric composition, leave plenty of empty space, use minimal space, design should be small and centered, avoid filling the entire space, keep the design compact and minimal, leave white space around the design, design should float in the center with empty space around it, minimal use of canvas space, design should be small and elegant, leave generous white space, design should be contained and not spread out';

  switch (size) {
    case '1x1':
      return `maximum 5 lines total, maximum 1 circle, extremely minimal design, ultra simple composition, minimal detail, maximum 2-3 elements total, use only 20% of the image space, rest should be blank with no elements, tiny design in the center, ${baseConstraints}`;
    case '2x2':
      return `maximum 8 lines total, maximum 2 circles, very simple design, minimal composition, minimal detail, maximum 3-4 elements total, use only 30% of the image space, small design in the center, ${baseConstraints}`;
    case '3x3':
      return `maximum 12 lines total, maximum 3 circles, simple design, balanced composition, moderate detail, maximum 4-5 elements total, use only 40% of the image space, medium design in the center, ${baseConstraints}`;
    case '4x4':
      return `maximum 15 lines total, maximum 4 circles, balanced design, moderate composition, moderate detail, maximum 5-6 elements total, use only 50% of the image space, balanced design in the center, ${baseConstraints}`;
    case '5x5':
      return `maximum 20 lines total, maximum 5 circles, balanced design, moderate composition, moderate detail, maximum 6-7 elements total, use only 60% of the image space, larger design in the center, ${baseConstraints}`;
    default:
      return `maximum 12 lines total, maximum 3 circles, simple design, balanced composition, moderate detail, maximum 4-5 elements total, use only 40% of the image space, medium design in the center, ${baseConstraints}`;
  }
} 
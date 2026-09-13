import Replicate from 'replicate'

export interface ImageGenerationProvider {
  generate(imageUrl: string, prompt: string): Promise<string[]>;
  healthCheck(): Promise<boolean>;
}

export class MockImageGenerationProvider implements ImageGenerationProvider {
  async generate(imageUrl: string, prompt: string): Promise<string[]> {
    return ['https://example.com/mock-design.jpg'];
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}

export class ReplicateImageProvider implements ImageGenerationProvider {
  private replicate: Replicate

  constructor() {
    this.replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    })
  }

  async generate(
    originalImage: string,
    prompt: string
  ): Promise<string[]> {
    if (!originalImage) throw new Error('Original image required for redesign.')

    const output = await this.replicate.run(
      'timothybrooks/instruct-pix2pix:30c1d0b916a6f8efce20493f5d61ee27491ab2a60430f673e4f0052921c568ac',
      {
        input: {
          image: originalImage,
          prompt,
          image_guidance_scale: 1.5,
          guidance_scale: 7.5,
        }
      }
    )

    // output is an array of strings (urls) for instruct-pix2pix
    if (Array.isArray(output) && output.length > 0) {
      return [output[0]]
    }
    
    if (typeof output === 'string') {
      return [output]
    }

    throw new Error('Failed to generate image.')
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.replicate.models.get('timothybrooks', 'instruct-pix2pix')
      return true
    } catch {
      return false
    }
  }
}

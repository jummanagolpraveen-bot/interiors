import { VisionAnalysisProvider, MockVisionAnalysisProvider, OpenAIVisionProvider } from './vision-analysis'
import { ImageGenerationProvider, MockImageGenerationProvider, ReplicateImageProvider } from './design-generator'
import { TextGenProvider, MockTextGenProvider } from './chat'

export class ProviderNotConfiguredError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProviderNotConfiguredError'
  }
}

export function getVisionProvider(): VisionAnalysisProvider {
  if (process.env.OPENAI_API_KEY) {
    return new OpenAIVisionProvider()
  }

  if (process.env.DEMO_MODE === 'true') {
    return new MockVisionAnalysisProvider()
  }

  throw new ProviderNotConfiguredError('OPENAI_API_KEY is not configured.')
}

export function getImageGenerationProvider(): ImageGenerationProvider {
  if (process.env.REPLICATE_API_TOKEN) {
    return new ReplicateImageProvider()
  }

  if (process.env.DEMO_MODE === 'true') {
    return new MockImageGenerationProvider()
  }

  throw new ProviderNotConfiguredError('REPLICATE_API_TOKEN is not configured.')
}

export function getTextGenProvider(): TextGenProvider {
  return new MockTextGenProvider()
}

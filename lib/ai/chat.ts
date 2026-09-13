export interface TextGenProvider {
  complete(context: string, prompt: string, language: string): Promise<string>;
  healthCheck(): Promise<boolean>;
}

export class MockTextGenProvider implements TextGenProvider {
  async complete(context: string, prompt: string, language: string): Promise<string> {
    return `Mock response in ${language}`;
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}

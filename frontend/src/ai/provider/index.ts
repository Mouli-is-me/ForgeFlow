export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIProvider {
  chat(messages: AIMessage[]): Promise<string>;
}

export class OllamaProvider implements AIProvider {
  private baseUrl: string;
  private model: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_OLLAMA_BASE_URL || 'http://localhost:11434';
    this.model = import.meta.env.VITE_OLLAMA_MODEL || 'llama3.1';
  }

  async chat(messages: AIMessage[]): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: false,
          format: 'json' // Request JSON format if we are parsing structured data
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.message.content;
    } catch (error) {
      console.error("AI Provider Error:", error);
      throw error;
    }
  }
}

export class FallbackMockProvider implements AIProvider {
  async chat(_messages: AIMessage[]): Promise<string> {
    // A mock fallback if AI is totally unavailable
    return JSON.stringify({
      valid: false,
      error: "AI service is currently unreachable.",
    });
  }
}

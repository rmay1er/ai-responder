import { generateText, streamText } from "ai";
import { InMemoryCache, type Cache } from "./src/InMemoryCache";
import { openai } from "@ai-sdk/openai";
import type { ToolSet, CoreMessage, ToolResult } from "ai";
import Redis from "ioredis";
export { InMemoryCache } from "./src/InMemoryCache";

/**
 * Configuration type for model
 */
type OpenAIResponsesModelId =
  | "o1"
  | "o1-2024-12-17"
  | "o1-mini"
  | "o1-mini-2024-09-12"
  | "o1-preview"
  | "o1-preview-2024-09-12"
  | "o3-mini"
  | "o3-mini-2025-01-31"
  | "gpt-4o"
  | "gpt-4o-2024-05-13"
  | "gpt-4o-2024-08-06"
  | "gpt-4o-2024-11-20"
  | "gpt-4o-mini"
  | "gpt-4o-mini-2024-07-18"
  | "gpt-4-turbo"
  | "gpt-4-turbo-2024-04-09"
  | "gpt-4-turbo-preview"
  | "gpt-4-0125-preview"
  | "gpt-4-1106-preview"
  | "gpt-4"
  | "gpt-4-0613"
  | "gpt-4.5-preview"
  | "gpt-4.5-preview-2025-02-27"
  | "gpt-3.5-turbo-0125"
  | "gpt-3.5-turbo"
  | "gpt-3.5-turbo-1106"
  | (string & {});

/**
 * Configuration interface for AIResponder
 */
interface AIResponderConfig {
  /** The AI model identifier to use for responses */
  model: OpenAIResponsesModelId;
  /** System instructions for the AI model */
  instructions: string;
  /** Optional set of tools for the AI to use */
  tools?: ToolSet;
  /** Cache configuration for session management */
  cache?: {
    /** Cache provider instance */
    provider: Cache | Redis;
    /** Expiration time in seconds for cached items */
    expireTime?: number;
  };
  lengthOfContext?: number;
}

/**
 * AIResponder class for handling AI responses with caching and error handling.
 * Provides methods for generating both standard and streamed responses,
 * with built-in session management and tool response formatting.
 */
export class AIResponder {
  /** The AI model identifier being used */
  public model: string;
  /** System instructions for the AI model */
  private instructions: string;
  /** Cache configuration and provider */
  private cache?: {
    provider: Cache | Redis;
    expireTime?: number;
  };
  /** Optional set of tools for the AI to use */
  private tools?: ToolSet;
  /** Optional number of messages in AI context */
  private lengthOfContext?: number;
  /** Universal error handler for various system events */
  private errorHandler?: (type: string, data: any) => void;

  /**
   * Creates an instance of AIResponder
   * @param config - Configuration object for the responder
   */
  constructor(config: AIResponderConfig) {
    this.model = config.model;
    this.instructions = config.instructions;
    if (config.cache) {
      this.cache = {
        provider: config.cache.provider,
        expireTime: config.cache.expireTime,
      };
    } else {
      this.cache = {
        provider: new InMemoryCache(),
        expireTime: 3600,
      };
    }
    if (config.lengthOfContext) {
      this.lengthOfContext = config.lengthOfContext;
    } else {
      this.lengthOfContext = 10;
    }
    this.tools = config.tools;
    this.setupCleanup();
  }

  /**
   * Gets a context-based response from the AI model.
   * Maintains conversation context using session-based caching.
   * @param userId - Unique identifier for the user session
   * @param prompt - User's input prompt
   * @returns Promise resolving to the AI response object
   * @throws Will throw an error if AI response fails
   */
  async getContextResponse(userId: string, prompt: string) {
    const sessionKey = `session:${userId}`;
    let messages: CoreMessage[] = [];

    try {
      messages = JSON.parse(
        (await this.cache!.provider.get(sessionKey)) || "[]",
      );
    } catch {
      messages = [];
    }

    messages.push({ role: "user", content: prompt });

    try {
      const { response, text, toolCalls, toolResults } = await generateText({
        model: openai(this.model),
        system: this.instructions,
        tools: this.tools,
        messages,
        maxTokens: 600,
        maxSteps: 10,
      });

      messages.push(...response.messages);
      if (messages.length > (this.lengthOfContext ?? 10)) {
        messages = messages.slice(-(this.lengthOfContext ?? 10));
      }

      await this.cache!.provider.set(
        sessionKey,
        JSON.stringify(messages),
        "EX",
        this.cache!.expireTime || 3600,
      );

      return { text, toolCalls, toolResults };
    } catch (error) {
      this.errorHandler?.("error", `Failed to get response from AI`);
      throw error;
    }
  }

  /**
   * Gets a streamed context-based response from the AI model.
   * Provides real-time streaming of the AI response while maintaining session context.
   * @param userId - Unique identifier for the user session
   * @param prompt - User's input prompt
   * @returns Promise resolving to an object containing the full response text
   * @throws Will throw an error if streaming fails
   */
  async getStreamedContextResponse(
    userId: string,
    prompt: string,
  ): Promise<any> {
    const sessionKey = `session:${userId}`;
    let messages: CoreMessage[] = [];

    try {
      messages = JSON.parse(
        (await this.cache!.provider.get(sessionKey)) || "[]",
      );
    } catch {
      messages = [];
    }

    messages.push({ role: "user", content: prompt });

    try {
      const response = streamText({
        model: openai(this.model),
        system: this.instructions,
        tools: this.tools,
        messages,
        maxTokens: 500,
        maxSteps: 4,
      });

      let fullResponse = "";
      const reader = response.textStream.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        fullResponse += value;
        Bun.stdout.write(value);
      }

      messages.push({
        role: "assistant",
        content: fullResponse,
      });

      if (messages.length > 10) {
        messages = messages.slice(-10);
      }

      await this.cache!.provider.set(
        sessionKey,
        JSON.stringify(messages),
        "EX",
        this.cache!.expireTime || 3600,
      );

      return { text: fullResponse };
    } catch (error) {
      this.errorHandler?.("error", `Failed to get response from AI`);
      throw error;
    }
  }

  /**
   * Formats tool responses into a readable string.
   * @param response - The response object containing tool results
   * @returns Formatted string showing tool arguments and results, or undefined if no tool results
   */
  formatToolResponse(response: {
    steps?: Array<{ toolResults?: Array<ToolResult<string, any, any>> }>;
  }): string | undefined {
    const toolResponse = response.steps?.[0]?.toolResults?.map((result) => ({
      args: result.args as any,
      result: result.result,
    }));

    if (toolResponse && toolResponse.length > 0) {
      return toolResponse
        .map(
          ({ args, result }) =>
            `Tool args: ${JSON.stringify(args)} | Tool result: ${JSON.stringify(
              result,
              null,
              2,
            )}`,
        )
        .join("\n");
    }
  }

  /**
   * Sets up a universal error handler for the responder.
   * Handles various system events including cache connection states.
   * @param handler - Function to handle errors and system events
   */
  catchErrors(handler: (type: string, data: any) => void): void {
    this.errorHandler = handler;
    this.setupCacheHandlers();
  }

  /**
   * Sets up event handlers for cache connection states
   */
  private setupCacheHandlers(): void {
    if (!this.cache) return;

    this.cache.provider.on("error", (error) => {
      this.errorHandler?.("error", `Error with connection to Cache: ${error}`);
    });

    this.cache.provider.on("connect", () => {
      this.errorHandler?.("connect", "✔ Cache connected");
    });

    this.cache.provider.on("reconnecting", () => {
      this.errorHandler?.("reconnecting", "🔄 Cache reconnecting...");
    });

    this.cache.provider.on("end", () => {
      this.errorHandler?.("end", "👋 Cache connection closed");
    });
  }

  /**
   * Sets up cleanup handlers for process termination signals.
   * Clears cache and closes connections on process exit.
   */
  private setupCleanup(): void {
    const cleanup = async () => {
      if (this.cache) {
        await this.cache.provider.flushall();
        await this.cache.provider.quit();
        this.errorHandler?.("clean", "Cache session is cleared");
      }
      process.exit(0);
    };

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
  }
}

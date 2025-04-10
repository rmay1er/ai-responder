import { generateText, streamText } from "ai";
import { InMemoryCache, type Cache } from "./src/InMemoryCache";
import { openai } from "@ai-sdk/openai";
import type { ToolSet, CoreMessage } from "ai";
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
      const response = await generateText({
        model: openai(this.model),
        system: this.instructions,
        tools: this.tools,
        messages,
        maxTokens: 500,
        maxSteps: 10,
      });

      // Добавляем ВСЕ сообщения из ответа (включая tool)
      messages.push(...response.response.messages);

      // Безопасная обрезка с сохранением tool-пар
      messages = this.trimMessagesToolsPairsSafety(
        messages,
        this.lengthOfContext ?? 10,
      );

      await this.cache!.provider.set(
        sessionKey,
        JSON.stringify(messages),
        "EX",
        this.cache!.expireTime || 3600,
      );

      return response;
    } catch (error) {
      this.errorHandler?.("error", `Failed to get response from AI`);
      throw error;
    }
  }

  /**
   * Safely trims message history while preserving assistant-tool message pairs.
   * Ensures tool responses are not separated from their corresponding assistant messages.
   * @param messages - Array of CoreMessage objects representing the conversation history
   * @param maxLength - Maximum number of messages to retain in the history
   * @returns Trimmed array of CoreMessage objects with preserved tool pairs
   */
  private trimMessagesToolsPairsSafety(
    messages: CoreMessage[],
    maxLength: number,
  ): CoreMessage[] {
    if (messages.length <= maxLength) return messages;

    // Ищем индексы всех пар assistant → tool
    const toolPairs: number[] = [];
    for (let i = 1; i < messages.length; i++) {
      if (messages[i].role === "tool" && messages[i - 1].role === "assistant") {
        toolPairs.push(i - 1, i); // Сохраняем индексы assistant и tool
      }
    }

    // Обрезаем, но не разрываем пары
    let startIndex = messages.length - maxLength;
    for (const pairStart of toolPairs) {
      if (pairStart < startIndex && pairStart + 1 >= startIndex) {
        // Если обрезка разорвёт пару, начинаем раньше
        startIndex = pairStart;
        break;
      }
    }

    return messages.slice(startIndex);
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

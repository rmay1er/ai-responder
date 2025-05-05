import { generateText, generateObject } from "ai";
import { InMemoryCache, type Cache } from "./cache/InMemoryCache";
import { openai } from "@ai-sdk/openai";
import type { ToolSet, CoreMessage } from "ai";
import type { OpenAIResponsesModelId } from "./types/OpenAIResponsesModelId";
import Redis from "ioredis";
import type { ZodType, ZodTypeDef } from "zod";

/**
 * Configuration interface for AIResponder
 */
export interface AIResponderConfig {
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
  /** Optional number of messages in AI context */
  lengthOfContext?: number;
  /** Optional maximum number of tokens to generate in a response */
  maxTokens?: number;
  /** Optional maximum number of steps to take in a response */
  maxSteps?: number;
  /** Schema of the object that the model should generate */
  schema?: ZodType<unknown, ZodTypeDef, unknown>;
  /** Optional schema name */
  schemaName?: string;
  /** Description of the schema */
  schemaDescription?: string;
}

/**
 * AIResponder class for handling AI responses with caching and error handling.
 * Provides methods for generating both standard and streamed responses,
 * with built-in session management and tool response formatting.
 */
export class AIResponderV1 {
  /** The AI model identifier being used */
  public model: OpenAIResponsesModelId;
  /** System instructions for the AI model */
  protected instructions: string;
  /** Cache configuration and provider */
  protected cache?: {
    provider: Cache | Redis;
    expireTime?: number;
  };
  /** Optional set of tools for the AI to use */
  protected tools?: ToolSet;
  /** Optional number of messages in AI context */
  protected lengthOfContext?: number;
  /** Schema for structured object generation */
  protected schema?: ZodType<unknown, ZodTypeDef, unknown>;
  /** Optional schema name */
  protected schemaName?: string;
  /** Optional schema description */
  protected schemaDescription?: string;
  /** Maximum number of tokens to generate */
  protected maxTokens?: number;
  /** Maximum number of steps to generate */
  protected maxSteps?: number;
  /** Universal error handler for various system events */
  protected errorHandler?: (type: string, data: any) => void;

  /**
   * Creates an instance of AIResponder
   * @param config - Configuration object for the responder
   */
  constructor(config: AIResponderConfig) {
    const {
      model,
      instructions,
      cache,
      lengthOfContext,
      tools,
      maxTokens,
      maxSteps,
      schema,
      schemaName,
      schemaDescription,
    } = config;

    this.model = model;
    this.instructions = instructions;
    this.cache = cache ?? {
      provider: new InMemoryCache(),
      expireTime: 3600,
    };
    this.lengthOfContext = lengthOfContext || 10;
    this.tools = tools;
    this.maxTokens = maxTokens || 500;
    this.maxSteps = maxSteps || 5;
    this.schema = schema;
    this.schemaName = schemaName;
    this.schemaDescription = schemaDescription;
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
        maxTokens: this.maxTokens,
        maxSteps: this.maxSteps,
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
        this.cache?.expireTime || 3600,
      );

      return response;
    } catch (error) {
      this.errorHandler?.("error", `Failed to get response from AI`);
      throw error;
    }
  }

  /**
   * Gets a once response without context from the AI model.
   * Maintains conversation context using session-based caching.
   * @param prompt - User's input prompt
   * @returns Promise resolving to the AI response object
   * @throws Will throw an error if AI response fails
   */
  async getOnceResponse(prompt: string) {
    try {
      const response = await generateText({
        model: openai(this.model),
        system: this.instructions,
        tools: this.tools,
        prompt: prompt,
        maxTokens: this.maxTokens,
        maxSteps: this.maxSteps,
      });
      return response;
    } catch (error) {
      this.errorHandler?.("error", `Failed to get response from AI`);
      throw error;
    }
  }

  /**
   * Gets an object response from the AI model.
   * Maintains conversation context using session-based caching.
   * @param userId - User's ID to save session data
   * @param prompt - User's input prompt
   * @returns Promise resolving to the AI response object
   * @throws Will throw an error if AI response fails
   */
  async getStructuredObject(userId: string, prompt: string) {
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
      const response = await generateObject({
        model: openai(this.model),
        messages,
        schemaName: this.schemaName,
        schemaDescription: this.schemaDescription,
        schema: this.schema as any, // Cast to any to bypass type checking
      });

      messages.push({ role: "assistant", content: String(response.object) });

      // Безопасная обрезка с сохранением tool-пар
      messages = this.trimMessagesToolsPairsSafety(
        messages,
        this.lengthOfContext ?? 10,
      );

      await this.cache!.provider.set(
        sessionKey,
        JSON.stringify(messages),
        "EX",
        this.cache?.expireTime || 3600,
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

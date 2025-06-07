import { generateObject, generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { AIResponderV1 } from "./aiResponderV1";
import type { AIResponderConfig, GenerateObjectOptions } from "./types/index";

/**
 * AIResponder class for handling AI responses with caching and error handling.
 * Provides methods for generating both standard and streamed responses,
 * with built-in session management and tool response formatting.
 */
export class AIResponderV2 extends AIResponderV1 {
  /**
   * Creates an instance of AIResponder
   * @param config - Configuration object for the responder
   */
  constructor(config: AIResponderConfig) {
    super(config);
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
    let messagesKey: string | undefined;

    try {
      const cachedValue = await this.cache!.provider.get(sessionKey);
      messagesKey = cachedValue ? cachedValue : undefined;
    } catch (error) {
      console.error("Error reading from cache:", error);
      messagesKey = undefined;
    }

    try {
      const generateTextParams: any = {
        model: openai.responses(this.model),
        system: this.instructions,
        tools: this.tools,
        prompt: prompt,
        maxTokens: this.maxTokens,
        temperature: this.temperature,
        maxSteps: this.maxSteps,
      };

      if (messagesKey) {
        generateTextParams.providerOptions = {
          openai: {
            previousResponseId: messagesKey,
          },
        };
      }

      const response = await generateText(generateTextParams);

      messagesKey = response.providerMetadata?.openai.responseId as string;

      if (messagesKey) {
        await this.cache!.provider.set(
          sessionKey,
          messagesKey,
          "EX",
          this.cache?.expireTime ?? 3600,
        );
      }

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
  async getStructuredObject(
    userId: string,
    prompt: string,
    options: GenerateObjectOptions,
  ) {
    const sessionKey = `session:${userId}`;
    let messagesKey: string | undefined;

    try {
      const cachedValue = await this.cache!.provider.get(sessionKey);
      messagesKey = cachedValue ? cachedValue : undefined;
    } catch (error) {
      console.error("Error reading from cache:", error);
      messagesKey = undefined;
    }

    try {
      const generateObjectParams: any = {
        model: openai.responses(this.model),
        system: this.instructions,
        tools: this.tools,
        schema: options.schema,
        schemaName: options.schemaName,
        schemaDescription: options.schemaDescription,
        prompt: prompt,
        temperature: this.temperature,
        maxTokens: this.maxTokens,
        maxSteps: this.maxSteps,
      };

      if (messagesKey) {
        generateObjectParams.providerOptions = {
          openai: {
            previousResponseId: messagesKey,
          },
        };
      }

      const response = await generateObject(generateObjectParams);

      messagesKey = response.providerMetadata?.openai.responseId as string;

      if (messagesKey) {
        await this.cache!.provider.set(
          sessionKey,
          messagesKey,
          "EX",
          this.cache?.expireTime ?? 3600,
        );
      }

      return response;
    } catch (error) {
      this.errorHandler?.("error", `Failed to get response from AI`);
      throw error;
    }
  }
}

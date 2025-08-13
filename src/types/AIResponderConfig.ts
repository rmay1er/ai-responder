import type { ToolSet } from "ai";
import type { ExOpenAIProvider } from "./index";
import Redis from "ioredis";
import type { Cache } from "../cache/InMemoryCache";

/**
 * Configuration interface for AIResponder
 */
export interface AIResponderConfig {
  /** The AI model identifier to use for responses */
  provider: ExOpenAIProvider;
  /** System instructions for the AI model */
  instructions: string;
  /** Optional set of tools for the AI to use */
  tools?: ToolSet;
  /** Cache configuration for session management */
  cache?: {
    /** Cache provider instance */
    provider: Cache | Redis;
    /** Expiration time in seconds for cached items */
    expireTime: number;
  };
  /** Optional number of messages in AI context */
  lengthOfContext?: number;
  /** Optional maximum number of tokens to generate in a response */
  maxTokens?: number;
  /** Optional maximum number of steps to take in a response */
  maxSteps?: number;
  /** Schema of the object that the model should generate */
  temperature?: number;
}

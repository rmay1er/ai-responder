import type { OpenAIChatModelId } from "./OpenAIResponsesModelId";
import type { OpenAIProvider, OpenAIProviderSettings } from "@ai-sdk/openai";

export interface ExOpenAIProviderSettings extends OpenAIProviderSettings {
  /** The AI model identifier to use for responses */
  modelId: OpenAIChatModelId;
}

export interface ExOpenAIProvider extends OpenAIProvider {
  /** The AI model identifier to use for responses */
  modelId: OpenAIChatModelId;
}

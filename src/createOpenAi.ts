import { createOpenAI as cr } from "@ai-sdk/openai";
import type { ExOpenAIProvider, ExOpenAIProviderSettings } from "./types/index";

function createOpenAIProvider(
  options: ExOpenAIProviderSettings,
): ExOpenAIProvider & { modelId: string } {
  const provider = cr(options);
  // Добавляем modelId как свойство
  (provider as any).modelId = options.modelId;
  return provider as ExOpenAIProvider;
}

export { createOpenAIProvider };

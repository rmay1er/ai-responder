import { AIResponder, InMemoryCache } from "./dist/aiResponder";
import { expect, test, describe } from "bun:test";

describe("AI Responser answers", () => {
  test("Classic answer", async () => {
    const ai = new AIResponder({
      model: "gpt-4o",
      instructions: "You are a helpful assistant.",
      cache: {
        provider: new InMemoryCache(),
      },
    });
    const response = await ai.getContextResponse("test", "Hello");
    expect(response.text).toBeString();
  });
});

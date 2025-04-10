import { AIResponder, InMemoryCache } from "./dist/aiResponder";

const aiModule = new AIResponder({
  model: "gpt-4o",
  instructions: "You are a helpful assistant.",
});

const response = await aiModule.getContextResponse(
  "console_session",
  "Say to user, that program is running and AI is ready to assist you.",
);

console.log(response.text);

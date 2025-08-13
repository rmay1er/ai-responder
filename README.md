# AI Responder Library

**Build Production-Ready AI Agents with Built-in Memory and Chained Tool Support**
⚡ Zero-config TypeScript library featuring automatic context memory and the ability to create chains of AI tool calls seamlessly

## Why Choose This Library?

- 🚀 **3-Line Agent Setup with Automatic Memory** - Spin up intelligent AI agents that remember conversation context without any manual memory management
- 🔐 **Secure API Handling** - Automatic environment variable integration with robust error handling
- 🧩 **Context-Aware Dialog** - Built-in memory enables agents to maintain rich, multi-turn conversations seamlessly
- 🔄 **Effortless Tool Chaining** - Create AI agents that act as tools themselves, enabling complex chains of AI-driven workflows
- 🛡️ **Battle-Tested** - Built-in retry logic, Redis caching, and graceful shutdown mechanisms
- 🛠️ **Extensible Tool Support** - Easily pass AI agents as tools to other agents for chaining calls and building sophisticated AI pipelines
- 📦 **MIT Licensed** - Fully open source for commercial use and customization

## Quick Start

### 1. Install Package
```bash
# Using Bun
bun install ai-responder

# Using npm
npm install ai-responder
```

### 2. Configure Environment
```bash
# .env
OPENAI_API_KEY=your-key-here
```

### 3. Create First Agent
```typescript
import { AIResponderV1, AIResponderV2 } from 'ai-responder';
import 'dotenv/config'; // Node.js only - Bun auto-loads .env
import { createOpenAiProvider } from "ai-responder";

// Create OpenAI provider first, set the model there
// Also you can pass API key directly if not using .env
const openaiProvider = createOpenAiProvider({
  modelId: "gpt-4.1-mini"
});

// Then create the AIResponderV1 agent with the provider, include InMemoryChache like array of messages
const supportBot = new AIResponderV1({
  provider: openaiProvider, // Official OpenAI model ID
  instructions: 'Friendly customer support assistant'
});

// Or create the AIResponderV2 agent with the provider, include InMemoryChache for messages id's (using openai.response API)
const managerBot = new AIResponderV2({
  provider: openaiProvider,
  instructions: "Friendly manager"
});

// Start conversing with full context support and automatic memory handling
const response = await supportBot.getContextResponse("user-789", "Hi!");
console.log(response.text); // → "Hello! How can I assist you today?"

// Or conversing without context support (one-off query, no memory used)
const responseNoMemory = await supportBot.getContextResponse("user-789", "Hi!", {
  memory: false,
});
console.log(responseNoMemory.text); // → "Hello! How can I assist you today?"

// You can also use AIResponderV1 and V2 instances as tools themselves, to build chains of AI-powered calls:
const cityAgentTool = supportBot.asTool({
  name: "cityAgent",
  description: "An agent expert on cities to answer detailed questions"
});
// Then pass this tool to another agent to orchestrate complex interactions

const managerBot = new AIResponderV2({
  provider: openaiProvider,
  instructions: "Friendly manager",
  tools: {
    cityAgentTool // Pass the support bot as a tool
  }
});

```

### 4. Using `getStructuredObject` with Zod Schemas

The `getStructuredObject` method allows you to get structured responses from the AI by defining a Zod schema for the expected object. This is especially useful when you want to enforce the shape of the response, making it easier to validate and work with.

Example usage with Zod schema:

```typescript
import { z } from "zod";

const userProfileSchema = z.object({
  name: z.string(),
  age: z.number().min(0),
  email: z.string().email(),
});

// Usage with AIResponderV1
const userProfileResponse = await supportBot.getStructuredObject("user-789",
  "Please provide the user profile info.", {
  schemaName: "UserProfile",
  schemaDescription: "A profile object containing name, age, and email",
  schema: userProfileSchema,
});

```

This ensures your model returns data matching the expected structure, reducing errors and improving integration reliability.

## Configuration Guide

```typescript
// Recommended production configuration example
const agentConfig = {
  // REQUIRED CORE SETTINGS
  provider: openaiProvider,  // OpenAI Provider
  instructions: 'Expert financial advisor',  // Defines agent tone and role

  // OPTIONAL SETTINGS FOR PERFORMANCE AND CONTEXT
  lengthOfContext: 20,    // Number of messages to retain in conversation (V1 only)
  maxTokens: 750,         // Limits response length to manage costs
  maxSteps: 4,            // Caps complexity to control response generation time
  cache: {                // Redis recommended for scalable session management
    provider: new Redis(),
    expireTime: 3600      // Session TTL in seconds
  }
};
```

### Configuration Reference

| Property          | Description                          | Default         |
|-------------------|------------------------------------|-----------------|
| **model**         | OpenAI model version                | *Required*      |
| **instructions**  | Agent behavior blueprint            | *Required*      |
| **lengthOfContext**| Number of past messages retained (V1 only) | `10`     |
| **maxTokens**     | Maximum number of tokens per response | `500`         |
| **maxSteps**      | Limits reasoning depth and iterations | `5`           |
| **cache**         | Session storage implementation (Redis recommended) | In-memory |


### Tool Integration Support
- Extend your AI assistant by adding external tools/APIs that can be invoked during conversations
- Allows complex workflows that combine AI with actionable external data or services seamlessly
- Easily use AIResponder agents as tools themselves to build chains of AI reasoning and workflows:

```typescript
import { createOpenAiProvider, AIResponderV1 } from "ai-responder";

const openaiProvider = createOpenAiProvider({ modelId: "gpt-4" });

const cityAgent = new AIResponderV1({
  provider: openaiProvider,
  instructions: "City expert AI agent",
  // config...
});

const mainAgent = new AIResponderV1({
  model: openaiProvider,
  instructions: "Team lead agent managing city experts",
  tools: { cityAgent },
});
```
This enables creating complex sequences of AI calls by passing agents as tools inside other agents.

## Version Comparison

| Feature          | V1 (Context Master)              | V2 (Speed Focused)                  |
|------------------|---------------------------------|-----------------------------------|
| **Storage**      | Full conversation history cached locally | Uses minimal response IDs (server-side memory) |
| **Memory Use**   | Higher memory overhead due to full message caching | Lean memory footprint by referencing prior responses |
| **Best For**     | Agents requiring rich, detailed dialogues and tool interop | High-volume, low-latency APIs and batch processing |
| **Setup**        | Automatic and simple initialization | Automatic, with streamlined context chaining |

### Real-Time Monitoring & Error Handling
```typescript
agent.catchErrors((eventType, details) => {
  if (eventType === 'error') {
    // Integrate with your monitoring/logging service (e.g. Sentry, Datadog)
    logToSentry(details);
  }
});
```

### Horizontal Scaling with Redis Clusters
```typescript
import Redis from 'ioredis';

const clusterAgent = new AIResponderV1({
  // In memory chache by default, but can be configured to use Redis
  cache: {
    provider: new Redis({
      host: 'redis-cluster',
      tls: { /* TLS config for secure clustering */ }
    }),
    expireTime: 86400 // 24-hour session retention for long-lived conversations
  }
});
```

### Graceful Shutdown and Resource Cleanup
- Automatic cache flushing and connection closure on process termination
- Prevents stale session data and resource leaks in long-running applications

## Extensibility and Customization

- Customize agent behavior with tailored system instructions
- Inject external tools/APIs via the tools option for augmented AI capabilities
- Support for both synchronous and streamed responses (future-ready)

## Contributing

We welcome community contributions! Here's how to help:

1. 🐛 **Report Issues** - Submit GitHub issues to help us improve stability
2. 💡 **Suggest Features** - Join the conversation and suggest enhancements via GitHub Discussions
3. 💻 **Submit Pull Requests** -
   - Fork the repository
   - Create a feature branch (`feat/your-feature`)
   - Add comprehensive tests for new functionality
   - Submit a pull request with clear documentation updates

**Pro Tip:** Please open an issue to discuss major changes before implementation to ensure alignment.

---

**Start Building AI Solutions Today**
📄 [MIT License](LICENSE) • 🔧 Modular, extensible architecture

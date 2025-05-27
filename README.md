# AI Responder Library

**Build Production-Ready AI Agents in Minutes**
⚡ Zero-config TypeScript library with enterprise-grade conversation management and extensible tool integrations

## Why Choose This Library?

- 🚀 **3-Line Agent Setup** - Spin up intelligent AI agents in under 30 seconds
- 🔐 **Secure API Handling** - Automatic environment variable integration with robust error handling
- 🧩 **Context-Aware Dialog** - Advanced conversation management with safe message trimming
- 🔄 **Flexible Memory Modes** - Support for session-based memory or stateless, one-off queries
- 🛡️ **Battle-Tested** - Built-in retry logic, Redis caching, and graceful shutdown mechanisms
- 🛠️ **Extensible Tool Support** - Incorporate external APIs and custom tools within dialogs
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
import { AIResponderV1 } from 'ai-responder';
import 'dotenv/config'; // Node.js only - Bun auto-loads .env

const supportBot = new AIResponderV1({
  model: 'gpt-4o', // Official OpenAI model ID
  instructions: 'Friendly customer support assistant'
});

// Start conversing with full context support
const response = await supportBot.getContextResponse('user-789', 'Hi!');
console.log(response.text); // → "Hello! How can I assist you today?"

// Or conversing without context support (once response)
const response = await supportBot.getContextResponse('user-789', 'Hi!'. {
  memory: false // Disable context memory for this query
});
console.log(response.text); // → "Hello! How can I assist you today?"
```

## Configuration Guide

```typescript
// Recommended production configuration example
const agentConfig = {
  // REQUIRED CORE SETTINGS
  model: 'gpt-4.1-mini',  // OpenAI model version
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

## Key Features

### Enterprise-Grade Security and Reliability
```typescript
// Automatic .env environment handling for safe API key injection
const secureAgent = new AIResponderV1({
  model: 'gpt-4',
  instructions: 'PCI-compliant payment assistant'
});
```

### Intelligent and Extensible Caching
```typescript
// Zero-config in-memory cache for development and quick prototyping
const devAgent = new AIResponderV1({/* config */});

// Production-grade Redis cluster support with TLS encryption
import Redis from 'ioredis';
const prodAgent = new AIResponderV1({
  cache: {
    provider: new Redis({
      host: 'redis-prod',
      tls: { /* secure TLS config here */ }
    }),
    expireTime: 7200 // Sessions expire after 2 hours
  }
});
```

### Tool Integration Support
- Extend your AI assistant by adding external tools/APIs that can be invoked during conversations
- Allows complex workflows that combine AI with actionable external data or services seamlessly

## Version Comparison

| Feature          | V1 (Context Master)              | V2 (Speed Focused)                  |
|------------------|---------------------------------|-----------------------------------|
| **Storage**      | Full conversation history cached locally | Uses minimal response IDs (server-side memory) |
| **Memory Use**   | Higher memory overhead due to full message caching | Lean memory footprint by referencing prior responses |
| **Best For**     | Agents requiring rich, detailed dialogues and tool interop | High-volume, low-latency APIs and batch processing |
| **Setup**        | Automatic and simple initialization | Automatic, with streamlined context chaining |

```typescript
// V2: High-speed, low-memory query agent example
const fastAgent = new AIResponderV2({
  model: 'gpt-4-turbo',
  instructions: 'High-speed query resolver'
});
```

## Production Essentials

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

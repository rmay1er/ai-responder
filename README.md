# AI Responder Library

**Build Production-Ready AI Agents in Minutes**
⚡ Zero-config TypeScript library with enterprise-grade conversation management

## Why Choose This Library?

- 🚀 **3-Line Agent Setup** - From zero to AI in 30 seconds
- 🔐 **Secure API Handling** - Automatic environment variable integration
- 🧩 **Context-Aware Dialog** - Smart history management out-of-the-box
- 🛡️ **Battle-Tested** - Built-in error recovery & Redis caching
- 📦 **MIT Licensed** - Free for commercial use and customization

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

// Start conversing!
const response = await supportBot.getContextResponse('user-789', 'Hi!');
console.log(response.text); // → "Hello! How can I assist you today?"
```

## Configuration Guide

```typescript
// Optimal production configuration
const agentConfig = {
  // REQUIRED CORE SETTINGS
  model: 'gpt-4-turbo', // OpenAI model ID
  instructions: 'Expert financial advisor', // Agent personality

  // OPTIONAL OPTIMIZATIONS
  lengthOfContext: 20,    // Messages to retain (V1 only)
  maxTokens: 750,         // Prevent verbose responses
  maxSteps: 4,            // Control reasoning depth
  cache: {                // Redis recommended for production
    provider: new Redis({ host: 'redis.prod' }),
    expireTime: 3600      // Session TTL in seconds
  }
};
```

### Configuration Reference

| Property | Description | Default |
|----------|-------------|---------|
| **model** | OpenAI model version | *Required* |
| **instructions** | Agent behavior blueprint | *Required* |
| **lengthOfContext** | Historical message limit (V1) | `10` |
| **maxTokens** | Response length limiter | `500` |
| **maxSteps** | Reasoning complexity cap | `5` |
| **cache** | Session storage solution | In-memory |

## Key Features

### Enterprise-Grade Security
```typescript
// Automatic .env handling
const secureAgent = new AIResponderV1({
  model: 'gpt-4',
  instructions: 'PCI-compliant payment assistant'
});
```

### Intelligent Caching
```typescript
// Zero-config in-memory cache
const devAgent = new AIResponderV1({/* config */});

// Production Redis integration
import Redis from 'ioredis';
const prodAgent = new AIResponderV1({
  cache: {
    provider: new Redis(), // Cluster-ready
    expireTime: 7200 // 2-hour sessions
  }
});
```

## Version Comparison

| Feature | V1 (Context Master) | V2 (Speed Focused) |
|---------|----------------------|---------------------|
| **Storage** | Full conversation history | Response IDs only |
| **Memory Use** | Higher | Minimal |
| **Best For** | Complex workflows | High-throughput APIs |
| **Setup** | Automatic | Automatic |

```typescript
// V2 Lightning Example
const fastAgent = new AIResponderV2({
  model: 'gpt-4-turbo',
  instructions: 'High-speed query resolver'
});
```

## Production Essentials

### Real-Time Monitoring
```typescript
agent.catchErrors((eventType, details) => {
  if (eventType === 'error') {
    logToSentry(details);
  }
});
```

### Horizontal Scaling
```typescript
import Redis from 'ioredis';

const clusterAgent = new AIResponderV1({
  cache: {
    provider: new Redis({
      host: 'redis-cluster',
      tls: { /* TLS config */ }
    }),
    expireTime: 86400 // 24h retention
  }
});
```

## Contributing

We welcome community contributions! Here's how to help:

1. 🐛 **Report Issues** - Open GitHub tickets for bugs
2. 💡 **Suggest Features** - Propose enhancements via Discussions
3. 👩💻 **Submit PRs** - Follow these steps:
   - Fork repository
   - Create feature branch (`feat/your-feature`)
   - Add tests for new functionality
   - Submit pull request with documentation updates

**Pro Tip:** Discuss major changes via Issues before coding!

---

**Start Building AI Solutions Today**
📄 [MIT License](LICENSE) • 🔧 Extensible Architecture • 🚀 Enterprise-Ready Foundation

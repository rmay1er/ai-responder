# AI Responder Library

The AI Responder library is a powerful TypeScript-based solution for managing AI-powered conversations with built-in session management, caching, and error handling. It provides a structured way to interact with AI models while maintaining conversation context and handling various system events.

## Features

- **Contextual Conversations**: Maintains conversation context using session-based caching
- **Streaming Support**: Provides real-time streaming of AI responses
- **Tool Integration**: Supports custom tools for extended functionality
- **Error Handling**: Comprehensive error handling and system event management
- **Cache Management**: Built-in caching with expiration and cleanup
- **Session Management**: Automatic session trimming and expiration

## Installation

Install the package using npm:

```bash
bun install ai-responder
```

## Usage

### Basic Setup

```typescript
import { AIResponder } from 'ai-responder';
import { InMemoryCache } from 'ai-responder';

const responder = new AIResponder({
  model: 'gpt-4',
  instructions: 'You are a helpful assistant.',
  cache: {
    provider: new InMemoryCache(),
    expireTime: 3600, // 1 hour
  },
});
```

### Getting a Contextual Response

```typescript
const response = await responder.getContextResponse('user-123', 'Hello!');
console.log(response.text);
```

### Streaming a Response

```typescript
const streamResponse = await responder.getStreamedContextResponse('user-123', 'Tell me a story');
console.log(streamResponse.text);
```

### Error Handling

```typescript
responder.catchErrors((type, data) => {
  switch (type) {
    case 'error':
      console.error('Error:', data);
      break;
    case 'connect':
      console.log(data);
      break;
    // Handle other event types
  }
});
```

## API Reference

### `AIResponder(config: AIResponderConfig)`

Main class for handling AI responses.

#### Configuration Options

- `model`: The AI model identifier to use
- `instructions`: System instructions for the AI
- `tools`: Optional set of tools for the AI to use
- `cache`: Cache configuration
  - `provider`: Cache provider instance
  - `expireTime`: Cache expiration time in seconds

### Methods

#### `getContextResponse(userId: string, prompt: string): Promise<any>`

Gets a context-based response from the AI model.

- `userId`: Unique identifier for the user session
- `prompt`: User's input prompt

#### `getStreamedContextResponse(userId: string, prompt: string): Promise<any>`

Gets a streamed context-based response from the AI model.

#### `formatToolResponse(response): string | undefined`

Formats tool responses into a readable string.

#### `catchErrors(handler: (type: string, data: any) => void): void`

Sets up a universal error handler for the responder.

## Cache Providers

The library supports multiple cache providers:

- `InMemoryCache`: Built-in in-memory cache
- `Redis`: Use with ioredis package

```typescript
import { Redis } from 'ioredis';

const redisCache = new Redis();
const responder = new AIResponder({
  // ... other config
  cache: {
    provider: redisCache,
    expireTime: 3600,
  },
});
```

## Error Handling Events

The error handler can receive the following event types:

- `error`: General errors
- `connect`: Cache connection established
- `reconnecting`: Cache reconnecting
- `end`: Cache connection closed
- `clean`: Cache cleanup complete

## Best Practices

1. Use unique user IDs for session management
2. Set appropriate cache expiration times based on your application needs
3. Implement proper error handling using `catchErrors`
4. Monitor cache connection states
5. Use streaming for long-running responses

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request

## License

MIT License

## Support

For support, please open an issue on the GitHub repository.

---

This library provides a robust foundation for building AI-powered conversational interfaces with proper session management and error handling. It's designed to be flexible and extensible while maintaining a simple API surface.

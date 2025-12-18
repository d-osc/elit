import { createState, computed, reactive, div, button, span, h2, h3, p, ul, li, strong, pre, code, type VNode } from 'elit';
import { codeBlock } from '../../highlight';

// AI Chat Demo Component
export const AIChatDemo = () => {
  interface Message {
    id: number;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    isStreaming?: boolean;
  }

  interface Conversation {
    id: string;
    title: string;
    messages: Message[];
    createdAt: Date;
  }

  // State
  const conversations = createState<Conversation[]>([
    {
      id: 'conv-1',
      title: 'Welcome Chat',
      messages: [
        {
          id: 1,
          role: 'system',
          content: 'AI Assistant initialized. How can I help you today?',
          timestamp: new Date(Date.now() - 60000)
        }
      ],
      createdAt: new Date(Date.now() - 60000)
    }
  ]);

  const currentConversationId = createState('conv-1');
  const messageInput = createState('');
  const isTyping = createState(false);
  const streamingText = createState('');
  const showSettings = createState(false);
  const temperature = createState(0.7);
  const maxTokens = createState(150);

  let nextMessageId = 2;
  let nextConvId = 2;

  // Sample AI responses for demo
  const aiResponses = [
    "I'm a demo AI assistant built with Elit framework. I can help you understand reactive state management!",
    "That's an interesting question! Reactive programming allows UI to automatically update when state changes.",
    "Let me explain: computed state derives values from other states and updates automatically when dependencies change.",
    "Great point! The key is using immutable updates - always create new objects/arrays instead of modifying existing ones.",
    "I see what you mean. Event handlers can update state, which triggers reactive re-renders of affected components.",
    "Exactly! This pattern helps separate business logic from presentation, making code more maintainable.",
    "Think of it like this: state is the source of truth, and reactive components are subscribers that update automatically.",
    "Good question! You can use computed() for derived state, and reactive() for components that respond to state changes.",
    "Yes! You can nest components, pass state as props, and compose complex UIs from simple reactive building blocks.",
    "That's the beauty of reactive programming - declarative, predictable, and easy to reason about!"
  ];

  // Computed states
  const currentConversation = computed([conversations, currentConversationId], (convs, id) =>
    convs.find(c => c.id === id)
  );

  const allMessages = computed([currentConversation], (conv) =>
    conv ? conv.messages : []
  );

  const conversationList = computed([conversations], (convs) =>
    [...convs].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  );

  const messageCount = computed([allMessages], (msgs) => msgs.length);

  // Format timestamp
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  // Simulate AI streaming response
  const simulateAIResponse = (userMessage: string) => {
    isTyping.value = true;
    streamingText.value = '';

    // Select a random response
    const responseText = aiResponses[Math.floor(Math.random() * aiResponses.length)];
    const words = responseText.split(' ');
    let currentIndex = 0;

    const streamInterval = setInterval(() => {
      if (currentIndex < words.length) {
        streamingText.value = streamingText.value + (currentIndex > 0 ? ' ' : '') + words[currentIndex];
        currentIndex++;
      } else {
        clearInterval(streamInterval);

        // Add complete message
        const conv = currentConversation.value;
        if (conv) {
          const updatedConv = {
            ...conv,
            messages: [
              ...conv.messages,
              {
                id: nextMessageId++,
                role: 'assistant' as const,
                content: streamingText.value,
                timestamp: new Date()
              }
            ]
          };

          conversations.value = conversations.value.map(c =>
            c.id === conv.id ? updatedConv : c
          );
        }

        isTyping.value = false;
        streamingText.value = '';

        // Auto-scroll to bottom
        setTimeout(() => {
          const container = document.querySelector('[data-chat-messages]');
          if (container) {
            container.scrollTop = container.scrollHeight;
          }
        }, 50);
      }
    }, 50);
  };

  // Send message
  const sendMessage = () => {
    const text = messageInput.value.trim();
    if (!text || isTyping.value) return;

    const conv = currentConversation.value;
    if (!conv) return;

    // Add user message
    const userMessage: Message = {
      id: nextMessageId++,
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    const updatedConv = {
      ...conv,
      messages: [...conv.messages, userMessage],
      title: conv.messages.length === 1 ? text.slice(0, 30) + (text.length > 30 ? '...' : '') : conv.title
    };

    conversations.value = conversations.value.map(c =>
      c.id === conv.id ? updatedConv : c
    );

    messageInput.value = '';

    // Auto-scroll to bottom
    setTimeout(() => {
      const container = document.querySelector('[data-chat-messages]');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 50);

    // Simulate AI response
    setTimeout(() => simulateAIResponse(text), 500);
  };

  // Create new conversation
  const newConversation = () => {
    const newConv: Conversation = {
      id: `conv-${nextConvId++}`,
      title: 'New Chat',
      messages: [
        {
          id: nextMessageId++,
          role: 'system',
          content: 'AI Assistant initialized. How can I help you today?',
          timestamp: new Date()
        }
      ],
      createdAt: new Date()
    };

    conversations.value = [...conversations.value, newConv];
    currentConversationId.value = newConv.id;
  };

  // Delete conversation
  const deleteConversation = (convId: string) => {
    const remaining = conversations.value.filter(c => c.id !== convId);

    if (remaining.length === 0) {
      // Create a new conversation if all are deleted
      newConversation();
    } else {
      conversations.value = remaining;
      if (currentConversationId.value === convId) {
        currentConversationId.value = remaining[0].id;
      }
    }
  };

  // Clear current conversation
  const clearConversation = () => {
    const conv = currentConversation.value;
    if (!conv) return;

    const clearedConv = {
      ...conv,
      messages: [
        {
          id: nextMessageId++,
          role: 'system' as const,
          content: 'Conversation cleared. How can I help you today?',
          timestamp: new Date()
        }
      ]
    };

    conversations.value = conversations.value.map(c =>
      c.id === conv.id ? clearedConv : c
    );
  };

  // Copy message
  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content).catch(() => {
      // Fallback for browsers that don't support clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    });
  };

  return div({ style: 'display: flex; height: 650px; background: var(--bg); border: 2px solid var(--border); border-radius: 12px; overflow: hidden;' },
    // Sidebar - Conversations
    div({ style: 'width: 280px; background: var(--bg-card); border-right: 2px solid var(--border); display: flex; flex-direction: column;' },
      // New Chat Button
      div({ style: 'padding: 1rem; border-bottom: 2px solid var(--border);' },
        button({
          onclick: newConversation,
          style: `
            width: 100%;
            padding: 0.875rem;
            border-radius: 8px;
            border: none;
            background: var(--primary);
            color: white;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            transition: opacity 0.2s;
          `
        }, '➕ New Chat')
      ),

      // Conversations List
      div({ style: 'flex: 1; overflow-y: auto; padding: 0.5rem;' },
        reactive(conversationList, (convs) =>
          div({ style: 'display: flex; flex-direction: column; gap: 0.25rem;' },
            ...convs.map(conv =>
              reactive(currentConversationId, (activeId) =>
                div({
                  style: `
                    position: relative;
                    padding: 0.875rem;
                    border-radius: 8px;
                    background: ${activeId === conv.id ? 'var(--primary)' : 'transparent'};
                    color: ${activeId === conv.id ? 'white' : 'var(--text-primary)'};
                    cursor: pointer;
                    transition: all 0.2s;
                  `,
                  onclick: () => { currentConversationId.value = conv.id; }
                },
                  div({ style: 'font-weight: 600; font-size: 0.875rem; margin-bottom: 0.25rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;' },
                    conv.title
                  ),
                  div({ style: 'display: flex; justify-content: space-between; align-items: center;' },
                    div({ style: `font-size: 0.75rem; opacity: ${activeId === conv.id ? '0.9' : '0.6'};` },
                      `${conv.messages.length} messages`
                    ),
                    button({
                      onclick: (e: Event) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      },
                      style: `
                        padding: 0.25rem;
                        border: none;
                        background: transparent;
                        color: ${activeId === conv.id ? 'white' : '#ef4444'};
                        cursor: pointer;
                        font-size: 0.875rem;
                        opacity: 0.7;
                      `
                    }, '🗑️')
                  )
                )
              )
            )
          )
        )
      ),

      // Settings Toggle
      div({ style: 'padding: 1rem; border-top: 2px solid var(--border);' },
        reactive(showSettings, (show) =>
          button({
            onclick: () => { showSettings.value = !showSettings.value; },
            style: `
              width: 100%;
              padding: 0.75rem;
              border-radius: 8px;
              border: 2px solid var(--border);
              background: ${show ? 'var(--primary)' : 'var(--bg)'};
              color: ${show ? 'white' : 'var(--text-primary)'};
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s;
            `
          }, `⚙️ Settings`)
        )
      )
    ),

    // Main Chat Area
    div({ style: 'flex: 1; display: flex; flex-direction: column;' },
      // Chat Header
      reactive(currentConversation, (conv) =>
        conv
          ? div({
              style: `
                padding: 1rem 1.5rem;
                border-bottom: 2px solid var(--border);
                background: var(--bg-card);
                display: flex;
                justify-content: space-between;
                align-items: center;
              `
            },
              div(
                div({ style: 'font-weight: 600; font-size: 1.125rem;' }, conv.title),
                reactive(messageCount, (count) =>
                  div({ style: 'font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;' },
                    `${count} messages • ${formatTime(conv.createdAt)}`
                  )
                )
              ),
              button({
                onclick: clearConversation,
                style: `
                  padding: 0.5rem 1rem;
                  border-radius: 6px;
                  border: 2px solid var(--border);
                  background: var(--bg);
                  color: var(--text-primary);
                  font-weight: 600;
                  font-size: 0.875rem;
                  cursor: pointer;
                `
              }, '🗑️ Clear')
            )
          : null
      ),

      // Messages Container
      div({
        'data-chat-messages': 'true',
        style: 'flex: 1; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem;'
      },
        reactive(allMessages, (msgs) =>
          div({ style: 'display: flex; flex-direction: column; gap: 1.5rem;' },
            ...msgs.map(message =>
              div({
                style: `
                  display: flex;
                  ${message.role === 'user' ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}
                `
              },
                div({
                  style: `
                    max-width: 75%;
                    ${message.role === 'system' ? 'width: 100%; max-width: 100%; text-align: center;' : ''}
                  `
                },
                  message.role === 'system'
                    ? div({
                        style: `
                          padding: 0.5rem 1rem;
                          background: var(--bg-card);
                          border: 1px dashed var(--border);
                          border-radius: 8px;
                          font-size: 0.875rem;
                          color: var(--text-muted);
                          font-style: italic;
                        `
                      }, message.content)
                    : div(
                        div({
                          style: `
                            display: flex;
                            align-items: center;
                            gap: 0.5rem;
                            margin-bottom: 0.5rem;
                          `
                        },
                          div({
                            style: `
                              width: 32px;
                              height: 32px;
                              border-radius: 50%;
                              background: ${message.role === 'user' ? 'var(--primary)' : 'linear-gradient(135deg, #667eea, #764ba2)'};
                              display: flex;
                              align-items: center;
                              justify-content: center;
                              color: white;
                              font-weight: 600;
                              font-size: 0.875rem;
                            `
                          }, message.role === 'user' ? 'You' : '🤖'),
                          div({ style: 'font-size: 0.75rem; color: var(--text-muted);' }, formatTime(message.timestamp))
                        ),
                        div({
                          style: `
                            padding: 1rem 1.25rem;
                            border-radius: 12px;
                            background: ${message.role === 'user' ? 'var(--primary)' : 'var(--bg-card)'};
                            color: ${message.role === 'user' ? 'white' : 'var(--text-primary)'};
                            border: ${message.role === 'user' ? 'none' : '1px solid var(--border)'};
                            line-height: 1.6;
                            position: relative;
                          `
                        },
                          message.content,
                          message.role === 'assistant'
                            ? div({ style: 'margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--border);' },
                                button({
                                  onclick: () => copyMessage(message.content),
                                  style: `
                                    padding: 0.375rem 0.75rem;
                                    border-radius: 6px;
                                    border: 1px solid var(--border);
                                    background: var(--bg);
                                    color: var(--text-primary);
                                    font-size: 0.75rem;
                                    cursor: pointer;
                                  `
                                }, '📋 Copy')
                              )
                            : null
                        )
                      )
                )
              )
            )
          )
        ),

        // Streaming indicator
        reactive(isTyping, (typing) =>
          typing
            ? div({ style: 'display: flex; justify-content: flex-start;' },
                div({ style: 'max-width: 75%;' },
                  div({ style: 'display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;' },
                    div({
                      style: `
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        background: linear-gradient(135deg, #667eea, #764ba2);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                      `
                    }, '🤖'),
                    div({ style: 'font-size: 0.75rem; color: var(--text-muted);' }, 'AI is typing...')
                  ),
                  reactive(streamingText, (text) =>
                    div({
                      style: `
                        padding: 1rem 1.25rem;
                        border-radius: 12px;
                        background: var(--bg-card);
                        color: var(--text-primary);
                        border: 1px solid var(--border);
                        line-height: 1.6;
                      `
                    }, text || '...')
                  )
                )
              )
            : null
        )
      ),

      // Settings Panel
      reactive(showSettings, (show) =>
        show
          ? div({
              style: `
                padding: 1rem 1.5rem;
                border-top: 2px solid var(--border);
                background: var(--bg-card);
              `
            },
              div({ style: 'font-weight: 600; margin-bottom: 1rem;' }, '⚙️ AI Settings'),

              // Temperature
              div({ style: 'margin-bottom: 1rem;' },
                div({ style: 'display: flex; justify-content: space-between; margin-bottom: 0.5rem;' },
                  span({ style: 'font-size: 0.875rem; font-weight: 600;' }, 'Temperature'),
                  reactive(temperature, (temp) =>
                    span({ style: 'font-size: 0.875rem; color: var(--text-muted);' }, String(temp.toFixed(1)))
                  )
                ),
                div({
                  contentEditable: 'true',
                  style: `
                    padding: 0.5rem;
                    border: 2px solid var(--border);
                    border-radius: 6px;
                    background: var(--bg);
                    font-size: 0.875rem;
                  `,
                  oninput: (e: Event) => {
                    const val = parseFloat((e.target as HTMLElement).textContent || '0.7');
                    temperature.value = Math.max(0, Math.min(2, val));
                  }
                }, String(temperature.value))
              ),

              // Max Tokens
              div(
                div({ style: 'display: flex; justify-content: space-between; margin-bottom: 0.5rem;' },
                  span({ style: 'font-size: 0.875rem; font-weight: 600;' }, 'Max Tokens'),
                  reactive(maxTokens, (tokens) =>
                    span({ style: 'font-size: 0.875rem; color: var(--text-muted);' }, String(tokens))
                  )
                ),
                div({
                  contentEditable: 'true',
                  style: `
                    padding: 0.5rem;
                    border: 2px solid var(--border);
                    border-radius: 6px;
                    background: var(--bg);
                    font-size: 0.875rem;
                  `,
                  oninput: (e: Event) => {
                    const val = parseInt((e.target as HTMLElement).textContent || '150');
                    maxTokens.value = Math.max(50, Math.min(1000, val));
                  }
                }, String(maxTokens.value))
              )
            )
          : null
      ),

      // Message Input
      div({ style: 'padding: 1rem 1.5rem; border-top: 2px solid var(--border); background: var(--bg-card);' },
        div({ style: 'display: flex; gap: 0.75rem; align-items: flex-end;' },
          div({
            contentEditable: 'true',
            style: `
              flex: 1;
              padding: 0.875rem;
              border: 2px solid var(--border);
              border-radius: 8px;
              background: var(--bg);
              color: var(--text-primary);
              outline: none;
              min-height: 48px;
              max-height: 120px;
              overflow-y: auto;
            `,
            oninput: (e: Event) => {
              messageInput.value = (e.target as HTMLElement).textContent || '';
            },
            onkeydown: (e: KeyboardEvent) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
                (e.target as HTMLElement).textContent = '';
              }
            },
            'data-placeholder': messageInput.value ? '' : 'Type your message... (Enter to send, Shift+Enter for new line)'
          }),

          reactive(isTyping, (typing) =>
            button({
              onclick: sendMessage,
              disabled: typing || !messageInput.value.trim(),
              style: `
                padding: 0.875rem 1.5rem;
                border: none;
                border-radius: 8px;
                background: ${typing || !messageInput.value.trim() ? 'var(--border)' : 'var(--primary)'};
                color: white;
                font-weight: 600;
                cursor: ${typing || !messageInput.value.trim() ? 'not-allowed' : 'pointer'};
                transition: all 0.2s;
              `
            }, '📤 Send')
          )
        )
      )
    )
  );
};

// AI Chat source code examples
const aiChatStateExample = `import { createState, computed, reactive, div, button } from 'elit';

interface Message {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

// State
const conversations = createState<Conversation[]>([]);
const currentConversationId = createState('conv-1');
const messageInput = createState('');
const isTyping = createState(false);
const streamingText = createState('');

// Computed states
const currentConversation = computed(
  [conversations, currentConversationId],
  (convs, id) => convs.find(c => c.id === id)
);

const allMessages = computed([currentConversation], (conv) =>
  conv ? conv.messages : []
);`;

const aiChatStreamingExample = `// Simulate AI streaming response
const simulateAIResponse = (userMessage: string) => {
  isTyping.value = true;
  streamingText.value = '';

  const responseText = "Your AI response here...";
  const words = responseText.split(' ');
  let currentIndex = 0;

  const streamInterval = setInterval(() => {
    if (currentIndex < words.length) {
      streamingText.value = streamingText.value +
        (currentIndex > 0 ? ' ' : '') + words[currentIndex];
      currentIndex++;
    } else {
      clearInterval(streamInterval);

      // Add complete message
      const conv = currentConversation.value;
      if (conv) {
        const updatedConv = {
          ...conv,
          messages: [
            ...conv.messages,
            {
              id: nextMessageId++,
              role: 'assistant' as const,
              content: streamingText.value,
              timestamp: new Date()
            }
          ]
        };

        conversations.value = conversations.value.map(c =>
          c.id === conv.id ? updatedConv : c
        );
      }

      isTyping.value = false;
      streamingText.value = '';
    }
  }, 50); // Stream word by word
};`;

const aiChatMessagingExample = `// Send message
const sendMessage = () => {
  const text = messageInput.value.trim();
  if (!text || isTyping.value) return;

  const conv = currentConversation.value;
  if (!conv) return;

  // Add user message
  const userMessage: Message = {
    id: nextMessageId++,
    role: 'user',
    content: text,
    timestamp: new Date()
  };

  const updatedConv = {
    ...conv,
    messages: [...conv.messages, userMessage],
    title: conv.messages.length === 1
      ? text.slice(0, 30) + (text.length > 30 ? '...' : '')
      : conv.title
  };

  conversations.value = conversations.value.map(c =>
    c.id === conv.id ? updatedConv : c
  );

  messageInput.value = '';

  // Trigger AI response
  setTimeout(() => simulateAIResponse(text), 500);
};

// Create new conversation
const newConversation = () => {
  const newConv: Conversation = {
    id: \`conv-\${nextConvId++}\`,
    title: 'New Chat',
    messages: [
      {
        id: nextMessageId++,
        role: 'system',
        content: 'AI Assistant initialized.',
        timestamp: new Date()
      }
    ],
    createdAt: new Date()
  };

  conversations.value = [...conversations.value, newConv];
  currentConversationId.value = newConv.id;
};`;

const aiChatRenderExample = `// Render messages with role-based styling
reactive(allMessages, (msgs) =>
  div({ style: 'display: flex; flex-direction: column; gap: 1.5rem;' },
    ...msgs.map(message =>
      div({
        style: \`
          display: flex;
          \${message.role === 'user'
            ? 'justify-content: flex-end;'
            : 'justify-content: flex-start;'}
        \`
      },
        div({ style: 'max-width: 75%;' },
          // Avatar and timestamp
          div({ style: 'display: flex; align-items: center; gap: 0.5rem;' },
            div({
              style: \`
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: \${message.role === 'user'
                  ? 'var(--primary)'
                  : 'linear-gradient(135deg, #667eea, #764ba2)'};
              \`
            }, message.role === 'user' ? 'You' : '🤖')
          ),

          // Message bubble
          div({
            style: \`
              padding: 1rem 1.25rem;
              border-radius: 12px;
              background: \${message.role === 'user'
                ? 'var(--primary)'
                : 'var(--bg-card)'};
              color: \${message.role === 'user'
                ? 'white'
                : 'var(--text-primary)'};
            \`
          }, message.content)
        )
      )
    )
  )
);

// Streaming indicator
reactive(isTyping, (typing) =>
  typing
    ? div(
        div({ style: 'display: flex; align-items: center; gap: 0.5rem;' },
          div('🤖'),
          div('AI is typing...')
        ),
        reactive(streamingText, (text) =>
          div({ style: 'padding: 1rem; background: var(--bg-card);' },
            text || '...'
          )
        )
      )
    : null
);`;

// AI Chat Content
export const AIChatContent: VNode = div(
  // Demo
  div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 2rem; margin-bottom: 3rem;' },
    h2({ style: 'margin: 0 0 2rem 0; font-size: 1.75rem;' }, '🤖 Try the AI Chat'),
    AIChatDemo()
  ),

  // Overview
  div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 2rem; margin-bottom: 3rem;' },
    h2({ style: 'margin: 0 0 1rem 0; font-size: 1.75rem;' }, '📖 Overview'),
    p({ style: 'color: var(--text-muted); margin-bottom: 2rem; line-height: 1.8;' },
      'This AI Chat Application demonstrates conversational AI interface with streaming responses, ',
      'multiple conversations, message history, settings management, and copy functionality using Elit\'s reactive state system.'
    ),

    // Key Features
    div({ style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;' },
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '💬 Streaming Responses'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Real-time word-by-word streaming of AI responses with typing indicators'
        )
      ),
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '📚 Multiple Conversations'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Manage multiple chat threads with automatic title generation'
        )
      ),
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '🕒 Message History'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Persistent conversation history with timestamps and message counts'
        )
      ),
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '⚙️ Settings Panel'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Adjustable AI parameters like temperature and max tokens'
        )
      ),
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '📋 Copy Messages'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'One-click copying of AI responses to clipboard'
        )
      ),
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '🎨 Role-based Styling'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Different visual styles for user, assistant, and system messages'
        )
      )
    )
  ),

  // Source Code
  div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 2rem; margin-bottom: 3rem;' },
    h2({ style: 'margin: 0 0 1.5rem 0; font-size: 1.75rem;' }, '💻 Source Code'),

    h3({ style: 'margin: 2rem 0 1rem 0; font-size: 1.25rem; color: var(--primary);' }, '1. State Management'),
    pre({ style: 'margin: 0 0 2rem 0;' }, code(...codeBlock(aiChatStateExample))),

    h3({ style: 'margin: 2rem 0 1rem 0; font-size: 1.25rem; color: var(--primary);' }, '2. Streaming Responses'),
    pre({ style: 'margin: 0 0 2rem 0;' }, code(...codeBlock(aiChatStreamingExample))),

    h3({ style: 'margin: 2rem 0 1rem 0; font-size: 1.25rem; color: var(--primary);' }, '3. Message Handling'),
    pre({ style: 'margin: 0 0 2rem 0;' }, code(...codeBlock(aiChatMessagingExample))),

    h3({ style: 'margin: 2rem 0 1rem 0; font-size: 1.25rem; color: var(--primary);' }, '4. Message Rendering'),
    pre({ style: 'margin: 0;' }, code(...codeBlock(aiChatRenderExample)))
  ),

  // Key Learnings
  div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 2rem;' },
    h2({ style: 'margin: 0 0 1.5rem 0; font-size: 1.75rem;' }, '🎓 Key Learnings'),
    ul({ style: 'margin: 0; padding-left: 1.5rem; line-height: 2; color: var(--text-muted);' },
      li(strong('Streaming simulation:'), ' Using setInterval to create word-by-word streaming effect'),
      li(strong('Conversation management:'), ' Managing multiple chat threads with unique IDs'),
      li(strong('Computed filtering:'), ' Deriving current conversation and messages from conversations array'),
      li(strong('Message roles:'), ' Handling different message types (user, assistant, system) with conditional styling'),
      li(strong('Auto-scrolling:'), ' Using setTimeout and DOM queries to scroll to latest message'),
      li(strong('Typing indicators:'), ' Showing real-time streaming text while AI is responding'),
      li(strong('Clipboard API:'), ' Implementing copy functionality with fallback for older browsers'),
      li(strong('Dynamic titles:'), ' Auto-generating conversation titles from first user message'),
      li(strong('Settings state:'), ' Managing AI parameters (temperature, max tokens) with reactive updates'),
      li(strong('Keyboard shortcuts:'), ' Enter to send, Shift+Enter for new line'),
      li(strong('Conditional rendering:'), ' Showing/hiding settings panel and typing indicator based on state'),
      li(strong('Array mutations:'), ' Immutably updating conversations array when adding messages'),
      li(strong('Timestamp formatting:'), ' Relative time display (just now, 5m ago, etc.)'),
      li(strong('Conversation deletion:'), ' Removing conversations with automatic fallback creation'),
      li(strong('Message history:'), ' Maintaining full conversation context with timestamps')
    )
  )
);

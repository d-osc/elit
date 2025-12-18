import { createState, computed, reactive, div, button, span, h2, h3, p, ul, li, strong, pre, code, type VNode } from 'elit';
import { codeBlock } from '../../highlight';

// Chat App Demo Component
export const ChatAppDemo = () => {
  interface Message {
    id: number;
    userId: string;
    userName: string;
    text: string;
    timestamp: Date;
    roomId: string;
  }

  interface User {
    id: string;
    name: string;
    avatar: string;
    status: 'online' | 'away' | 'offline';
  }

  interface Room {
    id: string;
    name: string;
    emoji: string;
  }

  // Sample users
  const users: User[] = [
    { id: 'user1', name: 'Alice', avatar: '👩', status: 'online' },
    { id: 'user2', name: 'Bob', avatar: '👨', status: 'online' },
    { id: 'user3', name: 'Charlie', avatar: '🧑', status: 'away' },
    { id: 'user4', name: 'Diana', avatar: '👩‍🦰', status: 'online' }
  ];

  const rooms: Room[] = [
    { id: 'general', name: 'General', emoji: '💬' },
    { id: 'random', name: 'Random', emoji: '🎲' },
    { id: 'tech', name: 'Tech Talk', emoji: '💻' },
    { id: 'gaming', name: 'Gaming', emoji: '🎮' }
  ];

  // State
  const currentUserId = createState('user1');
  const currentRoomId = createState('general');
  const messages = createState<Message[]>([
    {
      id: 1,
      userId: 'user2',
      userName: 'Bob',
      text: 'Hey everyone! 👋',
      timestamp: new Date(Date.now() - 300000),
      roomId: 'general'
    },
    {
      id: 2,
      userId: 'user3',
      userName: 'Charlie',
      text: 'Hi Bob! How are you doing?',
      timestamp: new Date(Date.now() - 240000),
      roomId: 'general'
    },
    {
      id: 3,
      userId: 'user2',
      userName: 'Bob',
      text: 'I\'m great! Just working on a new project.',
      timestamp: new Date(Date.now() - 180000),
      roomId: 'general'
    },
    {
      id: 4,
      userId: 'user4',
      userName: 'Diana',
      text: 'Anyone up for a game later? 🎮',
      timestamp: new Date(Date.now() - 120000),
      roomId: 'gaming'
    }
  ]);

  const messageInput = createState('');
  const typingUsers = createState<Set<string>>(new Set());
  const showEmojiPicker = createState(false);
  const onlineUsers = createState<Set<string>>(new Set(['user1', 'user2', 'user4']));

  let nextMessageId = 5;
  let typingTimeout: any = null;

  const emojis = ['😀', '😂', '❤️', '👍', '🎉', '🔥', '✨', '👋', '🤔', '😎', '💯', '🚀'];

  // Computed states
  const currentUser = computed([currentUserId], (userId) =>
    users.find(u => u.id === userId)
  );

  const currentRoom = computed([currentRoomId], (roomId) =>
    rooms.find(r => r.id === roomId)
  );

  const roomMessages = computed([messages, currentRoomId], (msgs, roomId) =>
    msgs
      .filter(m => m.roomId === roomId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  );

  const unreadCounts = computed([messages, currentRoomId], (msgs, activeRoomId) => {
    const counts: Record<string, number> = {};
    rooms.forEach(room => {
      if (room.id !== activeRoomId) {
        counts[room.id] = msgs.filter(m => m.roomId === room.id).length;
      }
    });
    return counts;
  });

  const activeTypingUsers = computed([typingUsers, currentUserId], (typing, userId) =>
    Array.from(typing).filter(id => id !== userId)
  );

  const onlineUsersList = computed([onlineUsers, currentUserId], (online, userId) =>
    users.filter(u => online.has(u.id) && u.id !== userId)
  );

  // Format timestamp
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // Send message
  const sendMessage = () => {
    const text = messageInput.value.trim();
    if (!text) return;

    const user = currentUser.value;
    if (!user) return;

    const newMessage: Message = {
      id: nextMessageId++,
      userId: user.id,
      userName: user.name,
      text,
      timestamp: new Date(),
      roomId: currentRoomId.value
    };

    messages.value = [...messages.value, newMessage];
    messageInput.value = '';

    // Remove from typing users
    const typing = new Set(typingUsers.value);
    typing.delete(user.id);
    typingUsers.value = typing;

    // Auto-scroll to bottom
    setTimeout(() => {
      const messagesContainer = document.querySelector('[data-messages-container]');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, 50);
  };

  // Handle typing
  const handleTyping = (text: string) => {
    messageInput.value = text;

    const user = currentUser.value;
    if (!user) return;

    // Add to typing users
    if (text.trim() && !typingUsers.value.has(user.id)) {
      const typing = new Set(typingUsers.value);
      typing.add(user.id);
      typingUsers.value = typing;
    }

    // Clear existing timeout
    if (typingTimeout) clearTimeout(typingTimeout);

    // Remove from typing after 2 seconds of inactivity
    typingTimeout = setTimeout(() => {
      const typing = new Set(typingUsers.value);
      typing.delete(user.id);
      typingUsers.value = typing;
    }, 2000);
  };

  // Switch room
  const switchRoom = (roomId: string) => {
    currentRoomId.value = roomId;
    messageInput.value = '';
    showEmojiPicker.value = false;

    // Auto-scroll to bottom
    setTimeout(() => {
      const messagesContainer = document.querySelector('[data-messages-container]');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, 50);
  };

  // Insert emoji
  const insertEmoji = (emoji: string) => {
    messageInput.value = messageInput.value + emoji;
    showEmojiPicker.value = false;
  };

  // Delete message
  const deleteMessage = (messageId: number) => {
    messages.value = messages.value.filter(m => m.id !== messageId);
  };

  return div({ style: 'display: flex; height: 600px; background: var(--bg); border: 2px solid var(--border); border-radius: 12px; overflow: hidden;' },
    // Sidebar - Rooms & Users
    div({ style: 'width: 250px; background: var(--bg-card); border-right: 2px solid var(--border); display: flex; flex-direction: column;' },
      // Current User
      reactive(currentUser, (user) =>
        user
          ? div({
              style: `
                padding: 1rem;
                border-bottom: 2px solid var(--border);
                background: linear-gradient(135deg, var(--primary), #667eea);
                color: white;
              `
            },
              div({ style: 'display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;' },
                span({ style: 'font-size: 2rem;' }, user.avatar),
                div(
                  div({ style: 'font-weight: 600; font-size: 1.125rem;' }, user.name),
                  div({ style: 'font-size: 0.75rem; opacity: 0.9;' }, '🟢 Online')
                )
              )
            )
          : null
      ),

      // Rooms List
      div({ style: 'padding: 1rem; border-bottom: 2px solid var(--border);' },
        div({ style: 'font-size: 0.875rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.75rem;' }, 'ROOMS'),
        reactive(currentRoomId, (activeRoomId) =>
          div({ style: 'display: flex; flex-direction: column; gap: 0.25rem;' },
            ...rooms.map(room =>
              div(
                button({
                  onclick: () => switchRoom(room.id),
                  style: `
                    width: 100%;
                    padding: 0.75rem;
                    border: none;
                    border-radius: 6px;
                    background: ${activeRoomId === room.id ? 'var(--primary)' : 'transparent'};
                    color: ${activeRoomId === room.id ? 'white' : 'var(--text-primary)'};
                    text-align: left;
                    cursor: pointer;
                    font-weight: ${activeRoomId === room.id ? '600' : '500'};
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    transition: background 0.2s;
                  `
                },
                  div({ style: 'display: flex; align-items: center; gap: 0.5rem;' },
                    span({ style: 'font-size: 1.125rem;' }, room.emoji),
                    span(room.name)
                  ),
                  reactive(unreadCounts, (counts) =>
                    counts[room.id] && activeRoomId !== room.id
                      ? span({
                          style: `
                            background: #ef4444;
                            color: white;
                            padding: 0.125rem 0.5rem;
                            border-radius: 10px;
                            font-size: 0.75rem;
                            font-weight: 600;
                          `
                        }, String(counts[room.id]))
                      : null
                  )
                )
              )
            )
          )
        )
      ),

      // Online Users
      div({ style: 'padding: 1rem; flex: 1; overflow-y: auto;' },
        div({ style: 'font-size: 0.875rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.75rem;' }, 'ONLINE USERS'),
        reactive(onlineUsersList, (usersList) =>
          div({ style: 'display: flex; flex-direction: column; gap: 0.5rem;' },
            ...usersList.map(user =>
              div({
                style: `
                  display: flex;
                  align-items: center;
                  gap: 0.5rem;
                  padding: 0.5rem;
                  border-radius: 6px;
                  transition: background 0.2s;
                `
              },
                span({ style: 'font-size: 1.5rem;' }, user.avatar),
                div(
                  div({ style: 'font-size: 0.875rem; font-weight: 500;' }, user.name),
                  div({ style: 'font-size: 0.75rem; color: var(--text-muted);' },
                    user.status === 'online' ? '🟢 Online' :
                    user.status === 'away' ? '🟡 Away' : '⚫ Offline'
                  )
                )
              )
            )
          )
        )
      )
    ),

    // Main Chat Area
    div({ style: 'flex: 1; display: flex; flex-direction: column;' },
      // Chat Header
      reactive(currentRoom, (room) =>
        room
          ? div({
              style: `
                padding: 1rem 1.5rem;
                border-bottom: 2px solid var(--border);
                background: var(--bg-card);
              `
            },
              div({ style: 'display: flex; align-items: center; gap: 0.75rem;' },
                span({ style: 'font-size: 1.5rem;' }, room.emoji),
                div(
                  div({ style: 'font-weight: 600; font-size: 1.125rem;' }, `# ${room.name}`),
                  reactive(onlineUsersList, (usersList) =>
                    div({ style: 'font-size: 0.75rem; color: var(--text-muted);' },
                      `${usersList.length + 1} members online`
                    )
                  )
                )
              )
            )
          : null
      ),

      // Messages Container
      div({
        'data-messages-container': 'true',
        style: 'flex: 1; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem;'
      },
        reactive(roomMessages, (msgs) =>
          msgs.length === 0
            ? div({
                style: 'display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-muted);'
              },
                div({ style: 'font-size: 3rem; margin-bottom: 0.5rem;' }, '💬'),
                div({ style: 'font-size: 1.125rem; font-weight: 600;' }, 'No messages yet'),
                div({ style: 'font-size: 0.875rem;' }, 'Be the first to say something!')
              )
            : div({ style: 'display: flex; flex-direction: column; gap: 1rem;' },
                ...msgs.map(message =>
                  reactive(currentUserId, (userId) => {
                    const isOwnMessage = message.userId === userId;
                    return div({
                      style: `
                        display: flex;
                        ${isOwnMessage ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}
                      `
                    },
                      div({
                        style: `
                          max-width: 70%;
                          display: flex;
                          gap: 0.75rem;
                          ${isOwnMessage ? 'flex-direction: row-reverse;' : ''}
                        `
                      },
                        // Avatar
                        div({
                          style: `
                            width: 40px;
                            height: 40px;
                            border-radius: 50%;
                            background: linear-gradient(135deg, var(--primary), #667eea);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 1.5rem;
                            flex-shrink: 0;
                          `
                        }, users.find(u => u.id === message.userId)?.avatar || '👤'),

                        // Message Content
                        div({ style: 'flex: 1;' },
                          div({
                            style: `
                              display: flex;
                              align-items: center;
                              gap: 0.5rem;
                              margin-bottom: 0.25rem;
                              ${isOwnMessage ? 'flex-direction: row-reverse;' : ''}
                            `
                          },
                            span({ style: 'font-weight: 600; font-size: 0.875rem;' }, message.userName),
                            span({ style: 'font-size: 0.75rem; color: var(--text-muted);' }, formatTime(message.timestamp))
                          ),
                          div({
                            style: `
                              padding: 0.75rem 1rem;
                              border-radius: 12px;
                              background: ${isOwnMessage ? 'var(--primary)' : 'var(--bg-card)'};
                              color: ${isOwnMessage ? 'white' : 'var(--text-primary)'};
                              border: ${isOwnMessage ? 'none' : '1px solid var(--border)'};
                              word-wrap: break-word;
                              position: relative;
                            `
                          },
                            span(message.text),
                            isOwnMessage
                              ? button({
                                  onclick: () => deleteMessage(message.id),
                                  style: `
                                    position: absolute;
                                    top: -8px;
                                    right: -8px;
                                    width: 20px;
                                    height: 20px;
                                    border-radius: 50%;
                                    border: none;
                                    background: #ef4444;
                                    color: white;
                                    font-size: 0.625rem;
                                    cursor: pointer;
                                    display: none;
                                    align-items: center;
                                    justify-content: center;
                                  `,
                                  onmouseenter: (e: Event) => {
                                    (e.target as HTMLElement).style.display = 'flex';
                                  }
                                }, '×')
                              : null
                          )
                        )
                      )
                    );
                  })
                )
              )
        )
      ),

      // Typing Indicator
      reactive(activeTypingUsers, (typing) =>
        typing.length > 0
          ? div({
              style: `
                padding: 0.5rem 1.5rem;
                font-size: 0.875rem;
                color: var(--text-muted);
                font-style: italic;
              `
            },
              typing.length === 1
                ? `${users.find(u => u.id === typing[0])?.name} is typing...`
                : typing.length === 2
                ? `${users.find(u => u.id === typing[0])?.name} and ${users.find(u => u.id === typing[1])?.name} are typing...`
                : `${typing.length} people are typing...`
            )
          : null
      ),

      // Message Input Area
      div({ style: 'padding: 1rem 1.5rem; border-top: 2px solid var(--border); background: var(--bg-card);' },
        // Emoji Picker
        reactive(showEmojiPicker, (show) =>
          show
            ? div({
                style: `
                  background: var(--bg);
                  border: 2px solid var(--border);
                  border-radius: 8px;
                  padding: 0.75rem;
                  margin-bottom: 0.75rem;
                  display: grid;
                  grid-template-columns: repeat(6, 1fr);
                  gap: 0.5rem;
                `
              },
                ...emojis.map(emoji =>
                  button({
                    onclick: () => insertEmoji(emoji),
                    style: `
                      padding: 0.5rem;
                      border: none;
                      background: transparent;
                      font-size: 1.5rem;
                      cursor: pointer;
                      border-radius: 6px;
                      transition: background 0.2s;
                    `
                  }, emoji)
                )
              )
            : null
        ),

        // Input Row
        div({ style: 'display: flex; gap: 0.75rem; align-items: center;' },
          button({
            onclick: () => { showEmojiPicker.value = !showEmojiPicker.value; },
            style: `
              padding: 0.75rem;
              border: 2px solid var(--border);
              border-radius: 8px;
              background: var(--bg);
              font-size: 1.25rem;
              cursor: pointer;
              transition: all 0.2s;
            `
          }, '😀'),

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
              min-height: 44px;
              max-height: 120px;
              overflow-y: auto;
            `,
            oninput: (e: Event) => {
              handleTyping((e.target as HTMLElement).textContent || '');
            },
            onkeydown: (e: KeyboardEvent) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
                (e.target as HTMLElement).textContent = '';
              }
            },
            'data-placeholder': messageInput.value ? '' : 'Type a message...'
          }),

          button({
            onclick: sendMessage,
            style: `
              padding: 0.875rem 1.5rem;
              border: none;
              border-radius: 8px;
              background: var(--primary);
              color: white;
              font-weight: 600;
              cursor: pointer;
              transition: opacity 0.2s;
            `
          }, '📤 Send')
        ),

        div({ style: 'margin-top: 0.5rem; font-size: 0.75rem; color: var(--text-muted);' },
          'Press Enter to send, Shift+Enter for new line'
        )
      )
    )
  );
};

// Chat App source code examples
const chatStateExample = `import { createState, computed, reactive, div, button } from 'elit';

interface Message {
  id: number;
  userId: string;
  userName: string;
  text: string;
  timestamp: Date;
  roomId: string;
}

interface User {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'away' | 'offline';
}

// State
const currentUserId = createState('user1');
const currentRoomId = createState('general');
const messages = createState<Message[]>([]);
const messageInput = createState('');
const typingUsers = createState<Set<string>>(new Set());
const onlineUsers = createState<Set<string>>(new Set());

// Computed states
const currentUser = computed([currentUserId], (userId) =>
  users.find(u => u.id === userId)
);

const roomMessages = computed([messages, currentRoomId], (msgs, roomId) =>
  msgs
    .filter(m => m.roomId === roomId)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
);

const activeTypingUsers = computed([typingUsers, currentUserId], (typing, userId) =>
  Array.from(typing).filter(id => id !== userId)
);`;

const chatMessagingExample = `// Send message
const sendMessage = () => {
  const text = messageInput.value.trim();
  if (!text) return;

  const user = currentUser.value;
  if (!user) return;

  const newMessage: Message = {
    id: nextMessageId++,
    userId: user.id,
    userName: user.name,
    text,
    timestamp: new Date(),
    roomId: currentRoomId.value
  };

  messages.value = [...messages.value, newMessage];
  messageInput.value = '';

  // Remove from typing users
  const typing = new Set(typingUsers.value);
  typing.delete(user.id);
  typingUsers.value = typing;

  // Auto-scroll to bottom
  setTimeout(() => {
    const container = document.querySelector('[data-messages-container]');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, 50);
};

// Handle typing indicator
let typingTimeout: any = null;

const handleTyping = (text: string) => {
  messageInput.value = text;

  const user = currentUser.value;
  if (!user) return;

  // Add to typing users
  if (text.trim() && !typingUsers.value.has(user.id)) {
    const typing = new Set(typingUsers.value);
    typing.add(user.id);
    typingUsers.value = typing;
  }

  // Clear existing timeout
  if (typingTimeout) clearTimeout(typingTimeout);

  // Remove from typing after 2 seconds of inactivity
  typingTimeout = setTimeout(() => {
    const typing = new Set(typingUsers.value);
    typing.delete(user.id);
    typingUsers.value = typing;
  }, 2000);
};`;

const chatRoomsExample = `// Computed unread counts per room
const unreadCounts = computed([messages, currentRoomId], (msgs, activeRoomId) => {
  const counts: Record<string, number> = {};
  rooms.forEach(room => {
    if (room.id !== activeRoomId) {
      counts[room.id] = msgs.filter(m => m.roomId === room.id).length;
    }
  });
  return counts;
});

// Switch room
const switchRoom = (roomId: string) => {
  currentRoomId.value = roomId;
  messageInput.value = '';

  // Auto-scroll to bottom
  setTimeout(() => {
    const container = document.querySelector('[data-messages-container]');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, 50);
};

// Render rooms with unread badges
reactive(currentRoomId, (activeRoomId) =>
  div({ style: 'display: flex; flex-direction: column; gap: 0.25rem;' },
    ...rooms.map(room =>
      button({
        onclick: () => switchRoom(room.id),
        style: \`
          background: \${activeRoomId === room.id ? 'var(--primary)' : 'transparent'};
          color: \${activeRoomId === room.id ? 'white' : 'var(--text-primary)'};
        \`
      },
        div({ style: 'display: flex; align-items: center; gap: 0.5rem;' },
          span(room.emoji),
          span(room.name)
        ),
        reactive(unreadCounts, (counts) =>
          counts[room.id] && activeRoomId !== room.id
            ? span({ style: 'background: #ef4444; color: white; padding: 0.125rem 0.5rem;' },
                String(counts[room.id])
              )
            : null
        )
      )
    )
  )
);`;

const chatRenderExample = `// Render messages with own message detection
reactive(roomMessages, (msgs) =>
  div({ style: 'display: flex; flex-direction: column; gap: 1rem;' },
    ...msgs.map(message =>
      reactive(currentUserId, (userId) => {
        const isOwnMessage = message.userId === userId;

        return div({
          style: \`
            display: flex;
            \${isOwnMessage ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}
          \`
        },
          div({
            style: \`
              display: flex;
              gap: 0.75rem;
              \${isOwnMessage ? 'flex-direction: row-reverse;' : ''}
            \`
          },
            // Avatar
            div({ style: 'width: 40px; height: 40px; border-radius: 50%;' },
              users.find(u => u.id === message.userId)?.avatar
            ),

            // Message bubble
            div(
              div({ style: 'font-weight: 600; font-size: 0.875rem;' },
                message.userName
              ),
              div({
                style: \`
                  padding: 0.75rem 1rem;
                  border-radius: 12px;
                  background: \${isOwnMessage ? 'var(--primary)' : 'var(--bg-card)'};
                  color: \${isOwnMessage ? 'white' : 'var(--text-primary)'};
                \`
              }, message.text)
            )
          )
        );
      })
    )
  )
);

// Typing indicator
reactive(activeTypingUsers, (typing) =>
  typing.length > 0
    ? div({ style: 'font-style: italic; color: var(--text-muted);' },
        typing.length === 1
          ? \`\${users.find(u => u.id === typing[0])?.name} is typing...\`
          : \`\${typing.length} people are typing...\`
      )
    : null
);`;

// Chat App Content
export const ChatAppContent: VNode = div(
  // Demo
  div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 2rem; margin-bottom: 3rem;' },
    h2({ style: 'margin: 0 0 2rem 0; font-size: 1.75rem;' }, '💬 Try the Chat App'),
    ChatAppDemo()
  ),

  // Overview
  div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 2rem; margin-bottom: 3rem;' },
    h2({ style: 'margin: 0 0 1rem 0; font-size: 1.75rem;' }, '📖 Overview'),
    p({ style: 'color: var(--text-muted); margin-bottom: 2rem; line-height: 1.8;' },
      'This Chat Application demonstrates real-time messaging, multiple chat rooms, typing indicators, ',
      'online user presence, message management, and emoji support using Elit\'s reactive state system.'
    ),

    // Key Features
    div({ style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;' },
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '💬 Real-time Messaging'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Send and receive messages instantly with automatic scrolling and timestamps'
        )
      ),
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '🏠 Multiple Rooms'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Switch between different chat rooms with unread message badges'
        )
      ),
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '⌨️ Typing Indicator'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'See when other users are typing with automatic timeout detection'
        )
      ),
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '🟢 User Presence'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Track online users with status indicators and avatars'
        )
      ),
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '😀 Emoji Support'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Quick emoji picker for adding reactions to messages'
        )
      ),
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '🎨 Message Styling'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Different styles for own messages vs others with avatars and timestamps'
        )
      )
    )
  ),

  // Source Code
  div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 2rem; margin-bottom: 3rem;' },
    h2({ style: 'margin: 0 0 1.5rem 0; font-size: 1.75rem;' }, '💻 Source Code'),

    h3({ style: 'margin: 2rem 0 1rem 0; font-size: 1.25rem; color: var(--primary);' }, '1. State Management'),
    pre({ style: 'margin: 0 0 2rem 0;' }, code(...codeBlock(chatStateExample))),

    h3({ style: 'margin: 2rem 0 1rem 0; font-size: 1.25rem; color: var(--primary);' }, '2. Messaging & Typing'),
    pre({ style: 'margin: 0 0 2rem 0;' }, code(...codeBlock(chatMessagingExample))),

    h3({ style: 'margin: 2rem 0 1rem 0; font-size: 1.25rem; color: var(--primary);' }, '3. Rooms & Unread Counts'),
    pre({ style: 'margin: 0 0 2rem 0;' }, code(...codeBlock(chatRoomsExample))),

    h3({ style: 'margin: 2rem 0 1rem 0; font-size: 1.25rem; color: var(--primary);' }, '4. Message Rendering'),
    pre({ style: 'margin: 0;' }, code(...codeBlock(chatRenderExample)))
  ),

  // Key Learnings
  div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 2rem;' },
    h2({ style: 'margin: 0 0 1.5rem 0; font-size: 1.75rem;' }, '🎓 Key Learnings'),
    ul({ style: 'margin: 0; padding-left: 1.5rem; line-height: 2; color: var(--text-muted);' },
      li(strong('Real-time updates:'), ' Managing message state with instant UI updates and auto-scrolling'),
      li(strong('Multi-room system:'), ' Filtering messages by room with computed state'),
      li(strong('Typing indicators:'), ' Using Set data structure with timeout for activity tracking'),
      li(strong('Computed filtering:'), ' Combining multiple states (messages, currentRoomId) for room-specific data'),
      li(strong('User presence:'), ' Tracking online users with Set state management'),
      li(strong('Message ownership:'), ' Conditional styling based on current user vs other users'),
      li(strong('Unread badges:'), ' Computing unread counts per room with reactive updates'),
      li(strong('Auto-scrolling:'), ' Using setTimeout and DOM queries for UX improvements'),
      li(strong('Keyboard shortcuts:'), ' Enter to send, Shift+Enter for new line with event handling'),
      li(strong('Emoji picker:'), ' Toggle state for showing/hiding with click outside handling'),
      li(strong('Timestamp formatting:'), ' Relative time display (just now, 5m ago, etc.)'),
      li(strong('Message deletion:'), ' Filtering array state to remove specific messages'),
      li(strong('ContentEditable:'), ' Managing rich text input without reactive wrapper'),
      li(strong('Conditional rendering:'), ' Showing typing indicator only when users are active'),
      li(strong('Layout with flexbox:'), ' Three-panel chat interface with sidebar and main area')
    )
  )
);

import { ElitRequest, ElitResponse, ServerRouter } from 'elit/server';
import { database, Database } from 'elit/database';
import { resolve } from 'path';

export const router = new ServerRouter();

// Initialize database with configuration
const db = new Database({
  dir: resolve(process.cwd(), 'databases'),
  language: 'ts'
});

// Helper to execute database code
// async function executeDb(code: string): Promise<any> {
//   const result = await db.execute(code);
//   return result.namespace;
// }

// GET /api/hello
router.get('/api/hello', async (req:ElitRequest,res:ElitResponse) => {
    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.send("Hello from Elit ServerRouter!");
});

// POST /api/auth/register
router.post('/api/auth/register', async (req: ElitRequest, res: ElitResponse) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Please provide name, email, and password' });
  }

  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Please provide a valid email' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const userId = 'user_' + Date.now();
    const userData = JSON.stringify({
      id: userId,
      name,
      email,
      password,
      bio: 'New user',
      location: '',
      website: '',
      avatar: '',
      stats: {
        projects: 0,
        followers: 0,
        following: 0,
        stars: 0
      },
      createdAt: new Date().toISOString()
    });

    // Use a simpler approach without dynamic imports inside the function
    const code = `
      (async function() {
        const usersData = ${JSON.stringify(userData)};
        try {
          const usersModule = await import('./users');
          const user = JSON.parse(usersData);
          usersModule.users.push(user);
          if (typeof dbConsole !== 'undefined' && dbConsole.update) {
            dbConsole.update('users', 'users', usersModule.users);
          }
          if (typeof dbConsole !== 'undefined' && dbConsole.log) {
            dbConsole.log(user);
          }
          return user;
        } catch (e) {
          console.error('Error:', e.message);
          throw e;
        }
      })()
    `;

    const result = await db.execute(code);

    if (!result.logs || result.logs.length === 0) {
      throw new Error('Failed to create user');
    }

    const user = result.logs[0];
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');

    res.status(201).json({
      message: 'User registered successfully',
      token: token,
      user: user
    });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/api/auth/login', async (req: ElitRequest, res: ElitResponse) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password' });
  }

  try {
    const code = `
      (async function() {
        const email = ${JSON.stringify(email)};
        const password = ${JSON.stringify(password)};
        try {
          const usersModule = await import('./users');
          const user = usersModule.users.find(u => u.email === email && u.password === password);
          if (!user) {
            throw new Error('Invalid email or password');
          }
          if (typeof dbConsole !== 'undefined' && dbConsole.log) {
            dbConsole.log(user);
          }
          return user;
        } catch (e) {
          console.error('Error:', e.message);
          throw e;
        }
      })()
    `;

    const result = await db.execute(code);

    if (!result.logs || result.logs.length === 0 || !result.logs[0]) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.logs[0];
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');

    res.json({
      message: 'Login successful',
      token: token,
      user: user
    });
  } catch (error: any) {
    if (error.message === 'Invalid email or password') {
      return res.status(401).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/forgot-password
router.post('/api/auth/forgot-password', async (req: ElitRequest, res: ElitResponse) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Please provide email' });
  }

  res.json({
    message: 'If an account exists with this email, a password reset link has been sent'
  });
});

// GET /api/profile
router.get('/api/profile', async (_req: ElitRequest, res: ElitResponse) => {
  try {
    const code = `
      (async function() {
        try {
          const usersModule = await import('./users');
          // Try to load from dbConsole
          if (typeof dbConsole !== 'undefined' && dbConsole.read) {
            const loaded = dbConsole.read('users');
            if (loaded) {
              const parsed = JSON.parse(loaded);
              usersModule.users.length = 0;
              parsed.forEach(u => usersModule.users.push(u));
            }
          }
          if (usersModule.users.length === 0) {
            throw new Error('User not found');
          }
          const user = usersModule.users[0];
          if (typeof dbConsole !== 'undefined' && dbConsole.log) {
            dbConsole.log(user);
          }
          return user;
        } catch (e) {
          console.error('Error:', e.message);
          throw e;
        }
      })()
    `;

    const result = await db.execute(code);

    if (!result.logs || result.logs.length === 0 || !result.logs[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.logs[0] });
  } catch (error: any) {
    return res.status(404).json({ error: error.message || 'User not found' });
  }
});

// PUT /api/profile
router.put('/api/profile', async (req: ElitRequest, res: ElitResponse) => {
  const { name, bio, location, website } = req.body;

  try {
    const code = `
      (async function() {
        const updates = ${JSON.stringify({ name, bio, location, website })};
        try {
          const usersModule = await import('./users');
          // Try to load from dbConsole
          if (typeof dbConsole !== 'undefined' && dbConsole.read) {
            const loaded = dbConsole.read('users');
            if (loaded) {
              const parsed = JSON.parse(loaded);
              usersModule.users.length = 0;
              parsed.forEach(u => usersModule.users.push(u));
            }
          }
          if (usersModule.users.length === 0) {
            throw new Error('User not found');
          }
          // Update first user
          const user = usersModule.users[0];
          if (updates.name) user.name = updates.name;
          if (updates.bio) user.bio = updates.bio;
          if (updates.location) user.location = updates.location;
          if (updates.website) user.website = updates.website;
          // Save to dbConsole
          if (typeof dbConsole !== 'undefined' && dbConsole.update) {
            dbConsole.update('users', 'users', usersModule.users);
          }
          if (typeof dbConsole !== 'undefined' && dbConsole.log) {
            dbConsole.log(user);
          }
          return user;
        } catch (e) {
          console.error('Error:', e.message);
          throw e;
        }
      })()
    `;

    const result = await db.execute(code);

    if (!result.logs || result.logs.length === 0 || !result.logs[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: result.logs[0]
    });
  } catch (error: any) {
    return res.status(404).json({ error: error.message || 'User not found' });
  }
});

// GET /api/users
router.get('/api/users', async (_req: ElitRequest, res: ElitResponse) => {
  try {
    const code = `
      (async function() {
        try {
          const usersModule = await import('./users');
          // Try to load from dbConsole
          if (typeof dbConsole !== 'undefined' && dbConsole.read) {
            const loaded = dbConsole.read('users');
            if (loaded) {
              const parsed = JSON.parse(loaded);
              usersModule.users.length = 0;
              parsed.forEach(u => usersModule.users.push(u));
            }
          }
          if (typeof dbConsole !== 'undefined' && dbConsole.log) {
            dbConsole.log(usersModule.users);
          }
          return usersModule.users;
        } catch (e) {
          console.error('Error:', e.message);
          throw e;
        }
      })()
    `;

    const result = await db.execute(code);

    const userList = result.logs && result.logs.length > 0 ? result.logs[0] : [];
    res.json({ users: userList, count: Array.isArray(userList) ? userList.length : 0 });
  } catch (error: any) {
    res.json({ users: [], count: 0 });
  }
});

// GET /api/users/:id
router.get('/api/users/:id', async (req: ElitRequest, res: ElitResponse) => {
  const url = req.url || '';
  const userId = url.split('/').pop();

  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  try {
    const code = `
      (async function() {
        const userId = ${JSON.stringify(userId)};
        try {
          const usersModule = await import('./users');
          // Try to load from dbConsole
          if (typeof dbConsole !== 'undefined' && dbConsole.read) {
            const loaded = dbConsole.read('users');
            if (loaded) {
              const parsed = JSON.parse(loaded);
              usersModule.users.length = 0;
              parsed.forEach(u => usersModule.users.push(u));
            }
          }
          const user = usersModule.users.find(u => u.id === userId);
          if (!user) {
            throw new Error('User not found');
          }
          if (typeof dbConsole !== 'undefined' && dbConsole.log) {
            dbConsole.log(user);
          }
          return user;
        } catch (e) {
          console.error('Error:', e.message);
          throw e;
        }
      })()
    `;

    const result = await db.execute(code);

    if (!result.logs || result.logs.length === 0 || !result.logs[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.logs[0] });
  } catch (error: any) {
    if (error.message === 'User not found') {
      return res.status(404).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export const server = router;

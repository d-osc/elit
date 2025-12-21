# create-elit

Scaffolding tool for creating new Elit projects.

## Usage

With npm:
```bash
npm create elit@latest my-app
```

With yarn:
```bash
yarn create elit my-app
```

With pnpm:
```bash
pnpm create elit my-app
```

With bun:
```bash
bun create elit my-app
```

With deno:
```bash
deno run -A npm:create-elit my-app
```

## Templates

Choose a template with the `--template` flag:

```bash
npm create elit@latest my-app --template=basic
```

Available templates:

- **basic** (default) - Full-featured app with styled counter using CSS-in-JS
- **full** - Full-stack app with dev server, API routes, and CSS-in-JS
- **minimal** - Minimal setup with just DOM rendering

## Features

✨ **Zero Configuration** - Works out of the box
🎨 **CSS-in-JS** - Uses Elit's `CreateStyle` for type-safe styling
📦 **TypeScript Ready** - Full TypeScript support
🚀 **Fast Setup** - Creates project in seconds
🎯 **Multiple Templates** - Choose the right starting point

## What's Included

Each template includes:
- TypeScript configuration
- Package.json with Elit scripts (`dev`, `build`, `preview`)
- Elit config file (`elit.config.mjs`)
- 100% TypeScript - no HTML files needed
- Type-safe CSS-in-JS with `CreateStyle`
- Server-side rendering with `dom.renderServer`
- Client-side hydration with `client.ts`
- Example code showing best practices
- Auto-generated README and .gitignore

## Example

```bash
# Create a new project
npm create elit@latest my-elit-app

# Navigate to project
cd my-elit-app

# Install dependencies
npm install

# Start dev server
npm run dev
```

Visit http://localhost:3003 to see your app!

## Template Details

### Basic Template
- Counter example with increment/decrement
- Beautiful gradient UI with CSS-in-JS
- Reactive state management demo
- Type-safe styling with `CreateStyle`
- Server-side rendering with `dom.renderServer`

### Full Template
- Counter and API call examples
- Server-side routing with middleware
- CORS and logging setup
- Client-server communication
- Full-stack TypeScript setup

### Minimal Template
- Just the essentials
- Simple "Hello Elit!" example
- Perfect for learning or prototyping
- Pure TypeScript - zero HTML

## Learn More

- [Elit Documentation](https://d-osc.github.io/elit)
- [GitHub Repository](https://github.com/d-osc/elit)
- [npm Package](https://www.npmjs.com/package/elit)

## License

MIT

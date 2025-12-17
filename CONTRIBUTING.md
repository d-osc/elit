# Contributing to Elit

Thank you for your interest in contributing to Elit! We welcome contributions from everyone.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Guidelines](#coding-guidelines)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Release Process](#release-process)

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/elit.git
   cd elit
   ```
3. **Install dependencies**:
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+ and npm
- TypeScript 5.3+
- Git

### Building the Project

```bash
# Build elit core library
npm run build

# Build @elit/server
cd server && npm run build

# Watch mode for development
npm run dev
cd server && npm run dev
```

### Type Checking

```bash
# Type check elit
npm run typecheck

# Type check @elit/server
cd server && npm run typecheck
```

## 📁 Project Structure

```
elit/
├── src/                    # Core library source
│   ├── elements.ts         # HTML/SVG/MathML element factories
│   ├── state.ts           # Reactive state management
│   ├── reactive.ts        # Reactive rendering
│   ├── router.ts          # Client-side router
│   ├── shared-state.ts    # Shared state (with @elit/server)
│   └── ...
├── server/                # Development server package
│   ├── src/
│   │   ├── server.ts      # Main server
│   │   ├── router.ts      # REST API router
│   │   ├── middleware.ts  # Middleware stack
│   │   ├── state.ts       # Server-side state management
│   │   └── client.ts      # HMR client
│   └── example/           # Example applications
├── dist/                  # Built files (generated)
└── docs/                  # Documentation (coming soon)
```

## 📝 Coding Guidelines

### TypeScript Style

- Use TypeScript for all source files
- Provide proper type definitions for all public APIs
- Use interfaces for public types, type aliases for internal types
- Avoid `any` - use `unknown` if type is truly unknown

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Use semicolons
- Keep lines under 100 characters when possible
- Use meaningful variable and function names

### Comments

- Use JSDoc comments for public APIs
- Add inline comments for complex logic
- Keep comments up-to-date with code changes

Example:
```typescript
/**
 * Creates a reactive state container
 * @param initialValue - The initial value of the state
 * @param options - Optional configuration
 * @returns A State object with value getter/setter
 */
export function createState<T>(
  initialValue: T,
  options?: StateOptions
): State<T> {
  // Implementation
}
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests (when available)
npm test

# Run tests in watch mode
npm test -- --watch
```

### Writing Tests

- Place test files next to source files with `.test.ts` extension
- Use descriptive test names
- Test both happy paths and edge cases
- Mock external dependencies

Example:
```typescript
describe('createState', () => {
  it('should create state with initial value', () => {
    const state = createState(0);
    expect(state.value).toBe(0);
  });

  it('should notify subscribers on value change', () => {
    const state = createState(0);
    const subscriber = jest.fn();
    state.subscribe(subscriber);
    state.value = 1;
    expect(subscriber).toHaveBeenCalledWith(1);
  });
});
```

## 📤 Submitting Changes

### Commit Messages

Follow conventional commit format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(state): add throttle option to createState
fix(router): handle edge case in parameter parsing
docs: update README with shared state examples
```

### Pull Request Process

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** and commit them:
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

3. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Open a Pull Request** on GitHub:
   - Fill out the PR template
   - Link related issues
   - Add screenshots/examples if applicable
   - Request review from maintainers

5. **Address review feedback**:
   - Make requested changes
   - Push additional commits
   - Re-request review

6. **Merge**: Once approved, a maintainer will merge your PR

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests pass
- [ ] Type checking passes
- [ ] No console warnings/errors
- [ ] Commit messages follow conventions

## 🎯 Areas for Contribution

We welcome contributions in these areas:

### High Priority

- 🧪 **Testing**: Add unit tests and integration tests
- 📚 **Documentation**: Improve guides, examples, and API docs
- 🐛 **Bug Fixes**: Fix reported issues
- ⚡ **Performance**: Optimize bundle size and runtime performance

### Feature Requests

- 🎨 **Examples**: Add more example applications
- 🔌 **Integrations**: Integration with other tools/frameworks
- 🛠️ **Middleware**: New middleware for @elit/server
- 🎯 **Developer Tools**: Browser extensions, CLI tools

### Community

- 💬 **Support**: Help answer questions in issues/discussions
- 📖 **Tutorials**: Write blog posts or video tutorials
- 🌍 **Translations**: Translate documentation
- 🎤 **Presentations**: Give talks about Elit

## 🚢 Release Process

Releases are handled by maintainers:

### elit (Core Library)

```bash
# Update version in package.json
npm version patch|minor|major

# Create git tag
git tag v0.1.0
git push origin v0.1.0
```

### @elit/server

```bash
# Update version in server/package.json
cd server
npm version patch|minor|major

# Create git tag
git tag server-v0.1.0
git push origin server-v0.1.0
```

GitHub Actions will automatically:
- Run tests and type checking
- Build the package
- Publish to npm
- Create GitHub release

## 📄 License

By contributing to Elit, you agree that your contributions will be licensed under the MIT License.

## 🤝 Code of Conduct

Be respectful and inclusive. We want everyone to feel welcome to contribute.

## ❓ Questions?

- 💬 Open a [Discussion](https://github.com/oangsa/elit/discussions)
- 🐛 Report bugs via [Issues](https://github.com/oangsa/elit/issues)
- 📧 Email maintainers (check package.json for contact info)

---

**Thank you for contributing to Elit!** 🎉

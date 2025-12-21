/**
 * Monaco Editor Example
 * Demonstrates how to integrate Monaco Editor (VS Code's editor) with Elit
 */

import { div, h2, h3, h4, p, button, select, option, span, kbd, style, pre, CreateStyle } from 'elit';

// Monaco Editor will be loaded via CDN
declare global {
  interface Window {
    monaco: any;
    require: any;
  }
}

const MonacoEditorExample = () => {
  let editor: any = null;
  let editorContainer: HTMLElement;

  // Load Monaco Editor from CDN
  const loadMonaco = () => {
    return new Promise((resolve, reject) => {
      if (window.monaco) {
        resolve(window.monaco);
        return;
      }

      // Create script elements
      const loaderScript = document.createElement('script');
      loaderScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/loader.min.js';
      loaderScript.onload = () => {
        window.require.config({
          paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' }
        });
        window.require(['vs/editor/editor.main'], () => {
          resolve(window.monaco);
        });
      };
      loaderScript.onerror = reject;
      document.head.appendChild(loaderScript);
    });
  };

  // Initialize Monaco Editor
  const initEditor = async () => {
    try {
      const monaco:any = await loadMonaco();

      if (!editorContainer || editor) return;

      // Create editor instance
      editor = monaco.editor.create(editorContainer, {
        value: `// Welcome to Elit + Monaco Editor!
// Try editing this TypeScript code

import { div, h2, button, style } from 'elit/el';
import { CreateStyle } from 'elit/style';
import { dom } from 'elit/dom';

const Counter = () => {
  let count = 0;

  // Create styles using CreateStyle
  const counterStyles = new CreateStyle();

  counterStyles.addClass('counter', {
    textAlign: 'center',
    padding: '2rem',
    fontFamily: 'system-ui'
  });

  counterStyles.descendant('.counter', '.count', {
    fontSize: '3rem',
    fontWeight: 'bold',
    color: '#2563eb',
    margin: '1rem 0'
  });

  counterStyles.add({
    '.counter button': {
      padding: '0.75rem 2rem',
      margin: '0 0.5rem',
      fontSize: '1rem',
      border: 'none',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    '.counter .increment': {
      background: '#2563eb',
      color: 'white'
    },
    '.counter .increment:hover': {
      background: '#1d4ed8'
    },
    '.counter .decrement': {
      background: '#ef4444',
      color: 'white'
    },
    '.counter .decrement:hover': {
      background: '#dc2626'
    }
  });

  const styles = counterStyles.render();

  const countEl = div({ class: 'count' }, '0');

  const increment = () => {
    count++;
    countEl.textContent = String(count);
  };

  const decrement = () => {
    count--;
    countEl.textContent = String(count);
  };

  return div({ class: 'counter' },
    style({}, styles),
    h2({}, 'Counter Example'),
    countEl,
    div({},
      button({
        class: 'decrement',
        onclick: decrement
      }, '−'),
      button({
        class: 'increment',
        onclick: increment
      }, '+')
    )
  );
};

export default Counter;`,
        language: 'typescript',
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: true },
        fontSize: 14,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        tabSize: 2,
        insertSpaces: true,
      });

      // Add keyboard shortcuts
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        const value = editor.getValue();
        console.log('Code saved:', value);
        alert('Code saved to console!');
      });

    } catch (error) {
      console.error('Failed to load Monaco Editor:', error);
    }
  };

  // Run code functionality
  const runCode = () => {
    if (!editor) return;

    const code = editor.getValue();
    const outputEl = document.getElementById('output');
    if (!outputEl) return;

    try {
      // Clear previous output
      outputEl.innerHTML = '';

      // Simple preview (for demonstration)
      outputEl.innerHTML = `
        <div style="padding: 1rem; background: #111827; border-radius: 0.5rem; border: 1px solid #374151;">
          <strong style="color: #e5e7eb;">Code Preview:</strong>
          <pre style="margin-top: 0.5rem; padding: 1rem; background: #1f2937; border-radius: 0.25rem; overflow: auto; color: #e5e7eb; border: 1px solid #374151;">
           ${code}
          </script></div>
          </pre>
          <p style="margin-top: 1rem; color: #9ca3af; font-size: 0.875rem;">
            💡 In a real application, you would transpile and execute this code.
          </p>
        </div>
      `;
    } catch (error: any) {
      outputEl.innerHTML = `
        <div style="padding: 1rem; background: #7f1d1d; color: #fca5a5; border-radius: 0.5rem; border: 1px solid #991b1b;">
          <strong>Error:</strong> ${error.message}
        </div>
      `;
    }
  };

  // Change theme
  const changeTheme = (theme: string) => {
    if (window.monaco && editor) {
      window.monaco.editor.setTheme(theme);
    }
  };

  // Change language
  const changeLanguage = (language: string) => {
    if (window.monaco && editor) {
      const model = editor.getModel();
      if (model) {
        window.monaco.editor.setModelLanguage(model, language);
      }
    }
  };

  // Create styles using CreateStyle
  const monacoStyles = new CreateStyle();

  monacoStyles.addClass('monaco-example', {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '2rem',
    marginTop: '2rem'
  });

  monacoStyles.descendant('.monaco-example', '.header', {
    marginBottom: '2rem'
  });

  monacoStyles.descendant('.monaco-example', '.header h1', {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '0.5rem'
  });

  monacoStyles.descendant('.monaco-example', '.header p', {
    color: '#6b7280',
    fontSize: '1.125rem'
  });

  monacoStyles.descendant('.monaco-example', '.controls', {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
    flexWrap: 'wrap'
  });

  monacoStyles.add({
    '.monaco-example .controls button, .monaco-example .controls select': {
      padding: '0.5rem 1rem',
      border: '1px solid #374151',
      borderRadius: '0.375rem',
      background: '#1f2937',
      color: '#e5e7eb',
      cursor: 'pointer',
      fontSize: '0.875rem',
      transition: 'all 0.2s'
    },
    '.monaco-example .controls button:hover': {
      background: '#374151',
      borderColor: '#4b5563'
    },
    '.monaco-example .controls button.primary': {
      background: '#2563eb',
      color: 'white',
      borderColor: '#2563eb'
    },
    '.monaco-example .controls button.primary:hover': {
      background: '#1d4ed8',
      borderColor: '#1d4ed8'
    }
  });

  monacoStyles.descendant('.monaco-example', '.editor-wrapper', {
    border: '1px solid #374151',
    borderRadius: '0.5rem',
    overflow: 'hidden',
    marginBottom: '2rem'
  });

  monacoStyles.descendant('.monaco-example', '.editor-container', {
    width: '100%',
    height: '600px'
  });

  monacoStyles.descendant('.monaco-example', '.output', {
    border: '1px solid #374151',
    borderRadius: '0.5rem',
    padding: '1rem',
    background: '#1f2937',
    minHeight: '200px'
  });

  monacoStyles.descendant('.monaco-example', '.output h3', {
    marginTop: 0,
    marginBottom: '1rem',
    color: '#e5e7eb'
  });

  monacoStyles.descendant('.monaco-example', '.features', {
    marginTop: '2rem',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1rem'
  });

  monacoStyles.descendant('.monaco-example', '.feature-card', {
    padding: '1.5rem',
    background: '#1f2937',
    borderRadius: '0.5rem',
    border: '1px solid #374151'
  });

  monacoStyles.descendant('.monaco-example', '.feature-card h4', {
    margin: '0 0 0.5rem 0',
    color: '#e5e7eb',
    fontSize: '1.125rem'
  });

  monacoStyles.descendant('.monaco-example', '.feature-card p', {
    margin: 0,
    color: '#9ca3af',
    fontSize: '0.875rem'
  });

  monacoStyles.descendant('.monaco-example', '.keyboard-shortcuts', {
    marginTop: '2rem',
    padding: '1.5rem',
    background: '#1f2937',
    borderRadius: '0.5rem',
    border: '1px solid #374151'
  });

  monacoStyles.descendant('.monaco-example', '.keyboard-shortcuts h3', {
    marginTop: 0,
    marginBottom: '1rem',
    color: '#e5e7eb'
  });

  monacoStyles.descendant('.monaco-example', '.shortcut-list', {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '0.75rem'
  });

  monacoStyles.descendant('.monaco-example', '.shortcut', {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem',
    background: '#111827',
    borderRadius: '0.25rem',
    color: '#e5e7eb'
  });

  monacoStyles.descendant('.monaco-example', '.shortcut kbd', {
    padding: '0.25rem 0.5rem',
    background: '#374151',
    color: '#e5e7eb',
    borderRadius: '0.25rem',
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    border: '1px solid #4b5563'
  });

  monacoStyles.descendant('.monaco-example', '.source-code', {
    marginTop: '2rem',
    padding: '1.5rem',
    background: '#1f2937',
    borderRadius: '0.5rem',
    border: '1px solid #374151'
  });

  monacoStyles.descendant('.monaco-example', '.source-code h2', {
    marginTop: 0,
    marginBottom: '1rem',
    color: '#e5e7eb',
    fontSize: '1.5rem'
  });

  monacoStyles.descendant('.monaco-example', '.source-code pre', {
    margin: 0,
    padding: '1rem',
    background: '#111827',
    borderRadius: '0.25rem',
    overflow: 'auto',
    color: '#e5e7eb',
    fontSize: '0.875rem',
    lineHeight: '1.5',
    border: '1px solid #374151'
  });

  const styles = monacoStyles.render();

  // Create the component
  const component = div({ class: 'monaco-example' },
    style({}, styles),

    // Controls
    div({ class: 'controls' },
      button({
        class: 'primary',
        onclick: runCode
      }, '▶ Run Code'),

      select({
        onchange: (e: Event) => {
          const target = e.target as HTMLSelectElement;
          changeTheme(target.value);
        }
      },
        option({ value: 'vs-dark' }, 'Dark Theme'),
        option({ value: 'vs-light' }, 'Light Theme'),
        option({ value: 'hc-black' }, 'High Contrast')
      ),

      select({
        onchange: (e: Event) => {
          const target = e.target as HTMLSelectElement;
          changeLanguage(target.value);
        }
      },
        option({ value: 'typescript' }, 'TypeScript'),
        option({ value: 'javascript' }, 'JavaScript'),
        option({ value: 'html' }, 'HTML'),
        option({ value: 'css' }, 'CSS'),
        option({ value: 'json' }, 'JSON'),
        option({ value: 'markdown' }, 'Markdown')
      )
    ),

    // Editor
    div({ class: 'editor-wrapper' },
      div({
        class: 'editor-container',
        ref: (node) => {
          editorContainer = node as HTMLElement;
          // Initialize editor after a short delay
          setTimeout(initEditor, 100);
        }
      })
    ),

    // Output
    div({ class: 'output' },
      h3({}, 'Output'),
      div({ id: 'output' }, 'Click "Run Code" to see output here...')
    ),

    // Features
    div({ class: 'features' },
      div({ class: 'feature-card' },
        h4({}, '✨ IntelliSense'),
        p({}, 'Smart code completion and suggestions as you type')
      ),
      div({ class: 'feature-card' },
        h4({}, '🔍 Syntax Highlighting'),
        p({}, 'Beautiful syntax highlighting for multiple languages')
      ),
      div({ class: 'feature-card' },
        h4({}, '⌨️ Keyboard Shortcuts'),
        p({}, 'VS Code-like keyboard shortcuts for faster coding')
      ),
      div({ class: 'feature-card' },
        h4({}, '🎨 Multiple Themes'),
        p({}, 'Switch between dark, light, and high contrast themes')
      )
    ),

    // Keyboard Shortcuts
    div({ class: 'keyboard-shortcuts' },
      h3({}, '⌨️ Keyboard Shortcuts'),
      div({ class: 'shortcut-list' },
        div({ class: 'shortcut' },
          span({}, 'Save'),
          kbd({}, 'Ctrl/Cmd + S')
        ),
        div({ class: 'shortcut' },
          span({}, 'Find'),
          kbd({}, 'Ctrl/Cmd + F')
        ),
        div({ class: 'shortcut' },
          span({}, 'Replace'),
          kbd({}, 'Ctrl/Cmd + H')
        ),
        div({ class: 'shortcut' },
          span({}, 'Command Palette'),
          kbd({}, 'F1')
        ),
        div({ class: 'shortcut' },
          span({}, 'Multi-cursor'),
          kbd({}, 'Alt + Click')
        ),
        div({ class: 'shortcut' },
          span({}, 'Format Document'),
          kbd({}, 'Shift + Alt + F')
        )
      )
    ),

    // Source Code Example
    div({ class: 'source-code' },
      h2({}, '📝 Source Code Example'),
      pre({}, `// Load Monaco Editor from CDN
const loadMonaco = () => {
  return new Promise((resolve, reject) => {
    if (window.monaco) {
      resolve(window.monaco);
      return;
    }

    const loaderScript = document.createElement('script');
    loaderScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/loader.min.js';
    loaderScript.onload = () => {
      window.require.config({
        paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' }
      });
      window.require(['vs/editor/editor.main'], () => {
        resolve(window.monaco);
      });
    };
    loaderScript.onerror = reject;
    document.head.appendChild(loaderScript);
  });
};

// Initialize Monaco Editor
const initEditor = async () => {
  const monaco = await loadMonaco();

  editor = monaco.editor.create(editorContainer, {
    value: '// Your code here',
    language: 'typescript',
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: true },
    fontSize: 14
  });
};

// Change theme
const changeTheme = (theme) => {
  if (window.monaco && editor) {
    window.monaco.editor.setTheme(theme);
  }
};

// Change language
const changeLanguage = (language) => {
  if (window.monaco && editor) {
    const model = editor.getModel();
    if (model) {
      window.monaco.editor.setModelLanguage(model, language);
    }
  }
};`)
    )
  );

  return component;
};

// Export as VNode (not function)
export const MonacoEditorContent = MonacoEditorExample();

export default MonacoEditorContent;

import { span } from 'elit';
import type { Child } from 'elit';

// Simple syntax highlighter for JavaScript/TypeScript code
export function highlight(code: string): Child[] {
  const tokens: Child[] = [];
  let i = 0;

  const keywords = ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'new', 'class', 'extends', 'import', 'export', 'from', 'default', 'async', 'await', 'try', 'catch', 'finally', 'throw', 'typeof', 'instanceof', 'in', 'of', 'true', 'false', 'null', 'undefined', 'this', 'super', 'static', 'get', 'set', 'interface', 'type', 'enum', 'as', 'implements', 'private', 'public', 'protected', 'readonly'];
  const builtins = ['console', 'document', 'window', 'Math', 'Array', 'Object', 'String', 'Number', 'Boolean', 'Date', 'JSON', 'Promise', 'Map', 'Set', 'RegExp', 'Error', 'Symbol', 'parseInt', 'parseFloat', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'fetch', 'alert', 'confirm', 'prompt'];

  while (i < code.length) {
    // Comments
    if (code.slice(i, i + 2) === '//') {
      let end = code.indexOf('\n', i);
      if (end === -1) end = code.length;
      tokens.push(span({ className: 'sh-comment' }, code.slice(i, end)));
      i = end;
      continue;
    }

    // Multi-line comments
    if (code.slice(i, i + 2) === '/*') {
      let end = code.indexOf('*/', i + 2);
      if (end === -1) end = code.length;
      else end += 2;
      tokens.push(span({ className: 'sh-comment' }, code.slice(i, end)));
      i = end;
      continue;
    }

    // Strings (single, double, template)
    if (code[i] === '"' || code[i] === "'" || code[i] === '`') {
      const quote = code[i];
      let end = i + 1;
      while (end < code.length) {
        if (code[end] === '\\') {
          end += 2;
          continue;
        }
        if (code[end] === quote) {
          end++;
          break;
        }
        // Handle template literal expressions ${...}
        if (quote === '`' && code.slice(end, end + 2) === '${') {
          // Find matching }
          let braceCount = 1;
          let exprEnd = end + 2;
          while (exprEnd < code.length && braceCount > 0) {
            if (code[exprEnd] === '{') braceCount++;
            if (code[exprEnd] === '}') braceCount--;
            exprEnd++;
          }
          end = exprEnd;
          continue;
        }
        end++;
      }
      tokens.push(span({ className: 'sh-string' }, code.slice(i, end)));
      i = end;
      continue;
    }

    // Numbers
    if (/[0-9]/.test(code[i]) || (code[i] === '.' && /[0-9]/.test(code[i + 1] || ''))) {
      let end = i;
      while (end < code.length && /[0-9.xXa-fA-FeE_]/.test(code[end])) end++;
      tokens.push(span({ className: 'sh-number' }, code.slice(i, end)));
      i = end;
      continue;
    }

    // Words (identifiers, keywords)
    if (/[a-zA-Z_$]/.test(code[i])) {
      let end = i;
      while (end < code.length && /[a-zA-Z0-9_$]/.test(code[end])) end++;
      const word = code.slice(i, end);

      // Check if it's a function call
      let j = end;
      while (j < code.length && /\s/.test(code[j])) j++;
      const isFunction = code[j] === '(';

      // Check for property access (preceded by .)
      let k = i - 1;
      while (k >= 0 && /\s/.test(code[k])) k--;
      const isProperty = code[k] === '.';

      if (keywords.includes(word)) {
        tokens.push(span({ className: 'sh-keyword' }, word));
      } else if (builtins.includes(word)) {
        tokens.push(span({ className: 'sh-builtin' }, word));
      } else if (isFunction && !isProperty) {
        tokens.push(span({ className: 'sh-function' }, word));
      } else if (isProperty) {
        tokens.push(span({ className: 'sh-property' }, word));
      } else if (word[0] === word[0].toUpperCase() && /[a-zA-Z]/.test(word[0])) {
        tokens.push(span({ className: 'sh-class' }, word));
      } else {
        tokens.push(span({ className: 'sh-variable' }, word));
      }
      i = end;
      continue;
    }

    // Operators
    if (/[+\-*/%=<>!&|^~?:]/.test(code[i])) {
      let end = i;
      // Handle multi-character operators
      const ops = ['=>', '===', '!==', '==', '!=', '<=', '>=', '&&', '||', '??', '++', '--', '+=', '-=', '*=', '/=', '%=', '**', '?.', '...'];
      let matched = false;
      for (const op of ops) {
        if (code.slice(i, i + op.length) === op) {
          tokens.push(span({ className: 'sh-operator' }, op));
          i += op.length;
          matched = true;
          break;
        }
      }
      if (!matched) {
        tokens.push(span({ className: 'sh-operator' }, code[i]));
        i++;
      }
      continue;
    }

    // Punctuation
    if (/[{}()\[\];,.]/.test(code[i])) {
      tokens.push(span({ className: 'sh-punctuation' }, code[i]));
      i++;
      continue;
    }

    // Whitespace and other characters
    if (code[i] === '\n') {
      tokens.push('\n');
      i++;
    } else if (/\s/.test(code[i])) {
      let end = i;
      while (end < code.length && /[ \t]/.test(code[end])) end++;
      tokens.push(code.slice(i, end));
      i = end;
    } else {
      tokens.push(code[i]);
      i++;
    }
  }

  return tokens;
}

// Create a highlighted code block
export function codeBlock(code: string) {
  return highlight(code.trim());
}

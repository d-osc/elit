import { createState, computed, reactive, div, button, span, h2, h3, p, ul, li, strong, pre, code, type VNode } from 'elit';
import { codeBlock } from '../../highlight';

// Search Demo Component
export const SearchDemo = () => {
  interface Item {
    id: number;
    title: string;
    description: string;
    category: string;
    tags: string[];
  }

  const items: Item[] = [
    { id: 1, title: 'JavaScript Basics', description: 'Learn the fundamentals of JavaScript programming', category: 'Programming', tags: ['javascript', 'beginner', 'web'] },
    { id: 2, title: 'React Tutorial', description: 'Build modern web applications with React', category: 'Framework', tags: ['react', 'javascript', 'frontend'] },
    { id: 3, title: 'TypeScript Guide', description: 'Master TypeScript for type-safe development', category: 'Programming', tags: ['typescript', 'javascript', 'types'] },
    { id: 4, title: 'CSS Flexbox', description: 'Create flexible layouts with CSS Flexbox', category: 'Styling', tags: ['css', 'layout', 'design'] },
    { id: 5, title: 'Node.js API', description: 'Build RESTful APIs with Node.js and Express', category: 'Backend', tags: ['nodejs', 'api', 'backend'] },
    { id: 6, title: 'Vue.js Essentials', description: 'Learn Vue.js framework from scratch', category: 'Framework', tags: ['vue', 'javascript', 'frontend'] },
    { id: 7, title: 'Python Basics', description: 'Introduction to Python programming', category: 'Programming', tags: ['python', 'beginner'] },
    { id: 8, title: 'Docker Container', description: 'Containerize applications with Docker', category: 'DevOps', tags: ['docker', 'containers', 'deployment'] },
    { id: 9, title: 'Git Version Control', description: 'Master Git for version control', category: 'Tools', tags: ['git', 'version-control', 'collaboration'] },
    { id: 10, title: 'SQL Database', description: 'Learn SQL and relational databases', category: 'Database', tags: ['sql', 'database', 'backend'] }
  ];

  const searchQuery = createState('');
  const selectedCategory = createState<string>('All');
  const searchIn = createState<'all' | 'title' | 'description' | 'tags'>('all');

  // Get unique categories
  const categories = ['All', ...Array.from(new Set(items.map(item => item.category)))];

  // Computed state for filtered items
  const filteredItems = computed([searchQuery, selectedCategory, searchIn], (query, category, searchMode) => {
    let filtered = items;

    // Filter by category
    if (category !== 'All') {
      filtered = filtered.filter(item => item.category === category);
    }

    // Filter by search query
    if (query.trim()) {
      const searchText = query.toLowerCase().trim();
      filtered = filtered.filter(item => {
        switch (searchMode) {
          case 'title':
            return item.title.toLowerCase().includes(searchText);
          case 'description':
            return item.description.toLowerCase().includes(searchText);
          case 'tags':
            return item.tags.some(tag => tag.toLowerCase().includes(searchText));
          case 'all':
          default:
            return (
              item.title.toLowerCase().includes(searchText) ||
              item.description.toLowerCase().includes(searchText) ||
              item.tags.some(tag => tag.toLowerCase().includes(searchText))
            );
        }
      });
    }

    return filtered;
  });

  const totalResults = () => filteredItems.value.length;
  const highlightText = (text: string) => {
    if (!searchQuery.value.trim()) return text;

    const query = searchQuery.value.trim();
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);

    return parts.map(part =>
      part.toLowerCase() === query.toLowerCase()
        ? span({ style: 'background: #fbbf24; color: #000; padding: 0 2px; border-radius: 2px; font-weight: 600;' }, part)
        : part
    );
  };

  return div(
    // Search Section
    div({ style: 'margin-bottom: 1.5rem;' },
      // Search Input
      div({ style: 'margin-bottom: 1rem;' },
        div({ style: 'position: relative;' },
          span({
            style: 'position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 1.25rem; pointer-events: none;'
          }, '🔍'),
          div({
            contentEditable: 'true',
            style: `
              width: 100%;
              padding: 0.875rem 0.875rem 0.875rem 2.75rem;
              border: 2px solid var(--border);
              border-radius: 10px;
              background: var(--bg);
              color: var(--text-primary);
              font-size: 1.125rem;
              outline: none;
              min-height: 48px;
              transition: border-color 0.2s;
            `,
            oninput: (e: Event) => {
              searchQuery.value = (e.target as HTMLElement).textContent || '';
            },
            onfocus: (e: Event) => {
              (e.target as HTMLElement).style.borderColor = 'var(--primary)';
            },
            onblur: (e: Event) => {
              (e.target as HTMLElement).style.borderColor = 'var(--border)';
            },
            'data-placeholder': searchQuery.value ? '' : 'Search for tutorials, guides, or topics...'
          })
        )
      ),

      // Search Options
      div({ style: 'display: flex; gap: 1rem; flex-wrap: wrap; align-items: center; margin-bottom: 1rem;' },
        // Search In selector
        div({ style: 'display: flex; gap: 0.5rem; align-items: center;' },
          span({ style: 'color: var(--text-muted); font-size: 0.875rem; font-weight: 600;' }, 'Search in:'),
          reactive(searchIn, (selected: string) =>
            div({ style: 'display: flex; gap: 0.25rem;' },
              ...(['all', 'title', 'description', 'tags'] as const).map(option =>
                button({
                  onclick: () => { searchIn.value = option; },
                  style: `
                    padding: 0.375rem 0.75rem;
                    border-radius: 6px;
                    border: 1px solid var(--border);
                    background: ${selected === option ? 'var(--primary)' : 'var(--bg)'};
                    color: ${selected === option ? 'white' : 'var(--text-primary)'};
                    cursor: pointer;
                    font-size: 0.8125rem;
                    font-weight: 600;
                    text-transform: capitalize;
                    transition: all 0.2s;
                  `
                }, option)
              )
            )
          )
        ),

        // Category Filter
        reactive(selectedCategory, (cat: string) =>
          div({ style: 'display: flex; gap: 0.25rem; flex-wrap: wrap; flex: 1;' },
            ...categories.map(category =>
              button({
                onclick: () => { selectedCategory.value = category; },
                style: `
                  padding: 0.375rem 0.75rem;
                  border-radius: 6px;
                  border: 1px solid var(--border);
                  background: ${cat === category ? 'var(--primary)' : 'var(--bg)'};
                  color: ${cat === category ? 'white' : 'var(--text-primary)'};
                  cursor: pointer;
                  font-size: 0.8125rem;
                  font-weight: 600;
                  transition: all 0.2s;
                `
              }, category)
            )
          )
        )
      ),

      // Results Count
      reactive(searchQuery, () =>
        reactive(selectedCategory, () =>
          div({
            style: 'padding: 0.75rem 1rem; background: var(--bg-card); border-radius: 8px; border: 1px solid var(--border); display: flex; align-items: center; gap: 0.5rem;'
          },
            span({ style: 'font-size: 1.25rem;' }, '📊'),
            span({ style: 'color: var(--text-muted);' }, 'Found'),
            span({ style: 'font-weight: bold; color: var(--primary); font-size: 1.125rem;' }, String(totalResults())),
            span({ style: 'color: var(--text-muted);' }, totalResults() === 1 ? 'result' : 'results')
          )
        )
      )
    ),

    // Results List
    reactive(filteredItems, (results) => {
      return results.length === 0
            ? div({
                style: 'text-align: center; padding: 3rem; color: var(--text-muted); background: var(--bg-card); border-radius: 12px; border: 1px dashed var(--border);'
              },
                div({ style: 'font-size: 3.5rem; margin-bottom: 1rem;' }, '🔍'),
                div({ style: 'font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem;' }, 'No results found'),
                div({ style: 'font-size: 0.875rem;' }, 'Try adjusting your search or filter')
              )
            : div({ style: 'display: grid; gap: 1rem;' },
                ...results.map(item =>
                  div({
                    style: `
                      padding: 1.25rem;
                      background: var(--bg-card);
                      border: 2px solid var(--border);
                      border-radius: 12px;
                      transition: all 0.2s;
                      cursor: pointer;
                    `,
                    onmouseenter: (e: Event) => {
                      const target = e.target as HTMLElement;
                      target.style.borderColor = 'var(--primary)';
                      target.style.transform = 'translateY(-2px)';
                      target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    },
                    onmouseleave: (e: Event) => {
                      const target = e.target as HTMLElement;
                      target.style.borderColor = 'var(--border)';
                      target.style.transform = 'translateY(0)';
                      target.style.boxShadow = 'none';
                    }
                  },
                    // Category Badge
                    div({ style: 'margin-bottom: 0.75rem;' },
                      span({
                        style: `
                          display: inline-block;
                          padding: 0.25rem 0.625rem;
                          background: var(--primary);
                          color: white;
                          border-radius: 6px;
                          font-size: 0.75rem;
                          font-weight: 600;
                        `
                      }, item.category)
                    ),

                    // Title
                    div({
                      style: 'font-size: 1.25rem; font-weight: bold; margin-bottom: 0.5rem; color: var(--text-primary);'
                    }, ...highlightText(item.title)),

                    // Description
                    div({
                      style: 'color: var(--text-muted); margin-bottom: 0.75rem; line-height: 1.6;'
                    }, ...highlightText(item.description)),

                    // Tags
                    div({ style: 'display: flex; gap: 0.375rem; flex-wrap: wrap;' },
                      ...item.tags.map(tag =>
                        span({
                          style: `
                            padding: 0.25rem 0.5rem;
                            background: var(--bg);
                            border: 1px solid var(--border);
                            border-radius: 4px;
                            font-size: 0.75rem;
                            color: var(--text-muted);
                            font-weight: 500;
                          `
                        }, ...highlightText(`#${tag}`))
                      )
                    )
                  )
                )
              );
    })
  );
};

// Source code examples
const searchStateExample = `import { createState, computed, reactive, div, span } from 'elit';

interface Item {
  id: number;
  title: string;
  description: string;
  category: string;
  tags: string[];
}

// Sample data
const items: Item[] = [
  {
    id: 1,
    title: 'JavaScript Basics',
    description: 'Learn JavaScript fundamentals',
    category: 'Programming',
    tags: ['javascript', 'beginner', 'web']
  },
  // ... more items
];

// State
const searchQuery = createState('');
const selectedCategory = createState<string>('All');
const searchIn = createState<'all' | 'title' | 'description' | 'tags'>('all');

// Search input without reactive wrapper to avoid re-render issues
div({
  contentEditable: 'true',
  style: 'padding: 0.875rem; border: 2px solid var(--border);',
  oninput: (e: Event) => {
    searchQuery.value = (e.target as HTMLElement).textContent || '';
  }
});`;

const searchFilterExample = `// Computed state for filtered items
// Automatically tracks searchQuery, selectedCategory, and searchIn
const filteredItems = computed(
  [searchQuery, selectedCategory, searchIn],
  (query, category, searchMode) => {
    let filtered = items;

    // Filter by category
    if (category !== 'All') {
      filtered = filtered.filter(item => item.category === category);
    }

    // Filter by search query
    if (query.trim()) {
      const searchText = query.toLowerCase().trim();

      filtered = filtered.filter(item => {
        switch (searchMode) {
          case 'title':
            return item.title.toLowerCase().includes(searchText);
          case 'description':
            return item.description.toLowerCase().includes(searchText);
          case 'tags':
            return item.tags.some(tag =>
              tag.toLowerCase().includes(searchText)
            );
          case 'all':
          default:
            return (
              item.title.toLowerCase().includes(searchText) ||
              item.description.toLowerCase().includes(searchText) ||
              item.tags.some(tag => tag.toLowerCase().includes(searchText))
            );
        }
      });
    }

    return filtered;
  }
);`;

const searchHighlightExample = `// Text highlighting with reactive updates
const highlightText = (text: string) => {
  if (!searchQuery.value.trim()) return text;

  const query = searchQuery.value.trim();
  const regex = new RegExp(\`(\${query})\`, 'gi');
  const parts = text.split(regex);

  return parts.map(part =>
    part.toLowerCase() === query.toLowerCase()
      ? span({
          style: 'background: #fbbf24; color: #000; padding: 0 2px;'
        }, part)
      : part
  );
};

// Usage in rendering
div({ style: 'font-size: 1.25rem;' },
  ...highlightText(item.title)
);`;

const searchRenderExample = `// Reactive search results rendering using computed state
// No need for nested reactive - computed handles all dependencies
reactive(filteredItems, (results) => {
  return results.length === 0
    ? div('No results found')
    : div({ style: 'display: grid; gap: 1rem;' },
        ...results.map(item =>
          div({ style: 'padding: 1.25rem; background: var(--bg-card);' },
            // Category badge
            span({ style: 'background: var(--primary);' },
              item.category
            ),

            // Highlighted title
            div(...highlightText(item.title)),

            // Highlighted description
            div(...highlightText(item.description)),

            // Tags with highlighting
            div({ style: 'display: flex; gap: 0.375rem;' },
              ...item.tags.map(tag =>
                span(...highlightText(\`#\${tag}\`))
              )
            )
          )
        )
      );
});`;

// Search Content
export const SearchContent: VNode = div(
  // Demo
  div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 2rem; margin-bottom: 3rem;' },
    h2({ style: 'margin: 0 0 2rem 0; font-size: 1.75rem;' }, '🔍 Try the Search System'),
    SearchDemo()
  ),

  // Technical Overview
  div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 2rem; margin-bottom: 3rem;' },
    h2({ style: 'margin: 0 0 1.5rem 0; font-size: 1.75rem;' }, '🔧 Technical Implementation'),
    p({ style: 'color: var(--text-muted); margin-bottom: 2rem; line-height: 1.8;' },
      'This Search System demonstrates advanced filtering with multiple search modes, real-time text highlighting, ',
      'category filtering, and responsive search results with Elit\'s reactive state management.'
    ),

    // Key Features
    div({ style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;' },
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '🎯 Multi-mode Search'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Search across all fields, or focus on title, description, or tags specifically'
        )
      ),
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '✨ Text Highlighting'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Real-time highlighting of matching text in search results for better visibility'
        )
      ),
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '📂 Category Filtering'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Combine search with category filters for precise results'
        )
      ),
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '⚡ Instant Results'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Zero-delay search with reactive updates as you type'
        )
      )
    )
  ),

  // Source Code
  div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 2rem; margin-bottom: 3rem;' },
    h2({ style: 'margin: 0 0 1.5rem 0; font-size: 1.75rem;' }, '💻 Source Code'),

    h3({ style: 'margin: 2rem 0 1rem 0; font-size: 1.25rem; color: var(--primary);' }, '1. State & Data Setup'),
    pre({ style: 'margin: 0 0 2rem 0;' }, code(...codeBlock(searchStateExample))),

    h3({ style: 'margin: 2rem 0 1rem 0; font-size: 1.25rem; color: var(--primary);' }, '2. Advanced Filtering Logic'),
    pre({ style: 'margin: 0 0 2rem 0;' }, code(...codeBlock(searchFilterExample))),

    h3({ style: 'margin: 2rem 0 1rem 0; font-size: 1.25rem; color: var(--primary);' }, '3. Text Highlighting'),
    pre({ style: 'margin: 0 0 2rem 0;' }, code(...codeBlock(searchHighlightExample))),

    h3({ style: 'margin: 2rem 0 1rem 0; font-size: 1.25rem; color: var(--primary);' }, '4. Reactive Results Rendering'),
    pre({ style: 'margin: 0;' }, code(...codeBlock(searchRenderExample)))
  ),

  // Key Learnings
  div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 2rem;' },
    h2({ style: 'margin: 0 0 1.5rem 0; font-size: 1.75rem;' }, '🎓 Key Learnings'),
    ul({ style: 'margin: 0; padding-left: 1.5rem; line-height: 2; color: var(--text-muted);' },
      li(strong('Multi-field search:'), ' Searching across multiple properties with flexible filtering modes'),
      li(strong('Text highlighting:'), ' Using regex to split and highlight matching text dynamically'),
      li(strong('Input handling:'), ' Using oninput event without reactive wrapper to prevent re-render issues'),
      li(strong('Computed state:'), ' Using computed() to track 3 dependencies (searchQuery, selectedCategory, searchIn) automatically'),
      li(strong('Search optimization:'), ' Case-insensitive matching with trim for better user experience'),
      li(strong('Tag filtering:'), ' Using array.some() to search within tag arrays'),
      li(strong('Dynamic categories:'), ' Extracting unique categories from data with Set'),
      li(strong('Result counting:'), ' Real-time statistics for search feedback'),
      li(strong('Interactive UI:'), ' Hover effects and transitions for better engagement')
    )
  )
);

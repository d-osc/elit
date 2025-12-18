import { createState, computed, reactive, div, button, span, h2, h3, p, ul, li, strong, pre, code, type VNode } from 'elit';
import { codeBlock } from '../../highlight';

// Project Management Demo Component
export const ProjectManagementDemo = () => {
  interface Task {
    id: number;
    title: string;
    description: string;
    assignee: string;
    priority: 'Low' | 'Medium' | 'High';
    status: 'To Do' | 'In Progress' | 'Done';
    dueDate: string;
  }

  // Initial tasks
  const tasks = createState<Task[]>([
    { id: 1, title: 'Design homepage mockup', description: 'Create wireframes and mockups', assignee: 'Alice', priority: 'High', status: 'In Progress', dueDate: '2024-01-15' },
    { id: 2, title: 'Implement authentication', description: 'Add login and registration', assignee: 'Bob', priority: 'High', status: 'To Do', dueDate: '2024-01-20' },
    { id: 3, title: 'Write documentation', description: 'API documentation', assignee: 'Charlie', priority: 'Medium', status: 'To Do', dueDate: '2024-01-25' },
    { id: 4, title: 'Fix navigation bug', description: 'Mobile menu not working', assignee: 'Alice', priority: 'Low', status: 'Done', dueDate: '2024-01-10' },
  ]);

  // Filter states
  const selectedStatus = createState<'All' | 'To Do' | 'In Progress' | 'Done'>('All');
  const selectedPriority = createState<'All' | 'Low' | 'Medium' | 'High'>('All');
  const selectedAssignee = createState<string>('All');
  const searchQuery = createState('');

  // Add task form states
  const showAddForm = createState(false);
  const newTaskTitle = createState('');
  const newTaskDescription = createState('');
  const newTaskAssignee = createState('Alice');
  const newTaskPriority = createState<'Low' | 'Medium' | 'High'>('Medium');
  const newTaskStatus = createState<'To Do' | 'In Progress' | 'Done'>('To Do');
  const newTaskDueDate = createState('');

  let nextId = 5;

  // Get unique assignees
  const assignees = computed([tasks], (taskList) => {
    return ['All', ...Array.from(new Set(taskList.map(t => t.assignee)))];
  });

  // Computed filtered tasks
  const filteredTasks = computed(
    [tasks, selectedStatus, selectedPriority, selectedAssignee, searchQuery],
    (taskList, status, priority, assignee, query) => {
      let filtered = taskList;

      // Filter by status
      if (status !== 'All') {
        filtered = filtered.filter(t => t.status === status);
      }

      // Filter by priority
      if (priority !== 'All') {
        filtered = filtered.filter(t => t.priority === priority);
      }

      // Filter by assignee
      if (assignee !== 'All') {
        filtered = filtered.filter(t => t.assignee === assignee);
      }

      // Filter by search query
      if (query.trim()) {
        const searchText = query.toLowerCase().trim();
        filtered = filtered.filter(t =>
          t.title.toLowerCase().includes(searchText) ||
          t.description.toLowerCase().includes(searchText)
        );
      }

      return filtered;
    }
  );

  // Computed statistics
  const totalTasks = computed([tasks], (taskList) => taskList.length);
  const todoCount = computed([tasks], (taskList) => taskList.filter(t => t.status === 'To Do').length);
  const inProgressCount = computed([tasks], (taskList) => taskList.filter(t => t.status === 'In Progress').length);
  const doneCount = computed([tasks], (taskList) => taskList.filter(t => t.status === 'Done').length);
  const highPriorityCount = computed([tasks], (taskList) => taskList.filter(t => t.priority === 'High' && t.status !== 'Done').length);

  // Task operations
  const addTask = () => {
    const title = newTaskTitle.value.trim();
    const description = newTaskDescription.value.trim();

    if (title && description) {
      tasks.value = [...tasks.value, {
        id: nextId++,
        title,
        description,
        assignee: newTaskAssignee.value,
        priority: newTaskPriority.value,
        status: newTaskStatus.value,
        dueDate: newTaskDueDate.value
      }];

      // Clear form
      newTaskTitle.value = '';
      newTaskDescription.value = '';
      newTaskAssignee.value = 'Alice';
      newTaskPriority.value = 'Medium';
      newTaskStatus.value = 'To Do';
      newTaskDueDate.value = '';
      showAddForm.value = false;
    }
  };

  const updateTaskStatus = (taskId: number, newStatus: 'To Do' | 'In Progress' | 'Done') => {
    tasks.value = tasks.value.map(t =>
      t.id === taskId ? { ...t, status: newStatus } : t
    );
  };

  const deleteTask = (taskId: number) => {
    tasks.value = tasks.value.filter(t => t.id !== taskId);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return '#ef4444';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#10b981';
      default: return 'var(--text-muted)';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Done': return '#22c55e';
      case 'In Progress': return '#3b82f6';
      case 'To Do': return '#6b7280';
      default: return 'var(--text-muted)';
    }
  };

  return div(
    // Add Task Button
    div({ style: 'margin-bottom: 1.5rem;' },
      reactive(showAddForm, (isShown) =>
        button({
          onclick: () => { showAddForm.value = !showAddForm.value; },
          style: `
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            border: none;
            background: var(--primary);
            color: white;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          `
        }, isShown ? '✕ Cancel' : '➕ Add New Task')
      )
    ),

    // Add Task Form
    reactive(showAddForm, (isShown) =>
      isShown
        ? div({
            style: `
              background: var(--bg-card);
              border: 2px solid var(--primary);
              border-radius: 12px;
              padding: 1.5rem;
              margin-bottom: 1.5rem;
            `
          },
          div({ style: 'margin-bottom: 1rem; font-size: 1.25rem; font-weight: 600; color: var(--primary);' }, '➕ Add New Task'),

          // Title
          div({ style: 'margin-bottom: 1rem;' },
            div({ style: 'font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-muted);' }, 'Title'),
            div({
              contentEditable: 'true',
              style: `
                padding: 0.75rem;
                border: 2px solid var(--border);
                border-radius: 8px;
                background: var(--bg);
                color: var(--text-primary);
                outline: none;
                min-height: 42px;
              `,
              oninput: (e: Event) => {
                newTaskTitle.value = (e.target as HTMLElement).textContent || '';
              },
              'data-placeholder': newTaskTitle.value ? '' : 'Enter task title...'
            })
          ),

          // Description
          div({ style: 'margin-bottom: 1rem;' },
            div({ style: 'font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-muted);' }, 'Description'),
            div({
              contentEditable: 'true',
              style: `
                padding: 0.75rem;
                border: 2px solid var(--border);
                border-radius: 8px;
                background: var(--bg);
                color: var(--text-primary);
                outline: none;
                min-height: 80px;
              `,
              oninput: (e: Event) => {
                newTaskDescription.value = (e.target as HTMLElement).textContent || '';
              },
              'data-placeholder': newTaskDescription.value ? '' : 'Enter task description...'
            })
          ),

          // Grid: Assignee, Priority, Status
          div({ style: 'display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 1rem;' },
            // Assignee
            div(
              div({ style: 'font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-muted);' }, 'Assignee'),
              reactive(newTaskAssignee, (selected) =>
                div({ style: 'display: flex; flex-direction: column; gap: 0.5rem;' },
                  ...(['Alice', 'Bob', 'Charlie'] as const).map(name =>
                    button({
                      onclick: () => { newTaskAssignee.value = name; },
                      style: `
                        padding: 0.5rem;
                        border-radius: 6px;
                        border: 2px solid ${selected === name ? 'var(--primary)' : 'var(--border)'};
                        background: ${selected === name ? 'var(--primary)' : 'var(--bg)'};
                        color: ${selected === name ? 'white' : 'var(--text-primary)'};
                        cursor: pointer;
                        font-size: 0.875rem;
                        font-weight: 600;
                      `
                    }, name)
                  )
                )
              )
            ),

            // Priority
            div(
              div({ style: 'font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-muted);' }, 'Priority'),
              reactive(newTaskPriority, (selected) =>
                div({ style: 'display: flex; flex-direction: column; gap: 0.5rem;' },
                  ...(['Low', 'Medium', 'High'] as const).map(priority =>
                    button({
                      onclick: () => { newTaskPriority.value = priority; },
                      style: `
                        padding: 0.5rem;
                        border-radius: 6px;
                        border: 2px solid ${selected === priority ? 'var(--primary)' : 'var(--border)'};
                        background: ${selected === priority ? 'var(--primary)' : 'var(--bg)'};
                        color: ${selected === priority ? 'white' : 'var(--text-primary)'};
                        cursor: pointer;
                        font-size: 0.875rem;
                        font-weight: 600;
                      `
                    }, priority)
                  )
                )
              )
            ),

            // Status
            div(
              div({ style: 'font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-muted);' }, 'Status'),
              reactive(newTaskStatus, (selected) =>
                div({ style: 'display: flex; flex-direction: column; gap: 0.5rem;' },
                  ...(['To Do', 'In Progress', 'Done'] as const).map(status =>
                    button({
                      onclick: () => { newTaskStatus.value = status; },
                      style: `
                        padding: 0.5rem;
                        border-radius: 6px;
                        border: 2px solid ${selected === status ? 'var(--primary)' : 'var(--border)'};
                        background: ${selected === status ? 'var(--primary)' : 'var(--bg)'};
                        color: ${selected === status ? 'white' : 'var(--text-primary)'};
                        cursor: pointer;
                        font-size: 0.875rem;
                        font-weight: 600;
                      `
                    }, status)
                  )
                )
              )
            )
          ),

          // Submit Button
          button({
            onclick: addTask,
            style: `
              width: 100%;
              padding: 0.875rem;
              border-radius: 8px;
              border: none;
              background: var(--primary);
              color: white;
              font-size: 1rem;
              font-weight: 600;
              cursor: pointer;
            `
          }, '✓ Add Task')
        )
        : null
    ),

    // Statistics Cards
    reactive(tasks, () =>
      div({
        style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;'
      },
        div({ style: 'padding: 1rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; text-align: center;' },
          div({ style: 'font-size: 1.75rem; font-weight: bold; color: var(--primary);' }, String(totalTasks.value)),
          div({ style: 'font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem;' }, 'Total Tasks')
        ),
        div({ style: 'padding: 1rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; text-align: center;' },
          div({ style: 'font-size: 1.75rem; font-weight: bold; color: #6b7280;' }, String(todoCount.value)),
          div({ style: 'font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem;' }, 'To Do')
        ),
        div({ style: 'padding: 1rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; text-align: center;' },
          div({ style: 'font-size: 1.75rem; font-weight: bold; color: #3b82f6;' }, String(inProgressCount.value)),
          div({ style: 'font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem;' }, 'In Progress')
        ),
        div({ style: 'padding: 1rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; text-align: center;' },
          div({ style: 'font-size: 1.75rem; font-weight: bold; color: #22c55e;' }, String(doneCount.value)),
          div({ style: 'font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem;' }, 'Done')
        ),
        div({ style: 'padding: 1rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; text-align: center;' },
          div({ style: 'font-size: 1.75rem; font-weight: bold; color: #ef4444;' }, String(highPriorityCount.value)),
          div({ style: 'font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem;' }, 'High Priority')
        )
      )
    ),

    // Filters
    div({ style: 'margin-bottom: 1.5rem;' },
      // Search
      div({ style: 'margin-bottom: 1rem;' },
        div({ style: 'position: relative;' },
          span({
            style: 'position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 1.125rem; pointer-events: none;'
          }, '🔍'),
          div({
            contentEditable: 'true',
            style: `
              width: 100%;
              padding: 0.75rem 0.75rem 0.75rem 2.5rem;
              border: 2px solid var(--border);
              border-radius: 8px;
              background: var(--bg);
              color: var(--text-primary);
              font-size: 1rem;
              outline: none;
              min-height: 42px;
            `,
            oninput: (e: Event) => {
              searchQuery.value = (e.target as HTMLElement).textContent || '';
            },
            'data-placeholder': searchQuery.value ? '' : 'Search tasks...'
          })
        )
      ),

      // Filter buttons
      div({ style: 'display: flex; gap: 1rem; flex-wrap: wrap;' },
        // Status filter
        div({ style: 'flex: 1; min-width: 250px;' },
          div({ style: 'font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-muted);' }, 'Status'),
          reactive(selectedStatus, (status) =>
            div({ style: 'display: flex; gap: 0.5rem; flex-wrap: wrap;' },
              ...(['All', 'To Do', 'In Progress', 'Done'] as const).map(s =>
                button({
                  onclick: () => { selectedStatus.value = s; },
                  style: `
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    border: 1px solid var(--border);
                    background: ${status === s ? 'var(--primary)' : 'var(--bg)'};
                    color: ${status === s ? 'white' : 'var(--text-primary)'};
                    cursor: pointer;
                    font-size: 0.875rem;
                    font-weight: 600;
                  `
                }, s)
              )
            )
          )
        ),

        // Priority filter
        div({ style: 'flex: 1; min-width: 250px;' },
          div({ style: 'font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-muted);' }, 'Priority'),
          reactive(selectedPriority, (priority) =>
            div({ style: 'display: flex; gap: 0.5rem; flex-wrap: wrap;' },
              ...(['All', 'Low', 'Medium', 'High'] as const).map(p =>
                button({
                  onclick: () => { selectedPriority.value = p; },
                  style: `
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    border: 1px solid var(--border);
                    background: ${priority === p ? 'var(--primary)' : 'var(--bg)'};
                    color: ${priority === p ? 'white' : 'var(--text-primary)'};
                    cursor: pointer;
                    font-size: 0.875rem;
                    font-weight: 600;
                  `
                }, p)
              )
            )
          )
        ),

        // Assignee filter
        div({ style: 'flex: 1; min-width: 250px;' },
          div({ style: 'font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-muted);' }, 'Assignee'),
          reactive(selectedAssignee, (selected) =>
            div({ style: 'display: flex; gap: 0.5rem; flex-wrap: wrap;' },
              ...assignees.value.map(a =>
                button({
                  onclick: () => { selectedAssignee.value = a; },
                  style: `
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    border: 1px solid var(--border);
                    background: ${selected === a ? 'var(--primary)' : 'var(--bg)'};
                    color: ${selected === a ? 'white' : 'var(--text-primary)'};
                    cursor: pointer;
                    font-size: 0.875rem;
                    font-weight: 600;
                  `
                }, a)
              )
            )
          )
        )
      )
    ),

    // Task List
    reactive(filteredTasks, (taskList) =>
      taskList.length === 0
        ? div({
            style: 'text-align: center; padding: 3rem; color: var(--text-muted); background: var(--bg-card); border-radius: 8px; border: 1px dashed var(--border);'
          },
          div({ style: 'font-size: 3rem; margin-bottom: 0.5rem;' }, '📋'),
          div('No tasks found')
        )
        : div({ style: 'display: grid; gap: 1rem;' },
            ...taskList.map(task =>
              div({
                style: `
                  padding: 1.25rem;
                  background: var(--bg-card);
                  border: 2px solid var(--border);
                  border-radius: 12px;
                  transition: all 0.2s;
                `
              },
                // Header
                div({ style: 'display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;' },
                  div({ style: 'flex: 1;' },
                    div({ style: 'font-size: 1.125rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem;' }, task.title),
                    div({ style: 'color: var(--text-muted); font-size: 0.875rem;' }, task.description)
                  ),
                  button({
                    onclick: () => deleteTask(task.id),
                    style: 'background: transparent; border: none; color: #ef4444; cursor: pointer; font-size: 1.25rem;'
                  }, '🗑️')
                ),

                // Metadata
                div({ style: 'display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem;' },
                  div({ style: 'display: flex; align-items: center; gap: 0.5rem;' },
                    span({ style: 'font-size: 0.875rem; color: var(--text-muted);' }, '👤'),
                    span({ style: 'font-size: 0.875rem; font-weight: 600;' }, task.assignee)
                  ),
                  div({ style: 'display: flex; align-items: center; gap: 0.5rem;' },
                    span({ style: 'font-size: 0.875rem; color: var(--text-muted);' }, '📅'),
                    span({ style: 'font-size: 0.875rem;' }, task.dueDate)
                  ),
                  div({
                    style: `
                      padding: 0.25rem 0.75rem;
                      border-radius: 12px;
                      background: ${getPriorityColor(task.priority)}20;
                      color: ${getPriorityColor(task.priority)};
                      font-size: 0.75rem;
                      font-weight: 600;
                    `
                  }, task.priority)
                ),

                // Status buttons
                div({ style: 'display: flex; gap: 0.5rem;' },
                  ...(['To Do', 'In Progress', 'Done'] as const).map(status =>
                    button({
                      onclick: () => updateTaskStatus(task.id, status),
                      style: `
                        flex: 1;
                        padding: 0.5rem;
                        border-radius: 6px;
                        border: 2px solid ${task.status === status ? getStatusColor(status) : 'var(--border)'};
                        background: ${task.status === status ? getStatusColor(status) : 'var(--bg)'};
                        color: ${task.status === status ? 'white' : 'var(--text-primary)'};
                        cursor: pointer;
                        font-size: 0.875rem;
                        font-weight: 600;
                      `
                    }, status)
                  )
                )
              )
            )
          )
    )
  );
};

// Source code examples
const pmStateExample = `import { createState, computed, reactive } from 'elit';

interface Task {
  id: number;
  title: string;
  description: string;
  assignee: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'To Do' | 'In Progress' | 'Done';
  dueDate: string;
}

// State
const tasks = createState<Task[]>([
  { id: 1, title: 'Design homepage', assignee: 'Alice', priority: 'High', status: 'In Progress', dueDate: '2024-01-15' }
]);

const selectedStatus = createState<'All' | 'To Do' | 'In Progress' | 'Done'>('All');
const selectedPriority = createState<'All' | 'Low' | 'Medium' | 'High'>('All');
const selectedAssignee = createState<string>('All');
const searchQuery = createState('');`;

const pmComputedExample = `// Computed filtered tasks with 5 dependencies
const filteredTasks = computed(
  [tasks, selectedStatus, selectedPriority, selectedAssignee, searchQuery],
  (taskList, status, priority, assignee, query) => {
    let filtered = taskList;

    if (status !== 'All') {
      filtered = filtered.filter(t => t.status === status);
    }

    if (priority !== 'All') {
      filtered = filtered.filter(t => t.priority === priority);
    }

    if (assignee !== 'All') {
      filtered = filtered.filter(t => t.assignee === assignee);
    }

    if (query.trim()) {
      const searchText = query.toLowerCase().trim();
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(searchText) ||
        t.description.toLowerCase().includes(searchText)
      );
    }

    return filtered;
  }
);

// Dynamic computed assignees from task list
const assignees = computed([tasks], (taskList) => {
  return ['All', ...Array.from(new Set(taskList.map(t => t.assignee)))];
});

// Computed statistics
const totalTasks = computed([tasks], (taskList) => taskList.length);
const todoCount = computed([tasks], (taskList) =>
  taskList.filter(t => t.status === 'To Do').length
);
const doneCount = computed([tasks], (taskList) =>
  taskList.filter(t => t.status === 'Done').length
);`;

const pmOperationsExample = `// Task operations
const addTask = () => {
  const title = newTaskTitle.value.trim();
  const description = newTaskDescription.value.trim();

  if (title && description) {
    tasks.value = [...tasks.value, {
      id: nextId++,
      title,
      description,
      assignee: newTaskAssignee.value,
      priority: newTaskPriority.value,
      status: newTaskStatus.value,
      dueDate: newTaskDueDate.value
    }];

    // Clear form
    newTaskTitle.value = '';
    newTaskDescription.value = '';
    showAddForm.value = false;
  }
};

const updateTaskStatus = (taskId: number, newStatus: 'To Do' | 'In Progress' | 'Done') => {
  tasks.value = tasks.value.map(t =>
    t.id === taskId ? { ...t, status: newStatus } : t
  );
};

const deleteTask = (taskId: number) => {
  tasks.value = tasks.value.filter(t => t.id !== taskId);
};`;

const pmRenderExample = `// Reactive task list rendering
reactive(filteredTasks, (taskList) =>
  taskList.length === 0
    ? div('No tasks found')
    : div({ style: 'display: grid; gap: 1rem;' },
        ...taskList.map(task =>
          div({ style: 'padding: 1.25rem; background: var(--bg-card);' },
            // Title and description
            div({ style: 'font-weight: 600;' }, task.title),
            div({ style: 'color: var(--text-muted);' }, task.description),

            // Metadata
            div({ style: 'display: flex; gap: 1rem;' },
              div(\`👤 \${task.assignee}\`),
              div(\`📅 \${task.dueDate}\`),
              div({
                style: \`color: \${getPriorityColor(task.priority)}\`
              }, task.priority)
            ),

            // Status buttons
            div({ style: 'display: flex; gap: 0.5rem;' },
              ...['To Do', 'In Progress', 'Done'].map(status =>
                button({
                  onclick: () => updateTaskStatus(task.id, status),
                  style: \`
                    background: \${task.status === status ? getStatusColor(status) : 'var(--bg)'};
                  \`
                }, status)
              )
            )
          )
        )
      )
);

// Assignee filter - using reactive with selectedAssignee and assignees.value
// IMPORTANT: Avoid nested reactive - use .value to access computed state
reactive(selectedAssignee, (selected) =>
  div({ style: 'display: flex; gap: 0.5rem; flex-wrap: wrap;' },
    ...assignees.value.map(a =>
      button({
        onclick: () => { selectedAssignee.value = a; },
        style: \`
          padding: 0.5rem 1rem;
          border-radius: 6px;
          background: \${selected === a ? 'var(--primary)' : 'var(--bg)'};
          color: \${selected === a ? 'white' : 'var(--text-primary)'};
        \`
      }, a)
    )
  )
);`;

// Project Management Content
export const ProjectManagementContent: VNode = div(
  // Demo
  div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 2rem; margin-bottom: 3rem;' },
    h2({ style: 'margin: 0 0 2rem 0; font-size: 1.75rem;' }, '📋 Project Management System'),
    ProjectManagementDemo()
  ),

  // Technical Overview
  div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 2rem; margin-bottom: 3rem;' },
    h2({ style: 'margin: 0 0 1.5rem 0; font-size: 1.75rem;' }, '🔧 Technical Implementation'),
    p({ style: 'color: var(--text-muted); margin-bottom: 2rem; line-height: 1.8;' },
      'This Project Management System demonstrates task tracking, multi-criteria filtering, status updates, ',
      'team assignment, and real-time statistics using Elit\'s reactive state management.'
    ),

    // Key Features
    div({ style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;' },
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '📝 Task Management'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Create, update, and delete tasks with detailed information'
        )
      ),
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '🎯 Status Tracking'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Track tasks through To Do, In Progress, and Done statuses'
        )
      ),
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '🔍 Advanced Filtering'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Filter by status, priority, assignee, and search text'
        )
      ),
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '📊 Real-time Stats'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Live statistics showing task counts and high-priority items'
        )
      )
    )
  ),

  // Source Code
  div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 2rem; margin-bottom: 3rem;' },
    h2({ style: 'margin: 0 0 1.5rem 0; font-size: 1.75rem;' }, '💻 Source Code'),

    h3({ style: 'margin: 2rem 0 1rem 0; font-size: 1.25rem; color: var(--primary);' }, '1. State & Data'),
    pre({ style: 'margin: 0 0 2rem 0;' }, code(...codeBlock(pmStateExample))),

    h3({ style: 'margin: 2rem 0 1rem 0; font-size: 1.25rem; color: var(--primary);' }, '2. Computed Filtering & Stats'),
    pre({ style: 'margin: 0 0 2rem 0;' }, code(...codeBlock(pmComputedExample))),

    h3({ style: 'margin: 2rem 0 1rem 0; font-size: 1.25rem; color: var(--primary);' }, '3. Task Operations'),
    pre({ style: 'margin: 0 0 2rem 0;' }, code(...codeBlock(pmOperationsExample))),

    h3({ style: 'margin: 2rem 0 1rem 0; font-size: 1.25rem; color: var(--primary);' }, '4. Reactive Rendering'),
    pre({ style: 'margin: 0;' }, code(...codeBlock(pmRenderExample)))
  ),

  // Key Learnings
  div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 2rem;' },
    h2({ style: 'margin: 0 0 1.5rem 0; font-size: 1.75rem;' }, '🎓 Key Learnings'),
    ul({ style: 'margin: 0; padding-left: 1.5rem; line-height: 2; color: var(--text-muted);' },
      li(strong('Multi-criteria filtering:'), ' Combining 5 filters (status, priority, assignee, search, tasks) with computed state'),
      li(strong('Computed chains:'), ' Multiple computed states for different statistics'),
      li(strong('Avoiding nested reactive:'), ' Using reactive(selectedAssignee) with assignees.value instead of nested reactive calls'),
      li(strong('Status management:'), ' Updating task status with visual feedback'),
      li(strong('Dynamic assignees:'), ' Computing unique assignees from task list'),
      li(strong('Color coding:'), ' Using functions to map priority/status to colors'),
      li(strong('Form handling:'), ' Managing complex form with multiple fields and validation'),
      li(strong('Immutable updates:'), ' Using map and filter for array transformations'),
      li(strong('Conditional rendering:'), ' Showing/hiding add form based on state'),
      li(strong('Real-time statistics:'), ' Computing counts from filtered data'),
      li(strong('Task metadata:'), ' Displaying assignee, due date, and priority badges')
    )
  )
);

export type TodoPriority = 'low' | 'medium' | 'high';

export interface TodoItem {
	id: string;
	title: string;
	notes: string;
	priority: TodoPriority;
	completed: boolean;
	createdAt: string;
	updatedAt: string;
}

export const todos: TodoItem[] = [
	{
		id: 'todo_launch_board',
		title: 'Ship the first database-backed board',
		notes: 'Wire the server endpoints and confirm every action writes back to databases/todo.ts.',
		priority: 'high',
		completed: false,
		createdAt: '2026-04-17T09:00:00.000Z',
		updatedAt: '2026-04-17T09:00:00.000Z'
	},
	{
		id: 'todo_polish_copy',
		title: 'Tune the starter copy',
		notes: 'Replace placeholders with a short workflow that makes sense for your team.',
		priority: 'medium',
		completed: false,
		createdAt: '2026-04-17T09:30:00.000Z',
		updatedAt: '2026-04-17T09:30:00.000Z'
	},
	{
		id: 'todo_cleanup_template',
		title: 'Prune example tasks you do not need',
		notes: 'Keep the board lean so the starter feels like your own project from day one.',
		priority: 'low',
		completed: true,
		createdAt: '2026-04-17T08:15:00.000Z',
		updatedAt: '2026-04-17T10:15:00.000Z'
	}
];
export type TodoPriority = 'low' | 'medium' | 'high';
export type TodoFilter = 'all' | 'active' | 'completed';

export interface TodoItem {
  id: string;
  title: string;
  notes: string;
  priority: TodoPriority;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TodoSummary {
  total: number;
  active: number;
  completed: number;
  highPriority: number;
}
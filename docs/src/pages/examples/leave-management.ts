import { createState, computed, reactive, div, button, span, h2, h3, p, ul, li, strong, pre, code, type VNode } from 'elit';
import { codeBlock } from '../../highlight';

// Leave Management Demo Component
export const LeaveManagementDemo = () => {
  interface LeaveRequest {
    id: number;
    employeeName: string;
    department: string;
    leaveType: 'Annual' | 'Sick' | 'Personal' | 'Emergency';
    startDate: string;
    endDate: string;
    days: number;
    reason: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    submittedDate: string;
  }

  // Initial leave requests
  const leaveRequests = createState<LeaveRequest[]>([
    { id: 1, employeeName: 'John Smith', department: 'Engineering', leaveType: 'Annual', startDate: '2024-02-01', endDate: '2024-02-05', days: 5, reason: 'Family vacation', status: 'Pending', submittedDate: '2024-01-15' },
    { id: 2, employeeName: 'Sarah Johnson', department: 'Marketing', leaveType: 'Sick', startDate: '2024-01-20', endDate: '2024-01-22', days: 3, reason: 'Medical appointment', status: 'Approved', submittedDate: '2024-01-18' },
    { id: 3, employeeName: 'Mike Davis', department: 'Sales', leaveType: 'Personal', startDate: '2024-02-10', endDate: '2024-02-12', days: 3, reason: 'Personal matters', status: 'Pending', submittedDate: '2024-01-25' },
    { id: 4, employeeName: 'Emma Wilson', department: 'HR', leaveType: 'Emergency', startDate: '2024-01-18', endDate: '2024-01-18', days: 1, reason: 'Family emergency', status: 'Approved', submittedDate: '2024-01-17' },
  ]);

  // Filter states
  const selectedStatus = createState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const selectedLeaveType = createState<'All' | 'Annual' | 'Sick' | 'Personal' | 'Emergency'>('All');
  const selectedDepartment = createState<string>('All');
  const searchQuery = createState('');

  // Add leave form states
  const showAddForm = createState(false);
  const newEmployeeName = createState('');
  const newDepartment = createState('Engineering');
  const newLeaveType = createState<'Annual' | 'Sick' | 'Personal' | 'Emergency'>('Annual');
  const newStartDate = createState('');
  const newEndDate = createState('');
  const newReason = createState('');

  let nextId = 5;

  // Get unique departments
  const departments = computed([leaveRequests], (requests) => {
    return ['All', ...Array.from(new Set(requests.map(r => r.department)))];
  });

  // Computed filtered requests
  const filteredRequests = computed(
    [leaveRequests, selectedStatus, selectedLeaveType, selectedDepartment, searchQuery],
    (requests, status, leaveType, department, query) => {
      let filtered = requests;

      if (status !== 'All') {
        filtered = filtered.filter(r => r.status === status);
      }

      if (leaveType !== 'All') {
        filtered = filtered.filter(r => r.leaveType === leaveType);
      }

      if (department !== 'All') {
        filtered = filtered.filter(r => r.department === department);
      }

      if (query.trim()) {
        const searchText = query.toLowerCase().trim();
        filtered = filtered.filter(r =>
          r.employeeName.toLowerCase().includes(searchText) ||
          r.reason.toLowerCase().includes(searchText)
        );
      }

      return filtered.sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime());
    }
  );

  // Computed statistics
  const totalRequests = computed([leaveRequests], (requests) => requests.length);
  const pendingCount = computed([leaveRequests], (requests) => requests.filter(r => r.status === 'Pending').length);
  const approvedCount = computed([leaveRequests], (requests) => requests.filter(r => r.status === 'Approved').length);
  const rejectedCount = computed([leaveRequests], (requests) => requests.filter(r => r.status === 'Rejected').length);
  const totalDaysRequested = computed([leaveRequests], (requests) =>
    requests.filter(r => r.status === 'Pending').reduce((sum, r) => sum + r.days, 0)
  );

  // Calculate days between dates
  const calculateDays = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  // Leave operations
  const addLeaveRequest = () => {
    const name = newEmployeeName.value.trim();
    const reason = newReason.value.trim();
    const startDate = newStartDate.value;
    const endDate = newEndDate.value;

    if (name && reason && startDate && endDate) {
      const days = calculateDays(startDate, endDate);
      const today = new Date().toISOString().split('T')[0];

      leaveRequests.value = [...leaveRequests.value, {
        id: nextId++,
        employeeName: name,
        department: newDepartment.value,
        leaveType: newLeaveType.value,
        startDate,
        endDate,
        days,
        reason,
        status: 'Pending',
        submittedDate: today
      }];

      // Clear form
      newEmployeeName.value = '';
      newDepartment.value = 'Engineering';
      newLeaveType.value = 'Annual';
      newStartDate.value = '';
      newEndDate.value = '';
      newReason.value = '';
      showAddForm.value = false;
    }
  };

  const updateStatus = (requestId: number, newStatus: 'Pending' | 'Approved' | 'Rejected') => {
    leaveRequests.value = leaveRequests.value.map(r =>
      r.id === requestId ? { ...r, status: newStatus } : r
    );
  };

  const deleteRequest = (requestId: number) => {
    leaveRequests.value = leaveRequests.value.filter(r => r.id !== requestId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return '#22c55e';
      case 'Rejected': return '#ef4444';
      case 'Pending': return '#f59e0b';
      default: return 'var(--text-muted)';
    }
  };

  const getLeaveTypeIcon = (type: string) => {
    switch (type) {
      case 'Annual': return '🏖️';
      case 'Sick': return '🏥';
      case 'Personal': return '👤';
      case 'Emergency': return '🚨';
      default: return '📋';
    }
  };

  return div(
    // Add Leave Button
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
        }, isShown ? '✕ Cancel' : '➕ New Leave Request')
      )
    ),

    // Add Leave Form
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
          div({ style: 'margin-bottom: 1rem; font-size: 1.25rem; font-weight: 600; color: var(--primary);' }, '➕ New Leave Request'),

          // Employee Name
          div({ style: 'margin-bottom: 1rem;' },
            div({ style: 'font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-muted);' }, 'Employee Name'),
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
                newEmployeeName.value = (e.target as HTMLElement).textContent || '';
              },
              'data-placeholder': newEmployeeName.value ? '' : 'Enter employee name...'
            })
          ),

          // Grid: Department, Leave Type
          div({ style: 'display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;' },
            // Department
            div(
              div({ style: 'font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-muted);' }, 'Department'),
              reactive(newDepartment, (selected) =>
                div({ style: 'display: flex; flex-direction: column; gap: 0.5rem;' },
                  ...(['Engineering', 'Marketing', 'Sales', 'HR'] as const).map(dept =>
                    button({
                      onclick: () => { newDepartment.value = dept; },
                      style: `
                        padding: 0.5rem;
                        border-radius: 6px;
                        border: 2px solid ${selected === dept ? 'var(--primary)' : 'var(--border)'};
                        background: ${selected === dept ? 'var(--primary)' : 'var(--bg)'};
                        color: ${selected === dept ? 'white' : 'var(--text-primary)'};
                        cursor: pointer;
                        font-size: 0.875rem;
                        font-weight: 600;
                      `
                    }, dept)
                  )
                )
              )
            ),

            // Leave Type
            div(
              div({ style: 'font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-muted);' }, 'Leave Type'),
              reactive(newLeaveType, (selected) =>
                div({ style: 'display: flex; flex-direction: column; gap: 0.5rem;' },
                  ...(['Annual', 'Sick', 'Personal', 'Emergency'] as const).map(type =>
                    button({
                      onclick: () => { newLeaveType.value = type; },
                      style: `
                        padding: 0.5rem;
                        border-radius: 6px;
                        border: 2px solid ${selected === type ? 'var(--primary)' : 'var(--border)'};
                        background: ${selected === type ? 'var(--primary)' : 'var(--bg)'};
                        color: ${selected === type ? 'white' : 'var(--text-primary)'};
                        cursor: pointer;
                        font-size: 0.875rem;
                        font-weight: 600;
                      `
                    }, `${getLeaveTypeIcon(type)} ${type}`)
                  )
                )
              )
            )
          ),

          // Grid: Start Date, End Date
          div({ style: 'display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;' },
            // Start Date
            div(
              div({ style: 'font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-muted);' }, 'Start Date'),
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
                  newStartDate.value = (e.target as HTMLElement).textContent || '';
                },
                'data-placeholder': newStartDate.value ? '' : 'YYYY-MM-DD'
              })
            ),

            // End Date
            div(
              div({ style: 'font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-muted);' }, 'End Date'),
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
                  newEndDate.value = (e.target as HTMLElement).textContent || '';
                },
                'data-placeholder': newEndDate.value ? '' : 'YYYY-MM-DD'
              })
            )
          ),

          // Reason
          div({ style: 'margin-bottom: 1.5rem;' },
            div({ style: 'font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-muted);' }, 'Reason'),
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
                newReason.value = (e.target as HTMLElement).textContent || '';
              },
              'data-placeholder': newReason.value ? '' : 'Enter reason for leave...'
            })
          ),

          // Submit Button
          button({
            onclick: addLeaveRequest,
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
          }, '✓ Submit Request')
        )
        : null
    ),

    // Statistics Cards
    reactive(leaveRequests, () =>
      div({
        style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;'
      },
        div({ style: 'padding: 1rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; text-align: center;' },
          div({ style: 'font-size: 1.75rem; font-weight: bold; color: var(--primary);' }, String(totalRequests.value)),
          div({ style: 'font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem;' }, 'Total Requests')
        ),
        div({ style: 'padding: 1rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; text-align: center;' },
          div({ style: 'font-size: 1.75rem; font-weight: bold; color: #f59e0b;' }, String(pendingCount.value)),
          div({ style: 'font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem;' }, 'Pending')
        ),
        div({ style: 'padding: 1rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; text-align: center;' },
          div({ style: 'font-size: 1.75rem; font-weight: bold; color: #22c55e;' }, String(approvedCount.value)),
          div({ style: 'font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem;' }, 'Approved')
        ),
        div({ style: 'padding: 1rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; text-align: center;' },
          div({ style: 'font-size: 1.75rem; font-weight: bold; color: #ef4444;' }, String(rejectedCount.value)),
          div({ style: 'font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem;' }, 'Rejected')
        ),
        div({ style: 'padding: 1rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; text-align: center;' },
          div({ style: 'font-size: 1.75rem; font-weight: bold; color: #3b82f6;' }, String(totalDaysRequested.value)),
          div({ style: 'font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem;' }, 'Days Pending')
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
            'data-placeholder': searchQuery.value ? '' : 'Search by employee name or reason...'
          })
        )
      ),

      // Filter buttons
      div({ style: 'display: flex; gap: 1rem; flex-wrap: wrap;' },
        // Status filter
        div({ style: 'flex: 1; min-width: 200px;' },
          div({ style: 'font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-muted);' }, 'Status'),
          reactive(selectedStatus, (status) =>
            div({ style: 'display: flex; gap: 0.5rem; flex-wrap: wrap;' },
              ...(['All', 'Pending', 'Approved', 'Rejected'] as const).map(s =>
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

        // Leave Type filter
        div({ style: 'flex: 1; min-width: 250px;' },
          div({ style: 'font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-muted);' }, 'Leave Type'),
          reactive(selectedLeaveType, (type) =>
            div({ style: 'display: flex; gap: 0.5rem; flex-wrap: wrap;' },
              ...(['All', 'Annual', 'Sick', 'Personal', 'Emergency'] as const).map(t =>
                button({
                  onclick: () => { selectedLeaveType.value = t; },
                  style: `
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    border: 1px solid var(--border);
                    background: ${type === t ? 'var(--primary)' : 'var(--bg)'};
                    color: ${type === t ? 'white' : 'var(--text-primary)'};
                    cursor: pointer;
                    font-size: 0.875rem;
                    font-weight: 600;
                  `
                }, t)
              )
            )
          )
        ),

        // Department filter
        div({ style: 'flex: 1; min-width: 200px;' },
          div({ style: 'font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-muted);' }, 'Department'),
          reactive(selectedDepartment, (dept) =>
            div({ style: 'display: flex; gap: 0.5rem; flex-wrap: wrap;' },
              ...departments.value.map(d =>
                button({
                  onclick: () => { selectedDepartment.value = d; },
                  style: `
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    border: 1px solid var(--border);
                    background: ${dept === d ? 'var(--primary)' : 'var(--bg)'};
                    color: ${dept === d ? 'white' : 'var(--text-primary)'};
                    cursor: pointer;
                    font-size: 0.875rem;
                    font-weight: 600;
                  `
                }, d)
              )
            )
          )
        )
      )
    ),

    // Leave Requests List
    reactive(filteredRequests, (requests) =>
      requests.length === 0
        ? div({
            style: 'text-align: center; padding: 3rem; color: var(--text-muted); background: var(--bg-card); border-radius: 8px; border: 1px dashed var(--border);'
          },
          div({ style: 'font-size: 3rem; margin-bottom: 0.5rem;' }, '📋'),
          div('No leave requests found')
        )
        : div({ style: 'display: grid; gap: 1rem;' },
            ...requests.map(request =>
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
                    div({ style: 'font-size: 1.125rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem;' }, request.employeeName),
                    div({ style: 'color: var(--text-muted); font-size: 0.875rem;' }, request.department)
                  ),
                  button({
                    onclick: () => deleteRequest(request.id),
                    style: 'background: transparent; border: none; color: #ef4444; cursor: pointer; font-size: 1.25rem;'
                  }, '🗑️')
                ),

                // Leave Info
                div({ style: 'display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem;' },
                  div({
                    style: `
                      padding: 0.5rem 0.75rem;
                      border-radius: 12px;
                      background: var(--bg);
                      font-size: 0.875rem;
                      font-weight: 600;
                      display: flex;
                      align-items: center;
                      gap: 0.5rem;
                    `
                  }, getLeaveTypeIcon(request.leaveType), request.leaveType),
                  div({ style: 'display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem;' },
                    span({ style: 'color: var(--text-muted);' }, '📅'),
                    span(request.startDate),
                    span({ style: 'color: var(--text-muted);' }, '→'),
                    span(request.endDate)
                  ),
                  div({
                    style: `
                      padding: 0.25rem 0.75rem;
                      border-radius: 12px;
                      background: var(--primary);
                      color: white;
                      font-size: 0.875rem;
                      font-weight: 600;
                    `
                  }, `${request.days} day${request.days > 1 ? 's' : ''}`)
                ),

                // Reason
                div({ style: 'margin-bottom: 1rem; padding: 0.75rem; background: var(--bg); border-radius: 8px;' },
                  div({ style: 'font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.25rem;' }, 'Reason:'),
                  div({ style: 'font-size: 0.875rem; color: var(--text-primary);' }, request.reason)
                ),

                // Status & Actions
                div({ style: 'display: flex; gap: 0.5rem; align-items: center;' },
                  div({
                    style: `
                      padding: 0.5rem 1rem;
                      border-radius: 8px;
                      background: ${getStatusColor(request.status)}20;
                      color: ${getStatusColor(request.status)};
                      font-size: 0.875rem;
                      font-weight: 600;
                    `
                  }, request.status),
                  div({ style: 'flex: 1;' }),
                  ...(['Approved', 'Rejected', 'Pending'] as const).map(status =>
                    request.status !== status
                      ? button({
                          onclick: () => updateStatus(request.id, status),
                          style: `
                            padding: 0.5rem 1rem;
                            border-radius: 6px;
                            border: 1px solid ${getStatusColor(status)};
                            background: var(--bg);
                            color: ${getStatusColor(status)};
                            cursor: pointer;
                            font-size: 0.75rem;
                            font-weight: 600;
                          `
                        }, status)
                      : null
                  )
                )
              )
            )
          )
    )
  );
};

// Source code examples
const leaveStateExample = `import { createState, computed, reactive } from 'elit';

interface LeaveRequest {
  id: number;
  employeeName: string;
  department: string;
  leaveType: 'Annual' | 'Sick' | 'Personal' | 'Emergency';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  submittedDate: string;
}

const leaveRequests = createState<LeaveRequest[]>([...]);
const selectedStatus = createState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
const selectedLeaveType = createState<'All' | 'Annual' | 'Sick' | 'Personal' | 'Emergency'>('All');
const selectedDepartment = createState<string>('All');
const searchQuery = createState('');`;

const leaveComputedExample = `// Computed filtered requests with 5 dependencies
const filteredRequests = computed(
  [leaveRequests, selectedStatus, selectedLeaveType, selectedDepartment, searchQuery],
  (requests, status, leaveType, department, query) => {
    let filtered = requests;

    if (status !== 'All') {
      filtered = filtered.filter(r => r.status === status);
    }

    if (leaveType !== 'All') {
      filtered = filtered.filter(r => r.leaveType === leaveType);
    }

    if (department !== 'All') {
      filtered = filtered.filter(r => r.department === department);
    }

    if (query.trim()) {
      const searchText = query.toLowerCase().trim();
      filtered = filtered.filter(r =>
        r.employeeName.toLowerCase().includes(searchText) ||
        r.reason.toLowerCase().includes(searchText)
      );
    }

    return filtered.sort((a, b) =>
      new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime()
    );
  }
);

// Dynamic computed departments from request list
const departments = computed([leaveRequests], (requests) => {
  return ['All', ...Array.from(new Set(requests.map(r => r.department)))];
});

// Computed statistics
const pendingCount = computed([leaveRequests], (requests) =>
  requests.filter(r => r.status === 'Pending').length
);

const totalDaysRequested = computed([leaveRequests], (requests) =>
  requests.filter(r => r.status === 'Pending').reduce((sum, r) => sum + r.days, 0)
);`;

const leaveOperationsExample = `// Leave operations
const addLeaveRequest = () => {
  const name = newEmployeeName.value.trim();
  const reason = newReason.value.trim();
  const days = calculateDays(newStartDate.value, newEndDate.value);

  if (name && reason) {
    leaveRequests.value = [...leaveRequests.value, {
      id: nextId++,
      employeeName: name,
      department: newDepartment.value,
      leaveType: newLeaveType.value,
      startDate: newStartDate.value,
      endDate: newEndDate.value,
      days,
      reason,
      status: 'Pending',
      submittedDate: new Date().toISOString().split('T')[0]
    }];
    showAddForm.value = false;
  }
};

const updateStatus = (requestId: number, newStatus: 'Pending' | 'Approved' | 'Rejected') => {
  leaveRequests.value = leaveRequests.value.map(r =>
    r.id === requestId ? { ...r, status: newStatus } : r
  );
};

const calculateDays = (start: string, end: string): number => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};`;

const leaveRenderExample = `// Reactive leave requests rendering
reactive(filteredRequests, (requests) =>
  requests.length === 0
    ? div('No leave requests found')
    : div({ style: 'display: grid; gap: 1rem;' },
        ...requests.map(request =>
          div({ style: 'padding: 1.25rem; background: var(--bg-card);' },
            // Employee info
            div({ style: 'font-weight: 600;' }, request.employeeName),
            div({ style: 'color: var(--text-muted);' }, request.department),

            // Leave details
            div(\`\${getLeaveTypeIcon(request.leaveType)} \${request.leaveType}\`),
            div(\`📅 \${request.startDate} → \${request.endDate}\`),
            div(\`\${request.days} day\${request.days > 1 ? 's' : ''}\`),

            // Reason
            div({ style: 'padding: 0.75rem; background: var(--bg);' },
              div('Reason:', request.reason)
            ),

            // Status with action buttons
            div({ style: 'display: flex; gap: 0.5rem;' },
              div({
                style: \`color: \${getStatusColor(request.status)}\`
              }, request.status),

              ...['Approved', 'Rejected', 'Pending'].map(status =>
                request.status !== status
                  ? button({
                      onclick: () => updateStatus(request.id, status)
                    }, status)
                  : null
              )
            )
          )
        )
      )
);

// Department filter - using reactive with selectedDepartment and departments.value
// IMPORTANT: Avoid nested reactive - use .value to access computed state
reactive(selectedDepartment, (dept) =>
  div({ style: 'display: flex; gap: 0.5rem; flex-wrap: wrap;' },
    ...departments.value.map(d =>
      button({
        onclick: () => { selectedDepartment.value = d; },
        style: \`
          padding: 0.5rem 1rem;
          border-radius: 6px;
          background: \${dept === d ? 'var(--primary)' : 'var(--bg)'};
          color: \${dept === d ? 'white' : 'var(--text-primary)'};
        \`
      }, d)
    )
  )
);`;

// Leave Management Content
export const LeaveManagementContent: VNode = div(
  // Demo
  div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 2rem; margin-bottom: 3rem;' },
    h2({ style: 'margin: 0 0 2rem 0; font-size: 1.75rem;' }, '🏖️ Leave Management System'),
    LeaveManagementDemo()
  ),

  // Technical Overview
  div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 2rem; margin-bottom: 3rem;' },
    h2({ style: 'margin: 0 0 1.5rem 0; font-size: 1.75rem;' }, '🔧 Technical Implementation'),
    p({ style: 'color: var(--text-muted); margin-bottom: 2rem; line-height: 1.8;' },
      'This Leave Management System demonstrates employee leave tracking, approval workflows, multi-criteria filtering, ',
      'date calculations, and real-time statistics using Elit\'s reactive state management.'
    ),

    // Key Features
    div({ style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;' },
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '📝 Leave Requests'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Submit and manage leave requests with dates, types, and reasons'
        )
      ),
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '✅ Approval Workflow'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Approve, reject, or keep requests pending with status tracking'
        )
      ),
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '🔍 Smart Filtering'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Filter by status, leave type, department, and search text'
        )
      ),
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '📊 Analytics'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Real-time statistics showing pending, approved, and total days'
        )
      )
    )
  ),

  // Source Code
  div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 2rem; margin-bottom: 3rem;' },
    h2({ style: 'margin: 0 0 1.5rem 0; font-size: 1.75rem;' }, '💻 Source Code'),

    h3({ style: 'margin: 2rem 0 1rem 0; font-size: 1.25rem; color: var(--primary);' }, '1. State & Data'),
    pre({ style: 'margin: 0 0 2rem 0;' }, code(...codeBlock(leaveStateExample))),

    h3({ style: 'margin: 2rem 0 1rem 0; font-size: 1.25rem; color: var(--primary);' }, '2. Computed Filtering & Stats'),
    pre({ style: 'margin: 0 0 2rem 0;' }, code(...codeBlock(leaveComputedExample))),

    h3({ style: 'margin: 2rem 0 1rem 0; font-size: 1.25rem; color: var(--primary);' }, '3. Leave Operations'),
    pre({ style: 'margin: 0 0 2rem 0;' }, code(...codeBlock(leaveOperationsExample))),

    h3({ style: 'margin: 2rem 0 1rem 0; font-size: 1.25rem; color: var(--primary);' }, '4. Reactive Rendering'),
    pre({ style: 'margin: 0;' }, code(...codeBlock(leaveRenderExample)))
  ),

  // Key Learnings
  div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 2rem;' },
    h2({ style: 'margin: 0 0 1.5rem 0; font-size: 1.75rem;' }, '🎓 Key Learnings'),
    ul({ style: 'margin: 0; padding-left: 1.5rem; line-height: 2; color: var(--text-muted);' },
      li(strong('HR workflow:'), ' Implementing leave request submission and approval processes'),
      li(strong('Multi-filter computed:'), ' Combining 5 filters (status, type, department, search, requests)'),
      li(strong('Date calculations:'), ' Computing duration between start and end dates'),
      li(strong('Status management:'), ' Tracking Pending, Approved, Rejected states'),
      li(strong('Dynamic statistics:'), ' Real-time counts and totals based on current data'),
      li(strong('Sorting by date:'), ' Ordering requests by submission date (newest first)'),
      li(strong('Dynamic departments:'), ' Computing unique departments from request data'),
      li(strong('Avoiding nested reactive:'), ' Using reactive(selectedDepartment) with departments.value instead of nested reactive calls'),
      li(strong('Color coding:'), ' Visual status indicators with color functions'),
      li(strong('Icon mapping:'), ' Using emojis for different leave types'),
      li(strong('Form validation:'), ' Ensuring required fields before submission'),
      li(strong('Aggregate calculations:'), ' Using reduce to sum total days requested'),
      li(strong('Multi-status actions:'), ' Showing only relevant action buttons per status')
    )
  )
);

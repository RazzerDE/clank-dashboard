export interface SubTasksCompletion {
  id: string;
  finished: boolean;
}

export interface SubTasks {
  id: number;
  name: string;
  finished: boolean;
  redirect_url: string;
}

export interface TasksCompletion {
  finished: boolean;
  subtasks: SubTasksCompletion[];
}

export interface TasksCompletionList {
  [key: string]: TasksCompletion;
}

export interface Tasks {
  id: number;
  finished: boolean | null; // null = in progress, false = not functional, true = finished
  title: string;
  subtasks: SubTasks[];
}

export const tasks: Tasks[] = [
  {
    id: 1,
    finished: true,
    title: 'SECTION_BOT_SETUP_TASK_SUPPORT',
    subtasks: [
      { id: 1.1, name: 'SECTION_BOT_SETUP_TASK_SUPPORT_1', finished: true, redirect_url: '/support/setup' },
      { id: 1.2, name: 'SECTION_BOT_SETUP_TASK_SUPPORT_2', finished: true, redirect_url: '/teamlist' },
      { id: 1.3, name: 'SECTION_BOT_SETUP_TASK_SUPPORT_3', finished: true, redirect_url: '/support/themes' },
      { id: 1.4, name: 'SECTION_BOT_SETUP_TASK_SUPPORT_4', finished: true, redirect_url: '/support/themes' },
    ]
  },
  {
    id: 2,
    finished: null,
    title: 'SECTION_BOT_SETUP_TASK_SECURITY',
    subtasks: [
      { id: 2.1, name: 'SECTION_BOT_SETUP_TASK_SECURITY_1', finished: false, redirect_url: '/security/automod' },
      { id: 2.2, name: 'SECTION_BOT_SETUP_TASK_SECURITY_2', finished: true, redirect_url: '/security/automod' },
      { id: 2.3, name: 'SECTION_BOT_SETUP_TASK_SECURITY_3', finished: false, redirect_url: '/security/shield' },
      { id: 2.4, name: 'SECTION_BOT_SETUP_TASK_SECURITY_4', finished: true, redirect_url: '/security/backups' }
    ],
  },
  {
    id: 3,
    finished: false,
    title: 'SECTION_BOT_SETUP_TASK_GLOBAL',
    subtasks: [
      { id: 3.1, name: 'SECTION_BOT_SETUP_TASK_GLOBAL_1', finished: false, redirect_url: '/misc/global-chat' }
    ],
  },
];
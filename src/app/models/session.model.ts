export interface Session {
  _id?: string;
  sessionId: string;
  title: string;
  language: string;
  createdAt: Date;
  createdBy: string;
  users: User[];
  lastActive: Date;
}

export interface User {
  id: string;
  name: string;
  color: string;
  active: boolean;
  lastActive: Date;
}

export interface CodeExecution {
  sessionId: string;
  language: string;
  sourceCode: string;
  stdin: string;
  timestamp: Date;
  result?: ExecutionResult;
}

export interface ExecutionResult {
  stdout?: string;
  stderr?: string;
  error?: string;
  time?: string;
  memory?: string;
  token?: string;
  status?: {
    id: number;
    description: string;
  };
}

export interface Language {
  id: number;
  name: string;
  value: string;
  monacoLanguage: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { id: 71, name: 'Python', value: 'python', monacoLanguage: 'python' },
  { id: 63, name: 'JavaScript', value: 'javascript', monacoLanguage: 'javascript' },
  { id: 54, name: 'C++', value: 'cpp', monacoLanguage: 'cpp' },
  { id: 62, name: 'Java', value: 'java', monacoLanguage: 'java' },
  { id: 51, name: 'C#', value: 'csharp', monacoLanguage: 'csharp' }
];
import { z } from 'zod';
import {
  createCaseSchema,
  updateCaseStatusSchema,
  createExpenseSchema,
  createHearingSchema,
  createTaskSchema,
  createNoteSchema
} from '../schemas';

// Request types inferred from Zod schemas
export type CreateCaseRequest = z.infer<typeof createCaseSchema>['body'];
export type UpdateCaseStatusRequest = z.infer<typeof updateCaseStatusSchema>['body'];
export type CreateExpenseRequest = z.infer<typeof createExpenseSchema>['body'];
export type CreateHearingRequest = z.infer<typeof createHearingSchema>['body'];
export type CreateTaskRequest = z.infer<typeof createTaskSchema>['body'];
export type CreateNoteRequest = z.infer<typeof createNoteSchema>['body'];

// Model Types (corresponding to DB schemas)
export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  barNo?: string;
  role: 'admin' | 'lawyer';
  companyId: number;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Client {
  id: number;
  userId: number;
  name: string;
  email?: string;
  phone?: string;
  status: 'active' | 'inactive';
}

export interface Case {
  id: number;
  userId: number;
  clientId: number;
  clientName?: string; // from JOIN
  caseNo: string;
  title: string;
  court?: string;
  status: 'active' | 'closed' | 'archived' | 'pending';
  type?: string;
  createdAt: string;
}

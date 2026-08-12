import { z } from 'zod';

export const createCaseSchema = z.object({
  body: z.object({
    caseNo: z.string().min(1, 'Dosya numarası zorunludur'),
    title: z.string().min(3, 'Dava başlığı en az 3 karakter olmalıdır').refine(val => val.trim().length >= 3, 'Dava başlığı boş olamaz'),
    court: z.string().optional(),
    type: z.string().optional(),
  })
});

export const updateCaseStatusSchema = z.object({
  body: z.object({
    status: z.enum(['active', 'closed', 'archived', 'pending']),
  })
});

export const createExpenseSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Masraf başlığı zorunludur'),
    amount: z.union([z.number(), z.string()]).transform(val => Number(val)).refine(val => val > 0, 'Tutar 0 dan büyük olmalıdır'),
    date: z.string().optional(),
    status: z.string().optional(),
    isCompanyExpense: z.boolean().optional(),
  })
});

export const createHearingSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Duruşma başlığı zorunludur'),
    date: z.string().min(1, 'Tarih zorunludur'),
    time: z.string().optional(),
    location: z.string().optional(),
  })
});

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Görev başlığı zorunludur'),
    date: z.string().optional(),
    priority: z.string().optional(),
  })
});

export const createNoteSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Not başlığı zorunludur'),
    content: z.string().optional(),
    date: z.string().optional(),
  })
});

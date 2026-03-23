import { z } from 'zod';

export const customerSchema = z.object({
    name: z.string()
        .min(3, { message: 'Nama pelanggan minimal 3 karakter' })
        .max(100, { message: 'Nama pelanggan maksimal 100 karakter' }),
    phone: z.string()
        .regex(/^[0-9+-\s]+$/, { message: 'Nomor telepon hanya boleh berisi angka, spasi, +, atau -' })
        .min(10, { message: 'Nomor telepon minimal 10 digit' })
        .max(20, { message: 'Nomor telepon maksimal 20 digit' })
        .or(z.literal('')), // Optional phone
    address: z.string()
        .max(255, { message: 'Alamat maksimal 255 karakter' })
        .or(z.literal('')), // Optional address
    type: z.enum(['walkin', 'corporate', 'vip', 'service'], {
        errorMap: () => ({ message: 'Tipe pelanggan tidak valid' })
    }).default('walkin'),
    company: z.string()
        .max(100, { message: 'Nama perusahaan maksimal 100 karakter' })
        .or(z.literal(''))
});

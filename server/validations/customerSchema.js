const { z } = require('zod');

const customerSchema = z.object({
    name: z.string()
        .min(3, 'Nama pelanggan minimal 3 karakter')
        .max(100, 'Nama pelanggan maksimal 100 karakter'),
    phone: z.string()
        .regex(/^[0-9+-\s]+$/, 'Nomor telepon hanya boleh berisi angka, spasi, +, atau -')
        .min(10, 'Nomor telepon minimal 10 digit')
        .max(20, 'Nomor telepon maksimal 20 digit')
        .optional()
        .or(z.literal('')),
    address: z.string()
        .max(255, 'Alamat maksimal 255 karakter')
        .optional()
        .or(z.literal('')),
    type: z.enum(['walkin', 'corporate', 'vip', 'service'], {
        errorMap: () => ({ message: 'Tipe pelanggan tidak valid' })
    }).default('walkin'),
    company: z.string()
        .max(100, 'Nama perusahaan maksimal 100 karakter')
        .optional()
        .or(z.literal(''))
});

module.exports = {
    customerSchema
};

const { z } = require('zod');

// Middleware generic untuk memvalidasi request body dengan Zod schema
const validate = (schema) => {
    return (req, res, next) => {
        try {
            // Parses and validates the request body
            const validatedData = schema.parse(req.body);
            // Replace req.body with the sanitized and validated data
            req.body = validatedData;
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                // Map the Zod errors to a flat array of messages or an object
                const errorMessages = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }));

                return res.status(400).json({
                    success: false,
                    message: 'Validasi gagal',
                    errors: errorMessages
                });
            }

            // If it's another kind of error, pass it to the default error handler
            next(error);
        }
    };
};

module.exports = { validate };

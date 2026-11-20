import { ZodError } from 'zod';

export function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request payload',
            details: err.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
            requestId: req.id,
          },
        });
      }
      next(err);
    }
  };
}

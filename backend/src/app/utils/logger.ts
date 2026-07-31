import winston from 'winston';
import { envVars } from '../config/env.js';
import { Request, Response, NextFunction } from 'express';

const isDevelopment = envVars.NODE_ENV === 'development';

// Request logging middleware
  const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      correlationId: (req as any).correlationId
    });
  });
  
  next();
};

// Winston logger configuration
const logger = winston.createLogger({
  level: isDevelopment ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Console for all environments
    new winston.transports.Console({
      format: isDevelopment
        ? winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ level, message, timestamp, ...meta }) => {
              const metaStr = Object.keys(meta).length
                ? JSON.stringify(meta, null, 2)
                : '';
              return `${timestamp} [${level}] ${message} ${metaStr}`;
            })
          )
        : winston.format.json()
    }),
    // File for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    // File for all logs
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});

export default logger;
export { requestLogger };
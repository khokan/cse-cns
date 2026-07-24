import dotenv from 'dotenv';
import AppError from '../errorHelpers/AppError';
import status from 'http-status';


dotenv.config();

interface EnvConfig {
    NODE_ENV: string;
    PORT: string;
}


const loadEnvVariables = (): EnvConfig => {

    const requireEnvVariable = [
        'NODE_ENV',
        'PORT',
    ]

    requireEnvVariable.forEach((variable) => {
        if (!process.env[variable]) {
            // throw new Error(`Environment variable ${variable} is required but not set in .env file.`);
            throw new AppError(status.INTERNAL_SERVER_ERROR, `Environment variable ${variable} is required but not set in .env file.`);
        }
    })

    return {
        NODE_ENV: process.env.NODE_ENV as string,
        PORT: process.env.PORT as string,
    }
}

export const envVars = loadEnvVariables();
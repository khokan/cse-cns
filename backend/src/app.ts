import express, { Application, Request, Response } from "express";
import { toNodeHandler } from "better-auth/node";
import path from "path";
import cors from "cors";
import { envVars } from "./app/config/env";
import qs from "qs"


const app: Application = express();


app.use(cors({
    origin : ["http://localhost:3000", "http://localhost:5000"],
    credentials : true,
    methods : ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders : ["Content-Type", "Authorization"]
}))


// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));


// Basic route
app.get('/', async (req: Request, res: Response) => {
    res.status(201).json({
        success: true,
        message: 'CSE-CNS is working',
    })
});

export default app;
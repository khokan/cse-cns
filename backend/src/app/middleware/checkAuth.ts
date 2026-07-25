/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";
import status from "http-status";
import { UserRoleType } from "../types/auth.types";
import { auth as betterAuth } from "../lib/auth";
import AppError from "../errorHelpers/AppError";
import { fromNodeHeaders } from "better-auth/node";

export const checkAuth = (...authRoles: UserRoleType[]) =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Session verification via Better Auth API.
            // better-auth stores a hashed token in the DB; cookie value != DB value.
            // auth.api.getSession() handles the hashing internally.
            const session = await betterAuth.api.getSession({
                headers: fromNodeHeaders(req.headers),
            });

            if (!session || !session.user) {
                throw new AppError(status.UNAUTHORIZED, "Unauthorized access! No valid session found.");
            }

            if (!session.user.emailVerified) {
                throw new AppError(status.FORBIDDEN, "Email verification required. Please verify your email!");
            }

            req.user = {
                userId: session.user.id,
                email: session.user.email,
                role: session.user.role as string,
            };

            if (authRoles.length && !authRoles.includes(req.user.role as UserRoleType)) {
                throw new AppError(status.FORBIDDEN, "Forbidden! You don't have permission to access this resource.");
            }

            next();
        } catch (err) {
            next(err);
        }
    };
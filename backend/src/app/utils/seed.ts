import { UserRole } from "../types/auth.types.js";
import { envVars } from "../config/env.js";
import { auth } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";
import logger from "./logger.js";
import { SecurityService } from "../modules/security/security.service.js";

export const seedSuperAdmin = async () => {
    try {
        // 1. Seed default RBAC roles and permissions
        await SecurityService.seedDefaults();

        // 2. Check if Admin user exists
        let adminUserRecord = await prisma.user.findFirst({
            where: {
                role: UserRole.ADMIN,
            },
        });

        if (!adminUserRecord) {
            const adminUser = await auth.api.signUpEmail({
                body: {
                    email: envVars.ADMIN_EMAIL,
                    password: envVars.ADMIN_PASSWORD,
                    name: "Admin",
                    role: UserRole.ADMIN,
                    needPasswordChange: false,
                    rememberMe: false,
                },
            });

            await prisma.$transaction(async (tx) => {
                await tx.user.update({
                    where: {
                        id: adminUser.user.id,
                    },
                    data: {
                        emailVerified: true,
                    },
                });
            });

            adminUserRecord = await prisma.user.findUnique({
                where: { id: adminUser.user.id },
            });

            logger.info("Admin Created ", adminUser);
        } else {
            logger.info("Admin user already exists.");
        }

        // 3. Ensure Admin has the ADMIN role assigned in UserRole table
        if (adminUserRecord) {
            const adminRole = await prisma.role.findUnique({
                where: { name: UserRole.ADMIN },
            });

            if (adminRole) {
                await prisma.userRole.upsert({
                    where: {
                        userId_roleId: {
                            userId: adminUserRecord.id,
                            roleId: adminRole.id,
                        },
                    },
                    update: {},
                    create: {
                        userId: adminUserRecord.id,
                        roleId: adminRole.id,
                    },
                });
            }
        }
    } catch (error) {
        logger.error("Error seeding admin / RBAC: ", error);
        if (envVars.ADMIN_EMAIL) {
            try {
                await prisma.user.delete({
                    where: {
                        email: envVars.ADMIN_EMAIL,
                    },
                });
            } catch {
                // Ignore deletion error if user wasn't created
            }
        }
    }
};
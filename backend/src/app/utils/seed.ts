import { UserRole } from "../types/auth.types";
import { envVars } from "../config/env";
import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";
import logger from "./logger";

export const seedSuperAdmin = async () => {
    try {
        const isAdminExist = await prisma.user.findFirst({
            where:{
                role : UserRole.ADMIN
            }
        })

        if(isAdminExist) {
            logger.info("Admin already exists. Skipping seeding admin.");
            return;
        }

        const adminUser = await auth.api.signUpEmail({
            body:{
                email : envVars.ADMIN_EMAIL,
                password : envVars.ADMIN_PASSWORD,
                name : "Admin",
                role : UserRole.ADMIN,
                needPasswordChange : false,
                rememberMe : false,
            }
        })

        await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where : {
                    id : adminUser.user.id
                },
                data : {
                    emailVerified : true,
                }
            });
        });

        logger.info("Admin Created ", adminUser);
    } catch (error) {
        logger.error("Error seeding admin: ", error);
        await prisma.user.delete({
            where : {
                email : envVars.ADMIN_EMAIL,
            }
        })
    }
}
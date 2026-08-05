import { IRequestUser } from "./requestUser.interface";
import { PermissionResult } from "../types/security.types";

declare global {
    namespace Express {
        interface Request {
            user: IRequestUser;
            permission?: PermissionResult;
        }
    }
}
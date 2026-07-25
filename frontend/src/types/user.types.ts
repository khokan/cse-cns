import { UserRole } from "@/utils/authUtils";

export interface UserInfo {
    id : string;
    name : string,
    email : string,
    role : UserRole
}
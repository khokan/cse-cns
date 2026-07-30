import { TableConfig } from "./datatable.interface.js";
import { UserRole } from "../../types/auth.types.js";

export const TABLE_REGISTRY: Record<string, TableConfig> = {
    challan: {
        db: "cns",
        model: "challan",
        primaryKey: "ID",
        readRoles: [UserRole.ADMIN, UserRole.IT, UserRole.ACCOUNTING],
        writeRoles: [UserRole.ADMIN, UserRole.IT, UserRole.ACCOUNTING],
        searchableFields: ["ChallanNumber"],
    },
    taxToNBR: {
        db: "cns",
        model: "taxToNBR",
        primaryKey: "ID",
        readRoles: [UserRole.ADMIN, UserRole.IT, UserRole.ACCOUNTING],
        writeRoles: [UserRole.ADMIN, UserRole.IT, UserRole.ACCOUNTING],
        searchableFields: ["ContractNumber", "DeducteeTIN", "TRECHolderName", "MemberID"],
    },
    settlement: {
        db: "cns",
        model: "settlement",
        primaryKey: "ContractNumber",
        readRoles: [UserRole.ADMIN, UserRole.IT, UserRole.ACCOUNTING],
        writeRoles: [UserRole.ADMIN, UserRole.IT],
        searchableFields: ["ContractNumber", "ScripID", "BuyBrokerCode", "SellBrokerCode"],
    },
    member: {
        db: "cnsWeb",
        model: "member",
        primaryKey: "MemberID",
        readRoles: [UserRole.ADMIN, UserRole.IT, UserRole.ACCOUNTING],
        writeRoles: [UserRole.ADMIN],
        searchableFields: ["MemberCode", "MemberName", "TIN", "EmailAddress"],
    },
    auditLog: {
        db: "cnsWeb",
        model: "auditLog",
        primaryKey: "id",
        readRoles: [UserRole.ADMIN, UserRole.IT],
        writeRoles: [], // Audit logs are read-only
        searchableFields: ["action", "entity", "userEmail", "userId"],
    },
};

export const getTableConfig = (tableKey: string): TableConfig | null => {
    return TABLE_REGISTRY[tableKey.toLowerCase()] ?? null;
};

import { TableConfig } from "./datatable.interface.js";
import { UserRole } from "../../types/auth.types.js";

export const TABLE_REGISTRY: Record<string, TableConfig> = {
    challan: {
        db: "cns",
        model: "challan",
        primaryKey: "ID",
        idType: "int",
        readRoles: [UserRole.ADMIN, UserRole.IT, UserRole.ACCOUNTING],
        writeRoles: [UserRole.ADMIN, UserRole.IT, UserRole.ACCOUNTING],
        searchableFields: ["ChallanNumber"],
    },
    taxToNBR: {
        db: "cns",
        model: "taxToNBR",
        primaryKey: "id",
        idType: "bigint",
        readRoles: [UserRole.ADMIN, UserRole.IT, UserRole.ACCOUNTING],
        writeRoles: [UserRole.ADMIN, UserRole.IT, UserRole.ACCOUNTING],
        searchableFields: ["contractNumber", "deducteeTIN", "trecHolderName", "memberId"],
    },
    settlement: {
        db: "cns",
        model: "settlement",
        primaryKey: "ContractNumber",
        idType: "string",
        readRoles: [UserRole.ADMIN, UserRole.IT, UserRole.ACCOUNTING],
        writeRoles: [UserRole.ADMIN, UserRole.IT],
        searchableFields: ["ContractNumber", "ScripID", "BuyBrokerCode", "SellBrokerCode"],
    },
    member: {
        db: "cnsWeb",
        model: "member",
        primaryKey: "MemberID",
        idType: "string",
        readRoles: [UserRole.ADMIN, UserRole.IT, UserRole.ACCOUNTING],
        writeRoles: [UserRole.ADMIN],
        searchableFields: ["MemberCode", "MemberName", "TIN", "EmailAddress"],
    },
    auditLog: {
        db: "cnsWeb",
        model: "auditLog",
        primaryKey: "id",
        idType: "string",
        readRoles: [UserRole.ADMIN, UserRole.IT],
        writeRoles: [], // Audit logs are read-only
        searchableFields: ["action", "entity", "userEmail", "userId"],
    },
};

export const getTableConfig = (tableKey: string): TableConfig | null => {
    return TABLE_REGISTRY[tableKey] ?? null;
};

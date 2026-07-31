import { db } from "../../lib/prisma.js";
import { getTableConfig, TABLE_REGISTRY } from "./datatable.registry.js";
import { DatatableQuery } from "./datatable.interface.js";
import { UserRoleType } from "../../types/auth.types.js";
import { writeAuditLog } from "../../utils/auditLog.js";
import AppError from "../../errorHelpers/AppError.js";
import status from "http-status";

const parseId = (id: string, idType?: "bigint" | "int" | "string") => {
    if (idType === "bigint") {
        try {
            return BigInt(id);
        } catch {
            throw new AppError(status.BAD_REQUEST, `Invalid bigint ID '${id}'.`);
        }
    }
    if (idType === "int") {
        const parsed = Number(id);
        if (!Number.isInteger(parsed)) {
            throw new AppError(status.BAD_REQUEST, `Invalid integer ID '${id}'.`);
        }
        return parsed;
    }
    return id;
};

const getDelegate = (dbName: "cnsWeb" | "cns", modelName: string) => {
    const dbClient = db[dbName] as any;
    const delegate = dbClient[modelName];
    if (!delegate) {
        throw new AppError(
            status.INTERNAL_SERVER_ERROR,
            `Prisma delegate for model '${modelName}' on database '${dbName}' not found.`
        );
    }
    return delegate;
};

const getAccessibleTables = (userRole: UserRoleType) => {
    return Object.entries(TABLE_REGISTRY)
        .filter(([_, config]: [string, any]) => config.readRoles.includes(userRole))
        .map(([key, config]: [string, any]) => ({
            key,
            db: config.db,
            model: config.model,
            canWrite: config.writeRoles.includes(userRole),
            primaryKey: config.primaryKey,
        }));
};

const listRows = async (tableKey: string, query: DatatableQuery, userRole: UserRoleType) => {
    const config = getTableConfig(tableKey);
    if (!config) {
        throw new AppError(status.NOT_FOUND, `Table '${tableKey}' is not registered for CRUD operations.`);
    }

    if (!config.readRoles.includes(userRole)) {
        throw new AppError(status.FORBIDDEN, `You don't have permission to access table '${tableKey}'.`);
    }

    const page = parseInt(query.page ?? "1", 10);
    const limit = parseInt(query.limit ?? "10", 10);
    const skip = (page - 1) * limit;

    const delegate = getDelegate(config.db, config.model);

    // Build search filter if search term and searchableFields exist
    let where: Record<string, any> = {};
    if (query.search && config.searchableFields && config.searchableFields.length > 0) {
        where.OR = config.searchableFields.map((field) => ({
            [field]: { contains: query.search },
        }));
    }

    // Include other dynamic filter query parameters
    const reservedKeys = ["page", "limit", "search", "sortBy", "sortOrder"];
    for (const [k, v] of Object.entries(query)) {
        if (!reservedKeys.includes(k) && v !== undefined && v !== "") {
            where[k] = v;
        }
    }

    const orderBy = query.sortBy
        ? { [query.sortBy]: query.sortOrder === "desc" ? "desc" : "asc" }
        : { [config.primaryKey]: "asc" };

    const [rows, total] = await Promise.all([
        delegate.findMany({
            where,
            orderBy,
            skip,
            take: limit,
        }),
        delegate.count({ where }),
    ]);

    // Convert BigInt values to String for JSON serialization
    const serializedRows = JSON.parse(
        JSON.stringify(rows, (_, v) => (typeof v === "bigint" ? v.toString() : v))
    );

    return {
        data: serializedRows,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            primaryKey: config.primaryKey,
            canWrite: config.writeRoles.includes(userRole),
        },
    };
};

const getRow = async (tableKey: string, id: string, userRole: UserRoleType) => {
    const config = getTableConfig(tableKey);
    if (!config) {
        throw new AppError(status.NOT_FOUND, `Table '${tableKey}' is not registered.`);
    }

    if (!config.readRoles.includes(userRole)) {
        throw new AppError(status.FORBIDDEN, `You don't have permission to access table '${tableKey}'.`);
    }

    const delegate = getDelegate(config.db, config.model);
    const parsedId = parseId(id, config.idType);

    const row = await delegate.findUnique({
        where: { [config.primaryKey]: parsedId },
    });

    if (!row) {
        throw new AppError(status.NOT_FOUND, `Record with ID '${id}' not found in '${tableKey}'.`);
    }

    return JSON.parse(JSON.stringify(row, (_, v) => (typeof v === "bigint" ? v.toString() : v)));
};

const createRow = async (
    tableKey: string,
    data: Record<string, any>,
    userId: string,
    userRole: UserRoleType
) => {
    const config = getTableConfig(tableKey);
    if (!config) {
        throw new AppError(status.NOT_FOUND, `Table '${tableKey}' is not registered.`);
    }

    if (!config.writeRoles.includes(userRole)) {
        throw new AppError(status.FORBIDDEN, `You don't have permission to create records in '${tableKey}'.`);
    }

    const delegate = getDelegate(config.db, config.model);
    const created = await delegate.create({ data });

    const serialized = JSON.parse(
        JSON.stringify(created, (_, v) => (typeof v === "bigint" ? v.toString() : v))
    );

    writeAuditLog({
        userId,
        action: "CRUD_CREATE",
        entity: config.model,
        entityId: String(serialized[config.primaryKey] ?? ""),
        payload: data,
    });

    return serialized;
};

const updateRow = async (
    tableKey: string,
    id: string,
    data: Record<string, any>,
    userId: string,
    userRole: UserRoleType
) => {
    const config = getTableConfig(tableKey);
    if (!config) {
        throw new AppError(status.NOT_FOUND, `Table '${tableKey}' is not registered.`);
    }

    if (!config.writeRoles.includes(userRole)) {
        throw new AppError(status.FORBIDDEN, `You don't have permission to update records in '${tableKey}'.`);
    }

    const delegate = getDelegate(config.db, config.model);
    const parsedId = parseId(id, config.idType);

    // Prevent trying to update the primary key
    const { [config.primaryKey]: _pk, ...updateData } = data;

    const updated = await delegate.update({
        where: { [config.primaryKey]: parsedId },
        data: updateData,
    });

    const serialized = JSON.parse(
        JSON.stringify(updated, (_, v) => (typeof v === "bigint" ? v.toString() : v))
    );

    writeAuditLog({
        userId,
        action: "CRUD_UPDATE",
        entity: config.model,
        entityId: id,
        payload: data,
    });

    return serialized;
};

const deleteRow = async (
    tableKey: string,
    id: string,
    userId: string,
    userRole: UserRoleType
) => {
    const config = getTableConfig(tableKey);
    if (!config) {
        throw new AppError(status.NOT_FOUND, `Table '${tableKey}' is not registered.`);
    }

    if (!config.writeRoles.includes(userRole)) {
        throw new AppError(status.FORBIDDEN, `You don't have permission to delete records from '${tableKey}'.`);
    }

    const delegate = getDelegate(config.db, config.model);
    const parsedId = parseId(id, config.idType);

    const deleted = await delegate.delete({
        where: { [config.primaryKey]: parsedId },
    });

    writeAuditLog({
        userId,
        action: "CRUD_DELETE",
        entity: config.model,
        entityId: id,
    });

    return JSON.parse(JSON.stringify(deleted, (_, v) => (typeof v === "bigint" ? v.toString() : v)));
};

export const DatatableService = {
    getAccessibleTables,
    listRows,
    getRow,
    createRow,
    updateRow,
    deleteRow,
};

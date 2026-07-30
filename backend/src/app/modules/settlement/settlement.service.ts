import { db } from "../../lib/prisma.js";
import { enqueueSettlementJob } from "../../queues/settlement.queue.js";
import { writeAuditLog } from "../../utils/auditLog.js";
import AppError from "../../errorHelpers/AppError.js";
import status from "http-status";
import type { CreateSettlementDto, SettlementQuery } from "./settlement.interface.js";

const triggerSettlement = async (userId: string, userRole: string, dto: CreateSettlementDto) => {
    if (!["IT", "ADMIN"].includes(userRole)) {
        throw new AppError(status.FORBIDDEN, "Only IT and ADMIN roles can trigger settlement processes.");
    }

    if (!dto.contractNumber) {
        throw new AppError(status.BAD_REQUEST, "ContractNumber is required to trigger settlement.");
    }

    await enqueueSettlementJob({
        contractNumber: dto.contractNumber,
        initiatedBy: userId,
        data: dto,
    });

    writeAuditLog({
        userId,
        action: "SETTLEMENT_INITIATED",
        entity: "Settlement",
        entityId: dto.contractNumber,
        payload: dto as unknown as Record<string, unknown>,
    });

    return {
        contractNumber: dto.contractNumber,
        status: "PENDING",
        message: "Settlement job successfully enqueued.",
    };
};

const getSettlements = async (query: SettlementQuery) => {
    const page = parseInt(query.page ?? "1", 10);
    const limit = parseInt(query.limit ?? "10", 10);
    const skip = (page - 1) * limit;

    const where = {
        ...(query.contractNumber ? { ContractNumber: { contains: query.contractNumber } } : {}),
        ...(query.scripId ? { ScripID: { contains: query.scripId } } : {}),
        ...(query.buyBrokerCode ? { BuyBrokerCode: query.buyBrokerCode } : {}),
        ...(query.sellBrokerCode ? { SellBrokerCode: query.sellBrokerCode } : {}),
        ...(query.processType ? { ProcessType: query.processType } : {}),
    };

    const [settlements, total] = await Promise.all([
        db.cns.settlement.findMany({
            where,
            skip,
            take: limit,
        }),
        db.cns.settlement.count({ where }),
    ]);

    return {
        data: settlements,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

const getSettlementByContractNumber = async (contractNumber: string) => {
    const settlement = await db.cns.settlement.findUnique({
        where: { ContractNumber: contractNumber },
    });

    if (!settlement) {
        throw new AppError(status.NOT_FOUND, "Settlement record not found.");
    }

    return settlement;
};

const retrySettlement = async (contractNumber: string, userId: string, userRole: string) => {
    if (!["IT", "ADMIN"].includes(userRole)) {
        throw new AppError(status.FORBIDDEN, "Only IT and ADMIN roles can retry settlement jobs.");
    }

    const existing = await getSettlementByContractNumber(contractNumber);

    const dto: CreateSettlementDto = {
        contractNumber: existing.ContractNumber,
        scripId: existing.ScripID ?? undefined,
        buyBrokerCode: existing.BuyBrokerCode ?? undefined,
        buyTraderCode: existing.BuyTraderCode ?? undefined,
        buyOrdType: existing.BuyOrdType ?? undefined,
        sellBrokerCode: existing.SellBrokerCode ?? undefined,
        sellTraderCode: existing.SellTraderCode ?? undefined,
        sellOrdType: existing.SellOrdType ?? undefined,
        quantity: existing.Quantity ?? undefined,
        price: existing.Price ? parseFloat(existing.Price.toString()) : undefined,
        processType: existing.ProcessType ?? undefined,
        tradeTime: existing.TradeTime ?? undefined,
    };

    await enqueueSettlementJob({
        contractNumber,
        initiatedBy: userId,
        data: dto,
    });

    writeAuditLog({
        userId,
        action: "SETTLEMENT_RETRIED",
        entity: "Settlement",
        entityId: contractNumber,
    });

    return {
        contractNumber,
        status: "PENDING",
        message: "Settlement job re-enqueued for processing.",
    };
};

export const SettlementService = {
    triggerSettlement,
    getSettlements,
    getSettlementByContractNumber,
    retrySettlement,
};

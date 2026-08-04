import { db } from "../../lib/prisma.js";
import { TaxToNBRQuery, CreateTaxToNBRDto, UpdateTaxToNBRDto } from "./taxToNBR.interface.js";
import AppError from "../../errorHelpers/AppError.js";
import status from "http-status";
import { serializeBigInt } from "../../shared/serializeBigInt.js";
import { serializeBigInt } from "../../shared/serializeBigInt.js";

const getAllTaxToNBRs = async (query: TaxToNBRQuery) => {
    const page = parseInt(query.page ?? "1", 10);
    const limit = parseInt(query.limit ?? "10", 10);
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy ?? "id";
    const sortOrder = (query.sortOrder ?? "desc") as "asc" | "desc";

    const where: any = {
        ...(query.search
            ? {
                  OR: [
                      { contractNumber: { contains: query.search } },
                      { trecHolderName: { contains: query.search } },
                      { deducteeTIN: { contains: query.search } },
                      { mobileNumber: { contains: query.search } },
                      { emailAddress: { contains: query.search } },
                  ],
              }
            : {}),
        ...(query.dateFrom || query.dateTo
            ? {
                  paymentDate: {
                      ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
                      ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
                  },
              }
            : {}),
    };

    const [taxToNBRs, total] = await Promise.all([
        db.cns.taxToNBR.findMany({
            where,
            orderBy: { [sortBy]: sortOrder },
            skip,
            take: limit,
        }),
        db.cns.taxToNBR.count({ where }),
    ]);

     const serialized = serializeBigInt(taxToNBRs);
    
    return {
        data: serialized,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

const getTaxToNBRById = async (id: bigint) => {
    const taxToNBR = await db.cns.taxToNBR.findUnique({
        where: { id },
    });

    if (!taxToNBR) {
        throw new AppError(status.NOT_FOUND, "Tax to NBR record not found.");
    }

    const serialized = serializeBigInt(serializeBigInt(taxToNBR), "getTaxToNBRById");
    console.log("[TaxToNBRService] getTaxToNBRById serialized data:", JSON.stringify(serialized, null, 2).substring(0, 500));
    return serialized;
};

const createTaxToNBR = async (dto: CreateTaxToNBRDto) => {
    const taxToNBR = await db.cns.taxToNBR.create({
        data: {
            fromDate: dto.fromDate,
            toDate: dto.toDate,
            contractNumber: dto.contractNumber,
            paymentDate: dto.paymentDate,
            deducteeTIN: dto.deducteeTIN,
            trecHolderName: dto.trecHolderName,
            mobileNumber: dto.mobileNumber,
            emailAddress: dto.emailAddress,
            sectionNumber: dto.sectionNumber,
            tradeVolume: dto.tradeVolume,
            cseCommission: dto.cseCommission,
            paymentAmount: dto.paymentAmount,
            memberId: dto.memberId,
        },
    });

    const serialized = serializeBigInt(serializeBigInt(taxToNBR), "createTaxToNBR");
    console.log("[TaxToNBRService] createTaxToNBR serialized data:", JSON.stringify(serialized, null, 2).substring(0, 500));
    return serialized;
};

const updateTaxToNBR = async (id: bigint, dto: UpdateTaxToNBRDto) => {
    await getTaxToNBRById(id);

    const taxToNBR = await db.cns.taxToNBR.update({
        where: { id },
        data: {
            ...(dto.fromDate !== undefined && { fromDate: dto.fromDate }),
            ...(dto.toDate !== undefined && { toDate: dto.toDate }),
            ...(dto.contractNumber !== undefined && { contractNumber: dto.contractNumber }),
            ...(dto.paymentDate !== undefined && { paymentDate: dto.paymentDate }),
            ...(dto.deducteeTIN !== undefined && { deducteeTIN: dto.deducteeTIN }),
            ...(dto.trecHolderName !== undefined && { trecHolderName: dto.trecHolderName }),
            ...(dto.mobileNumber !== undefined && { mobileNumber: dto.mobileNumber }),
            ...(dto.emailAddress !== undefined && { emailAddress: dto.emailAddress }),
            ...(dto.sectionNumber !== undefined && { sectionNumber: dto.sectionNumber }),
            ...(dto.tradeVolume !== undefined && { tradeVolume: dto.tradeVolume }),
            ...(dto.cseCommission !== undefined && { cseCommission: dto.cseCommission }),
            ...(dto.paymentAmount !== undefined && { paymentAmount: dto.paymentAmount }),
            ...(dto.memberId !== undefined && { memberId: dto.memberId }),
        },
    });

    const serializedUpdate = serializeBigInt(serializeBigInt(taxToNBR), "updateTaxToNBR");
    console.log("[TaxToNBRService] updateTaxToNBR serialized data:", JSON.stringify(serializedUpdate, null, 2).substring(0, 500));
    return serializedUpdate;
};

const deleteTaxToNBR = async (id: bigint) => {
    await getTaxToNBRById(id);

    const taxToNBR = await db.cns.taxToNBR.delete({
        where: { id },
    });

    const serializedDelete = serializeBigInt(serializeBigInt(taxToNBR), "deleteTaxToNBR");
    console.log("[TaxToNBRService] deleteTaxToNBR serialized data:", JSON.stringify(serializedDelete, null, 2).substring(0, 500));
    return serializedDelete;
};

export const TaxToNBRService = {
    getAllTaxToNBRs,
    getTaxToNBRById,
    createTaxToNBR,
    updateTaxToNBR,
    deleteTaxToNBR,
};

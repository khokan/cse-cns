import { db } from "../../lib/prisma.js";
import { ChallanQuery, CreateChallanDto, UpdateChallanDto } from "./challan.interface.js";
import AppError from "../../errorHelpers/AppError.js";
import status from "http-status";

const getAllChallans = async (query: ChallanQuery) => {
    const page = parseInt(query.page ?? "1", 10);
    const limit = parseInt(query.limit ?? "10", 10);
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy ?? "ID";
    const sortOrder = (query.sortOrder ?? "desc") as "asc" | "desc";

    const where: any = {
        ...(query.search
            ? {
                  OR: [
                      { ChallanNumber: { contains: query.search } },
                  ],
              }
            : {}),
        ...(query.dateFrom || query.dateTo
            ? {
                  ChallanDate: {
                      ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
                      ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
                  },
              }
            : {}),
    };

    const [challans, total] = await Promise.all([
        db.cns.challan.findMany({
            where,
            orderBy: { [sortBy]: sortOrder },
            skip,
            take: limit,
        }),
        db.cns.challan.count({ where }),
    ]);

    return {
        data: challans,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

const getChallanById = async (id: number) => {
    const challan = await db.cns.challan.findUnique({
        where: { ID: id },
    });

    if (!challan) {
        throw new AppError(status.NOT_FOUND, "Challan not found.");
    }

    return challan;
};

const createChallan = async (dto: CreateChallanDto) => {
    const challan = await db.cns.challan.create({
        data: {
            ChallanNumber: dto.challanNumber,
            ChallanDate: dto.challanDate,
            ChallanPeriodStartDate: dto.challanPeriodStartDate,
            ChallanPeriodEndDate: dto.challanPeriodEndDate,
            TotalTaxAmount: dto.totalTaxAmount,
        },
    });

    return challan;
};

const updateChallan = async (id: number, dto: UpdateChallanDto) => {
    await getChallanById(id);

    const challan = await db.cns.challan.update({
        where: { ID: id },
        data: {
            ...(dto.challanNumber !== undefined && { ChallanNumber: dto.challanNumber }),
            ...(dto.challanDate !== undefined && { ChallanDate: dto.challanDate }),
            ...(dto.challanPeriodStartDate !== undefined && { ChallanPeriodStartDate: dto.challanPeriodStartDate }),
            ...(dto.challanPeriodEndDate !== undefined && { ChallanPeriodEndDate: dto.challanPeriodEndDate }),
            ...(dto.totalTaxAmount !== undefined && { TotalTaxAmount: dto.totalTaxAmount }),
        },
    });

    return challan;
};

const deleteChallan = async (id: number) => {
    await getChallanById(id);

    const challan = await db.cns.challan.delete({
        where: { ID: id },
    });

    return challan;
};

export const ChallanService = {
    getAllChallans,
    getChallanById,
    createChallan,
    updateChallan,
    deleteChallan,
};

import fs from "fs/promises";
import { createReadStream } from "fs";
import path from "path";
import { envVars } from "../config/env.js";

// ---------------------------------------------------------------------------
// Storage library — wraps local-disk operations for generated reports.
// Base path: <cwd>/uploads/reports/<userId>/<jobId>.<ext>
// ---------------------------------------------------------------------------

const getBase = () => path.resolve(envVars.REPORTS_UPLOAD_DIR);

/**
 * Ensures the user-specific sub-directory exists (creates if missing).
 */
const ensureDir = async (userId: string): Promise<string> => {
    const dir = path.join(getBase(), userId);
    await fs.mkdir(dir, { recursive: true });
    return dir;
};

/**
 * Saves a Buffer to disk.
 * @returns relative filePath (e.g. "userId/jobId.xlsx") stored in DB
 */
const saveReport = async (
    userId: string,
    jobId: string,
    ext: string,
    buffer: Buffer
): Promise<{ filePath: string; fileSize: number }> => {
    const dir = await ensureDir(userId);
    const fileName = `${jobId}.${ext}`;
    const absPath = path.join(dir, fileName);
    await fs.writeFile(absPath, buffer);
    const stats = await fs.stat(absPath);
    return {
        filePath: `${userId}/${fileName}`,
        fileSize: stats.size,
    };
};

/**
 * Returns the absolute disk path for a stored report.
 */
const getAbsolutePath = (filePath: string): string =>
    path.join(getBase(), filePath);

/**
 * Creates a read stream for streaming the file to a response.
 */
const createReportStream = (filePath: string) =>
    createReadStream(getAbsolutePath(filePath));

/**
 * Deletes a stored report file from disk.
 */
const deleteReport = async (filePath: string): Promise<void> => {
    try {
        await fs.unlink(getAbsolutePath(filePath));
    } catch {
        // Ignore file-not-found errors
    }
};

/**
 * Checks whether a stored report file exists on disk.
 */
const reportExists = async (filePath: string): Promise<boolean> => {
    try {
        await fs.access(getAbsolutePath(filePath));
        return true;
    } catch {
        return false;
    }
};

export const storageLib = {
    saveReport,
    getAbsolutePath,
    createReportStream,
    deleteReport,
    reportExists,
};

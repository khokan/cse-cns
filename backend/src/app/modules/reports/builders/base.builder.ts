// ---------------------------------------------------------------------------
// Abstract base class for all report builders.
// Each builder receives raw data rows and returns a Buffer + metadata.
// ---------------------------------------------------------------------------

export interface BuildResult {
    buffer: Buffer;
    mimeType: string;
    extension: string;
}

export abstract class ReportBuilder {
    /** Human-readable report title shown in the generated file */
    abstract readonly title: string;

    /**
     * Generate the report from data rows.
     * @param data   Array of plain objects (rows fetched from DB)
     * @param filters Original filter params (for display in header/footer)
     */
    abstract generate(
        data: Record<string, unknown>[],
        filters?: Record<string, unknown>
    ): Promise<BuildResult>;
}

import fastCsv from "fast-csv";
import { ReportBuilder, BuildResult } from "./base.builder.js";


// ---------------------------------------------------------------------------
// CSV Report Builder — uses fast-csv to stream rows into a Buffer.
// ---------------------------------------------------------------------------

export class CsvBuilder extends ReportBuilder {
    readonly title: string;

    constructor(title = "Report") {
        super();
        this.title = title;
    }

    async generate(
        data: Record<string, unknown>[],
        _filters?: Record<string, unknown>
    ): Promise<BuildResult> {
        const buffer = await this._buildCsv(data);
        return {
            buffer,
            mimeType: "text/csv",
            extension: "csv",
        };
    }

    private _buildCsv(data: Record<string, unknown>[]): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];

            // Derive headers from the first row's keys
            const headers = data.length > 0 ? Object.keys(data[0]) : [];

            const stream = fastCsv.format({ headers });

            stream.on("data", (chunk: Buffer) => chunks.push(chunk));
            stream.on("end", () => resolve(Buffer.concat(chunks)));
            stream.on("error", reject);

            for (const row of data) {
                stream.write(row);
            }

            stream.end();
        });
    }
}

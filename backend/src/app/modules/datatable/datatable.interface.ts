import { UserRoleType } from "../../types/auth.types.js";

export interface TableConfig {
  db: "cnsWeb" | "cns";
  model: string;
  primaryKey: string;
  readRoles: UserRoleType[];
  writeRoles: UserRoleType[];
  searchableFields?: string[];
}

export interface DatatableQuery {
  page?: string;
  limit?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  [key: string]: string | undefined;
}

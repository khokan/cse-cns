/**
 * Example usage of TanstackDataTable with proper datetime formatting and sorting
 * 
 * IMPORTANT: For sorting to work, you MUST add `enableSorting: true` to your column definitions
 */

import { ColumnDef } from "@tanstack/react-table";
import { TanstackDataTable } from "@/components/modules/common/tanstack-data-table";
import { formatDateOnly, formatDateTime, formatCurrency } from "@/components/modules/common/tanstack-table-helpers";

// Example data type
interface OrderData {
  id: string;
  orderNumber: string;
  createdAt: string; // ISO date string
  updatedAt: string;
  amount: number;
  status: string;
}

// EXAMPLE 1: Basic columns with datetime showing only date
export const basicColumns: ColumnDef<OrderData>[] = [
  {
    accessorKey: "orderNumber",
    header: "Order #",
    enableSorting: true, // Enable sorting for this column
  },
  {
    accessorKey: "createdAt",
    header: "Created Date",
    enableSorting: true,
    cell: ({ getValue }) => formatDateOnly(getValue() as string), // Shows only YYYY-MM-DD
  },
  {
    accessorKey: "amount",
    header: "Amount",
    enableSorting: true,
    cell: ({ getValue }) => formatCurrency(getValue() as number), // Format as currency
  },
  {
    accessorKey: "status",
    header: "Status",
    enableSorting: true,
  },
];

// EXAMPLE 2: Full datetime with time component
export const dateTimeColumns: ColumnDef<OrderData>[] = [
  {
    accessorKey: "orderNumber",
    header: "Order #",
    enableSorting: true,
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    enableSorting: true,
    cell: ({ getValue }) => formatDateTime(getValue() as string), // Shows YYYY-MM-DD HH:MM:SS
  },
  {
    accessorKey: "updatedAt",
    header: "Updated At",
    enableSorting: true,
    cell: ({ getValue }) => formatDateTime(getValue() as string),
  },
];

// EXAMPLE 3: Advanced columns with multiple features
export const advancedColumns: ColumnDef<OrderData>[] = [
  {
    accessorKey: "id",
    header: "ID",
    enableSorting: false, // Disable sorting for ID (optional)
    size: 100,
  },
  {
    accessorKey: "orderNumber",
    header: "Order Number",
    enableSorting: true,
    cell: ({ getValue }) => {
      const value = getValue() as string;
      return <span className="font-mono text-sm">{value}</span>;
    },
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    enableSorting: true,
    cell: ({ getValue }) => {
      return (
        <span className="text-muted-foreground">
          {formatDateOnly(getValue() as string)}
        </span>
      );
    },
  },
  {
    accessorKey: "amount",
    header: "Amount",
    enableSorting: true,
    cell: ({ getValue }) => {
      const value = getValue() as number;
      return <span className="font-semibold">{formatCurrency(value)}</span>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    enableSorting: true,
    cell: ({ getValue }) => {
      const status = getValue() as string;
      const statusColors: Record<string, string> = {
        pending: "bg-yellow-100 text-yellow-800",
        completed: "bg-green-100 text-green-800",
        cancelled: "bg-red-100 text-red-800",
      };
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || "bg-gray-100"}`}>
          {status}
        </span>
      );
    },
  },
];

// EXAMPLE 4: How to use in a component
/**
export function OrdersTableExample() {
  const [orders, setOrders] = useState<OrderData[]>([]);

  return (
    <TanstackDataTable
      columns={basicColumns}
      data={orders}
      title="Orders"
      description="Manage all your orders"
      searchKeys={["orderNumber", "status"]}
      initialPageSize={10}
      filters={[
        {
          field: "status",
          label: "Status",
          options: [
            { label: "Pending", value: "pending" },
            { label: "Completed", value: "completed" },
            { label: "Cancelled", value: "cancelled" },
          ],
        },
      ]}
    />
  );
}
 */

// KEY POINTS FOR PROPER SORTING & DATETIME:
// ==========================================
// 1. SORTING: Add `enableSorting: true` to any column you want sortable
// 2. DATETIME: Use `formatDateOnly()` for date-only display, `formatDateTime()` for date+time
// 3. CLICK HEADERS: Click the column headers to sort (arrow indicates direction)
// 4. DATA FORMAT: Ensure datetime values are ISO format strings or Date objects
// 5. BACKEND SORTING: For large datasets, implement server-side sorting by watching the `sorting` state

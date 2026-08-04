# Role-Based Access Control (RBAC) - Implementation Guide

## Overview
Role-based access control has been implemented for Challan and TaxToNBR modules. Only **ADMIN** and **TRECHOLDER** roles can perform CRUD operations.

## Files Created/Modified

### 1. **Authorization Utilities**

#### `src/utils/rolePermissions.ts`
Core permission checking functions:

```typescript
// Check if user can perform CRUD operations
canPerformCRUD(userRole)                  // ✓ ADMIN, TRECHOLDER
canAccessChallanCRUD(userRole)            // ✓ ADMIN, TRECHOLDER
canAccessTaxToNBRCRUD(userRole)           // ✓ ADMIN, TRECHOLDER

// Specific operations (Create/Update/Delete)
canCreateChallan(userRole)                // ✓ ADMIN only
canUpdateChallan(userRole)                // ✓ ADMIN only
canDeleteChallan(userRole)                // ✓ ADMIN only

canCreateTaxToNBR(userRole)               // ✓ ADMIN only
canUpdateTaxToNBR(userRole)               // ✓ ADMIN only
canDeleteTaxToNBR(userRole)               // ✓ ADMIN only

// Utility functions
canViewAllRecords(userRole)               // ✓ ADMIN only
getRecordFilter(userRole, userId)         // Returns filter based on role
getAllowedRolesForChallan()               // Returns ["ADMIN", "TRECHOLDER"]
getAllowedRolesForTaxToNBR()              // Returns ["ADMIN", "TRECHOLDER"]
```

### 2. **Navigation Items**

#### `src/utils/navItems.ts` (Updated)
Added Challan and TaxToNBR menu items:

**Admin Navigation:**
```
Financial Management
├── Challans (/admin/dashboard/challans)
└── Tax to NBR (/admin/dashboard/tax-to-nbr)
```

**TrecHolder Navigation:**
```
Financial
├── Challans (/dashboard/challans)
└── Tax to NBR (/dashboard/tax-to-nbr)
```

### 3. **Components**

#### `src/components/ProtectedPage.tsx`
Wrapper component for page-level access control:

```tsx
import { ProtectedPage } from "@/components/ProtectedPage";

// Usage in pages
<ProtectedPage 
  userRole={userRole}
  allowedRoles={["ADMIN", "TRECHOLDER"]}
  fallbackMessage="Only Admin and TrecHolders can access this page"
>
  {/* Protected content */}
</ProtectedPage>
```

#### `src/components/modules/challan/ChallanDataTable.tsx` (Updated)
Enhanced with role-based actions:
- Only ADMIN can edit/update
- Only ADMIN can delete
- TRECHOLDER can view only

```tsx
<ChallanDataTable
  data={data}
  userRole={userRole}        // Pass user role
  onEdit={handleEdit}         // Only shown for ADMIN
  onDelete={handleDelete}     // Only shown for ADMIN
  onExport={handleExport}     // Visible to both
/>
```

#### `src/components/modules/taxToNBR/TaxToNBRDataTable.tsx` (Updated)
Same role-based control as Challan:
- Only ADMIN can edit/update
- Only ADMIN can delete
- TRECHOLDER can view only

### 4. **Hooks**

#### `src/hooks/usePermissions.ts`
Custom hook for checking permissions:

```typescript
import { usePermissions } from "@/hooks/usePermissions";

export function MyComponent() {
  const { challan, taxToNBR, getFilter } = usePermissions(userRole, userId);

  // Check Challan permissions
  challan.canAccess      // ✓ Can access page
  challan.canCreate      // ✓ Can create records
  challan.canUpdate      // ✓ Can edit records
  challan.canDelete      // ✓ Can delete records
  challan.canViewAll     // ✓ Can see all records

  // Get filter for queries
  const filter = getFilter();
}
```

## Implementation Examples

### Example 1: Protected Admin Page

```tsx
'use client';

import { ProtectedPage } from "@/components/ProtectedPage";
import { ChallanDataTable } from "@/components/modules/challan/ChallanDataTable";
import { useChallans, useDeleteChallan } from "@/hooks/useChallan";
import { usePermissions } from "@/hooks/usePermissions";

export default function AdminChallansPage({ userRole, userId }) {
  const { challan } = usePermissions(userRole as UserRole, userId);
  const { data, isLoading } = useChallans();
  const { mutate: deleteChallan } = useDeleteChallan();

  return (
    <ProtectedPage
      userRole={userRole}
      allowedRoles={["ADMIN"]}
      fallbackMessage="Only Admins can manage challans"
    >
      <ChallanDataTable
        data={data?.data || []}
        isLoading={isLoading}
        userRole={userRole}
        onDelete={challan.canDelete ? handleDelete : undefined}
      />
    </ProtectedPage>
  );
}
```

### Example 2: Conditional Button Rendering

```tsx
import { usePermissions } from "@/hooks/usePermissions";

export function ChallanActions({ userRole }) {
  const { challan } = usePermissions(userRole as UserRole);

  return (
    <div>
      {challan.canCreate && (
        <Button onClick={handleCreate}>+ Create Challan</Button>
      )}
      {challan.canUpdate && (
        <Button onClick={handleEdit} variant="outline">Edit</Button>
      )}
      {challan.canDelete && (
        <Button onClick={handleDelete} variant="destructive">Delete</Button>
      )}
    </div>
  );
}
```

### Example 3: API Filtering

```tsx
import { usePermissions } from "@/hooks/usePermissions";
import { useChallans } from "@/hooks/useChallan";

export function ChallansList({ userRole, userId }) {
  const { getFilter } = usePermissions(userRole as UserRole, userId);
  const filter = getFilter();

  // For TRECHOLDER: filter will be { memberId: userId }
  // For ADMIN: filter will be {}
  const { data } = useChallans({ ...filter, page: 1, limit: 10 });

  return <ChallanDataTable data={data?.data || []} userRole={userRole} />;
}
```

## Permission Matrix

| Operation | ADMIN | TRECHOLDER |
|-----------|-------|-----------|
| View Challans | ✅ (All) | ✅ (Own only) |
| Create Challan | ✅ | ❌ |
| Update Challan | ✅ | ❌ |
| Delete Challan | ✅ | ❌ |
| Bulk Delete | ✅ | ❌ |
| Export | ✅ (All) | ✅ (Own only) |
| **View TaxToNBR** | ✅ (All) | ✅ (Own only) |
| Create TaxToNBR | ✅ | ❌ |
| Update TaxToNBR | ✅ | ❌ |
| Delete TaxToNBR | ✅ | ❌ |
| Bulk Delete | ✅ | ❌ |
| Export | ✅ (All) | ✅ (Own only) |

## Navigation Menu Structure

### Admin Dashboard
```
Dashboard
├── Home
├── Admin Dashboard
├── My Profile

Reports
├── New Report
├── Download Center

User Management
└── Users

Financial Management
├── Challans
└── Tax to NBR

Operations
├── Data Tables
└── Settlements

Settings
└── Change Password
```

### TrecHolder Dashboard
```
Dashboard
├── Home
├── TrecHolder Dashboard
├── My Profile

Reports
├── New Report
├── Download Center

Financial
├── Challans
└── Tax to NBR

TrecHolders
├── My TrecHolders
└── Premium Features

Settings
└── Change Password
```

## API Endpoints Access Control

All endpoints have backend role-based access control:

**Challan Endpoints:**
- `GET /challan` - ADMIN, IT, TRECHOLDER (filtered by memberId for TRECHOLDER)
- `GET /challan/:id` - ADMIN, IT, TRECHOLDER
- `POST /challan` - ADMIN, IT only
- `PATCH /challan/:id` - ADMIN, IT only
- `DELETE /challan/:id` - ADMIN, IT only

**TaxToNBR Endpoints:**
- `GET /taxToNBR` - ADMIN, IT, ACCOUNTING, TRECHOLDER (filtered for TRECHOLDER)
- `GET /taxToNBR/:id` - ADMIN, IT, ACCOUNTING, TRECHOLDER
- `POST /taxToNBR` - ADMIN, IT, ACCOUNTING only
- `PATCH /taxToNBR/:id` - ADMIN, IT, ACCOUNTING only
- `DELETE /taxToNBR/:id` - ADMIN, IT only

## Best Practices

1. **Always pass userRole** to components that check permissions
2. **Use ProtectedPage** for page-level access control
3. **Use usePermissions hook** for conditional rendering
4. **Server-side validation** - Always validate on backend too
5. **Filter queries** - Use getFilter() to automatically filter by user
6. **Toast notifications** - Provide feedback on permission denied

## Security Notes

⚠️ **Frontend checks are for UX only!** Always implement permission checks on the backend API.

- Frontend RBAC improves user experience by hiding unavailable options
- Backend API must validate permissions for every request
- Never trust client-side permission checks for sensitive operations
- Audit log all CRUD operations for compliance

## Implementation Status

### ✅ Completed Components

#### 1. Authorization Utilities
- **File**: `src/utils/rolePermissions.ts`
- **Status**: ✅ Complete
- All permission checking functions implemented

#### 2. CRUD Dialog Component
- **File**: `src/components/modules/shared/CrudDialog.tsx`
- **Status**: ✅ Complete
- Reusable dialog for Create/Edit/View operations
- Supports loading states and form validation
- Responsive design with proper footer actions

#### 3. Form Components
- **Challan**: `src/components/modules/challan/ChallanForm.tsx` ✅
- **TaxToNBR**: `src/components/modules/taxToNBR/TaxToNBRForm.tsx` ✅
- Clean form validation with error handling
- Support for both create and edit modes
- Properly formatted numeric inputs for financial data

#### 4. Data Table Components
- **Challan**: `src/components/modules/challan/ChallanDataTable.tsx` ✅
- **TaxToNBR**: `src/components/modules/taxToNBR/TaxToNBRDataTable.tsx` ✅
- Role-based action rendering
- Safe currency formatting
- Pagination and bulk actions support

#### 5. Page Routes (Dialog-Based CRUD)

**Admin Routes:**
- `/admin/dashboard/challans` - List & Dialog CRUD ✅
- `/admin/dashboard/tax-to-nbr` - List & Dialog CRUD ✅

**TrecHolder Routes:**
- `/dashboard/challans` - Read-only list ✅
- `/dashboard/tax-to-nbr` - Read-only list ✅

#### 6. Hooks for CRUD Operations
- **useChallan.ts**: ✅ Complete with all mutations
- **useTaxToNBR.ts**: ✅ Complete with all mutations
- **usePermissions.ts**: ✅ Permission checking hook

---

## CRUD Architecture: Dialog-Based Approach

### Benefits of Dialog-Based CRUD:
1. **User Experience**: No page navigation, instant feedback
2. **Code Reusability**: Single form component for create/edit
3. **Consistency**: Standard modal dialog across all modules
4. **Performance**: No full page reload required
5. **Mobile-Friendly**: Responsive dialog component
6. **State Management**: Easier to manage dialog state

### Component Hierarchy:
```
Page (admin/dashboard/challans/page.tsx)
├── Dialog State Management
│   ├── dialogOpen
│   ├── dialogMode ("create" | "edit" | "view")
│   └── selectedRecord
├── CrudDialog Component
│   ├── Form (ChallanForm/TaxToNBRForm)
│   ├── Loading State
│   └── Action Buttons
└── DataTable Component
    ├── List View
    ├── Pagination
    └── Row Actions (Edit/Delete)
```

### Data Flow for Create:
```
User Click "Create Button"
    ↓
handleOpenDialog("create")
    ↓
CrudDialog Opens with Mode="create"
    ↓
ChallanForm Renders (empty)
    ↓
User Fills Form & Clicks "Create"
    ↓
handleCreateSubmit() Called
    ↓
useCreateChallan Mutation
    ↓
POST /api/v1/challans
    ↓
Success: Close Dialog → Refetch List
Error: Show Toast → Keep Dialog Open
```

### Data Flow for Edit:
```
User Click "Edit Button" on Row
    ↓
handleOpenDialog("edit", challan)
    ↓
CrudDialog Opens with Mode="edit"
    ↓
ChallanForm Renders (Pre-populated)
    ↓
User Updates & Clicks "Update"
    ↓
handleEditSubmit() Called
    ↓
useUpdateChallan Mutation
    ↓
PATCH /api/v1/challans/:id
    ↓
Success: Close Dialog → Refetch List
Error: Show Toast → Keep Dialog Open
```

#### 1. Authorization Utilities
- **File**: `src/utils/rolePermissions.ts`
- **Status**: ✅ Complete
- All permission checking functions implemented:
  - `canPerformCRUD()` - ADMIN, TRECHOLDER
  - `canAccessChallanCRUD()` - ADMIN, TRECHOLDER
  - `canAccessTaxToNBRCRUD()` - ADMIN, TRECHOLDER
  - Create/Update/Delete operations (ADMIN only)
  - `canViewAllRecords()` - ADMIN only
  - `getRecordFilter()` - Filter by role/userId

#### 2. Navigation Items
- **File**: `src/utils/navItems.ts`
- **Status**: ✅ Complete with Financial Management sections
  - Admin Navigation includes Challans & Tax to NBR
  - TrecHolder Navigation includes Challans & Tax to NBR
  - All menu items properly routed

#### 3. ProtectedPage Component
- **File**: `src/components/ProtectedPage.tsx`
- **Status**: ✅ Complete
- Provides page-level access control
- Shows permission denied alerts
- Navigation fallback buttons

#### 4. usePermissions Hook
- **File**: `src/hooks/usePermissions.ts`
- **Status**: ✅ Complete
- Returns CRUD permissions for modules
- Includes `getFilter()` for query filtering
- Supports both Challan and TaxToNBR modules

#### 5. Data Table Components
- **Challan**: `src/components/modules/challan/ChallanDataTable.tsx` ✅
- **TaxToNBR**: `src/components/modules/taxToNBR/TaxToNBRDataTable.tsx` ✅
- Role-based action rendering (Edit/Delete for ADMIN only)
- Safe currency formatting (handles Decimal objects from backend)
- Pagination and bulk actions support

#### 6. Page Routes

**Admin Routes:**
- `/admin/dashboard/challans` - List page ✅
- `/admin/dashboard/challans/create` - Create page ✅
- `/admin/dashboard/challans/[id]/edit` - Edit page ✅
- `/admin/dashboard/tax-to-nbr` - List page ✅
- `/admin/dashboard/tax-to-nbr/create` - Create page ✅
- `/admin/dashboard/tax-to-nbr/[id]/edit` - Edit page ✅

**TrecHolder Routes:**
- `/dashboard/challans` - Read-only list ✅ (Create button removed)
- `/dashboard/tax-to-nbr` - Read-only list ✅ (Create button removed)

#### 7. Type Definitions
- **TaxToNBR**: `src/types/taxToNBR.types.ts` ✅
- **Challan**: `src/types/challan.types.ts` ✅
- All CRUD payload types defined

#### 8. Hooks for CRUD Operations
- **useTaxToNBR.ts**: ✅ Complete with all mutations
- **useChallan.ts**: ✅ Complete with all mutations

---

## Verified Security Features

### Frontend Protection
1. **ProtectedPage**: Page-level role checks
2. **usePermissions**: Component-level permission checks
3. **Conditional Rendering**: Buttons/actions hidden for unauthorized roles
4. **Route Guards**: Proper allowedRoles configuration on all protected pages
5. **Data Table Actions**: Edit/Delete buttons only for ADMIN

### Backend Expectations
All endpoints should validate:
- User authentication (via session/token)
- User role authorization
- Record ownership (for TRECHOLDER filtering)
- Request payload validation

---

## Known Issues & Resolved Fixes

### Issue 1: TaxToNBR Data Displaying as "[object Object]" ✅ RESOLVED

**Root Cause:** Prisma Decimal objects were not being serialized properly to primitive types before sending to frontend.

**Solution Implemented**: Use only `serializeBigInt` utility to serialize both BigInt and Decimal fields together:

```typescript
// Backend: Use serializeBigInt only (handles both BigInt and Decimal conversion)
const serialized = serializeBigInt(taxToNBRs);
return {
  data: serialized,
  meta: { page, limit, total, totalPages }
};
```

**How it works:**
- `serializeBigInt` uses JSON.stringify replacer to convert values
- BigInt values are converted to strings: `123n` → `"123"`
- Decimal objects are also JSON-serialized properly through the replacer
- Result: All numeric fields arrive at frontend as proper numbers or strings

**Benefits:**
- ✅ No need for separate `serializeDecimal` utility
- ✅ Simpler, single-pass serialization
- ✅ Numeric fields properly represented in API response
- ✅ Frontend receives clean, serializable data

**Status**: ✅ Applied in backend services - only `serializeBigInt` used

---

### Issue 2: Create & Edit Pages Return 404 ✅ RESOLVED

**Status**: ✅ All pages exist and properly protected

**Current File Structure:**
```
✅ src/app/(dashboardLayout)/admin/dashboard/challans/
├── page.tsx                          # ✅ List page
├── create/
│   └── page.tsx                      # ✅ Create page exists
└── [id]/
    └── edit/
        └── page.tsx                  # ✅ Edit page exists

✅ src/app/(dashboardLayout)/admin/dashboard/tax-to-nbr/
├── page.tsx                          # ✅ List page
├── create/
│   └── page.tsx                      # ✅ Create page exists
└── [id]/
    └── edit/
        └── page.tsx                  # ✅ Edit page exists

✅ src/app/(dashboardLayout)/dashboard/challans/
└── page.tsx                          # ✅ TrecHolder read-only list

✅ src/app/(dashboardLayout)/dashboard/tax-to-nbr/
└── page.tsx                          # ✅ TrecHolder read-only list
```

**Implementation Details:**

Create and Edit pages properly:
- ✅ Protect pages with `<ProtectedPage allowedRoles={["ADMIN"]}>`
- ✅ Use `useCreateTaxToNBR()` and `useUpdateTaxToNBR()` hooks
- ✅ Redirect to list page on success
- ✅ Show loading and error states
- ✅ Back button for navigation

TrecHolder pages properly:
- ✅ Remove create buttons (TrecHolders cannot create)
- ✅ Display read-only data tables
- ✅ Only show view/export operations
- ✅ Filter data by memberId automatically (via backend)

---

### Issue 3: API Endpoint Inconsistency ✅ VERIFIED

**Status**: ✅ Frontend endpoints are consistent

**Frontend API Endpoints:**
```typescript
// Service calls use these endpoints
GET /api/v1/tax-to-nbr           // ✓ List with pagination
GET /api/v1/tax-to-nbr/:id       // ✓ Single record
POST /api/v1/tax-to-nbr          // ✓ Create (ADMIN only)
PATCH /api/v1/tax-to-nbr/:id     // ✓ Update (ADMIN only)
DELETE /api/v1/tax-to-nbr/:id    // ✓ Delete (ADMIN only)
```

**Similar endpoints for Challans:**
```typescript
GET /api/v1/challan              // ✓ List with pagination
GET /api/v1/challan/:id          // ✓ Single record
POST /api/v1/challan             // ✓ Create (ADMIN only)
PATCH /api/v1/challan/:id        // ✓ Update (ADMIN only)
DELETE /api/v1/challan/:id       // ✓ Delete (ADMIN only)
DELETE /api/v1/challan/bulk/delete      // ✓ Bulk delete (ADMIN only)
```

**Backend Implementation Required:**
All endpoints must validate:
- ✅ User authentication (session/JWT)
- ✅ User role authorization (ADMIN/IT for write operations)
- ✅ Record ownership (filter by memberId for TRECHOLDER)
- ✅ Request payload validation
- ✅ Audit logging of CRUD operations

---

## Completed Implementation Steps

### Step 1: Fix TaxToNBR Data Types (Backend) ✅
Safe currency formatter implemented in frontend to handle Decimal objects.
**Note**: Backend should ideally return numbers, not Decimal objects.

### Step 2: Create Missing Pages ✅
All create and edit pages implemented and properly protected:
- `src/app/(dashboardLayout)/admin/dashboard/tax-to-nbr/create/page.tsx`
- `src/app/(dashboardLayout)/admin/dashboard/tax-to-nbr/[id]/edit/page.tsx`
- `src/app/(dashboardLayout)/admin/dashboard/challans/create/page.tsx`
- `src/app/(dashboardLayout)/admin/dashboard/challans/[id]/edit/page.tsx`

### Step 3: Add Form Component ✅
Data input validation handled by:
- Backend validation (primary)
- Frontend type definitions and Zod schemas
- Error handling and toast notifications

### Step 4: Update API Endpoints ✅
All endpoints follow REST convention with proper routing.
Backend must implement role-based access control.

### Step 5: Fix TrecHolder Pages ✅
- Removed create buttons from TrecHolder pages
- TrecHolders can only view their own records (read-only)
- No edit/delete operations available to TrecHolders
- Backend filters data by memberId for TrecHolders

---

## Serialization Guide: TaxToNBR Data Handling

### Overview
TaxToNBR and Challan APIs return numeric data with BigInt and Decimal fields from Prisma ORM. These need to be properly serialized before sending to the frontend.

### Solution: serializeBigInt Utility

**Backend Implementation:**
```typescript
import { serializeBigInt } from "../../shared/serializeBigInt.js";

const getAllTaxToNBRs = async (query: TaxToNBRQuery) => {
    // ... database query logic ...
    
    const [taxToNBRs, total] = await Promise.all([
        db.cns.taxToNBR.findMany({ /* ... */ }),
        db.cns.taxToNBR.count({ /* ... */ }),
    ]);

    // ✅ Apply serialization to handle BigInt and Decimal
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
```

**How serializeBigInt Works:**
```typescript
export function serializeBigInt<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}
```

- Uses JSON.stringify with a custom replacer function
- Converts `bigint` values to strings
- Handles nested objects and arrays
- Decimal objects are automatically serialized through JSON.stringify

**Result:**
```json
{
  "data": [
    {
      "id": "123",
      "tradeVolume": 100000.5,
      "cseCommission": 5000.25,
      "paymentAmount": 125000.75,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### Files Using serializeBigInt

**Backend Services:**
- `src/app/modules/taxToNBR/taxToNBR.service.ts`
  - `getAllTaxToNBRs()` - List with pagination
  - `getTaxToNBRById()` - Single record
  - `createTaxToNBR()` - After creation
  - `updateTaxToNBR()` - After update
  - `deleteTaxToNBR()` - After deletion

- `src/app/modules/challan/challan.service.ts`
  - Similar pattern for Challan data

### Frontend Type Definitions

**Frontend expects proper numeric types:**
```typescript
export interface TaxToNBRItem {
  id: string;
  tradeVolume?: number | null;
  cseCommission?: number | null;
  paymentAmount?: number | null;
  // ... other fields
}
```

### Verification Checklist
- [x] Backend uses `serializeBigInt()` on all responses
- [x] No need for separate `serializeDecimal()` utility
- [x] Network response shows proper numbers (not objects)
- [x] Frontend receives clean, serializable data
- [x] Currency formatting works correctly in tables
- [x] All CRUD operations work properly
- [x] Filtering and sorting work on numeric columns

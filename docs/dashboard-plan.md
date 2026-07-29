# Implementation Plan - Admin Reconciliation Dashboard

Integrating 3 MSSQL stored procedures (`usp_Reconciliation_ReceivableSummary`, `usp_Reconciliation_TransactionSummary`, `usp_Reconciliation_CashFlowSummary`) into a backend module and an interactive dashboard for the **ADMIN** role.

## User Review Required

> [!IMPORTANT]
> - This dashboard is **strictly restricted to ADMIN and IT roles**. `TRECHOLDER` users will not have access to these endpoints or UI components.
> - The stored procedures are queried directly from the `cnsWeb` MSSQL database via Prisma raw query execution.

---

## Proposed Changes

### Backend Module (`reconciliation`)

#### [NEW] [reconciliation.service.ts](file:///i:/CSE/Projects/Current/web-app/cse-cns/backend/src/app/modules/reconciliation/reconciliation.service.ts)
- Executes raw queries for:
  1. `EXEC [dbo].[usp_Reconciliation_ReceivableSummary]`
  2. `EXEC [dbo].[usp_Reconciliation_TransactionSummary]`
  3. `EXEC [dbo].[usp_Reconciliation_CashFlowSummary]`
- Normalizes nulls, numeric values, and total rows.

#### [NEW] [reconciliation.controller.ts](file:///i:/CSE/Projects/Current/web-app/cse-cns/backend/src/app/modules/reconciliation/reconciliation.controller.ts)
- Exposes `GET /api/v1/reconciliation/summary` handler wrapped with `catchAsync`.

#### [NEW] [reconciliation.route.ts](file:///i:/CSE/Projects/Current/web-app/cse-cns/backend/src/app/modules/reconciliation/reconciliation.route.ts)
- Protected by `checkAuth(UserRole.ADMIN, UserRole.IT)`.

#### [MODIFY] [routes/index.ts](file:///i:/CSE/Projects/Current/web-app/cse-cns/backend/src/app/routes/index.ts)
- Mounts `/reconciliation` route.

---

### Frontend Components & Pages

#### [NEW] [reconciliation.service.ts](file:///i:/CSE/Projects/Current/web-app/cse-cns/frontend/src/services/reconciliation.service.ts)
- Client-side API fetcher for `/reconciliation/summary`.

#### [NEW] [useReconciliation.ts](file:///i:/CSE/Projects/Current/web-app/cse-cns/frontend/src/hooks/useReconciliation.ts)
- React Query hook `useReconciliationSummary()`.

#### [NEW] [ReconciliationDashboard.tsx](file:///i:/CSE/Projects/Current/web-app/cse-cns/frontend/src/components/modules/dashboard/ReconciliationDashboard.tsx)
- Lucrative interactive dashboard containing:
  - Glassmorphic KPI Cards (Spot, ABGN, Z, Total Value, CSE Commission, AIT).
  - Transaction Breakdown Table & Group distribution (A B G N, Spot, Z).
  - Cash Flow Settlement Timeline & Activity Waterfall (T0 Spot, T1 Collection, T2 Pay-out, T3 Final Settlement).
  - Clean currency formatting in BDT (Taka).

#### [MODIFY] [dashboard/page.tsx](file:///i:/CSE/Projects/Current/web-app/cse-cns/frontend/src/app/(dashboardLayout)/dashboard/page.tsx)
- Renders `ReconciliationDashboard` when `role` is `ADMIN` or `IT`.

---

## Verification Plan

### Automated & Manual Verification
1. Verify backend API endpoint `GET /api/v1/reconciliation/summary` returns structured json from all 3 stored procedures.
2. Verify role protection: ADMIN/IT allowed, TRECHOLDER denied (403 Forbidden).
3. Test UI layout and interactive metric cards on Admin Dashboard.

### created based on below data from cns db

usp_Reconciliation_ReceivableSummary
Spot (Taka)	ABGN (Taka)	Z (Taka)	Total Value in Taka
449899.01	28501833.26	1787503.49	30739235.76

usp_Reconciliation_TransactionSummary
TradeDate	Share Group	Collection	CSE Commission	AIT	IPF	Payment after AIT, Com. & IPF
2024-06-02 00:00:00.000	A B G N	28501833.26	93908.52	870951.88	0.00	27536972.86
2024-06-02 00:00:00.000	Spot	449899.01	206.84	449.58	0.00	449242.59
2024-06-02 00:00:00.000	Z 	1787503.49	821.68	1786.30	0.00	1784895.51
NULL	Total in Amount	30739235.76	94937.04	873187.76	0.00	29771110.96

usp_Reconciliation_CashFlowSummary

SN	Settlement Date	Activity	Cash In	Cash Out	Cash Movement
1	2024-06-02 00:00:00.000	Spot Collection (T0)	449899.01	NULL	449899.01
2	2024-06-03 00:00:00.000	A B G N Collection (T1)	28501833.26	NULL	28951732.27
3	2024-06-03 00:00:00.000	Z  Collection (T1)	1787503.49	NULL	30739235.76
4	2024-06-03 00:00:00.000	Spot Collection (T1)	NULL	449242.59	30289993.17
5	2024-06-04 00:00:00.000	A B G N Collection (T2)	NULL	27536972.86	2753020.31
6	2024-06-05 00:00:00.000	Z  Collection (T3)	NULL	1784895.51	968124.80
NULL	NULL	NULL	30739235.76	29771110.96	2753020.31...here 3 stored procedures from cns db which will be accessed by admin role only and generate data and make interactive lucrative dashboard. 

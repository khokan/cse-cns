export type UserRole = "ADMIN" | "IT" | "ACCOUNTING" | "TRECHOLDER" | "MARKETING";

export const authRoutes = ["/login", "/register"];

export const isAuthRoute = (pathname: string) => {
    return authRoutes.some((router: string) => router === pathname);
};

export type RouteConfig = {
    exact: string[];
    pattern: RegExp[];
};

export const commonProtectedRoutes: RouteConfig = {
    exact: ["/my-profile", "/change-password"],
    pattern: [],
};

export const adminProtectedRoutes: RouteConfig = {
    pattern: [/^\/admin\/dashboard/],
    exact: [],
};

export const superAdminProtectedRoutes: RouteConfig = {
    pattern: [/^\/admin\/dashboard/],
    exact: [],
};

export const trecholderProtectedRoutes: RouteConfig = {
    pattern: [/^\/dashboard/],
    exact: [],
};

export const isRouteMatches = (pathname: string, routes: RouteConfig) => {
    if (routes.exact.includes(pathname)) {
        return true;
    }
    return routes.pattern.some((pattern: RegExp) => pattern.test(pathname));
};

export const getRouteOwner = (pathname: string): "ADMIN" | "TRECHHOLDER" | "COMMON" | null => {
    if (isRouteMatches(pathname, superAdminProtectedRoutes)) {
        return "ADMIN";
    }

    if (isRouteMatches(pathname, adminProtectedRoutes)) {
        return "ADMIN";
    }

    if (isRouteMatches(pathname, trecholderProtectedRoutes)) {
        return "TRECHHOLDER";
    }

    if (isRouteMatches(pathname, commonProtectedRoutes)) {
        return "COMMON";
    }

    return null;
};

export const getDefaultDashboardRoute = (role: UserRole) => {
    if (role === "ADMIN" || role === "IT" || role === "ACCOUNTING") {
        return "/admin/dashboard";
    }
    return "/dashboard";
};

export const isValidRedirectForRole = (redirectPath: string, role: UserRole) => {
    const routeOwner = getRouteOwner(redirectPath);

    if (routeOwner === null || routeOwner === "COMMON") {
        return true;
    }

    if (routeOwner === "ADMIN" && (role === "ADMIN" || role === "IT" || role === "ACCOUNTING")) {
        return true;
    }

    if (routeOwner === "TRECHHOLDER" && (role === "TRECHOLDER" || role === "MARKETING")) {
        return true;
    }

    return false;
};
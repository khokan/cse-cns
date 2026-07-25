import { NavSection } from "@/types/dashboard.types";
import { getDefaultDashboardRoute, UserRole } from "./authUtils";


export const getCommonNavItems = (role : UserRole) : NavSection[] => {
    const defaultDashboard = getDefaultDashboardRoute(role);
    return [
        {
            // title : "Dashboard",
            items : [
                {
                    title : "Home",
                    href : "/",
                    icon : "Home"
                },
                {
                    title : "Dashboard",
                    href : defaultDashboard,
                    icon : "LayoutDashboard"

                },
                {
                    title: "My Profile",
                    href: `/my-profile`,
                    icon: "User",
                },
            ]
        },
        {
            title : "Settings",
            items : [
                {
                    title : "Change Password",
                    href : "/change-password",
                    icon : "Settings"
                }
            ]
        }
    ]
}

export const AdminNavItems: NavSection[] = [
    {
        title: "User Management",
        items: [
            {
                title: "users",
                href: "/admin/dashboard/users",
                icon: "Shield",
            },
        ],
    },
];

export const TrecHolderNavItems: NavSection[] = [
    {
        title: "subscriptions",
        items: [
            {
                title: "My subscriptions",
                href: "/dashboard/subscription",
                icon: "Calendar",
            },
            {
                title: "Premium Features",
                href: "/dashboard/premium-feature",
                icon: "ClipboardList",
            },
        ],
    },
  ];

export const getNavItemsByRole = (role : UserRole) : NavSection[] => {
    const commonNavItems = getCommonNavItems(role);

    switch (role) {
        case "ADMIN":
            return [...commonNavItems, ...AdminNavItems];
        case "TRECHOLDER":
            return [...commonNavItems, ...TrecHolderNavItems];
    }
    return commonNavItems
}
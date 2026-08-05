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
            title : "Reports",
            items : [
                {
                    title : "New Report",
                    href : "/reports",
                    icon : "FileBarChart"
                },
                {
                    title : "Download Center",
                    href : "/reports/download-center",
                    icon : "Download"
                }
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
                title: "Users",
                href: "/admin/dashboard/users",
                icon: "Users",
            },
        ],
    },
    {
        title: "Security",
        items: [
            {
                title: "Security Hub",
                href: "/admin/security",
                icon: "ShieldCheck",
            },
            {
                title: "Roles",
                href: "/admin/security/roles",
                icon: "Shield",
            },
            {
                title: "Permissions",
                href: "/admin/security/permissions",
                icon: "KeyRound",
            },
        ],
    },
    {
        title: "Financial Management",
        items: [
            {
                title: "Challans",
                href: "/admin/dashboard/challans",
                icon: "FileText",
            },
            {
                title: "Tax to NBR",
                href: "/admin/dashboard/tax-to-nbr",
                icon: "BarChart",
            },
        ],
    },
    {
        title: "Operations",
        items: [
            {
                title: "Data Tables",
                href: "/data",
                icon: "Database",
            },
            {
                title: "Settlements",
                href: "/settlements",
                icon: "ArrowLeftRight",
            },
        ],
    },
];


export const TrecHolderNavItems: NavSection[] = [
    {
        title: "Financial",
        items: [
            {
                title: "Challans",
                href: "/dashboard/challans",
                icon: "FileText",
            },
            {
                title: "Tax to NBR",
                href: "/dashboard/tax-to-nbr",
                icon: "BarChart",
            },
        ],
    },
    {
        title: "trecholders",
        items: [
            {
                title: "My trecholders",
                href: "/dashboard/trecholder",
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
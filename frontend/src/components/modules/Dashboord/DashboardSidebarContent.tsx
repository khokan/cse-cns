"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { getIconComponent } from "@/utils/iconMapper"
import { cn } from "@/utils/utils"
import { NavSection } from "@/types/dashboard.types"
import { UserInfo } from "@/types/user.types"
import Link from "next/link"
import { usePathname } from "next/navigation"


interface DashboardSidebarContentProps {
    userInfo : UserInfo,
    navItems : NavSection[],
    dashboardHome : string,

}



const DashboardSidebarContent = ({dashboardHome, navItems, userInfo} : DashboardSidebarContentProps) => {
    const pathname = usePathname()
    const displayName = userInfo?.name?.trim() || "User";
    const userInitial = displayName.charAt(0).toUpperCase();
    const displayRole = userInfo?.role
      ? String(userInfo.role).toLowerCase().replace("_", " ")
      : "member";

  return (
    <div className="hidden h-full w-72 flex-col overflow-y-auto border-r border-border/70 bg-linear-to-b from-card via-card to-muted/30 md:flex">
      {/* Logo / Brand */}
      <div className="flex h-16 items-center border-b border-border/70 px-6">
        <Link href={dashboardHome}>
          <span className="text-lg font-semibold tracking-wide text-primary">CSE Console</span>
        </Link>
      </div>

      {/* Navigation Area */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-6">
          {navItems.map((section, sectionId) => (
            <div key={sectionId}>
              {section.title && (
                <h4 className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.title}
                </h4>
              )}

              <div className="space-y-1">
                {section.items.map((item, id) => {
                  const isActive = pathname === item.href;
                  // Icon Mapper Function
                  const Icon = getIconComponent(item.icon);

                  return (
                    <Link
                      href={item.href}
                      key={id}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-accent/70 hover:text-accent-foreground",
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
              </div>

              {sectionId < navItems.length - 1 && (
                <Separator className="my-4" />
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* User Info At Bottom */}
      <div className="border-t border-border/70 px-4 py-4">
        <div className="flex items-center gap-3 rounded-xl bg-background/70 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <span className="text-sm font-semibold text-primary">
              {userInitial}
            </span>
          </div>

          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {displayRole}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardSidebarContent
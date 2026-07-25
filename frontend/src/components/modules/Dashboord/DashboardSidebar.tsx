import { getDefaultDashboardRoute } from "@/utils/authUtils"
import { getNavItemsByRole } from "@/utils/navItems"
// import { getUserInfo } from "@/services/auth.services"
import { NavSection } from "@/types/dashboard.types"
import DashboardSidebarContent from "./DashboardSidebarContent"
import { userService } from "@/services/user.service"


const DashboardSidebar = async () => {
  const userInfo = await userService.getSession()
  if (!userInfo?.data) {
    return null
  }

  const navItems : NavSection[] = getNavItemsByRole(userInfo.data.user.role)

  const dashboardHome = getDefaultDashboardRoute(userInfo.data.user.role)
  return (
    <DashboardSidebarContent userInfo={userInfo.data.user} navItems={navItems} dashboardHome={dashboardHome}/>
  )
}

export default DashboardSidebar
import { getDefaultDashboardRoute } from "@/utils/authUtils"
import { getNavItemsByRole } from "@/utils/navItems"
import { NavSection } from "@/types/dashboard.types"
import DashboardNavbarContent from "./DashboardNavbarContent"
import { userService } from "@/services/user.service"

const DashboardNavbar = async () => {
   const userInfo = await userService.getSession()
  if (!userInfo?.data) {
   return null
  }

    const navItems : NavSection[] = getNavItemsByRole(userInfo.data.role)

    const dashboardHome = getDefaultDashboardRoute(userInfo.data.user.role)
  return (
    <DashboardNavbarContent userInfo={userInfo.data.user} navItems={navItems} dashboardHome={dashboardHome}/>
  )
} 

export default DashboardNavbar
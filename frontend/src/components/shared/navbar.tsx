import { userService } from "@/services/user.service";
import { Roles } from "@/constants/roles";
import NavbarContent from "./navbar-content";

type Role = "TRECHOLDER" | "ADMIN";
type SessionUser = { name?: string; role?: Role };

function linksForRole(role?: Role) {
  if (role === Roles.ADMIN) {
    return [
      { href: "/", label: "Home" },
      { href: "/admin/dashboard", label: "Dashboard" },
    ];
  }
  if (role === Roles.TRECHOLDER) {
    return [
      { href: "/", label: "Home" },
      { href: "/dashboard", label: "Dashboard" },
    ];
  }
  return [{ href: "/", label: "Home" }];
}

export default async function Navbar() {
  const { data } = await userService.getSession();
  const user = data?.user as SessionUser | undefined;
  const role = user?.role;
  const menu = linksForRole(role);
  const clientUser = user
    ? {
        name: user.name,
        role: user.role,
      }
    : null;

  return <NavbarContent user={clientUser} menu={menu} />;
}

"use client";

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { UserInfo } from "@/types/user.types"
import { Key, LogOut, User } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { signOutUser } from "@/lib/auth-client"


interface UserDropdownProps{
    userInfo : UserInfo
}

const UserDropdown = ({ userInfo }: UserDropdownProps) => {
    const router = useRouter();
    const displayName = userInfo?.name?.trim() || "User";
    const userInitial = displayName.charAt(0).toUpperCase();
    const displayEmail = userInfo?.email || "No email";
    const displayRole = userInfo?.role
        ? userInfo.role.toLowerCase().replace("_", " ")
        : "member";

  const handleLogout = async () => {
        try {
            await signOutUser();
            router.replace("/login");
            router.refresh();
        } catch {
            toast.error("Failed to log out. Please try again.");
        }
  };

  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant={"outline"} size={"icon"} className="rounded-full border-border/80">
                <span className="text-sm font-semibold">
                    {userInitial}
                </span>
            </Button>
        </DropdownMenuTrigger>


        <DropdownMenuContent align={"end"} className="w-56 rounded-xl border-border/70">
            <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">
                        {displayName}
                    </p>

                    <p className="text-xs text-muted-foreground">
                        {displayEmail}
                    </p>

                    <p className="text-xs text-primary capitalize">
                        {displayRole}
                    </p>
                </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator/>

            <DropdownMenuItem asChild>
                <Link href={"/my-profile"} className="flex w-full items-center">
                <User className="mr-2 h-4 w-4"/>
                    My Profile
                </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
                <Link href={"/change-password"} className="flex w-full items-center">
                    <Key className="mr-2 h-4 w-4"/>
                    Change Password
                </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator/>


            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                <LogOut className="mr-2 h-4 w-4"/>
                Logout
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default UserDropdown
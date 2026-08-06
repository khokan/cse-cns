"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createUser } from "@/services/admin.service";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from "@/components/ui/sheet";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const ROLE_OPTIONS = [
    { value: "ADMIN", label: "Admin" },
    { value: "ACCOUNTING", label: "Accounting" },
    { value: "IT", label: "IT" },
    { value: "TRECHOLDER", label: "Trec Holder" },
    { value: "MARKETING", label: "Marketing" },
];

const createUserSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.string().min(1, "Role is required"),
    trecHolderId: z.string().optional(),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

interface CreateUserSheetProps {
    /** Restrict role options — ACCOUNTING cannot assign ADMIN role */
    canAssignAdminRole?: boolean;
}

export function CreateUserSheet({ canAssignAdminRole = true }: CreateUserSheetProps) {
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<CreateUserForm>({
        resolver: zodResolver(createUserSchema),
        defaultValues: { role: "", trecHolderId: "" },
    });

    const selectedRole = watch("role");

    const availableRoles = canAssignAdminRole
        ? ROLE_OPTIONS
        : ROLE_OPTIONS.filter((r) => r.value !== "ADMIN");

    const mutation = useMutation({
        mutationFn: (data: CreateUserForm) =>
            createUser({
                ...data,
                trecHolderId: data.trecHolderId || undefined,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
            toast.success("User created successfully.", {
                description: "They will need to log in and change their password.",
            });
            reset();
            setOpen(false);
        },
        onError: (err: Error) =>
            toast.error("Failed to create user", { description: err.message }),
    });

    const onSubmit = (data: CreateUserForm) => mutation.mutate(data);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button id="create-user-btn" size="sm">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add User
                </Button>
            </SheetTrigger>

            <SheetContent className="sm:max-w-md overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Create New User</SheetTitle>
                    <SheetDescription>
                        User will be created as <strong>Inactive</strong> and must change their
                        password on first login.
                    </SheetDescription>
                </SheetHeader>

                <form
                    id="create-user-form"
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-5 py-6"
                >
                    {/* Name */}
                    <div className="space-y-1.5">
                        <Label htmlFor="cu-name">
                            Full Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="cu-name"
                            placeholder="e.g. Jane Smith"
                            {...register("name")}
                            aria-invalid={!!errors.name}
                        />
                        {errors.name && (
                            <p className="text-xs text-destructive">{errors.name.message}</p>
                        )}
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                        <Label htmlFor="cu-email">
                            Email <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="cu-email"
                            type="email"
                            placeholder="jane@example.com"
                            {...register("email")}
                            aria-invalid={!!errors.email}
                        />
                        {errors.email && (
                            <p className="text-xs text-destructive">{errors.email.message}</p>
                        )}
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                        <Label htmlFor="cu-password">
                            Initial Password <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                            <Input
                                id="cu-password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Min. 8 characters"
                                {...register("password")}
                                aria-invalid={!!errors.password}
                                className="pr-10"
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                                onClick={() => setShowPassword((v) => !v)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                tabIndex={-1}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="text-xs text-destructive">{errors.password.message}</p>
                        )}
                    </div>

                    {/* Role */}
                    <div className="space-y-1.5">
                        <Label htmlFor="cu-role">
                            Role <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={selectedRole}
                            onValueChange={(v) =>
                                setValue("role", v, { shouldValidate: true })
                            }
                        >
                            <SelectTrigger id="cu-role" aria-invalid={!!errors.role}>
                                <SelectValue placeholder="Select a role…" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableRoles.map((r) => (
                                    <SelectItem key={r.value} value={r.value}>
                                        {r.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.role && (
                            <p className="text-xs text-destructive">{errors.role.message}</p>
                        )}
                    </div>

                    {/* Trec Holder ID (optional) */}
                    <div className="space-y-1.5">
                        <Label htmlFor="cu-trec">Trec Holder ID</Label>
                        <Input
                            id="cu-trec"
                            placeholder="Optional"
                            {...register("trecHolderId")}
                        />
                    </div>
                </form>

                <SheetFooter>
                    <Button
                        variant="outline"
                        onClick={() => {
                            reset();
                            setOpen(false);
                        }}
                        disabled={mutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="create-user-form"
                        disabled={mutation.isPending}
                        id="create-user-submit-btn"
                    >
                        {mutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {mutation.isPending ? "Creating…" : "Create User"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

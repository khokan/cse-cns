import Link from "next/link";
import { Facebook, Github, Linkedin, Mail } from "lucide-react";

const productLinks = [
	{ href: "/", label: "Home" },
	{ href: "/dashboard", label: "Dashboard" },
	{ href: "/courses", label: "Courses" },
];

const companyLinks = [
	{ href: "/register", label: "Get Started" },
	{ href: "/login", label: "Login" },
	{ href: "/contact", label: "Contact" },
];

const socialLinks = [
	{ href: "https://www.linkedin.com/company/CSE-platform", label: "LinkedIn", icon: Linkedin },
	{ href: "https://github.com/khokan/ilearning-fe", label: "GitHub", icon: Github },
	{ href: "https://facebook.com/ilearningplatform", label: "Facebook", icon: Facebook },
];

export function Footer() {
	return (
		<footer className="border-t bg-muted/20">
			<div className="mx-auto max-w-6xl px-4 py-14">
				<div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
					<div className="space-y-4 lg:col-span-2">
						<h3 className="text-xl font-semibold tracking-tight text-foreground">CSE</h3>
						<p className="max-w-md text-sm leading-6 text-muted-foreground">
							Build career-ready skills with guided learning paths, premium resources,
							and a focused dashboard experience designed for fast progress.
						</p>
						<a
							href="mailto:support@ilearning.com"
							className="inline-flex items-center gap-2 rounded-full border border-border/70 px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
						>
							<Mail className="h-4 w-4" />
							support@ilearning.com
						</a>
					</div>

					<div>
						<h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground/80">Product</h4>
						<ul className="space-y-2.5">
							{productLinks.map((item) => (
								<li key={item.href}>
									<Link
										href={item.href}
										className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
									>
										{item.label}
									</Link>
								</li>
							))}
						</ul>
					</div>

					<div>
						<h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground/80">Company</h4>
						<ul className="space-y-2.5">
							{companyLinks.map((item) => (
								<li key={item.href}>
									<Link
										href={item.href}
										className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
									>
										{item.label}
									</Link>
								</li>
							))}
						</ul>
					</div>
				</div>

				<div className="mt-10 flex flex-col gap-4 border-t border-border/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
					<p className="text-sm text-muted-foreground">
						Copyright {new Date().getFullYear()} iLearning. All rights reserved.
					</p>

					<div className="flex items-center gap-2">
						{socialLinks.map((item) => {
							const Icon = item.icon;
							return (
								<a
									key={item.label}
									href={item.href}
									aria-label={item.label}
									className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
								>
									<Icon className="h-4 w-4" />
								</a>
							);
						})}
					</div>
				</div>
			</div>
		</footer>
	);
}

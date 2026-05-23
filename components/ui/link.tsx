import NextLink, { LinkProps as NextLinkProps } from "next/link";
import { cn } from "@/lib/utils";

export const Link = ({
  children,
  className,
  ...props
}: NextLinkProps & { children: React.ReactNode; className?: string }) => {
  return (
    <NextLink
      {...props}
      className={cn("text-blue-500 dark:text-blue-400 hover:underline", className)}
      target="_blank"
    >
      {children}
    </NextLink>
  );
};

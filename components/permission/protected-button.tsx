import { Button } from "@heiso-io/bee/components/ui/button";
import { usePermission } from "@heiso-io/bee/hooks/use-permission";

type ProtectedButtonProps =
  | {
      className?: string;
      resource?: undefined;
      action?: undefined;
      asChild?: boolean;
      children?: React.ReactNode;
    }
  | {
      className?: string;
      resource: string;
      action: string;
      asChild?: boolean;
      children?: React.ReactNode;
    };

export const ProtectedButton = ({
  className,
  resource,
  action,
  children,
  asChild = false,
  ...props
}: ProtectedButtonProps) => {
  const allowed = usePermission({
    resource,
    action,
  });
  if (!allowed) return null;

  return (
    <Button className={className} asChild={asChild} {...props}>
      {children}
    </Button>
  );
};

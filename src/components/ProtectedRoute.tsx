import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  // TODO: wire up AuthContext – for now allow all access
  return <>{children}</>;
}

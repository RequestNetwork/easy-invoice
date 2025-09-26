import type { ClientId } from "@/server/db/schema";

interface EcommerceManageProps {
  initialClientIds: ClientId[];
}

export function EcommerceManage({
  initialClientIds: _initialClientIds,
}: EcommerceManageProps) {
  return (
    <div>
      <h1>Ecommerce Manage</h1>
    </div>
  );
}

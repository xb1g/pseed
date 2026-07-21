import { ParentUpdateTokenConfirmation } from "@/components/trials/ParentUpdateTokenConfirmation";

const bearerPattern = /^[0-9a-f]{64}$/;

export default async function UnsubscribeParentUpdatePage({
  params,
  searchParams,
}: {
  params: Promise<{ unsubscribeToken: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { unsubscribeToken } = await params;
  const { status } = await searchParams;
  const valid = bearerPattern.test(unsubscribeToken);
  return (
    <ParentUpdateTokenConfirmation
      kind="unsubscribe"
      action={
        valid
          ? `/api/trials/parent-updates/unsubscribe/${unsubscribeToken}`
          : null
      }
      status={valid ? status : "not-found"}
    />
  );
}

import { ParentUpdateTokenConfirmation } from "@/components/trials/ParentUpdateTokenConfirmation";

const bearerPattern = /^[0-9a-f]{64}$/;

export default async function VerifyParentUpdatePage({
  params,
  searchParams,
}: {
  params: Promise<{ verificationToken: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { verificationToken } = await params;
  const { status } = await searchParams;
  const valid = bearerPattern.test(verificationToken);
  return (
    <ParentUpdateTokenConfirmation
      kind="verify"
      action={
        valid
          ? `/api/trials/parent-updates/verify/${verificationToken}`
          : null
      }
      status={valid ? status : "not-found"}
    />
  );
}

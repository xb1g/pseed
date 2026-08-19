import { listCopilotTokensAction } from "./actions";
import { CopilotTokenList } from "./CopilotTokenList";
import { CopilotSetupGuide } from "./CopilotSetupGuide";

export const dynamic = "force-dynamic";

export default async function DmCopilotPage() {
  const tokens = await listCopilotTokensAction();
  const apiBase =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://www.passionseed.org";
  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold">DM Copilot · Tokens</h2>
        <p className="text-xs text-muted-foreground">
          สร้าง bearer token ให้ Chrome extension ที่อยู่ในเครื่องของทีม ไม่ต้องใช้ session cookie ของ admin
        </p>
      </header>
      <CopilotSetupGuide apiBase={apiBase} />
      <CopilotTokenList initialTokens={tokens} />
    </div>
  );
}

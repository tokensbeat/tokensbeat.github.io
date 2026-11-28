/**
 * One small picture per part of the platform, the same wherever the part is named: the head's Platform panel and menu
 * sheet (by page id). Lucide line icons, drawn in jade.
 */
import {
  Activity,
  ArrowLeftRight,
  Bot,
  Database,
  FolderLock,
  Hammer,
  LifeBuoy,
  MessagesSquare,
  Sparkles,
  SquareTerminal,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { PageId } from "@/content/site";

export const PAGE_ICONS: Readonly<Partial<Record<PageId, LucideIcon>>> = {
  database: Database,
  storage: FolderLock,
  models: Sparkles,
  agents: Bot,
  aha: MessagesSquare,
  workspace: SquareTerminal,
  supabase: ArrowLeftRight,
  help: LifeBuoy,
  status: Activity,
  build: Hammer,
  pricing: Wallet,
};

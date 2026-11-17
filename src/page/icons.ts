/**
 * One small picture per part of the platform, the same wherever the part is named: the homepage's cards (by the copy
 * deck's item ids) and the head's Platform panel and menu sheet (by page id). Lucide line icons, drawn in jade.
 */
import {
  Activity,
  ArrowLeftRight,
  BookOpen,
  Bot,
  Database,
  FolderLock,
  Hammer,
  HardDrive,
  LifeBuoy,
  MessagesSquare,
  Newspaper,
  Sigma,
  Sparkles,
  SquareCode,
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

/** The homepage deck's item ids that are not page ids. */
export const ITEM_ICONS: Readonly<Record<string, LucideIcon>> = {
  models: Sparkles,
  docs: BookOpen,
  people: LifeBuoy,
  latex: Sigma,
  news: Newspaper,
  code: SquareCode,
  "aha-storage": HardDrive,
};

/** The picture for a homepage deck item: its own, else its page's; undefined for one without. */
export function itemIcon(id: string): LucideIcon | undefined {
  return ITEM_ICONS[id] ?? PAGE_ICONS[id as PageId];
}

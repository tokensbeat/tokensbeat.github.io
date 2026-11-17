/**
 * The pages this site renders, by id (src/content/site.ts). Each is prerendered in English and Chinese
 * (src/entry-server.tsx); a page id without a component here is not built.
 */
import type { ComponentType } from "react";
import { SITE_PAGES, type PageId } from "@/content/site";
import { Agents } from "./Agents";
import { Aha } from "./Aha";
import { Build } from "./Build";
import { Database } from "./Database";
import { Help } from "./Help";
import { Home } from "./Home";
import { Models } from "./Models";
import { Pricing } from "./Pricing";
import { Start } from "./Start";
import { Status } from "./Status";
import { Storage } from "./Storage";
import { Supabase } from "./Supabase";
import { Workspace } from "./Workspace";

export const PAGE_COMPONENTS: Partial<Record<PageId, ComponentType>> = {
  home: Home,
  database: Database,
  storage: Storage,
  models: Models,
  agents: Agents,
  workspace: Workspace,
  aha: Aha,
  supabase: Supabase,
  pricing: Pricing,
  help: Help,
  build: Build,
  status: Status,
  start: Start,
};

/** The pages that are built, in the site's order. */
export const BUILT_PAGES: PageId[] = SITE_PAGES.map((p) => p.id).filter((id) => PAGE_COMPONENTS[id]);

import {
  Building2,
  CirclePlus,
  DoorOpen,
  FileText,
  Folder,
  House,
  Landmark,
  Layers,
  LayoutDashboard,
  ListChecks,
  type LucideIcon,
  Percent,
  Play,
  Receipt,
  Users,
  Wallet,
} from "lucide-react";

import type { AppModule, MenuIcon } from "@/lib/module-menu";

export const ITEM_ICONS: Record<MenuIcon, LucideIcon> = {
  building: Building2,
  door: DoorOpen,
  users: Users,
  layers: Layers,
  home: House,
  file: FileText,
  folder: Folder,
  percent: Percent,
  receipt: Receipt,
  wallet: Wallet,
  list: ListChecks,
  play: Play,
  landmark: Landmark,
  plus: CirclePlus,
};

export const MODULE_ICONS: Record<AppModule["icon"], LucideIcon> = {
  dashboard: LayoutDashboard,
  building: Building2,
  wallet: Wallet,
  receipt: Receipt,
  users: Users,
};

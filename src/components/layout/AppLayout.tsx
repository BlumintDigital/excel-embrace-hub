import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { CommandPalette } from "@/components/CommandPalette";
import { CommandPaletteProvider } from "@/contexts/CommandPaletteContext";

export function AppLayout() {
  return (
    <CommandPaletteProvider>
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-auto pt-14 lg:pt-0">
          <Outlet />
        </main>
      </div>
      <CommandPalette />
    </CommandPaletteProvider>
  );
}

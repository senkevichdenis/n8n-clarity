import { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from "@/components/ui/sidebar-custom";
import { Zap, FileText, Settings } from "lucide-react";
import { motion } from "framer-motion";

export type ActiveScreen = "explain" | "documentation" | "settings";

interface AppSidebarProps {
  activeScreen: ActiveScreen;
  onScreenChange: (screen: ActiveScreen) => void;
}

export function AppSidebar({ activeScreen, onScreenChange }: AppSidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="flex flex-col h-full">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Logo open={open} />
          <div className="mt-8 flex flex-col gap-2">
            <SidebarLink
              icon={<Zap className="h-5 w-5 flex-shrink-0" />}
              label="Explain My Automation"
              active={activeScreen === "explain"}
              onClick={() => onScreenChange("explain")}
            />
            <SidebarLink
              icon={<FileText className="h-5 w-5 flex-shrink-0" />}
              label="Documentation Builder"
              active={activeScreen === "documentation"}
              onClick={() => onScreenChange("documentation")}
            />
          </div>
        </div>
        <div className="mt-auto pt-4">
          <SidebarLink
            icon={<Settings className="h-5 w-5 flex-shrink-0" />}
            label="Settings"
            active={activeScreen === "settings"}
            onClick={() => onScreenChange("settings")}
          />
        </div>
      </SidebarBody>
    </Sidebar>
  );
}

function Logo({ open }: { open: boolean }) {
  const { animate } = useSidebar();

  return (
    <div className="font-normal flex items-center text-sm py-1 relative z-20 gap-3">
      <div className="h-9 w-9 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#FFB627' }}>
        <span className="text-xl font-bold text-white">D</span>
      </div>
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="font-semibold text-[hsl(var(--text-main))] whitespace-pre"
      >
        Den's Tools
      </motion.span>
    </div>
  );
}

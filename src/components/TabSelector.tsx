interface TabSelectorProps {
  activeTab: "explain" | "documentation";
  onTabChange: (tab: "explain" | "documentation") => void;
}

export function TabSelector({ activeTab, onTabChange }: TabSelectorProps) {
  return (
    <div className="flex justify-center items-center mb-8 sticky top-0 z-10 bg-[hsl(var(--bg-page))] py-4">
      <div className="inline-flex rounded-lg border border-[hsl(var(--border-subtle))] bg-[hsl(var(--bg-panel))] p-1">
        <button
          onClick={() => onTabChange("explain")}
          className={`px-8 py-3 rounded-md text-base font-medium transition-colors ${
            activeTab === "explain"
              ? "bg-[hsl(var(--bg-panel-alt))] text-[hsl(var(--text-main))] shadow-sm"
              : "text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))]"
          }`}
        >
          Explain My Automation
        </button>
        <button
          onClick={() => onTabChange("documentation")}
          className={`px-8 py-3 rounded-md text-base font-medium transition-colors ${
            activeTab === "documentation"
              ? "bg-[hsl(var(--bg-panel-alt))] text-[hsl(var(--text-main))] shadow-sm"
              : "text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))]"
          }`}
        >
          Documentation Builder
        </button>
      </div>
    </div>
  );
}

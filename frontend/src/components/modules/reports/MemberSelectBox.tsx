"use client";

import { useState, useMemo } from "react";
import { Users, CheckSquare, Square, Search } from "lucide-react";
import { useMembersList } from "@/hooks/useReportJobs";
import { cn } from "@/utils/utils";

interface MemberSelectBoxProps {
  selectedMemberIds: string[];
  onChange: (selectedIds: string[]) => void;
  className?: string;
}

export function MemberSelectBox({
  selectedMemberIds,
  onChange,
  className,
}: MemberSelectBoxProps) {
  const { data: membersList = [], isLoading } = useMembersList(true);
  const [searchText, setSearchText] = useState("");

  // Filter members list based on search query
  const filteredMembers = useMemo(() => {
    if (!searchText.trim()) return membersList;
    const q = searchText.toLowerCase();
    return membersList.filter(
      (m) =>
        m.memberId.toLowerCase().includes(q) ||
        m.memberCode.toLowerCase().includes(q) ||
        m.memberName.toLowerCase().includes(q)
    );
  }, [membersList, searchText]);

  const handleToggleMember = (memberId: string) => {
    if (selectedMemberIds.includes(memberId)) {
      onChange(selectedMemberIds.filter((id) => id !== memberId));
    } else {
      onChange([...selectedMemberIds, memberId]);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedMemberIds.length === membersList.length) {
      onChange([]);
    } else {
      onChange(membersList.map((m) => m.memberId));
    }
  };

  return (
    <div className={cn("space-y-3 rounded-2xl border bg-muted/20 p-5", className)}>
      {/* Title + Count Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Select Members for Batch Report Generation
          </label>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
          {selectedMemberIds.length} of {membersList.length} Selected
        </span>
      </div>

      {/* Search & Select All controls */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search member ID, code, or name..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
        <button
          type="button"
          onClick={handleToggleSelectAll}
          disabled={isLoading || membersList.length === 0}
          className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-2 text-xs font-medium transition-colors shrink-0 disabled:opacity-50"
        >
          {selectedMemberIds.length === membersList.length && membersList.length > 0 ? (
            <>
              <Square className="w-3.5 h-3.5" /> Deselect All
            </>
          ) : (
            <>
              <CheckSquare className="w-3.5 h-3.5" /> Select All ({membersList.length})
            </>
          )}
        </button>
      </div>

      {/* Member Checkboxes Scroll Area */}
      <div className="max-h-52 overflow-y-auto rounded-xl border border-border/80 bg-background p-2 space-y-1">
        {isLoading ? (
          <div className="space-y-2 p-2 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-6 rounded-md bg-muted/60" />
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            No members found matching &ldquo;{searchText}&rdquo;
          </p>
        ) : (
          filteredMembers.map((m) => {
            const isChecked = selectedMemberIds.includes(m.memberId);
            return (
              <label
                key={m.memberId}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-xs transition-colors cursor-pointer select-none",
                  isChecked
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-accent/50 text-foreground"
                )}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggleMember(m.memberId)}
                  className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                />
                <span className="font-semibold shrink-0">[{m.memberId}]</span>
                <span className="truncate flex-1">{m.memberName}</span>
                {m.memberCode && m.memberCode !== m.memberId && (
                  <span className="text-muted-foreground text-[10px] shrink-0">
                    ({m.memberCode})
                  </span>
                )}
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}

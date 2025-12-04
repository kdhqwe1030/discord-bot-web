// components/group/GroupInviteButton.tsx
"use client";

import { useState } from "react";
import { PiShareFat } from "react-icons/pi"; // 아이콘은 취향껏
import GroupInviteModal from "./GroupInviteModal";

interface GroupInviteButtonProps {
  groupId: string;
  groupName?: string;
}

const GroupInviteButton = ({ groupId, groupName }: GroupInviteButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-full bg-surface-3  px-3 py-1.5 text-[11px] font-medium text-gray-200 hover:bg-surface-3 /80 transition"
      >
        <PiShareFat className="w-3 h-3" />
        <span>초대 링크</span>
      </button>

      <GroupInviteModal
        isOpen={open}
        onClose={() => setOpen(false)}
        groupId={groupId}
        groupName={groupName}
      />
    </>
  );
};

export default GroupInviteButton;

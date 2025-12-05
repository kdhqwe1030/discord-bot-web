"use client";

import Modal from "@/components/Modal";
import { userAPI } from "@/lib/api/user";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { SiRiotgames } from "react-icons/si";
import RiotLinkModal from "../modals/RiotLinkModal";

const RiotLinkButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-md bg-riot px-2 py-1 text-sm font-medium text-white hover:bg-riot-dark transition-colors"
      >
        <SiRiotgames className="w-4 h-4" />
        <span>Riot 계정 연결</span>
      </button>

      <RiotLinkModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default RiotLinkButton;

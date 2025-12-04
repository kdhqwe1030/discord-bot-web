"use client";
import { IoIosAdd } from "react-icons/io";
import AddGroupModal from "./AddGroupModal";
import { useState } from "react";

const AddGroupCard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <>
      <div
        className="w-full rounded-2xl p-6 shadow-lg shadow-black/40 h-64 border-sub2 border-2 border-dotted flex flex-col items-center justify-center cursor-pointer hover:bg-surface-3 /50 transition-colors"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="bg-surface-1  w-12 h-12 flex items-center justify-center rounded-full mb-6">
          <IoIosAdd className="text-text-1  text-4xl" />
        </div>

        <div className="flex flex-col gap-1 items-center">
          <div className="text-text-1 ">새로운 그룹을 만들어보세요</div>
          <div className="text-gray-300 text-sm text-center">
            기존 디스코드 채널과 연동할 수 있습니다.
          </div>
        </div>
      </div>
      <AddGroupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default AddGroupCard;

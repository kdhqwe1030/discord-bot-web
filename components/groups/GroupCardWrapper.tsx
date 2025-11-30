import React from "react";
import AddGroupCard from "./AddGroupCard";
import GroupCard from "./GroupCard";

const GroupCardWrapper = () => {
  return (
    <section className="mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12 justify-items-center">
      <GroupCard />
      <GroupCard />
      <GroupCard />
      <GroupCard />
      <AddGroupCard />
    </section>
  );
};

export default GroupCardWrapper;

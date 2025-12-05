import Header from "@/components/Header";

export default function GroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-scree">
      <Header />
      <main className="pt-4 px-4">{children}</main>
    </div>
  );
}

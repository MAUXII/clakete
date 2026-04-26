

export default function ListsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="py-8 mt-20 px-4 w-full max-w-[1280px]">
     
      <main className="w-full">
        {children}
      </main>
    </div>
  )
} 


export default function ListsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="py-8 mt-20 w-full max-w-6xl">
     
      <main className="w-full">
        {children}
      </main>
    </div>
  )
} 
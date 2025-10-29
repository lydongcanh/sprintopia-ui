function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-primary">Sprintopia</h1>
          <p className="text-muted-foreground mt-2">
            A joyful home for agile discussions and estimation
          </p>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Welcome to Sprintopia</h2>
          <p className="text-muted-foreground">
            Your planning poker and agile estimation tool is being built...
          </p>
        </div>
      </main>
    </div>
  )
}

export default App

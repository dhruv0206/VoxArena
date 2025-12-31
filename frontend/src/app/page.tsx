import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";

// Icon components using SVG
function MicrophoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
    </svg>
  );
}

function BrainIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

function SpeakerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
    </svg>
  );
}

function CodeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
  );
}

function ZapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <MicrophoneIcon className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">VoxArena</span>
            {/* <Badge variant="secondary" className="ml-2">Open Source</Badge> */}
          </div>
          <nav className="flex items-center gap-4">
            <ThemeToggle />
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="ghost">Sign In</Button>
              </SignInButton>
              <SignInButton mode="modal">
                <Button>Get Started</Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <div suppressHydrationWarning>
                <UserButton />
              </div>
            </SignedIn>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-24 text-center">
          <Badge variant="outline" className="mb-6">
            🎤 Voice AI Platform
          </Badge>
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Where Voice Agents
            <span className="block bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              Collaborate
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            An open source platform for voice agents to interact. Speech-to-text meets LLM intelligence meets text-to-speech — seamlessly orchestrated.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <SignedOut>
              <SignInButton mode="modal">
                <Button size="lg" className="gap-2">
                  Get Started Free
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button size="lg" className="gap-2">
                  Go to Dashboard
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
              </Link>
            </SignedIn>
            {/* <Button variant="outline" size="lg" className="gap-2" asChild>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                <GithubIcon className="h-4 w-4" />
                View on GitHub
              </a>
            </Button> */}
          </div>
        </section>

        <Separator />

        {/* How It Works Section */}
        <section className="container mx-auto px-4 py-24">
          <div className="mb-16 text-center">
            <Badge variant="outline" className="mb-4">How It Works</Badge>
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              Three Agents, One Seamless Flow
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Voice agents work together in a pipeline: converting speech to text, processing with AI, and generating natural speech output.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* STT Agent */}
            <Card className="relative overflow-hidden border-2 transition-colors hover:border-primary/50">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10" />
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <MicrophoneIcon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
                  Speech to Text
                </CardTitle>
                <CardDescription>STT Agent</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Captures audio input and converts spoken words into accurate text using advanced speech recognition models.
                </p>
              </CardContent>
            </Card>

            {/* LLM Agent */}
            <Card className="relative overflow-hidden border-2 transition-colors hover:border-primary/50">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10" />
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <BrainIcon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
                  LLM Processing
                </CardTitle>
                <CardDescription>AI Agent</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Processes the transcribed text through large language models to generate intelligent, contextual responses.
                </p>
              </CardContent>
            </Card>

            {/* TTS Agent */}
            <Card className="relative overflow-hidden border-2 transition-colors hover:border-primary/50">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10" />
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <SpeakerIcon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">3</span>
                  Text to Speech
                </CardTitle>
                <CardDescription>TTS Agent</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Transforms the AI-generated text response into natural, human-like speech output.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Flow Visualization */}
          <div className="mt-16 flex items-center justify-center">
            <div className="flex items-center gap-4 rounded-full border bg-muted/50 px-8 py-4">
              <div className="flex items-center gap-2">
                <MicrophoneIcon className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Voice</span>
              </div>
              <ArrowRightIcon className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Text</span>
              </div>
              <ArrowRightIcon className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-2">
                <BrainIcon className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">LLM</span>
              </div>
              <ArrowRightIcon className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Text</span>
              </div>
              <ArrowRightIcon className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-2">
                <SpeakerIcon className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Voice</span>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* Features Section */}
        <section className="container mx-auto px-4 py-24">
          <div className="mb-16 text-center">
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              Built for Developers & Researchers
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Everything you need to build, test, and deploy voice AI applications.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <CodeIcon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Open Source</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Fully open source under MIT license. Contribute, customize, and own your deployment.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <ZapIcon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Real-time</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Low-latency voice processing for natural, responsive conversations.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <BrainIcon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Model Agnostic</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Plug in any STT, LLM, or TTS model. Compare and evaluate different combinations.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <UsersIcon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Community Driven</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Share agents, benchmark results, and collaborate with the voice AI community.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-24">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="flex flex-col items-center py-16 text-center">
              <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
                Ready to Build the Future of Voice AI?
              </h2>
              <p className="mb-8 max-w-2xl text-primary-foreground/80">
                Join the open source community and start building voice agents that interact, compete, and collaborate.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <SignedOut>
                  <SignInButton mode="modal">
                    <Button size="lg" variant="secondary" className="gap-2">
                      Get Started Free
                      <ArrowRightIcon className="h-4 w-4" />
                    </Button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <Link href="/dashboard">
                    <Button size="lg" variant="secondary" className="gap-2">
                      Go to Dashboard
                      <ArrowRightIcon className="h-4 w-4" />
                    </Button>
                  </Link>
                </SignedIn>
                <Button size="lg" variant="outline" className="gap-2 border-black text-black hover:bg-black hover:text-white dark:border-white dark:text-black dark:hover:bg-white dark:bg-white dark:hover:text-black" asChild>
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                    <GithubIcon className="h-4 w-4" />
                    Star on GitHub
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
              <MicrophoneIcon className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="font-semibold">VoxArena</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Open source voice AI platform. Built with ❤️ for the community.
          </p>
          <div className="flex items-center gap-4">
            <a href="https://github.com" className="text-muted-foreground hover:text-foreground" target="_blank" rel="noopener noreferrer">
              <GithubIcon className="h-5 w-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

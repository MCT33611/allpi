import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="bg-background text-primary min-h-screen w-full overflow-hidden flex flex-col">
      <div className="absolute top-0 left-0 w-full p-4 z-50 bg-gradient-to-b from-background/80 to-transparent">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">ALLPI</h1>
          <div className="flex items-center gap-2">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="w-10 h-10 rounded-full" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1 overflow-hidden">
          <div className="w-full h-full bg-accent/20">
            <div className="h-full bg-accent animate-youtube-loader"></div>
          </div>
        </div>
      </div>
      <div className="flex-1 pt-24 pb-8 w-full h-full flex flex-col items-center gap-16 overflow-y-auto px-4">
        <Skeleton className="w-full max-w-5xl h-auto aspect-[4/3] rounded-lg" />
        <Skeleton className="w-full max-w-5xl h-auto aspect-[4/3] rounded-lg" />
        <Skeleton className="w-full max-w-5xl h-auto aspect-[4/3] rounded-lg" />
      </div>
    </main>
  );
}

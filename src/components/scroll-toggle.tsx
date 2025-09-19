"use client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

type ScrollDirection = "vertical" | "horizontal";

const VerticalIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-6 h-6"
  >
    <path
      d="M12 21V3M12 21L17 16M12 21L7 16M12 3L17 8M12 3L7 8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const HorizontalIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-6 h-6"
  >
    <path
      d="M3 12H21M3 12L8 7M3 12L8 17M21 12L16 7M21 12L16 17"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function ScrollToggle({
  scrollDirection,
  setScrollDirection,
  disableHorizontal = false,
}: {
  scrollDirection: ScrollDirection;
  setScrollDirection: (dir: ScrollDirection) => void;
  disableHorizontal?: boolean;
}) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 p-1 rounded-full border border-accent/50 bg-background/50 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setScrollDirection("vertical")}
          className={cn(
            "rounded-full h-8 w-8 transition-colors",
            scrollDirection === "vertical"
              ? "bg-accent text-background"
              : "hover:bg-accent/20"
          )}
          aria-label="Set vertical scroll"
        >
          <VerticalIcon />
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "rounded-full",
                disableHorizontal && "cursor-not-allowed"
              )}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (!disableHorizontal) {
                    setScrollDirection("horizontal");
                  }
                }}
                className={cn(
                  "rounded-full h-8 w-8 transition-colors",
                  scrollDirection === "horizontal"
                    ? "bg-accent text-background"
                    : "hover:bg-accent/20",
                  disableHorizontal &&
                    "opacity-50 pointer-events-none"
                )}
                aria-label="Set horizontal scroll"
                disabled={disableHorizontal}
              >
                <HorizontalIcon />
              </Button>
            </div>
          </TooltipTrigger>
          {disableHorizontal && (
            <TooltipContent>
              <p>Horizontal view not available for this content.</p>
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

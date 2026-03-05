import { cn } from "@/lib/utils"

interface ProgressBarProps {
  value: number
  max?: number
  className?: string
  showLabel?: boolean
  size?: "sm" | "md" | "lg"
}

const sizeClasses = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
}

export function ProgressBar({ 
  value, 
  max = 100, 
  className, 
  showLabel = false,
  size = "md" 
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  
  return (
    <div className="w-full space-y-1">
      {showLabel && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={cn("w-full bg-secondary rounded-full overflow-hidden", sizeClasses[size], className)}>
        <div
          className="h-full bg-primary transition-all duration-300 ease-in-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export function UploadProgress({ 
  fileName, 
  progress 
}: { 
  fileName: string
  progress: number 
}) {
  return (
    <div className="space-y-2 p-3 border rounded-lg bg-muted/50">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium truncate">{fileName}</span>
        <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
      </div>
      <ProgressBar value={progress} size="sm" />
    </div>
  )
}

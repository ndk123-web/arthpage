import * as React from "react"
import { cn } from "@/lib/utils"
// import { ChevronDown } from "lucide-react"

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          className={cn(
            "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 appearance-none",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        {/* Custom arrow could go here if we want to hide the native one, 
            but keeping it simple with appearance-none (added above) and a manual arrow or just native behavior if appearance-none causes issues. 
            Actually, let's keep native arrow for simplicity as we aren't injecting icons yet.
            Removing appearance-none to let browser rendering handle the arrow for now unless we add an icon.
         */}
      </div>
    )
  }
)
Select.displayName = "Select"

export { Select }
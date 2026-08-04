import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 transition-[color,box-shadow,background-color] outline-none placeholder:text-gray-400 placeholder:font-normal focus-visible:border-[#3B82F6] focus-visible:ring-3 focus-visible:ring-[#3B82F6]/20 focus-visible:bg-white disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className
      )}
      {...props}
    />
  )
}

export { Input }

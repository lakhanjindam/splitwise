import * as React from "react";
import { cn } from "@/lib/utils";

interface DialogProps {
  // Define your dialog props here
  children: React.ReactNode // add this to define children
  className?: string;
  
}


const Dialog: React.FC<DialogProps> = ({ children, ...props }) => (
  <div className={cn("dialog-class", props.className)} {...props}>
    {children}
  </div>
);

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

const DialogContent: React.FC<DialogContentProps> = ({ children, className }) => (
  <div className={cn("dialog-content-class", className)}>
    {children}
  </div>
);

export { Dialog, DialogContent };

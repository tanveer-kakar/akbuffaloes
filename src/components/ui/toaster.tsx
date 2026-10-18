import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";
import { voiceAnnouncer } from "@/lib/voiceAnnouncer";
import { Volume2 } from "lucide-react";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1 flex-1 pr-4">
              <div className="flex items-center gap-2">
                {title && <ToastTitle>{title}</ToastTitle>}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const titleStr = typeof title === "string" ? title : "";
                    const descStr = typeof description === "string" ? description : "";
                    voiceAnnouncer.speak(titleStr, descStr);
                  }}
                  className="p-1 rounded-md text-gold/75 hover:text-gold hover:bg-gold/15 transition-colors shrink-0"
                  title="Speak aloud"
                  aria-label="Listen to notification"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}

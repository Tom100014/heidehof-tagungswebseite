
import { Toaster as SonnerToaster } from "sonner";

type ToasterProps = React.ComponentProps<typeof SonnerToaster>;

// Update the Toaster component to actually render the Sonner toaster
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <SonnerToaster
      theme="dark"
      className="toaster-group"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-black/90 group-[.toaster]:backdrop-blur-md group-[.toaster]:border-gold/30 group-[.toaster]:shadow-elegant",
          description: "group-[.toast]:text-gold/80",
          actionButton: "group-[.toast]:bg-gold group-[.toast]:text-black group-[.toast]:hover:bg-gold-dark",
          cancelButton: "group-[.toast]:bg-transparent group-[.toast]:text-gold group-[.toast]:border group-[.toast]:border-gold/30 group-[.toast]:hover:bg-gold/10",
          error: "group-[.toast]:bg-black/90 group-[.toast]:text-white group-[.toast]:border-red-800",
          success: "group-[.toast]:bg-black/90 group-[.toast]:text-white group-[.toast]:border-zinc-800",
          warning: "group-[.toast]:bg-black/90 group-[.toast]:text-white group-[.toast]:border-amber-700",
          info: "group-[.toast]:bg-black/90 group-[.toast]:text-white group-[.toast]:border-blue-800",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };

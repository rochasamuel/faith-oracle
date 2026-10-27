import logoIgreja from "@/assets/logo-igreja.png"
import { cn } from "@/lib/utils"

/** Selo da igreja, usado como está (sem recorte nem filtro). */
export function ChurchSeal({ className }: { className?: string }) {
  return (
    <img
      src={logoIgreja}
      alt=""
      aria-hidden
      className={cn("shrink-0 rounded-full object-contain", className)}
    />
  )
}

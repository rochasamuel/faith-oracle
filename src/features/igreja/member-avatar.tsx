import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { getMemberPhotoUrl } from "@/api/members"

/** Iniciais do nome (primeiro + último) para o fallback do avatar. */
function memberInitials(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ""
  return (first + last).toUpperCase()
}

interface MemberAvatarProps {
  nome: string
  /** Caminho da foto no bucket (foto_path) ou null quando não há foto. */
  fotoPath?: string | null
  /** URL já resolvida (ex.: preview local); tem precedência sobre fotoPath. */
  src?: string | null
  size?: "default" | "sm" | "lg"
  className?: string
}

/** Avatar do membro: foto quando houver, senão as iniciais do nome. */
export function MemberAvatar({
  nome,
  fotoPath,
  src,
  size,
  className,
}: MemberAvatarProps) {
  const url = src ?? (fotoPath ? getMemberPhotoUrl(fotoPath) : null)
  return (
    <Avatar size={size} className={className}>
      {url && <AvatarImage src={url} alt={nome} />}
      <AvatarFallback>{memberInitials(nome)}</AvatarFallback>
    </Avatar>
  )
}

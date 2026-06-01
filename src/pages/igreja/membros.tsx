import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function MembrosPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="font-heading text-lg font-medium">Membros</h1>
        <p className="text-xs text-muted-foreground">
          Cadastro de membros da igreja.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Em breve</CardTitle>
          <CardDescription>
            A gestão de membros ainda será implementada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Esta seção está reservada para o cadastro e a listagem de membros.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

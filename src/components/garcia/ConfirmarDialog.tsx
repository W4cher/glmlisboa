import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  /** Controlado: passar `true` para abrir. */
  aberto: boolean;
  titulo: string;
  descricao: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  /** Pinta o botão de confirmação a vermelho. Usar quando se apaga algo. */
  destrutivo?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

/**
 * Diálogo de confirmação da app, em vez do `confirm()` do navegador — que não
 * segue o tema, não se traduz e é bloqueado em alguns contextos.
 */
export default function ConfirmarDialog({
  aberto, titulo, descricao,
  textoConfirmar = "Confirmar", textoCancelar = "Cancelar",
  destrutivo = false, onConfirmar, onCancelar,
}: Props) {
  return (
    <AlertDialog open={aberto} onOpenChange={o => { if (!o) onCancelar(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{descricao}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancelar}>{textoCancelar}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmar}
            style={destrutivo ? { background: "hsl(var(--destructive))" } : undefined}
          >
            {textoConfirmar}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

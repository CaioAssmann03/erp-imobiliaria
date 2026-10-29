"use client";

import { useState } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConfirmDeleteButtonProps {
  title: string;
  description: string;
  onConfirm: () => void;
  /** Texto do botão (padrão: "Excluir"). */
  label?: string;
  /** Como o botão que abre a confirmação se mostra: o padrão é o discreto das linhas de tabela; na barra de ações do formulário é `solid`. */
  appearance?: "quiet" | "solid";
}

export function ConfirmDeleteButton({
  title,
  description,
  onConfirm,
  label = "Excluir",
  appearance = "quiet",
}: ConfirmDeleteButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant={appearance === "solid" ? "secondary" : "ghost"}
        size={appearance === "solid" ? "default" : "sm"}
        className={cn(appearance === "solid" ? "text-danger" : "text-ink-soft hover:text-danger")}
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => {
                setOpen(false);
                onConfirm();
              }}
            >
              {label}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

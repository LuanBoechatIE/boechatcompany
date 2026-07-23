"use client";

// Seletor de responsável alimentado pelos usuários reais do site (não mais o
// array fixo RESPONSAVEIS). `submitAs="id"` envia usuarios.id (ownership real,
// leads.usuario_id); `submitAs="nome"` envia o nome de exibição (campos de
// texto secundários que ainda não têm coluna relacional própria).
import { useEffect, useState } from "react";
import { listUsuariosAtivos, type UsuarioBasico } from "../../crm-actions";

export function ResponsavelSelect({
  name,
  defaultValue,
  submitAs = "id",
  className,
}: {
  name: string;
  defaultValue?: string | number | null;
  submitAs?: "id" | "nome";
  className: string;
}) {
  const [usuarios, setUsuarios] = useState<UsuarioBasico[]>([]);
  // Controlado (não defaultValue): a lista de usuários chega assíncrona, e um
  // select não-controlado não re-seleciona a opção certa quando ela aparece
  // depois do valor inicial já ter "assentado" no DOM.
  const [valor, setValor] = useState(defaultValue != null ? String(defaultValue) : "");

  useEffect(() => {
    listUsuariosAtivos()
      .then(setUsuarios)
      .catch(() => setUsuarios([]));
  }, []);

  return (
    <select name={name} value={valor} onChange={(e) => setValor(e.target.value)} className={className}>
      <option value="">—</option>
      {usuarios.map((u) => (
        <option key={u.id} value={submitAs === "id" ? u.id : u.nome}>
          {u.nome}
        </option>
      ))}
    </select>
  );
}

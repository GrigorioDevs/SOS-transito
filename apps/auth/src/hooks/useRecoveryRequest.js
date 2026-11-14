import { useEffect, useRef, useState } from "react";

export default function useRecoveryRequest() {
  const [acaoPendente, setAcaoPendente] = useState("");
  const requisicao = useRef(null);

  // Ao sair da página, uma resposta pendente não deve mudar a tela.
  useEffect(() => () => requisicao.current?.abort(), []);

  async function executar(acao, tarefa, tratarErro) {
    if (requisicao.current) return;

    const controller = new AbortController();
    requisicao.current = controller;
    setAcaoPendente(acao);

    try {
      await tarefa(controller.signal);
    } catch (erro) {
      if (!controller.signal.aborted) tratarErro(erro.message);
    } finally {
      requisicao.current = null;
      if (!controller.signal.aborted) setAcaoPendente("");
    }
  }

  return { acaoPendente, executar };
}

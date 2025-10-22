import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Agendamentos() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [dataSelecionada, setDataSelecionada] = useState("");
  const [horaSelecionada, setHoraSelecionada] = useState("");
  const [servicoSelecionado, setServicoSelecionado] = useState("");
  const [carregando, setCarregando] = useState(true);

  // 🔹 Carrega agendamentos existentes
  useEffect(() => {
    async function carregarAgendamentos() {
      const { data, error } = await supabase.from("booking").select("*").order("data", { ascending: true });
      if (!error) setAgendamentos(data || []);
      setCarregando(false);
    }
    carregarAgendamentos();
  }, []);

  // 🔹 Carrega lista de serviços disponíveis
  useEffect(() => {
    async function carregarServicos() {
      const { data, error } = await supabase.from("servicos").select("*").order("nome", { ascending: true });
      if (!error) setServicos(data || []);
    }
    carregarServicos();
  }, []);

  // 🔹 Cria novo agendamento
  async function criarAgendamento() {
    if (!dataSelecionada || !horaSelecionada || !servicoSelecionado) {
      alert("Preencha todos os campos antes de agendar!");
      return;
    }

    const { error } = await supabase.from("agendamentos").insert([
      {
        nome: servicoSelecionado,
        data: `${dataSelecionada} ${horaSelecionada}`,
        status: "confirmed",
      },
    ]);

    if (error) {
      alert("Erro ao criar agendamento.");
      console.log(error);
    } else {
      alert("Agendamento criado com sucesso!");
      window.location.reload();
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col items-center py-10">
      <h1 className="text-3xl font-bold mb-6">Agendamentos Existentes</h1>

      {carregando ? (
        <p>Carregando...</p>
      ) : (
        <div className="w-full max-w-3xl space-y-4">
          {agendamentos.map((item) => (
            <Card key={item.id} className="bg-[#1c1f26] border-none">
              <CardContent className="flex justify-between items-center p-4">
                <div>
                  <h2 className="text-lg font-semibold">{item.nome}</h2>
                  <p className="text-sm text-gray-400">
                    {format(new Date(item.data), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    item.status === "confirmed"
                      ? "bg-green-600"
                      : item.status === "cancelled"
                      ? "bg-red-700"
                      : "bg-gray-600"
                  }`}
                >
                  {item.status}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 🔹 Calendário de novo agendamento */}
      <div className="mt-10 w-full max-w-lg bg-[#1c1f26] rounded-2xl p-6 shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">Agendar Novo Serviço</h2>

        <div className="flex flex-col gap-3">
          <label className="text-sm text-gray-300">Escolha o Serviço</label>
          <select
            className="bg-[#2a2f3a] p-2 rounded text-white"
            value={servicoSelecionado}
            onChange={(e) => setServicoSelecionado(e.target.value)}
          >
            <option value="">Selecione...</option>
            {servicos.map((s) => (
              <option key={s.id} value={s.nome}>
                {s.nome}
              </option>
            ))}
          </select>

          <label className="text-sm text-gray-300">Escolha a Data</label>
          <input
            type="date"
            className="bg-[#2a2f3a] p-2 rounded text-white"
            value={dataSelecionada}
            onChange={(e) => setDataSelecionada(e.target.value)}
          />

          <label className="text-sm text-gray-300">Escolha o Horário</label>
          <input
            type="time"
            className="bg-[#2a2f3a] p-2 rounded text-white"
            value={horaSelecionada}
            onChange={(e) => setHoraSelecionada(e.target.value)}
          />

          <Button onClick={criarAgendamento} className="mt-4 bg-blue-600 hover:bg-blue-700">
            Confirmar Agendamento
          </Button>
        </div>
      </div>
    </div>
  );
}

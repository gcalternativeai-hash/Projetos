// src/utils/storeStatus.ts

import { OperatingDay, TimePeriod } from '../lib/supabase';

// Mapeamento de números de dia da semana para nomes (0=Domingo, 6=Sábado)
const dayNames: { [key: number]: OperatingDay['day'] } = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

// Função para converter string de hora (HH:MM) para minutos desde a meia-noite
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Função para converter minutos desde a meia-noite para string de hora (HH:MM)
const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

/**
 * Verifica se a loja está aberta no momento.
 * @param operatingHours Array de OperatingDay com os horários de funcionamento.
 * @param now Opcional: Objeto Date para o momento atual (útil para testes).
 * @returns true se a loja estiver aberta, false caso contrário.
 */
export const isStoreOpen = (operatingHours: OperatingDay[], now: Date = new Date()): boolean => {
  const currentDay = dayNames[now.getDay()];
  const currentTimeInMinutes = timeToMinutes(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);

  const todaySchedule = operatingHours.find(schedule => schedule.day === currentDay);

  if (!todaySchedule || !todaySchedule.open) {
    return false; // Loja fechada hoje
  }

  for (const period of todaySchedule.periods) {
    const fromMinutes = timeToMinutes(period.from);
    const toMinutes = timeToMinutes(period.to);

    // Lida com horários que cruzam a meia-noite (ex: 22:00 - 02:00)
    if (fromMinutes <= toMinutes) {
      if (currentTimeInMinutes >= fromMinutes && currentTimeInMinutes < toMinutes) {
        return true; // Aberta dentro do período normal
      }
    } else { // Período cruza a meia-noite
      if (currentTimeInMinutes >= fromMinutes || currentTimeInMinutes < toMinutes) {
        return true; // Aberta antes da meia-noite ou depois da meia-noite
      }
    }
  }

  return false; // Não está em nenhum período de funcionamento
};

/**
 * Retorna o próximo horário de abertura da loja.
 * @param operatingHours Array de OperatingDay com os horários de funcionamento.
 * @param now Opcional: Objeto Date para o momento atual (útil para testes).
 * @returns Uma string formatada com o próximo dia e horário de abertura, ou null se não houver.
 */
export const getNextOpeningTime = (operatingHours: OperatingDay[], now: Date = new Date()): string | null => {
  const currentDayIndex = now.getDay(); // 0 = Sunday, 6 = Saturday
  const currentTimeInMinutes = timeToMinutes(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
  const todaySchedule = operatingHours.find(schedule => schedule.day === dayNames[currentDayIndex]);

  // Primeiro, verifica se a loja está atualmente aberta. Se sim, não há "próximo horário de abertura".
  if (isStoreOpen(operatingHours, now)) {
    return null; // A loja já está aberta
  }

  // Verifica os horários de abertura para o dia atual
  if (todaySchedule && todaySchedule.open) {
    for (const period of todaySchedule.periods) {
      const fromMinutes = timeToMinutes(period.from);
      const toMinutes = timeToMinutes(period.to);

      // Caso 1: Período não cruza a meia-noite (ex: 09:00 - 18:00)
      if (fromMinutes <= toMinutes) {
        // Se o horário atual é antes do início do período, este é o próximo horário de abertura hoje.
        if (currentTimeInMinutes < fromMinutes) {
          return `Hoje às ${period.from}`;
        }
      }
      // Caso 2: Período cruza a meia-noite (ex: 22:00 - 02:00)
      else {
        // Se o horário atual é antes do "to" (ex: 01:00 para 22:00-02:00),
        // significa que o período começou no dia anterior e ainda está ativo ou prestes a terminar hoje.
        // Se o horário atual é antes do "from" (ex: 17:00 para 22:00-02:00),
        // significa que é um futuro horário de abertura hoje.
        if (currentTimeInMinutes < toMinutes || currentTimeInMinutes < fromMinutes) {
            return `Hoje às ${period.from}`;
        }
      }
    }
  }

  // Se não encontrou nenhum horário de abertura para o dia atual, verifica os próximos 7 dias
  for (let i = 1; i <= 7; i++) {
    const nextDayDate = new Date(now);
    nextDayDate.setDate(now.getDate() + i); // Avança para o próximo dia
    const nextDayIndex = nextDayDate.getDay(); // Obtém o índice do dia da semana
    const nextDayName = dayNames[nextDayIndex]; // Obtém o nome do dia da semana
    const nextDaySchedule = operatingHours.find(schedule => schedule.day === nextDayName);

    if (nextDaySchedule && nextDaySchedule.open && nextDaySchedule.periods.length > 0) {
      const firstOpeningTime = nextDaySchedule.periods[0].from;
      const dayLabel = i === 1 ? 'Amanhã' : nextDayName.charAt(0).toUpperCase() + nextDayName.slice(1); // Capitaliza o nome do dia
      return `${dayLabel} às ${firstOpeningTime}`;
    }
  }

  return null; // Não encontrou nenhum horário de abertura nos próximos 7 dias
};

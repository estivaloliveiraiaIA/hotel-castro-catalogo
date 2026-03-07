/**
 * seed-hotel-knowledge.js
 *
 * Popula a tabela hotel_knowledge no Supabase com chunks do RAG do Concierge.
 * Uso: node scripts/seed-hotel-knowledge.js
 *
 * Env vars necessárias:
 *   VITE_SUPABASE_URL ou SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CHUNKS = [
  {
    topic: "identificacao",
    keywords: ["hotel", "nome", "estrelas", "tradicional", "historia", "anos", "certificacao"],
    content: `O Castro's Park Hotel é o hotel mais tradicional de Goiânia, com mais de 30 anos de tradição e certificação 5 estrelas. É referência em hospitalidade, gastronomia e infraestrutura na capital goiana. Endereço: Av. República do Líbano, 1520, Setor Oeste, CEP 74115-030, Goiânia, GO, Brasil.`,
  },
  {
    topic: "contato",
    keywords: ["telefone", "contato", "ligar", "email", "reserva", "site", "0800"],
    content: `Contatos do Castro's Park Hotel: Telefone principal: (62) 3096-2000. Telefone gratuito: 0800 606 2000. E-mail de reservas: reservas@castrospark.com.br. Site: www.castrospark.com.br. Para reservas de hospedagem, eventos ou informações gerais, entre em contato com a recepção.`,
  },
  {
    topic: "localizacao",
    keywords: ["localizacao", "onde", "fica", "bairro", "aeroporto", "centro", "distancia", "acesso"],
    content: `O Castro's Park Hotel está localizado no Setor Oeste, bairro nobre de Goiânia. Distâncias: aeroporto ~15 minutos de carro, centro da cidade ~5 minutos, Centro de Convenções ~5 minutos, rodoviária ~2,4 km. É uma das localizações mais privilegiadas da cidade.`,
  },
  {
    topic: "checkin_checkout",
    keywords: ["check-in", "checkin", "checkout", "check-out", "horario", "entrada", "saida", "chegar", "sair"],
    content: `Horários do Castro's Park Hotel: Check-in a partir das 14h00. Check-out até as 12h00. Para early check-in ou late check-out, sujeito à disponibilidade — consultar a recepção pelo (62) 3096-2000. Documentos necessários: documento com foto e cartão de crédito para caução.`,
  },
  {
    topic: "acomodacoes",
    keywords: ["quarto", "suite", "acomodacao", "apartamento", "cama", "ar condicionado", "tv", "frigoribar", "cofre", "categoria"],
    content: `O Castro's Park Hotel possui 171 apartamentos e suítes distribuídos em 12 categorias. Todos os quartos contam com ar-condicionado, TV a cabo, frigobar, cofre, Wi-Fi gratuito, banheiro privativo com amenidades e secador de cabelo. O room service funciona 24 horas. Para consultar disponibilidade e tarifas, fale com a recepção.`,
  },
  {
    topic: "wifi",
    keywords: ["wifi", "wi-fi", "internet", "conexao", "senha", "rede", "conectar"],
    content: `O Castro's Park Hotel oferece Wi-Fi gratuito em todos os quartos e áreas comuns do hotel. Também há internet cabeada nos quartos e um Business Center com computadores e impressora disponível para hóspedes. Para informações sobre acesso à rede, senha e suporte de conexão, dirija-se à recepção ou ligue (62) 3096-2000.`,
  },
  {
    topic: "estacionamento",
    keywords: ["estacionamento", "carro", "valet", "manobrista", "garagem", "parking", "vaga"],
    content: `O Castro's Park Hotel oferece estacionamento gratuito para hóspedes com serviço de manobrista (valet) no próprio hotel. Para informações sobre vagas para visitantes, consulte a recepção.`,
  },
  {
    topic: "restaurante_ipe_geral",
    keywords: ["restaurante", "ipe", "gastronomia", "cozinha", "culinaria", "refeicao", "comer", "jantar", "almoco", "tradicional"],
    content: `O Restaurante Ipê é um dos melhores restaurantes de Goiânia, localizado dentro do Castro's Park Hotel. Com mais de 30 anos de tradição e certificação 5 estrelas, oferece gastronomia contemporânea com culinária internacional e regional, opções vegetarianas, cardápio com 72 pratos e carta de vinhos com mais de 50 rótulos nacionais e internacionais.`,
  },
  {
    topic: "cafe_da_manha",
    keywords: ["cafe da manha", "cafe", "manha", "buffet", "pequeno almoco", "incluso", "cortesia", "6h30", "10h"],
    content: `O café da manhã do Restaurante Ipê é servido em buffet completo, incluso na diária para todos os hóspedes como cortesia. Também é aberto ao público externo. Horários: Segunda a Sexta-feira das 6h30 às 10h00. Sábados, Domingos e Feriados das 6h30 às 10h30.`,
  },
  {
    topic: "feijoada",
    keywords: ["feijoada", "sabado", "carne", "feijao", "tradicional", "premiada", "12h30", "15h30"],
    content: `A Premiada Feijoada do Restaurante Ipê é servida todo sábado das 12h30 às 15h30. É considerada uma das melhores feijoadas de Goiânia. Montada individualmente com 9 tipos de carne. Acompanha buffet com entradas e várias sobremesas. Reservas: (62) 3096-2000.`,
  },
  {
    topic: "almoco",
    keywords: ["almoco", "almoco executivo", "segunda sexta", "domingo", "11h", "15h", "executivo", "la carte"],
    content: `O Restaurante Ipê oferece duas opções de almoço: Almoço Executivo (Segunda a Sexta-feira, das 11h às 15h) com menu executivo incluindo entradas, prato principal e sobremesas. Almoço de Domingo (Domingos, das 11h às 15h30) com pratos à la carte. Reservas: (62) 3096-2000.`,
  },
  {
    topic: "jantar",
    keywords: ["jantar", "noite", "18h", "22h30", "a la carte", "janta"],
    content: `O Restaurante Ipê serve jantar à la carte diariamente das 18h às 22h30 com o melhor da gastronomia internacional e regional. Reservas recomendadas: (62) 3096-2000.`,
  },
  {
    topic: "cardapio_vinhos",
    keywords: ["cardapio", "vinho", "adega", "rotulo", "menu", "pratos", "vegetariano", "opcao"],
    content: `O Restaurante Ipê possui cardápio com 72 pratos, incluindo opções vegetarianas. A adega conta com mais de 50 rótulos dos melhores vinhos nacionais e internacionais. O cardápio online está disponível em: https://castros-park-hotel-restaurante-ip-1.goomer.app/menu`,
  },
  {
    topic: "musica_ao_vivo",
    keywords: ["musica", "musica ao vivo", "piano", "show", "sabado", "animacao", "pianista"],
    content: `O Restaurante Ipê oferece música ao vivo todo sábado, acompanhando a Feijoada Premiada. A programação musical anima o almoço de sábado com um ambiente especial e acolhedor.`,
  },
  {
    topic: "reservas_restaurante",
    keywords: ["reserva", "reservar", "mesa", "ligar", "agendamento", "restaurante"],
    content: `Para fazer reservas no Restaurante Ipê, ligue para (62) 3096-2000 ou 0800 606 2000. O restaurante atende tanto hóspedes do hotel quanto visitantes externos. Recomendamos reservar com antecedência, especialmente para o sábado (Feijoada Premiada).`,
  },
  {
    topic: "room_service",
    keywords: ["room service", "quarto", "servico de quarto", "pedir", "delivery", "24h", "comer no quarto"],
    content: `O Castro's Park Hotel oferece room service 24 horas para todos os hóspedes. Acione pelo telefone do quarto ou ligue para a recepção.`,
  },
  {
    topic: "piscina",
    keywords: ["piscina", "nadar", "mergulhar", "aquecida", "infantil", "kids", "bar piscina", "pool"],
    content: `O Castro's Park Hotel possui piscina externa aquecida, piscina infantil e bar da piscina (pool bar) ao lado. Ideal para relaxar durante a estadia. Para informações sobre horários de uso, consulte a recepção.`,
  },
  {
    topic: "spa",
    keywords: ["spa", "massagem", "facial", "estetica", "manicure", "relaxamento", "tratamento", "bem estar", "mandarin"],
    content: `O Castro's Park Hotel conta com uma unidade do Mandarin Spa Urbano, oferecendo tratamentos de bem-estar como massagens, faciais, manicure e outros. Para horários, agendamentos e valores, dirija-se à recepção ou ligue (62) 3096-2000.`,
  },
  {
    topic: "academia",
    keywords: ["academia", "ginastica", "exercicio", "personal trainer", "musculacao", "fitness", "treino"],
    content: `O Castro's Park Hotel possui academia completa com personal trainer disponível para os hóspedes. Para horários de funcionamento e informações sobre o personal trainer, consulte a recepção ou ligue (62) 3096-2000.`,
  },
  {
    topic: "sauna_lazer",
    keywords: ["sauna", "jogos", "brinquedoteca", "kids", "criancas", "lazer", "relaxar", "diversao"],
    content: `O Castro's Park Hotel oferece área completa de lazer: sauna, salão de jogos e brinquedoteca (espaço kids para hóspedes com crianças). Para informações sobre horários, consulte a recepção.`,
  },
  {
    topic: "eventos",
    keywords: ["evento", "salao", "convencao", "conferencia", "reuniao", "festa", "casamento", "corporativo", "capacidade"],
    content: `O Castro's Park Hotel dispõe de 10 salões de eventos para funções sociais e corporativas, com capacidade para até 850 pessoas simultaneamente e até 500 em formato auditório. O centro de convenções é modular e flexível. Para orçamentos e disponibilidade, contate a recepção ou envie e-mail para reservas@castrospark.com.br.`,
  },
  {
    topic: "servicos_adicionais",
    keywords: ["agencia", "viagem", "passeio", "loja", "deli", "delicatessen", "business center", "impressora", "concierge"],
    content: `O Castro's Park Hotel oferece serviços adicionais: agência de viagens no hotel (passeios e transfers), loja de conveniências, delicatessen e Business Center com computadores e impressora. O concierge presencial na recepção também pode ajudar com sugestões de passeios e serviços em Goiânia.`,
  },
  {
    topic: "pets",
    keywords: ["pet", "animal", "cachorro", "gato", "estimacao", "mascote", "dog"],
    content: `Infelizmente o Castro's Park Hotel não permite animais de estimação. Para dúvidas sobre esta política, entre em contato com a recepção pelo (62) 3096-2000.`,
  },
  {
    topic: "informacoes_sensiveis",
    keywords: ["preco", "valor", "tarifa", "diaria", "cancelamento", "alteracao", "pagamento", "fatura", "dado", "reclamacao", "perdidos"],
    content: `Para informações sobre valores de diárias, tarifas, cancelamentos, alterações de reserva, cobranças e dados pessoais, por favor dirija-se à recepção presencial ou ligue para (62) 3096-2000 — nossa equipe poderá te atender com muito mais precisão e cuidado.`,
  },
];

async function main() {
  console.log("🏨 Castro's Park Hotel — Seed hotel_knowledge");
  console.log(`📦 ${CHUNKS.length} chunks para inserir\n`);

  // Limpa tabela antes de reinserir
  const { error: deleteError } = await supabase
    .from("hotel_knowledge")
    .delete()
    .gte("id", 0);

  if (deleteError) {
    console.warn("⚠️  Aviso ao limpar tabela:", deleteError.message);
  }

  const { error } = await supabase.from("hotel_knowledge").insert(CHUNKS);

  if (error) {
    console.error("❌ Erro ao inserir chunks:", error.message);
    process.exit(1);
  }

  console.log(`✅ ${CHUNKS.length} chunks inseridos com sucesso!`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});

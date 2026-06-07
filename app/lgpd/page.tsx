import Link from 'next/link';
import Image from 'next/image';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gold/30" />
        <p className="text-[9px] tracking-[0.5em] uppercase text-gold font-bold shrink-0">{title}</p>
        <div className="flex-1 h-px bg-gold/30" />
      </div>
      <div className="text-cream/55 text-sm leading-relaxed flex flex-col gap-2">
        {children}
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center border border-gold/25 bg-gold/[0.06] text-gold text-[9px] font-bold uppercase tracking-[0.3em] px-2 py-0.5">
      {children}
    </span>
  );
}

export default function LgpdPage() {
  return (
    <div className="min-h-screen bg-midnight flex flex-col relative z-10">

      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-gold/15">
        <Link href="/" className="flex items-center gap-3 group">
          <Image src="/logo.png" alt="Alcance o Topo" width={34} height={34} className="object-contain" />
          <div className="w-px h-5 bg-cream/15" />
          <span className="text-[9px] tracking-[0.4em] uppercase font-bold text-cream/30 group-hover:text-cream/70 transition-colors">
            ← Início
          </span>
        </Link>
        <span className="text-[9px] tracking-[0.4em] uppercase font-bold text-gold/60">
          Privacidade
        </span>
      </header>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center py-12 px-6 gap-10 max-w-lg mx-auto w-full">

        {/* Title block */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2">
            <div className="h-px w-8 bg-gold/50" />
            <p className="text-[8px] tracking-[0.6em] uppercase text-gold font-bold">LGPD · Lei 13.709/2018</p>
            <div className="h-px w-8 bg-gold/50" />
          </div>
          <h1 className="text-4xl font-black text-cream uppercase tracking-tight leading-none">
            Privacidade
          </h1>
          <p className="text-cream/40 text-sm max-w-xs leading-relaxed">
            Direto ao ponto: este jogo não sabe quem você é e não quer saber.
          </p>
        </div>

        {/* Status badges */}
        <div className="flex flex-wrap gap-2 justify-center">
          <Tag>Sem anúncios</Tag>
          <Tag>Sem cadastro</Tag>
          <Tag>Sem cookies</Tag>
          <Tag>Sem rastreamento</Tag>
          <Tag>Sem cobrança</Tag>
        </div>

        {/* Sections */}
        <Section title="O que guardamos no seu dispositivo">
          <p>
            Dois itens ficam no <strong className="text-cream/80">localStorage</strong> do seu navegador — e só lá:
          </p>
          <ul className="flex flex-col gap-1.5 pl-4 border-l border-gold/20">
            <li>
              <span className="text-cream/70 font-bold">ID de jogador:</span> um código aleatório gerado
              automaticamente na primeira visita (ex: <span className="font-mono text-[11px] text-cream/40">a3f9…</span>).
              Não tem nome, e-mail nem qualquer dado seu associado a ele. É só um número para agrupar suas partidas.
            </li>
            <li>
              <span className="text-cream/70 font-bold">Estado da partida atual:</span> progresso do jogo em andamento,
              apagado quando você começa uma nova temporada.
            </li>
          </ul>
          <p>
            Você pode limpar esses dados a qualquer momento nas configurações do seu navegador
            (<em>Limpar dados do site</em>). Isso apaga seu histórico local — nada mais acontece.
          </p>
        </Section>

        <Section title="O que vai para o servidor">
          <p>
            Ao finalizar uma temporada, o resultado é salvo no nosso banco de dados associado
            apenas ao seu <strong className="text-cream/80">ID anônimo</strong>. Nenhuma informação pessoal
            é transmitida — sem IP registrado, sem fingerprint, sem qualquer dado que permita identificar você.
          </p>
          <p>
            O que é salvo: formação escolhida, pontuação, vitórias/empates/derrotas, gols, rank e o time que você montou.
            Só isso. Se amanhã resolvermos desligar o servidor, você não perde nada que importa de verdade.
          </p>
        </Section>

        <Section title="Cookies e rastreamento">
          <p>
            Não usamos cookies de rastreamento, pixels de conversão, Google Analytics, Meta Pixel
            nem qualquer ferramenta de monitoramento de comportamento.
          </p>
          <p>
            O único armazenamento no cliente é o localStorage descrito acima, que não é
            transmitido automaticamente para nenhum servidor.
          </p>
        </Section>

        <Section title="Publicidade e monetização">
          <p>
            Não há anúncios. Não há compras dentro do jogo. Não há assinatura.
            Não vendemos dados para terceiros porque não temos dados para vender.
          </p>
          <p>
            <em className="text-cream/35">
              Alcance o Topo é um projeto independente feito por amor ao futebol brasileiro.
              Sem patrocinadores, sem VC, sem modelo de negócio.
            </em>
          </p>
        </Section>

        <Section title="Seus direitos (LGPD)">
          <p>
            A LGPD garante direitos sobre seus dados pessoais. Como praticamente não coletamos
            dados pessoais, a maioria deles se aplica de forma trivial — mas vale registrar:
          </p>
          <ul className="flex flex-col gap-1.5 pl-4 border-l border-gold/20">
            <li><span className="text-cream/70 font-bold">Acesso:</span> seus dados de jogo ficam no seu dispositivo e você pode lê-los a qualquer momento.</li>
            <li><span className="text-cream/70 font-bold">Exclusão:</span> limpar o localStorage apaga tudo no cliente. Para apagar do servidor, entre em contato com o e-mail abaixo informando seu ID de jogador.</li>
            <li><span className="text-cream/70 font-bold">Portabilidade:</span> os dados do servidor são apenas scores — não há nada para exportar além de uma lista de resultados.</li>
            <li><span className="text-cream/70 font-bold">Oposição:</span> você pode parar de usar o jogo a qualquer momento. Simples assim.</li>
          </ul>
        </Section>

        <Section title="Infraestrutura">
          <p>
            O banco de dados é hospedado na <strong className="text-cream/80">Supabase</strong> (PostgreSQL),
            com servidores nos EUA (<span className="font-mono text-[11px] text-cream/40">us-east-2</span>).
            A aplicação web é hospedada na <strong className="text-cream/80">Railway</strong>/<strong className="text-cream/80">Vercel</strong>.
            Ambas as plataformas seguem padrões internacionais de segurança (SOC 2, ISO 27001).
          </p>
        </Section>

        <Section title="Contato">
          <p>
            Dúvidas, solicitações de exclusão ou qualquer questão relacionada a dados:
          </p>
          <p>
            <a
              href="mailto:alexandre.tahdeu@gmail.com"
              className="text-gold hover:text-gold/70 transition-colors font-bold"
            >
              alexandre.tahdeu@gmail.com
            </a>
          </p>
          <p className="text-cream/30 text-xs">
            Última atualização: junho de 2026
          </p>
        </Section>

      </div>

      {/* Footer */}
      <footer className="flex items-center justify-center py-4 gap-3 border-t border-gold/20">
        <div className="h-px w-8 bg-gold/40" />
        <span className="text-[8px] tracking-[0.5em] uppercase text-gold/35 font-bold">
          Alcance o Topo · Est. 2026
        </span>
        <div className="h-px w-8 bg-gold/40" />
      </footer>

    </div>
  );
}

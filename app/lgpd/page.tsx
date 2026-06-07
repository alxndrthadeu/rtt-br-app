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
            Política de Privacidade
          </h1>
          <p className="text-cream/30 text-xs">Última atualização: junho de 2026</p>
        </div>

        {/* Intro */}
        <p className="text-cream/55 text-sm leading-relaxed text-center max-w-sm">
          O <strong className="text-cream/80">Alcance o Topo</strong> é um jogo gratuito em que você monta
          um time histórico do futebol brasileiro e simula uma temporada. Esta política explica quais dados
          o site utiliza. Ao jogar, você concorda com as práticas descritas aqui.
        </p>

        <Section title="Dados que coletamos">
          <p>
            O Alcance o Topo não pede cadastro e não coleta nome, e-mail ou qualquer dado pessoal
            identificável para jogar. O essencial roda no seu próprio navegador. Podemos armazenar:
          </p>
          <ul className="flex flex-col gap-1.5 pl-4 border-l border-gold/20">
            <li>
              <strong className="text-cream/70">ID anônimo de jogador:</strong> um código gerado
              automaticamente no seu dispositivo para agrupar suas partidas. Não está vinculado a nenhuma
              identidade real.
            </li>
            <li>
              <strong className="text-cream/70">Estado da partida:</strong> progresso da temporada em
              andamento, guardado apenas no seu navegador.
            </li>
            <li>
              <strong className="text-cream/70">Resultados de temporadas:</strong> pontuação, time montado
              e rank final, salvos no servidor associados somente ao ID anônimo acima.
            </li>
          </ul>
        </Section>

        <Section title="Cookies e rastreamento">
          <p>
            Não utilizamos cookies de rastreamento, Google Analytics, Meta Pixel nem qualquer ferramenta
            de monitoramento de comportamento. O único armazenamento no cliente é o <em>localStorage</em>
            descrito acima, que não é transmitido automaticamente a nenhum servidor.
          </p>
        </Section>

        <Section title="Publicidade e monetização">
          <p>
            Não há anúncios, compras dentro do jogo nem assinatura. Não vendemos dados para terceiros
            porque não temos dados para vender. O Alcance o Topo é um projeto independente,
            sem patrocinadores e sem modelo de negócio.
          </p>
        </Section>

        <Section title="Serviços de terceiros">
          <p>
            Os resultados são armazenados na <strong className="text-cream/70">Supabase</strong> (banco
            de dados PostgreSQL hospedado nos EUA). A aplicação roda na{' '}
            <strong className="text-cream/70">Railway</strong> e/ou{' '}
            <strong className="text-cream/70">Vercel</strong>. Esses serviços possuem políticas de
            privacidade próprias e seguem padrões internacionais de segurança.
          </p>
        </Section>

        <Section title="Crianças">
          <p>
            O Alcance o Topo não é direcionado a menores de 13 anos e não coleta intencionalmente
            dados de crianças.
          </p>
        </Section>

        <Section title="Alterações">
          <p>
            Esta política pode ser atualizada periodicamente. Mudanças relevantes serão refletidas
            nesta página, com a data de atualização no topo.
          </p>
        </Section>

        <Section title="Contato">
          <p>
            Dúvidas ou sugestões sobre esta política? Fale com a gente pela página de apoio:
          </p>
          <a
            href="https://ko-fi.com/rttteam"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 self-start border border-gold/30 bg-gold/[0.05] px-4 py-2.5 text-gold font-bold text-sm tracking-wide hover:bg-gold/[0.10] transition-colors"
          >
            ☕ Ko-fi · ko-fi.com/rttteam
          </a>
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

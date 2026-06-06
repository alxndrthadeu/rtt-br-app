const ESCUDOS: Record<string, string> = {
  'Atlético-MG':  '/escudos/atletico_mg.png',
  'Botafogo':     '/escudos/botafogo.png',
  'Corinthians':  '/escudos/corinthians.png',
  'Cruzeiro':     '/escudos/cruzeiro.png',
  'Flamengo':     '/escudos/flamengo.png',
  'Fluminense':   '/escudos/fluminense.png',
  'Grêmio':       '/escudos/gremio.png',
  'Internacional':'/escudos/internacional.png',
  'Palmeiras':    '/escudos/palmeiras.png',
  'Santos':       '/escudos/santos.png',
  'São Paulo':    '/escudos/sao_paulo.png',
  'Vasco':        '/escudos/vasco.png',
};

export function getEscudo(team: string): string | null {
  return ESCUDOS[team] ?? null;
}

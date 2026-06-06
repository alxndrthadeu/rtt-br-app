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

const ABREVIACOES: Record<string, string> = {
  'Atlético-MG':  'CAM',
  'Botafogo':     'BOT',
  'Corinthians':  'COR',
  'Cruzeiro':     'CRU',
  'Flamengo':     'FLA',
  'Fluminense':   'FLU',
  'Grêmio':       'GRE',
  'Internacional':'INT',
  'Palmeiras':    'PAL',
  'Santos':       'SAN',
  'São Paulo':    'SAO',
  'Vasco':        'VAS',
};

export function getEscudo(team: string): string | null {
  return ESCUDOS[team] ?? null;
}

export function getAbrev(team: string): string {
  return ABREVIACOES[team] ?? team;
}

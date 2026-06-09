import { Team, MatchStage } from './types';

export const TEAMS: Record<string, Team> = {
  MEX: { id: 'mex', name: 'Mexico', short_name: 'MEX', color: '#006847' },
  RSA: { id: 'rsa', name: 'South Africa', short_name: 'RSA', color: '#007749' },
  KOR: { id: 'kor', name: 'Korea Republic', short_name: 'KOR', color: '#CD2E3A' },
  CZE: { id: 'cze', name: 'Czechia', short_name: 'CZE', color: '#11457E' },
  CAN: { id: 'can', name: 'Canada', short_name: 'CAN', color: '#FF0000' },
  BIH: { id: 'bih', name: 'Bosnia & Herzegovina', short_name: 'BIH', color: '#002395' },
  QAT: { id: 'qat', name: 'Qatar', short_name: 'QAT', color: '#8B1A32' },
  SUI: { id: 'sui', name: 'Switzerland', short_name: 'SUI', color: '#FF0000' },
  BRA: { id: 'bra', name: 'Brazil', short_name: 'BRA', color: '#009739' },
  MAR: { id: 'mar', name: 'Morocco', short_name: 'MAR', color: '#C1272D' },
  HAI: { id: 'hai', name: 'Haiti', short_name: 'HAI', color: '#00209F' },
  SCO: { id: 'sco', name: 'Scotland', short_name: 'SCO', color: '#003078' },
  USA: { id: 'usa', name: 'United States', short_name: 'USA', color: '#002868' },
  PAR: { id: 'par', name: 'Paraguay', short_name: 'PAR', color: '#DA121A' },
  AUS: { id: 'aus', name: 'Australia', short_name: 'AUS', color: '#00843D' },
  TUR: { id: 'tur', name: 'Türkiye', short_name: 'TUR', color: '#E30A17' },
  GER: { id: 'ger', name: 'Germany', short_name: 'GER', color: '#000000' },
  CUW: { id: 'cuw', name: 'Curaçao', short_name: 'CUW', color: '#002B7F' },
  CIV: { id: 'civ', name: "Côte d'Ivoire", short_name: 'CIV', color: '#F77F00' },
  ECU: { id: 'ecu', name: 'Ecuador', short_name: 'ECU', color: '#FFD100' },
  NED: { id: 'ned', name: 'Netherlands', short_name: 'NED', color: '#FF6600' },
  JPN: { id: 'jpn', name: 'Japan', short_name: 'JPN', color: '#000080' },
  SWE: { id: 'swe', name: 'Sweden', short_name: 'SWE', color: '#006AA7' },
  TUN: { id: 'tun', name: 'Tunisia', short_name: 'TUN', color: '#E70013' },
  BEL: { id: 'bel', name: 'Belgium', short_name: 'BEL', color: '#ED2939' },
  EGY: { id: 'egy', name: 'Egypt', short_name: 'EGY', color: '#CE1126' },
  IRN: { id: 'irn', name: 'IR Iran', short_name: 'IRN', color: '#239F40' },
  NZL: { id: 'nzl', name: 'New Zealand', short_name: 'NZL', color: '#000000' },
  ESP: { id: 'esp', name: 'Spain', short_name: 'ESP', color: '#AA151B' },
  CPV: { id: 'cpv', name: 'Cabo Verde', short_name: 'CPV', color: '#003893' },
  KSA: { id: 'ksa', name: 'Saudi Arabia', short_name: 'KSA', color: '#006C35' },
  URU: { id: 'uru', name: 'Uruguay', short_name: 'URU', color: '#5CBFEB' },
  FRA: { id: 'fra', name: 'France', short_name: 'FRA', color: '#002395' },
  SEN: { id: 'sen', name: 'Senegal', short_name: 'SEN', color: '#00853F' },
  IRQ: { id: 'irq', name: 'Iraq', short_name: 'IRQ', color: '#007A3D' },
  NOR: { id: 'nor', name: 'Norway', short_name: 'NOR', color: '#BA0C2F' },
  ARG: { id: 'arg', name: 'Argentina', short_name: 'ARG', color: '#75AADB' },
  ALG: { id: 'alg', name: 'Algeria', short_name: 'ALG', color: '#006233' },
  AUT: { id: 'aut', name: 'Austria', short_name: 'AUT', color: '#ED2939' },
  JOR: { id: 'jor', name: 'Jordan', short_name: 'JOR', color: '#007A3D' },
  POR: { id: 'por', name: 'Portugal', short_name: 'POR', color: '#006600' },
  COD: { id: 'cod', name: 'Congo DR', short_name: 'COD', color: '#007FFF' },
  UZB: { id: 'uzb', name: 'Uzbekistan', short_name: 'UZB', color: '#1EB53A' },
  COL: { id: 'col', name: 'Colombia', short_name: 'COL', color: '#FCD116' },
  ENG: { id: 'eng', name: 'England', short_name: 'ENG', color: '#1A3668' },
  CRO: { id: 'cro', name: 'Croatia', short_name: 'CRO', color: '#FF0000' },
  GHA: { id: 'gha', name: 'Ghana', short_name: 'GHA', color: '#006B3F' },
  PAN: { id: 'pan', name: 'Panama', short_name: 'PAN', color: '#DA121A' },
};

export function getTeamColor(shortName: string): string {
  return TEAMS[shortName]?.color ?? '#a0aec0';
}

export function getTeamFullName(shortName: string): string {
  return TEAMS[shortName]?.name ?? shortName;
}

export function getAllTeamAbbreviations(): string[] {
  return Object.keys(TEAMS);
}

export function isDrawAllowed(stage: MatchStage): boolean {
  return stage === 'group';
}

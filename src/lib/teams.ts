import { Team, MatchStage } from './types';

export const TEAMS: Record<string, Team> = {
  // Group A
  MEX: { id: 'mex', name: 'Mexico', short_name: 'MEX', color: '#00e676' },
  RSA: { id: 'rsa', name: 'South Africa', short_name: 'RSA', color: '#66bb6a' },
  KOR: { id: 'kor', name: 'Korea Republic', short_name: 'KOR', color: '#ef5350' },
  CZE: { id: 'cze', name: 'Czechia', short_name: 'CZE', color: '#42a5f5' },
  // Group B
  CAN: { id: 'can', name: 'Canada', short_name: 'CAN', color: '#ff5252' },
  BIH: { id: 'bih', name: 'Bosnia & Herzegovina', short_name: 'BIH', color: '#5c6bc0' },
  QAT: { id: 'qat', name: 'Qatar', short_name: 'QAT', color: '#ab47bc' },
  SUI: { id: 'sui', name: 'Switzerland', short_name: 'SUI', color: '#e53935' },
  // Group C
  BRA: { id: 'bra', name: 'Brazil', short_name: 'BRA', color: '#fdd835' },
  MAR: { id: 'mar', name: 'Morocco', short_name: 'MAR', color: '#e53935' },
  HAI: { id: 'hai', name: 'Haiti', short_name: 'HAI', color: '#5c6bc0' },
  SCO: { id: 'sco', name: 'Scotland', short_name: 'SCO', color: '#1e88e5' },
  // Group D
  USA: { id: 'usa', name: 'United States', short_name: 'USA', color: '#42a5f5' },
  PAR: { id: 'par', name: 'Paraguay', short_name: 'PAR', color: '#ef5350' },
  AUS: { id: 'aus', name: 'Australia', short_name: 'AUS', color: '#fdd835' },
  TUR: { id: 'tur', name: 'Türkiye', short_name: 'TUR', color: '#ff5252' },
  // Group E
  GER: { id: 'ger', name: 'Germany', short_name: 'GER', color: '#e0e0e0' },
  CUW: { id: 'cuw', name: 'Curaçao', short_name: 'CUW', color: '#5c6bc0' },
  CIV: { id: 'civ', name: "Côte d'Ivoire", short_name: 'CIV', color: '#ff9800' },
  ECU: { id: 'ecu', name: 'Ecuador', short_name: 'ECU', color: '#42a5f5' },
  // Group F
  NED: { id: 'ned', name: 'Netherlands', short_name: 'NED', color: '#ff7043' },
  JPN: { id: 'jpn', name: 'Japan', short_name: 'JPN', color: '#5c6bc0' },
  SWE: { id: 'swe', name: 'Sweden', short_name: 'SWE', color: '#fdd835' },
  TUN: { id: 'tun', name: 'Tunisia', short_name: 'TUN', color: '#ef5350' },
  // Group G
  BEL: { id: 'bel', name: 'Belgium', short_name: 'BEL', color: '#ff5252' },
  EGY: { id: 'egy', name: 'Egypt', short_name: 'EGY', color: '#ef5350' },
  IRN: { id: 'irn', name: 'IR Iran', short_name: 'IRN', color: '#66bb6a' },
  NZL: { id: 'nzl', name: 'New Zealand', short_name: 'NZL', color: '#e0e0e0' },
  // Group H
  ESP: { id: 'esp', name: 'Spain', short_name: 'ESP', color: '#ff5252' },
  CPV: { id: 'cpv', name: 'Cabo Verde', short_name: 'CPV', color: '#42a5f5' },
  KSA: { id: 'ksa', name: 'Saudi Arabia', short_name: 'KSA', color: '#66bb6a' },
  URU: { id: 'uru', name: 'Uruguay', short_name: 'URU', color: '#29b6f6' },
  // Group I
  FRA: { id: 'fra', name: 'France', short_name: 'FRA', color: '#5c6bc0' },
  SEN: { id: 'sen', name: 'Senegal', short_name: 'SEN', color: '#66bb6a' },
  IRQ: { id: 'irq', name: 'Iraq', short_name: 'IRQ', color: '#43a047' },
  NOR: { id: 'nor', name: 'Norway', short_name: 'NOR', color: '#ef5350' },
  // Group J
  ARG: { id: 'arg', name: 'Argentina', short_name: 'ARG', color: '#80d8ff' },
  ALG: { id: 'alg', name: 'Algeria', short_name: 'ALG', color: '#66bb6a' },
  AUT: { id: 'aut', name: 'Austria', short_name: 'AUT', color: '#ef5350' },
  JOR: { id: 'jor', name: 'Jordan', short_name: 'JOR', color: '#43a047' },
  // Group K
  POR: { id: 'por', name: 'Portugal', short_name: 'POR', color: '#66bb6a' },
  COD: { id: 'cod', name: 'Congo DR', short_name: 'COD', color: '#29b6f6' },
  UZB: { id: 'uzb', name: 'Uzbekistan', short_name: 'UZB', color: '#4caf50' },
  COL: { id: 'col', name: 'Colombia', short_name: 'COL', color: '#fdd835' },
  // Group L
  ENG: { id: 'eng', name: 'England', short_name: 'ENG', color: '#e0e0e0' },
  CRO: { id: 'cro', name: 'Croatia', short_name: 'CRO', color: '#ef5350' },
  GHA: { id: 'gha', name: 'Ghana', short_name: 'GHA', color: '#66bb6a' },
  PAN: { id: 'pan', name: 'Panama', short_name: 'PAN', color: '#ef5350' },
};

export function getTeamColor(shortName: string): string {
  return TEAMS[shortName]?.color ?? '#90a4ae';
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

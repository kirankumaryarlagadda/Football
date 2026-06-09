import { Team, MatchStage } from './types';

export const TEAMS: Record<string, Team> = {
  // Group A
  MEX: { id: 'mex', name: 'Mexico', short_name: 'MEX', color: '#006847' },
  RSA: { id: 'rsa', name: 'South Africa', short_name: 'RSA', color: '#ffb300' },
  KOR: { id: 'kor', name: 'Korea Republic', short_name: 'KOR', color: '#e53935' },
  CZE: { id: 'cze', name: 'Czechia', short_name: 'CZE', color: '#42a5f5' },
  // Group B
  CAN: { id: 'can', name: 'Canada', short_name: 'CAN', color: '#d32f2f' },
  BIH: { id: 'bih', name: 'Bosnia & Herzegovina', short_name: 'BIH', color: '#1976d2' },
  QAT: { id: 'qat', name: 'Qatar', short_name: 'QAT', color: '#8e24aa' },
  SUI: { id: 'sui', name: 'Switzerland', short_name: 'SUI', color: '#ff5252' },
  // Group C
  BRA: { id: 'bra', name: 'Brazil', short_name: 'BRA', color: '#fdd835' },
  MAR: { id: 'mar', name: 'Morocco', short_name: 'MAR', color: '#c62828' },
  HAI: { id: 'hai', name: 'Haiti', short_name: 'HAI', color: '#3949ab' },
  SCO: { id: 'sco', name: 'Scotland', short_name: 'SCO', color: '#0d47a1' },
  // Group D
  USA: { id: 'usa', name: 'United States', short_name: 'USA', color: '#1565c0' },
  PAR: { id: 'par', name: 'Paraguay', short_name: 'PAR', color: '#b71c1c' },
  AUS: { id: 'aus', name: 'Australia', short_name: 'AUS', color: '#f9a825' },
  TUR: { id: 'tur', name: 'Türkiye', short_name: 'TUR', color: '#d50000' },
  // Group E
  GER: { id: 'ger', name: 'Germany', short_name: 'GER', color: '#e0e0e0' },
  CUW: { id: 'cuw', name: 'Curaçao', short_name: 'CUW', color: '#5c6bc0' },
  CIV: { id: 'civ', name: "Côte d'Ivoire", short_name: 'CIV', color: '#ef6c00' },
  ECU: { id: 'ecu', name: 'Ecuador', short_name: 'ECU', color: '#0277bd' },
  // Group F
  NED: { id: 'ned', name: 'Netherlands', short_name: 'NED', color: '#ff6d00' },
  JPN: { id: 'jpn', name: 'Japan', short_name: 'JPN', color: '#303f9f' },
  SWE: { id: 'swe', name: 'Sweden', short_name: 'SWE', color: '#fbc02d' },
  TUN: { id: 'tun', name: 'Tunisia', short_name: 'TUN', color: '#ef5350' },
  // Group G
  BEL: { id: 'bel', name: 'Belgium', short_name: 'BEL', color: '#ff1744' },
  EGY: { id: 'egy', name: 'Egypt', short_name: 'EGY', color: '#ad1457' },
  IRN: { id: 'irn', name: 'IR Iran', short_name: 'IRN', color: '#2e7d32' },
  NZL: { id: 'nzl', name: 'New Zealand', short_name: 'NZL', color: '#b0bec5' },
  // Group H
  ESP: { id: 'esp', name: 'Spain', short_name: 'ESP', color: '#bf360c' },
  CPV: { id: 'cpv', name: 'Cabo Verde', short_name: 'CPV', color: '#4527a0' },
  KSA: { id: 'ksa', name: 'Saudi Arabia', short_name: 'KSA', color: '#1b5e20' },
  URU: { id: 'uru', name: 'Uruguay', short_name: 'URU', color: '#0097a7' },
  // Group I
  FRA: { id: 'fra', name: 'France', short_name: 'FRA', color: '#283593' },
  SEN: { id: 'sen', name: 'Senegal', short_name: 'SEN', color: '#4caf50' },
  IRQ: { id: 'irq', name: 'Iraq', short_name: 'IRQ', color: '#558b2f' },
  NOR: { id: 'nor', name: 'Norway', short_name: 'NOR', color: '#ba68c8' },
  // Group J
  ARG: { id: 'arg', name: 'Argentina', short_name: 'ARG', color: '#4fc3f7' },
  ALG: { id: 'alg', name: 'Algeria', short_name: 'ALG', color: '#66bb6a' },
  AUT: { id: 'aut', name: 'Austria', short_name: 'AUT', color: '#f44336' },
  JOR: { id: 'jor', name: 'Jordan', short_name: 'JOR', color: '#7cb342' },
  // Group K
  POR: { id: 'por', name: 'Portugal', short_name: 'POR', color: '#388e3c' },
  COD: { id: 'cod', name: 'Congo DR', short_name: 'COD', color: '#29b6f6' },
  UZB: { id: 'uzb', name: 'Uzbekistan', short_name: 'UZB', color: '#00897b' },
  COL: { id: 'col', name: 'Colombia', short_name: 'COL', color: '#ffa000' },
  // Group L
  ENG: { id: 'eng', name: 'England', short_name: 'ENG', color: '#cfd8dc' },
  CRO: { id: 'cro', name: 'Croatia', short_name: 'CRO', color: '#ec407a' },
  GHA: { id: 'gha', name: 'Ghana', short_name: 'GHA', color: '#43a047' },
  PAN: { id: 'pan', name: 'Panama', short_name: 'PAN', color: '#e91e63' },
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

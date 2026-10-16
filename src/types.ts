export interface Match {
  id: string;
  league: string;
  country: string;
  tournament_id?: string;
  home_team: string;
  away_team: string;
  home_score: string;
  away_score: string;
  status_code: string;
  status: string;
  detailed_state?: string;
  elapsed_minute: string | null;
  timestamp: number | null;
  periods: Array<{ period: string; home: string; away: string }>;
  winner: 'home' | 'away' | null;
  url: string;
  // Quick stats summary if available
  stats_summary?: {
    home_xg?: number;
    away_xg?: number;
    home_possession?: number;
    away_possession?: number;
    home_shots_on_target?: number;
    away_shots_on_target?: number;
  };
}

export interface MatchCounts {
  live: number;
  finished: number;
  scheduled: number;
}

export interface MatchesResponse {
  sport: string;
  day_offset: number;
  status_filter: string;
  total: number;
  counts: MatchCounts;
  matches: Match[];
}

export interface MatchDetail {
  id: string;
  title: string;
  home_team: string;
  away_team: string;
  score: string;
  period_breakdown: string;
  status: string;
  kickoff_time: string;
  raw_details: string[];
  url: string;
}

export interface StatItem {
  name: string;
  category: 'core' | 'shots' | 'passes' | 'defense' | 'discipline';
  home: string | number;
  away: string | number;
  home_raw?: number;
  away_raw?: number;
  home_percentage?: number;
}

export interface MatchDetailedStats {
  match_id: string;
  home_team: string;
  away_team: string;
  period: string; // 'Full Time' | '1st Half' | '2nd Half'
  stats: {
    // Advanced expected metrics
    expected_goals?: { home: number; away: number };
    xg_on_target?: { home: number; away: number };
    expected_assists?: { home: number; away: number };

    // Possession & Attacks
    ball_possession?: { home: number; away: number };
    attacks?: { home: number; away: number };
    dangerous_attacks?: { home: number; away: number };
    touches_in_box?: { home: number; away: number };

    // Shots
    total_shots?: { home: number; away: number };
    shots_on_target?: { home: number; away: number };
    shots_off_target?: { home: number; away: number };
    blocked_shots?: { home: number; away: number };
    shots_inside_box?: { home: number; away: number };
    shots_outside_box?: { home: number; away: number };
    big_chances?: { home: number; away: number };
    hit_woodwork?: { home: number; away: number };

    // Set pieces & Defense
    corner_kicks?: { home: number; away: number };
    goalkeeper_saves?: { home: number; away: number };
    fouls?: { home: number; away: number };
    offsides?: { home: number; away: number };
    tackles?: { home: string; away: string };
    clearances?: { home: number; away: number };
    interceptions?: { home: number; away: number };

    // Passing
    passes?: { home: string; away: string };
    pass_accuracy?: { home: number; away: number };
    long_balls?: { home: string; away: string };
    crosses?: { home: string; away: string };

    // Discipline
    yellow_cards?: { home: number; away: number };
    red_cards?: { home: number; away: number };
  };
  raw_items: StatItem[];
}

export interface MatchIncident {
  id: string;
  minute: string;
  type: 'goal' | 'yellow_card' | 'red_card' | 'second_yellow' | 'substitution' | 'penalty_miss' | 'var';
  team: 'home' | 'away';
  player: string;
  sub_player?: string; // player in / assist
  score_after?: string;
  description?: string;
}

export interface PlayerLineup {
  id: string;
  name: string;
  number?: string;
  position: 'G' | 'D' | 'M' | 'F' | 'Sub' | 'Coach';
  role_name?: string;
  rating?: number;
  is_captain?: boolean;
}

export interface MatchLineups {
  match_id: string;
  home_formation: string;
  away_formation: string;
  home_coach?: string;
  away_coach?: string;
  home_starting: PlayerLineup[];
  away_starting: PlayerLineup[];
  home_bench: PlayerLineup[];
  away_bench: PlayerLineup[];
}

export interface LeagueStanding {
  rank: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
  form: Array<'W' | 'D' | 'L'>;
}

export interface MLDatasetRow {
  match_id: string;
  league: string;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  target_outcome: 'HOME_WIN' | 'DRAW' | 'AWAY_WIN';
  home_xg: number;
  away_xg: number;
  xg_difference: number;
  home_possession: number;
  away_possession: number;
  home_shots: number;
  away_shots: number;
  home_shots_on_target: number;
  away_shots_on_target: number;
  shots_on_target_diff: number;
  home_corners: number;
  away_corners: number;
  home_fouls: number;
  away_fouls: number;
  home_yellow_cards: number;
  away_yellow_cards: number;
  home_pass_accuracy: number;
  away_pass_accuracy: number;
  home_dangerous_attacks: number;
  away_dangerous_attacks: number;
}

export interface ProviderHealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'offline';
  cdn_latency_ms: number;
  last_checked: string;
  active_feed_connections: number;
  consecutive_failures: number;
  rate_limit_headroom: string;
  cache_hit_rate_pct: number;
}

export interface LiveEventMessage {
  id: string;
  timestamp: string;
  match_id: string;
  match_title: string;
  event_type: 'GOAL' | 'RED_CARD' | 'YELLOW_CARD' | 'XG_SPIKE' | 'STATUS_CHANGE';
  minute: string;
  message: string;
  score: string;
}

export interface Sport {
  id: number;
  slug: string;
  name: string;
  icon: string;
}

export interface RunPythonResult {
  success: boolean;
  exitCode: number;
  durationMs: number;
  stdout: string;
  stderr: string;
}

export interface PredictionSelection {
  prediction_id: string;
  match_id: string;
  prediction_date: string;
  published_at_utc: string;
  kickoff_utc: string | null;
  league: string;
  home_team: string;
  away_team: string;
  market: string;
  selection: string;
  decimal_odds: number;
  odds_provider: string;
  odds_observed_at_utc: string;
  model_probability: number;
  implied_probability: number;
  estimated_ev: number;
  model_name: string;
  model_version: string;
  data_quality_score: number;
  model_uncertainty: number;
  model_agreement_pct: number;
  rank_position: number;
  status: 'PENDING' | 'WIN' | 'LOST' | 'VOID' | 'UNRESOLVED';
  home_final_score: number | null;
  away_final_score: number | null;
  settled_at_utc: string | null;
  stake_units: number;
  profit_units: number;
  supporting_reasons: string[];
}

export interface PerformanceMetrics {
  total_published: number;
  wins: number;
  losses: number;
  voids: number;
  pending: number;
  win_rate_pct: number;
  roi_pct: number;
  net_profit_units: number;
  total_staked_units: number;
  average_odds: number;
  max_drawdown_units: number;
  longest_win_streak: number;
  longest_loss_streak: number;
  brier_score: number;
}

export interface BacktestReport {
  backtest_run_at: string;
  historical_matches_evaluated: number;
  sample_size: number;
  wins: number;
  losses: number;
  win_rate_pct: number;
  roi_pct: number;
  net_profit_units: number;
  validation_gate_passed: boolean;
  brier_score: number;
  sample_simulations: Array<{
    match: string;
    market: string;
    selection: string;
    odds: number;
    model_prob: number;
    score: string;
    status: 'WIN' | 'LOST';
    profit: number;
  }>;
}

export type LiveEngineCode =
  | '1H_GOALS'
  | '2H_GOALS'
  | 'LATE_1H'
  | 'LATE_2H'
  | 'COMEBACK'
  | 'MOMENTUM_SHIFT'
  | 'NEXT_GOAL';

export interface LiveSignal {
  signal_id: string;
  match_id: string;
  league: string;
  home_team: string;
  away_team: string;
  minute: string;
  score_at_signal: string;
  engine_code: LiveEngineCode;
  market: string;
  selection: string;
  decimal_odds: number;
  bookmaker: string;
  model_probability: number;
  implied_probability: number;
  expected_value: number;
  home_xg: number;
  away_xg: number;
  home_shots_on_target: number;
  home_total_shots: number;
  away_shots_on_target: number;
  away_total_shots: number;
  home_possession: number;
  away_possession: number;
  triggering_evidence: string[];
  status: 'ACTIVE' | 'SETTLED';
  settlement_result: 'PENDING' | 'WIN' | 'LOST' | 'VOID';
  profit_units: number;
  final_score?: string;
  settled_at_minute?: string;
  telegram_dispatched?: number;
  discord_dispatched?: number;
  created_at: string;
  settled_at?: string;
}

export interface LiveMatch {
  id: string;
  home_team: string;
  away_team: string;
  league: string;
  country?: string;
  status: string;
  status_code: string;
  elapsed_minute: string;
  last_sync?: string;
  home_score: string;
  away_score: string;
  stats?: {
    home_xg?: number;
    away_xg?: number;
    home_shots_on_target?: number;
    away_shots_on_target?: number;
    home_total_shots?: number;
    away_total_shots?: number;
    home_possession?: number;
    away_possession?: number;
    home_dangerous_attacks?: number;
    away_dangerous_attacks?: number;
    home_corner_kicks?: number;
    away_corner_kicks?: number;
    home_red_cards?: number;
    away_red_cards?: number;
    home_fouls?: number;
    away_fouls?: number;
    home_saves?: number;
    away_saves?: number;
  };
  pressure_score?: number;
  active_signals?: LiveSignal[];
}

export interface MatchSnapshot {
  minute: number;
  home_score: number;
  away_score: number;
  home_xg: number;
  away_xg: number;
  home_shots_on_target: number;
  away_shots_on_target: number;
  pressure_score: number;
  snapshot_at?: string;
}

export interface LiveSignalsPerformance {
  total_signals: number;
  active_signals: number;
  won_signals: number;
  lost_signals: number;
  void_signals: number;
  settled_count: number;
  win_rate_pct: number;
  net_profit_units: number;
  roi_pct: number;
  avg_odds: number;
  current_streak: number;
  streak_type: 'WIN' | 'LOST' | 'NONE';
  by_engine: Record<
    string,
    {
      total: number;
      won: number;
      lost: number;
      profit: number;
      win_rate: number;
    }
  >;
}

export interface AutomationSettings {
  telegram_enabled: boolean;
  telegram_token: string;
  telegram_chat_id: string;
  telegram_thread_id?: string;
  discord_enabled: boolean;
  discord_webhook_url: string;
  min_odds: number;
  max_odds: number;
  min_ev: number;
  min_prob: number;
  auto_dispatch: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: number;
  quiet_hours_end: number;
  enabled_engines: string[];
}



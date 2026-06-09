'use client';

import Navbar from '@/components/Navbar';
import { getScoringTable } from '@/lib/scoring';

export default function RulesClient() {
  const scoringTable = getScoringTable();

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '1rem' }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.5rem', color: '#1a202c' }}>
          📖 Rules
        </h1>

        <div className="card" style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>🎯 How to Play</h2>
          <ul style={{ paddingLeft: '1.25rem', lineHeight: 2, fontSize: '0.9rem' }}>
            <li>Predict the result of each FIFA World Cup 2026 match</li>
            <li><strong>Group Stage:</strong> Pick Team 1, Draw, or Team 2</li>
            <li><strong>Knockout:</strong> Pick Team 1 or Team 2 (winner after penalties counts)</li>
            <li>Picks lock 30 minutes before kickoff</li>
            <li>Picks are hidden until the match starts</li>
            <li>Missing a pick counts as a wrong pick</li>
          </ul>
        </div>

        <div className="card" style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>📊 Scoring</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Stage</th>
                  <th style={{ padding: '0.5rem', textAlign: 'center', color: '#48bb78' }}>Correct</th>
                  <th style={{ padding: '0.5rem', textAlign: 'center', color: '#f56565' }}>Wrong</th>
                  <th style={{ padding: '0.5rem', textAlign: 'center', color: '#a0aec0' }}>Missed</th>
                </tr>
              </thead>
              <tbody>
                {scoringTable.map((row) => (
                  <tr key={row.stage} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 600 }}>{row.stage}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'center', color: '#48bb78', fontWeight: 700 }}>+{row.correct}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'center', color: '#f56565', fontWeight: 700 }}>{row.wrong}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'center', color: '#a0aec0', fontWeight: 700 }}>{row.missed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>🏆 Tiebreakers</h2>
          <ol style={{ paddingLeft: '1.25rem', lineHeight: 2, fontSize: '0.9rem' }}>
            <li>Total Points (higher)</li>
            <li>Correct Picks (more)</li>
            <li>Longest Winning Streak (higher)</li>
            <li>Wrong Picks (fewer)</li>
            <li>Missed Picks (fewer)</li>
          </ol>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>ℹ️ Other Rules</h2>
          <ul style={{ paddingLeft: '1.25rem', lineHeight: 2, fontSize: '0.9rem' }}>
            <li>Abandoned matches (NR) = 0 points for everyone</li>
            <li>Max 20 players allowed</li>
            <li>Admin approval required to join</li>
            <li>All times shown in your local timezone</li>
          </ul>
        </div>
      </div>
    </>
  );
}

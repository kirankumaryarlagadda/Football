'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';

export default function PrizesClient() {
  const [prizes, setPrizes] = useState<{ first: number; second: number; third: number } | null>(null);

  useEffect(() => {
    fetch('/api/prizes')
      .then((res) => res.json())
      .then((data) => setPrizes(data.prizes || null));
  }, []);

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 500, margin: '0 auto', padding: '1rem' }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.5rem', color: '#1a202c', textAlign: 'center' }}>
          🏆 Prizes
        </h1>
        <div className="card" style={{ textAlign: 'center' }}>
          {prizes ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '2rem' }}>🥇</div>
                <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>1st Place</div>
                <div style={{ color: '#b7791f', fontWeight: 800, fontSize: '1.5rem' }}>₹{prizes.first}</div>
              </div>
              <div>
                <div style={{ fontSize: '2rem' }}>🥈</div>
                <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>2nd Place</div>
                <div style={{ color: '#718096', fontWeight: 800, fontSize: '1.5rem' }}>₹{prizes.second}</div>
              </div>
              <div>
                <div style={{ fontSize: '2rem' }}>🥉</div>
                <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>3rd Place</div>
                <div style={{ color: '#9C4221', fontWeight: 800, fontSize: '1.5rem' }}>₹{prizes.third}</div>
              </div>
            </div>
          ) : (
            <p style={{ color: '#a0aec0' }}>Prize pool not set yet. Check back later!</p>
          )}
        </div>
      </div>
    </>
  );
}

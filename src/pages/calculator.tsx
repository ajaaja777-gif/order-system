import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface CostSetting {
  category: string;
  unit_cost: number;
}

interface CompetitorPrice {
  id: string;
  competitor_name: string;
  board_type: string;
  surface_type: string;
  unit_price: number;
  memo: string;
  created_at: string;
}

const BOARD_CONFIG = {
  MDF: {
    thicknesses: ['2.7t', '3t', '4.5t', '6t', '12t', '15t', '18t', '20t', '22t', '25t', '30t'],
    densities: ['INT', 'DL', 'D', 'R'],
  },
  PB: {
    thicknesses: ['9t', '12t', '15t', '18t', '23t', '30t'],
    densities: ['8형', '11형', '13형', '15형'],
  },
  합판: {
    thicknesses: ['3t', '4.8t', '8.5t', '11.5t', '14.5t', '17.5t'],
    densities: ['일반', '고비중', '방수'],
  },
};

const BOARD_SIZES = ['1220x2440', '1220x2800', '1220x3050', '1525x2440', '1830x2440'];
const ECO_GRADES = ['E1', 'E0', 'SE0'];

// 표면재 세부 규격 (두께 및 단위)
const SURFACE_CONFIG: { [key: string]: { unit: '장' | 'm'; thicknesses: string[] } } = {
  LPM: { unit: '장', thicknesses: ['기본'] },
  PVC: { unit: 'm', thicknesses: ['0.07t', '0.09t', '0.1t', '0.12t', '0.15t', '0.17t', '0.2t', '0.25t'] },
  PP: { unit: 'm', thicknesses: ['0.07t', '0.09t', '0.1t', '0.12t', '0.15t', '0.17t', '0.2t', '0.25t'] },
  PET: { unit: 'm', thicknesses: ['0.15t', '0.2t', '0.25t', '0.3t'] },
  ASA: { unit: 'm', thicknesses: ['0.15t', '0.2t', '0.25t', '0.3t'] },
  포일: { unit: 'm', thicknesses: ['기본'] },
};

export default function Calculator() {
  const [costDb, setCostDb] = useState<{ [key: string]: number }>({});

  // 1. 보드 단가표 관리 탭/필터
  const [tableBoard, setTableBoard] = useState<'MDF' | 'PB' | '합판'>('MDF');
  const [tableDensity, setTableDensity] = useState<string>('INT');

  // 2. 표면재 단가표 관리 탭
  const [tableSurface, setTableSurface] = useState<string>('PVC');

  // 3. 하단 실시간 견적 산출 조건
  const [boardType, setBoardType] = useState<'MDF' | 'PB' | '합판'>('MDF');
  const [thickness, setThickness] = useState('18t');
  const [boardSize, setBoardSize] = useState('1220x2440');
  const [density, setDensity] = useState('INT');
  const [ecoGrade, setEcoGrade] = useState('E1');

  // 표면재 선택 상태
  const [selectedSurfaceType, setSelectedSurfaceType] = useState('LPM');
  const [selectedSurfaceThick, setSelectedSurfaceThick] = useState('기본');
  const [processingType, setProcessingType] = useState<'양면' | '단면'>('양면');

  const [quantity, setQuantity] = useState<number>(100);
  const [transportCost, setTransportCost] = useState<number>(50000);
  const [targetMargin, setTargetMargin] = useState<number>(15);

  const [competitorList, setCompetitorList] = useState<CompetitorPrice[]>([]);
  const [compName, setCompName] = useState('');
  const [compBoard, setCompBoard] = useState('MDF 18t 1220x2440 E1');
  const [compSurface, setCompSurface] = useState('LPM 양면');
  const [compPrice, setCompPrice] = useState<number | ''>('');
  const [compMemo, setCompMemo] = useState('');

  useEffect(() => {
    fetchCostSettings();
    fetchCompetitorPrices();
  }, []);

  useEffect(() => {
    setTableDensity(BOARD_CONFIG[tableBoard].densities[0]);
  }, [tableBoard]);

  useEffect(() => {
    setSelectedSurfaceThick(SURFACE_CONFIG[selectedSurfaceType].thicknesses[0]);
  }, [selectedSurfaceType]);

  const fetchCostSettings = async () => {
    const { data } = await supabase.from('cost_settings').select('*');
    if (data) {
      const dbMap: { [key: string]: number } = {};
      data.forEach((item: CostSetting) => {
        dbMap[item.category] = Number(item.unit_cost);
      });
      setCostDb(dbMap);
      if (dbMap['TARGET_MARGIN']) setTargetMargin(dbMap['TARGET_MARGIN']);
    }
  };

  const fetchCompetitorPrices = async () => {
    const { data } = await supabase.from('competitor_prices').select('*').order('created_at', { ascending: false });
    if (data) setCompetitorList(data);
  };

  const handleCellChange = (key: string, value: number) => {
    setCostDb((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveAllCosts = async () => {
    try {
      const updates = Object.keys(costDb).map((key) => ({
        category: key,
        unit_cost: costDb[key],
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from('cost_settings').upsert(updates, { onConflict: 'category' });
      if (error) throw error;

      alert('보드 및 표면재 전체 원가 단가가 DB에 성공적으로 저장되었습니다!');
    } catch (err: any) {
      alert(`단가 저장 오류: ${err.message}`);
    }
  };

  const handleAddCompetitorPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compName || !compPrice) {
      alert('경쟁업체명과 단가를 입력해 주세요.');
      return;
    }

    const { error } = await supabase.from('competitor_prices').insert([
      {
        competitor_name: compName,
        board_type: compBoard,
        surface_type: compSurface,
        unit_price: Number(compPrice),
        memo: compMemo,
      },
    ]);

    if (error) {
      alert('경쟁사 단가 저장 실패');
    } else {
      alert('경쟁사 단가가 기록되었습니다.');
      setCompName('');
      setCompPrice('');
      setCompMemo('');
      fetchCompetitorPrices();
    }
  };

  const handleDeleteCompetitor = async (id: string) => {
    if (!confirm('해당 기록을 삭제하시겠습니까?')) return;
    await supabase.from('competitor_prices').delete().eq('id', id);
    fetchCompetitorPrices();
  };

  // 1. 원판 자재비 계산
  const fullDensityKey = `${boardType}_${thickness}_${density}_${ecoGrade}`;
  const baseGradeKey = `${boardType}_${thickness}_${ecoGrade}`;
  const boardUnitCost = costDb[fullDensityKey] ?? costDb[baseGradeKey] ?? 0;

  // 2. 표면재 자재비 계산 (요구사항: m당 단가 자재비는 1면당 2.5m 계산)
  const surfaceKey = `SURFACE_${selectedSurfaceType}_${selectedSurfaceThick}`;
  const rawSurfaceCost = costDb[surfaceKey] || 0;
  const surfaceInfo = SURFACE_CONFIG[selectedSurfaceType];

  let calculatedSurfaceCost = 0;
  let surfaceUsageCalcText = '';

  if (surfaceInfo.unit === '장') {
    // LPM (장당 단가)
    const multiplier = processingType === '양면' ? 1 : 0.6;
    calculatedSurfaceCost = rawSurfaceCost * multiplier;
    surfaceUsageCalcText = `장당 ${rawSurfaceCost.toLocaleString()}원 (${processingType})`;
  } else {
    // m당 단가 (PVC, PET, ASA, PP, 포일 등) -> 1면당 2.5m 계산
    const sideCount = processingType === '양면' ? 2 : 1;
    const totalMetersUsed = 2.5 * sideCount; // 양면: 5.0m, 단면: 2.5m
    calculatedSurfaceCost = rawSurfaceCost * totalMetersUsed;
    surfaceUsageCalcText = `1면당 2.5m 기준 (총 ${totalMetersUsed}m × ${rawSurfaceCost.toLocaleString()}원)`;
  }

  const processingUnitCost = costDb['PROCESSING_BASE'] || 3000;
  const lossRate = costDb['LOSS_RATE'] || 5;

  const baseCostPerItem = (boardUnitCost + calculatedSurfaceCost + processingUnitCost) * (1 + lossRate / 100);
  const transportPerItem = quantity > 0 ? transportCost / quantity : 0;

  const totalUnitCost = baseCostPerItem + transportPerItem;
  const totalCost = totalUnitCost * quantity;

  const recommendedUnitPrice = Math.ceil((totalUnitCost / (1 - targetMargin / 100)) / 100) * 100;
  const totalPrice = recommendedUnitPrice * quantity;
  const totalProfit = totalPrice - totalCost;
  const actualMarginRate = totalPrice > 0 ? ((totalProfit / totalPrice) * 100).toFixed(1) : '0';

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '12px', borderBottom: '2px solid #333' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>🧮 원가 단가 관리 및 견적 산출기</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/estimate" style={{ background: '#2563eb', color: '#fff', padding: '6px 12px', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px' }}>📄 견적서 작성</Link>
          <Link href="/admin" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 'bold' }}>수주 대시보드 ➔</Link>
        </div>
      </header>

      {/* 1. 보드 자재 단가 관리 표 */}
      <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>1. 보드 원판 단가 설정 (MDF / PB / 합판)</h2>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>비중 규격별 E1, E0, SE0 원판 단가를 기입하세요.</p>
          </div>
          <button onClick={handleSaveAllCosts} style={{ background: '#059669', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
            💾 전체 단가표 DB 저장
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          {(['MDF', 'PB', '합판'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setTableBoard(tab)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: tableBoard === tab ? '#1e40af' : '#f8fafc',
                color: tableBoard === tab ? '#fff' : '#334155',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              {tab} 단가표
            </button>
          ))}
        </div>

        <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontWeight: 'bold', fontSize: '12px', color: '#475569' }}>비중 필터:</span>
          {BOARD_CONFIG[tableBoard].densities.map((den) => (
            <button
              key={den}
              onClick={() => setTableDensity(den)}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                border: '1px solid #cbd5e1',
                background: tableDensity === den ? '#2563eb' : '#fff',
                color: tableDensity === den ? '#fff' : '#475569',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              {den}
            </button>
          ))}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderTop: '2px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', textAlign: 'center' }}>
                <th style={{ padding: '8px', border: '1px solid #e2e8f0', width: '120px' }}>두께</th>
                <th style={{ padding: '8px', border: '1px solid #e2e8f0', width: '100px' }}>비중</th>
                {ECO_GRADES.map((grade) => (
                  <th key={grade} style={{ padding: '8px', border: '1px solid #e2e8f0' }}>{grade} 단가 (원)</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BOARD_CONFIG[tableBoard].thicknesses.map((th) => (
                <tr key={th} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '6px', border: '1px solid #e2e8f0', fontWeight: 'bold', background: '#f8fafc', textAlign: 'center' }}>{tableBoard} {th}</td>
                  <td style={{ padding: '6px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#2563eb', fontWeight: 'bold' }}>{tableDensity}</td>
                  {ECO_GRADES.map((grade) => {
                    const cellKey = `${tableBoard}_${th}_${tableDensity}_${grade}`;
                    const costVal = costDb[cellKey] ?? 0;
                    return (
                      <td key={grade} style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                        <input
                          type="number"
                          value={costVal === 0 ? '' : costVal}
                          placeholder="0"
                          onChange={(e) => handleCellChange(cellKey, Number(e.target.value))}
                          style={{ width: '95%', padding: '4px', textAlign: 'right', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. 표면재 자재 단가 관리 표 (LPM, PVC, PP, PET, ASA, 포일 / 두께별 구분) */}
      <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '17px', fontWeight: 'bold', margin: '0 0 12px 0', color: '#1e293b' }}>2. 표면재 단가 설정 (LPM / PVC / PP / PET / ASA / 포일)</h2>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {Object.keys(SURFACE_CONFIG).map((surf) => (
            <button
              key={surf}
              onClick={() => setTableSurface(surf)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: tableSurface === surf ? '#0284c7' : '#f8fafc',
                color: tableSurface === surf ? '#fff' : '#334155',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              {surf} ({SURFACE_CONFIG[surf].unit}당)
            </button>
          ))}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f0f9ff', borderTop: '2px solid #0284c7', borderBottom: '1px solid #cbd5e1', textAlign: 'center' }}>
                <th style={{ padding: '8px', border: '1px solid #e2e8f0' }}>표면재 종류</th>
                <th style={{ padding: '8px', border: '1px solid #e2e8f0' }}>두께 규격</th>
                <th style={{ padding: '8px', border: '1px solid #e2e8f0' }}>단가 단위</th>
                <th style={{ padding: '8px', border: '1px solid #e2e8f0' }}>단가 (원)</th>
              </tr>
            </thead>
            <tbody>
              {SURFACE_CONFIG[tableSurface].thicknesses.map((th) => {
                const sKey = `SURFACE_${tableSurface}_${th}`;
                const sCost = costDb[sKey] ?? 0;
                return (
                  <tr key={th} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 'bold' }}>{tableSurface}</td>
                    <td style={{ padding: '6px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#0369a1', fontWeight: 'bold' }}>{th}</td>
                    <td style={{ padding: '6px', border: '1px solid #e2e8f0', textAlign: 'center' }}>원 / {SURFACE_CONFIG[tableSurface].unit}</td>
                    <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                      <input
                        type="number"
                        value={sCost === 0 ? '' : sCost}
                        placeholder="0"
                        onChange={(e) => handleCellChange(sKey, Number(e.target.value))}
                        style={{ width: '95%', padding: '4px', textAlign: 'right', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed #cbd5e1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>기본 가공 임가공비 (원/장)</label>
            <input
              type="number"
              value={costDb['PROCESSING_BASE'] || ''}
              onChange={(e) => handleCellChange('PROCESSING_BASE', Number(e.target.value))}
              style={{ width: '100%', padding: '6px', marginTop: '4px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>기본 로스율 (%)</label>
            <input
              type="number"
              value={costDb['LOSS_RATE'] || ''}
              onChange={(e) => handleCellChange('LOSS_RATE', Number(e.target.value))}
              style={{ width: '100%', padding: '6px', marginTop: '4px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
            />
          </div>
        </div>
      </div>

      {/* 3. 실시간 견적 산출기 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #d1d5db' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginTop: 0, marginBottom: '16px', color: '#2563eb' }}>⚙️ 견적 조건 선택 (표 단가 자동 연동)</h2>

          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>보드 종류</label>
                <select
                  value={boardType}
                  onChange={(e) => {
                    const newType = e.target.value as 'MDF' | 'PB' | '합판';
                    setBoardType(newType);
                    setThickness(BOARD_CONFIG[newType].thicknesses[0]);
                    setDensity(BOARD_CONFIG[newType].densities[0]);
                  }}
                  style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="MDF">MDF</option>
                  <option value="PB">PB</option>
                  <option value="합판">합판</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>두께</label>
                <select value={thickness} onChange={(e) => setThickness(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }}>
                  {BOARD_CONFIG[boardType].thicknesses.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>원판 규격 (mm)</label>
                <select value={boardSize} onChange={(e) => setBoardSize(e.target.value)} style={{ width: '100%', padding: '6px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }}>
                  {BOARD_SIZES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>비중 규격</label>
                <select value={density} onChange={(e) => setDensity(e.target.value)} style={{ width: '100%', padding: '6px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }}>
                  {BOARD_CONFIG[boardType].densities.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>환경 등급</label>
                <select value={ecoGrade} onChange={(e) => setEcoGrade(e.target.value)} style={{ width: '100%', padding: '6px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }}>
                  {ECO_GRADES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 표면재 세부 선택 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>표면재 종류</label>
                <select
                  value={selectedSurfaceType}
                  onChange={(e) => setSelectedSurfaceType(e.target.value)}
                  style={{ width: '100%', padding: '6px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  {Object.keys(SURFACE_CONFIG).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>표면재 두께</label>
                <select
                  value={selectedSurfaceThick}
                  onChange={(e) => setSelectedSurfaceThick(e.target.value)}
                  style={{ width: '100%', padding: '6px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  {SURFACE_CONFIG[selectedSurfaceType].thicknesses.map((th) => (
                    <option key={th} value={th}>{th}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>가공 구분</label>
                <select
                  value={processingType}
                  onChange={(e) => setProcessingType(e.target.value as '양면' | '단면')}
                  style={{ width: '100%', padding: '6px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="양면">양면</option>
                  <option value="단면">단면</option>
                </select>
              </div>
            </div>

            <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '6px', fontSize: '12px', color: '#1e40af' }}>
              <div>보드 원판 단가: <strong>{boardUnitCost.toLocaleString()} 원</strong></div>
              <div>표면재 자재비: <strong>{Math.round(calculatedSurfaceCost).toLocaleString()} 원</strong> ({selectedSurfaceType} {selectedSurfaceThick} / {surfaceUsageCalcText})</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold' }}>발주 수량 (장)</label>
                <input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold' }}>목표 마진율 (%)</label>
                <input type="number" value={targetMargin} onChange={(e) => setTargetMargin(Number(e.target.value))} style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }} />
              </div>
            </div>
          </div>
        </div>

        {/* 원가 분석 결과 */}
        <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginTop: 0, marginBottom: '16px', color: '#166534' }}>📊 당사 견적 분석</h2>
          <div style={{ background: '#fff', padding: '12px', borderRadius: '6px', marginBottom: '8px', border: '1px solid #dcfce7' }}>
            <div style={{ fontSize: '12px', color: '#65a30d' }}>장당 제조원가</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#14532d' }}>{Math.round(totalUnitCost).toLocaleString()} 원</div>
          </div>
          <div style={{ background: '#16a34a', color: '#fff', padding: '14px', borderRadius: '6px', marginBottom: '8px' }}>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>추천 판매 단가 (장당)</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{recommendedUnitPrice.toLocaleString()} 원</div>
            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '2px' }}>총 견적 금액: {totalPrice.toLocaleString()}원</div>
          </div>
          <div style={{ background: '#fff', padding: '14px', borderRadius: '6px', border: '2px solid #22c55e' }}>
            <div style={{ fontSize: '12px', color: '#15803d', fontWeight: 'bold' }}>예상 총 이익 금액</div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#166534' }}>+{totalProfit.toLocaleString()} 원 ({actualMarginRate}%)</div>
          </div>
        </div>
      </div>

      {/* 4. 경쟁사 단가 기록 */}
      <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginTop: 0, marginBottom: '16px', color: '#1e293b' }}>🔍 경쟁사 판매 단가 기록</h2>
        <form onSubmit={handleAddCompetitorPrice} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '20px', background: '#f8fafc', padding: '12px', borderRadius: '6px' }}>
          <input type="text" placeholder="경쟁업체명" value={compName} onChange={(e) => setCompName(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} required />
          <input type="text" placeholder="규격 (예: MDF 18t 1220x2440 E1)" value={compBoard} onChange={(e) => setCompBoard(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
          <input type="text" placeholder="표면재 (예: PET 0.2t 양면)" value={compSurface} onChange={(e) => setCompSurface(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
          <input type="number" placeholder="판매 단가" value={compPrice} onChange={(e) => setCompPrice(e.target.value === '' ? '' : Number(e.target.value))} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} required />
          <input type="text" placeholder="비고" value={compMemo} onChange={(e) => setCompMemo(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
          <button type="submit" style={{ background: '#0284c7', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>+ 저장</button>
        </form>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
              <th style={{ padding: '8px' }}>경쟁업체</th>
              <th style={{ padding: '8px' }}>보드 규격/등급</th>
              <th style={{ padding: '8px' }}>표면재</th>
              <th style={{ padding: '8px' }}>판매 단가</th>
              <th style={{ padding: '8px' }}>비고</th>
              <th style={{ padding: '8px' }}>삭제</th>
            </tr>
          </thead>
          <tbody>
            {competitorList.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>기록된 단가가 없습니다.</td>
              </tr>
            ) : (
              competitorList.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px', fontWeight: 'bold' }}>{item.competitor_name}</td>
                  <td style={{ padding: '8px' }}>{item.board_type}</td>
                  <td style={{ padding: '8px' }}>{item.surface_type}</td>
                  <td style={{ padding: '8px', fontWeight: 'bold', color: '#0284c7' }}>{item.unit_price?.toLocaleString()}원</td>
                  <td style={{ padding: '8px', color: '#64748b' }}>{item.memo || '-'}</td>
                  <td style={{ padding: '8px' }}>
                    <button onClick={() => handleDeleteCompetitor(item.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>삭제</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
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

const BOARD_SPECS = {
  MDF: {
    thicknesses: ['2.7t', '3t', '4.5t', '6t', '12t', '15t', '18t', '20t', '22t', '25t', '30t'],
  },
  PB: {
    thicknesses: ['9t', '12t', '15t', '18t', '23t', '30t'],
  },
  합판: {
    thicknesses: ['3t', '4.8t', '8.5t', '11.5t', '14.5t', '17.5t'],
  },
};

const ECO_GRADES = ['E1', 'E0', 'SE0'];

export default function Calculator() {
  // DB 단가 세팅
  const [costDb, setCostDb] = useState<{ [key: string]: number }>({
    'MDF_18t_E1': 15000,
    'MDF_18t_E0': 16500,
    'MDF_18t_SE0': 18000,
    'MDF_15t_E1': 13000,
    'PB_18t_E1': 12000,
    'LPM_양면': 5000,
    'LPM_단면': 3000,
    'PROCESSING_BASE': 3000,
    'LOSS_RATE': 5,
    'TARGET_MARGIN': 15,
  });

  // 선택된 보드 정보
  const [boardType, setBoardType] = useState('MDF');
  const [thickness, setThickness] = useState('18t');
  const [ecoGrade, setEcoGrade] = useState('E1');
  const [selectedSurface, setSelectedSurface] = useState('LPM_양면');
  
  const [quantity, setQuantity] = useState<number>(100);
  const [transportCost, setTransportCost] = useState<number>(50000);
  const [targetMargin, setTargetMargin] = useState<number>(15);
  const [isEditing, setIsEditing] = useState(false);

  // 경쟁사 단가
  const [competitorList, setCompetitorList] = useState<CompetitorPrice[]>([]);
  const [compName, setCompName] = useState('');
  const [compBoard, setCompBoard] = useState('MDF 18t E1');
  const [compSurface, setCompSurface] = useState('LPM 양면');
  const [compPrice, setCompPrice] = useState<number | ''>('');
  const [compMemo, setCompMemo] = useState('');

  useEffect(() => {
    fetchCostSettings();
    fetchCompetitorPrices();
  }, []);

  const fetchCostSettings = async () => {
    const { data } = await supabase.from('cost_settings').select('*');
    if (data && data.length > 0) {
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

  const handleSaveCostDb = async () => {
    try {
      const updates = Object.keys(costDb).map((key) => ({
        category: key,
        unit_cost: costDb[key],
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from('cost_settings').upsert(updates, { onConflict: 'category' });
      if (error) throw error;

      alert('원가 단가가 정상 저장되었습니다.');
      setIsEditing(false);
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
      alert('경쟁사 단가가 저장되었습니다.');
      setCompName('');
      setCompPrice('');
      setCompMemo('');
      fetchCompetitorPrices();
    }
  };

  const handleDeleteCompetitor = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    await supabase.from('competitor_prices').delete().eq('id', id);
    fetchCompetitorPrices();
  };

  // 보드 조합 키 생성 (예: MDF_18t_E1)
  const currentBoardKey = `${boardType}_${thickness}_${ecoGrade}`;
  const boardUnitCost = costDb[currentBoardKey] || 0;
  const surfaceUnitCost = costDb[selectedSurface] || 0;
  const processingUnitCost = costDb['PROCESSING_BASE'] || 0;
  const lossRate = costDb['LOSS_RATE'] || 0;

  const baseCostPerItem = (boardUnitCost + surfaceUnitCost + processingUnitCost) * (1 + lossRate / 100);
  const transportPerItem = quantity > 0 ? transportCost / quantity : 0;
  
  const totalUnitCost = baseCostPerItem + transportPerItem;
  const totalCost = totalUnitCost * quantity;

  const recommendedUnitPrice = Math.ceil((totalUnitCost / (1 - targetMargin / 100)) / 100) * 100;
  const totalPrice = recommendedUnitPrice * quantity;
  const totalProfit = totalPrice - totalCost;
  const actualMarginRate = totalPrice > 0 ? ((totalProfit / totalPrice) * 100).toFixed(1) : '0';

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '12px', borderBottom: '2px solid #333' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>🧮 규격/등급별 원가 단가 관리기</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/estimate" style={{ background: '#2563eb', color: '#fff', padding: '6px 12px', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px' }}>📄 견적서 작성</Link>
          <Link href="/admin" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 'bold' }}>수주 대시보드 ➔</Link>
        </div>
      </header>

      {/* 1. 보드 규격 및 환경등급별 세부 단가 관리 */}
      <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>💾 저장된 규격/등급별 원판 기본 단가</h2>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              ⚙️ 단가 세부 수정
            </button>
          ) : (
            <button onClick={handleSaveCostDb} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              💾 수정사항 DB 저장
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', fontSize: '13px' }}>
          {Object.keys(costDb).map((key) => (
            <div key={key} style={{ background: '#fff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 'bold' }}>{key}</div>
              {isEditing ? (
                <input
                  type="number"
                  value={costDb[key]}
                  onChange={(e) => setCostDb({ ...costDb, [key]: Number(e.target.value) })}
                  style={{ width: '100%', padding: '4px', border: '1px solid #94a3b8', borderRadius: '4px' }}
                />
              ) : (
                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#0f172a' }}>
                  {key.includes('RATE') || key.includes('MARGIN') ? `${costDb[key]}%` : `${costDb[key].toLocaleString()}원`}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 2. 보드 규격/등급 동적 선택 및 원가 산출 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #d1d5db' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginTop: 0, marginBottom: '16px', color: '#2563eb' }}>📦 품목 규격/등급 설정</h2>
          
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>보드 종류</label>
                <select
                  value={boardType}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setBoardType(newType);
                    setThickness(BOARD_SPECS[newType as keyof typeof BOARD_SPECS].thicknesses[0]);
                  }}
                  style={{ width: '100%', padding: '6px', marginTop: '4px' }}
                >
                  <option value="MDF">MDF</option>
                  <option value="PB">PB</option>
                  <option value="합판">합판</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>두께</label>
                <select value={thickness} onChange={(e) => setThickness(e.target.value)} style={{ width: '100%', padding: '6px', marginTop: '4px' }}>
                  {BOARD_SPECS[boardType as keyof typeof BOARD_SPECS].thicknesses.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>환경등급</label>
                <select value={ecoGrade} onChange={(e) => setEcoGrade(e.target.value)} style={{ width: '100%', padding: '6px', marginTop: '4px' }}>
                  {ECO_GRADES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '6px', fontSize: '13px', color: '#1e40af' }}>
              매칭 키: <strong>{currentBoardKey}</strong> | 원판 단가: <strong>{boardUnitCost > 0 ? `${boardUnitCost.toLocaleString()}원` : '단가 미등록'}</strong>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 'bold' }}>표면재 선택</label>
              <select value={selectedSurface} onChange={(e) => setSelectedSurface(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '4px' }}>
                <option value="LPM_양면">LPM 양면 ({costDb['LPM_양면']?.toLocaleString()}원)</option>
                <option value="LPM_단면">LPM 단면 ({costDb['LPM_단면']?.toLocaleString()}원)</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold' }}>수량 (장)</label>
                <input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold' }}>목표 마진 (%)</label>
                <input type="number" value={targetMargin} onChange={(e) => setTargetMargin(Number(e.target.value))} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
              </div>
            </div>
          </div>
        </div>

        {/* 원가 분석 결과 */}
        <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginTop: 0, marginBottom: '16px', color: '#166534' }}>📊 산출 분석 결과</h2>
          <div style={{ background: '#fff', padding: '12px', borderRadius: '6px', marginBottom: '8px', border: '1px solid #dcfce7' }}>
            <div style={{ fontSize: '12px', color: '#65a30d' }}>장당 원가 ({currentBoardKey} 기준)</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{Math.round(totalUnitCost).toLocaleString()} 원</div>
          </div>
          <div style={{ background: '#16a34a', color: '#fff', padding: '12px', borderRadius: '6px', marginBottom: '8px' }}>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>추천 판매 단가 (장당)</div>
            <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{recommendedUnitPrice.toLocaleString()} 원</div>
          </div>
          <div style={{ background: '#fff', padding: '12px', borderRadius: '6px', border: '2px solid #22c55e' }}>
            <div style={{ fontSize: '12px', color: '#15803d' }}>예상 총 이익 금액</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#166534' }}>+{totalProfit.toLocaleString()} 원 ({actualMarginRate}%)</div>
          </div>
        </div>
      </div>

      {/* 3. 경쟁사 단가 기록 */}
      <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginTop: 0, marginBottom: '16px', color: '#1e293b' }}>🔍 경쟁사 판매 단가 기록</h2>
        <form onSubmit={handleAddCompetitorPrice} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '20px', background: '#f8fafc', padding: '12px', borderRadius: '6px' }}>
          <input type="text" placeholder="경쟁업체명" value={compName} onChange={(e) => setCompName(e.target.value)} style={{ padding: '8px' }} required />
          <input type="text" placeholder="규격 (예: MDF 18t E1)" value={compBoard} onChange={(e) => setCompBoard(e.target.value)} style={{ padding: '8px' }} />
          <input type="text" placeholder="표면재 (예: LPM 양면)" value={compSurface} onChange={(e) => setCompSurface(e.target.value)} style={{ padding: '8px' }} />
          <input type="number" placeholder="판매 단가" value={compPrice} onChange={(e) => setCompPrice(e.target.value === '' ? '' : Number(e.target.value))} style={{ padding: '8px' }} required />
          <input type="text" placeholder="비고" value={compMemo} onChange={(e) => setCompMemo(e.target.value)} style={{ padding: '8px' }} />
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
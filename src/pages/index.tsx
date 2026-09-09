import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- 인터페이스 정의 ---
interface Item {
  board_type: string;
  thickness: string;
  density: string;
  eco_grade: string;
  surface_type: string;
  processing_type: string;
  pattern: string;
  width: number;
  length: number;
  quantity: number;
  item_memo: string;
}

interface Company {
  id: string;
  company_name: string;
  contact_person?: string;
  phone?: string;
}

interface OrderItem {
  id: string;
  board_type: string;
  thickness: string;
  density: string;
  eco_grade: string;
  surface_type: string;
  processing_type: string;
  pattern: string;
  width: number;
  length: number;
  quantity: number;
  item_memo: string;
}

interface Order {
  id: string;
  order_number: string;
  company_name: string;
  delivery_date: string;
  overall_memo: string;
  status: string;
  created_at: string;
  order_items: OrderItem[];
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

interface EstimateItem {
  id: number;
  itemName: string;
  spec: string;
  qty: number;
  unitPrice: number;
  memo: string;
}

// --- 보드 및 표면재 상수 설정 ---
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

const SURFACE_CONFIG: { [key: string]: { unit: '장' | 'm'; thicknesses: string[] } } = {
  LPM: { unit: '장', thicknesses: ['기본'] },
  PVC: { unit: 'm', thicknesses: ['0.07t', '0.09t', '0.1t', '0.12t', '0.15t', '0.17t', '0.2t', '0.25t'] },
  PP: { unit: 'm', thicknesses: ['0.07t', '0.09t', '0.1t', '0.12t', '0.15t', '0.17t', '0.2t', '0.25t'] },
  PET: { unit: 'm', thicknesses: ['0.15t', '0.2t', '0.25t', '0.3t'] },
  ASA: { unit: 'm', thicknesses: ['0.15t', '0.2t', '0.25t', '0.3t'] },
  포일: { unit: 'm', thicknesses: ['기본'] },
};

export default function MainIntegratedSystem() {
  const [activeTab, setActiveTab] = useState<'order' | 'admin' | 'calculator' | 'estimate' | 'companies'>('order');

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px', fontFamily: 'sans-serif', background: '#f8fafc', minHeight: '100vh' }}>
      {/* 📌 상단 원스톱 마스터 메인 헤더 & 네비게이션 탭 */}
      <header style={{ background: '#1e293b', padding: '16px 20px', borderRadius: '12px', color: '#fff', marginBottom: '20px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold' }}>🏭 표면재 가공 통합 생산/원가/발주 관리 시스템</h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>모든 발주, 원가, 견적, 수주 관리를 한곳에서 처리합니다.</p>
          </div>
          <div style={{ background: '#334155', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', color: '#38bdf8' }}>
            ● 시스템 정상 가동 중
          </div>
        </div>

        {/* 탭 메인 네비게이션 */}
        <nav style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'order', label: '📋 발주서 작성', desc: '발주처 전용' },
            { id: 'admin', label: '🏭 수주 관리 대시보드', desc: '생산/출고 상태' },
            { id: 'calculator', label: '🧮 원가 단가 관리 & 계산기', desc: '단가표 / 마진 산출' },
            { id: 'estimate', label: '📄 견적서 작성 및 출력', desc: 'A4 정식 견적서' },
            { id: 'companies', label: '🏢 거래처 관리', desc: '거래처 등록' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === tab.id ? '#2563eb' : '#334155',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
            >
              <div>{tab.label}</div>
              <div style={{ fontSize: '10px', opacity: 0.7, fontWeight: 'normal' }}>{tab.desc}</div>
            </button>
          ))}
        </nav>
      </header>

      {/* 📌 선택된 탭 컨텐츠 출력 */}
      <main>
        {activeTab === 'order' && <OrderSection />}
        {activeTab === 'admin' && <AdminSection />}
        {activeTab === 'calculator' && <CalculatorSection />}
        {activeTab === 'estimate' && <EstimateSection />}
        {activeTab === 'companies' && <CompaniesSection />}
      </main>
    </div>
  );
}

// ==========================================
// 1. 발주서 작성 탭 콤포넌트
// ==========================================
function OrderSection() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [overallMemo, setOverallMemo] = useState('');

  const [items, setItems] = useState<Item[]>([
    {
      board_type: 'MDF',
      thickness: '18t',
      density: 'INT',
      eco_grade: 'E1',
      surface_type: 'LPM',
      processing_type: '양면',
      pattern: '',
      width: 1220,
      length: 2440,
      quantity: 1,
      item_memo: '',
    },
  ]);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    const { data } = await supabase.from('companies').select('*').order('company_name');
    if (data) setCompanies(data);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        board_type: 'MDF',
        thickness: '18t',
        density: 'INT',
        eco_grade: 'E1',
        surface_type: 'LPM',
        processing_type: '양면',
        pattern: '',
        width: 1220,
        length: 2440,
        quantity: 1,
        item_memo: '',
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) {
      alert('거래처를 선택해 주세요.');
      return;
    }

    try {
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{ order_number: orderNumber, company_name: selectedCompany, delivery_date: deliveryDate || null, overall_memo: overallMemo, status: '신규접수' }])
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItemsToInsert = items.map((item) => ({
        order_id: orderData.id,
        board_type: item.board_type,
        thickness: item.thickness,
        density: item.density,
        eco_grade: item.eco_grade,
        surface_type: item.surface_type,
        processing_type: item.processing_type,
        pattern: item.pattern,
        width: Number(item.width),
        length: Number(item.length),
        quantity: Number(item.quantity),
        item_memo: item.item_memo,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItemsToInsert);
      if (itemsError) throw itemsError;

      alert(`발주서가 성공적으로 제출되었습니다! (발주번호: ${orderNumber})`);
      setSelectedCompany('');
      setDeliveryDate('');
      setOverallMemo('');
    } catch (err: any) {
      alert(`제출 중 오류: ${err.message}`);
    }
  };

  return (
    <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginTop: 0, marginBottom: '16px' }}>📋 가공 발주서 작성 (발주처 전용)</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>거래처 선택 *</label>
            <input
              type="text"
              list="company-list"
              placeholder="거래처 검색 또는 직접 입력"
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              required
            />
            <datalist id="company-list">
              {companies.map((c) => (
                <option key={c.id} value={c.company_name} />
              ))}
            </datalist>
          </div>
          <div style={{ width: '200px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>희망 납기일</label>
            <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
          </div>
        </div>

        {items.map((item, index) => (
          <div key={index} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '16px', background: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontWeight: 'bold', color: '#2563eb' }}>품목 #{index + 1}</span>
              {items.length > 1 && (
                <button type="button" onClick={() => removeItem(index)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>삭제</button>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b' }}>보드 종류</label>
                <select value={item.board_type} onChange={(e) => {
                  const newItems = [...items];
                  newItems[index].board_type = e.target.value;
                  setItems(newItems);
                }} style={{ width: '100%', padding: '6px' }}>
                  <option value="MDF">MDF</option>
                  <option value="PB">PB</option>
                  <option value="합판">합판</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b' }}>두께</label>
                <input type="text" value={item.thickness} onChange={(e) => {
                  const newItems = [...items];
                  newItems[index].thickness = e.target.value;
                  setItems(newItems);
                }} style={{ width: '100%', padding: '6px' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b' }}>표면재</label>
                <select value={item.surface_type} onChange={(e) => {
                  const newItems = [...items];
                  newItems[index].surface_type = e.target.value;
                  setItems(newItems);
                }} style={{ width: '100%', padding: '6px' }}>
                  <option value="LPM">LPM</option>
                  <option value="PVC">PVC</option>
                  <option value="PP">PP</option>
                  <option value="PET">PET</option>
                  <option value="ASA">ASA</option>
                  <option value="포일">포일</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b' }}>수량 (장)</label>
                <input type="number" value={item.quantity} onChange={(e) => {
                  const newItems = [...items];
                  newItems[index].quantity = Number(e.target.value);
                  setItems(newItems);
                }} style={{ width: '100%', padding: '6px' }} />
              </div>
            </div>
          </div>
        ))}

        <button type="button" onClick={addItem} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '16px' }}>+ 품목 추가</button>
        <button type="submit" style={{ width: '100%', background: '#2563eb', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>발주서 제출하기</button>
      </form>
    </div>
  );
}

// ==========================================
// 2. 수주 관리 대시보드 탭 콤포넌트
// ==========================================
function AdminSection() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  const updateStatus = async (orderId: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    fetchOrders();
  };

  return (
    <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginTop: 0, marginBottom: '16px' }}>🏭 수주 접수 현황 관리</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
            <th style={{ padding: '8px' }}>발주번호</th>
            <th style={{ padding: '8px' }}>거래처명</th>
            <th style={{ padding: '8px' }}>품목수</th>
            <th style={{ padding: '8px' }}>진행 상태</th>
            <th style={{ padding: '8px' }}>상태 변경</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '8px', fontWeight: 'bold' }}>{o.order_number}</td>
              <td style={{ padding: '8px' }}>{o.company_name}</td>
              <td style={{ padding: '8px' }}>{o.order_items?.length || 0}건</td>
              <td style={{ padding: '8px', fontWeight: 'bold', color: '#2563eb' }}>{o.status}</td>
              <td style={{ padding: '8px' }}>
                <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)} style={{ padding: '4px' }}>
                  <option value="신규접수">신규접수</option>
                  <option value="가공중">가공중</option>
                  <option value="출고대기">출고대기</option>
                  <option value="완료">완료</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ==========================================
// 3. 원가 단가 관리 & 실시간 계산기 탭 콤포넌트
// ==========================================
function CalculatorSection() {
  const [costDb, setCostDb] = useState<{ [key: string]: number }>({});
  const [tableBoard, setTableBoard] = useState<'MDF' | 'PB' | '합판'>('MDF');
  const [tableDensity, setTableDensity] = useState<string>('INT');
  const [tableSurface, setTableSurface] = useState<string>('PVC');

  const [boardType, setBoardType] = useState<'MDF' | 'PB' | '합판'>('MDF');
  const [thickness, setThickness] = useState('18t');
  const [boardSize, setBoardSize] = useState('1220x2440');
  const [density, setDensity] = useState('INT');
  const [ecoGrade, setEcoGrade] = useState('E1');

  const [selectedSurfaceType, setSelectedSurfaceType] = useState('LPM');
  const [selectedSurfaceThick, setSelectedSurfaceThick] = useState('기본');
  const [processingType, setProcessingType] = useState<'양면' | '단면'>('양면');
  const [quantity, setQuantity] = useState<number>(100);
  const [targetMargin, setTargetMargin] = useState<number>(15);

  useEffect(() => {
    fetchCostSettings();
  }, []);

  const fetchCostSettings = async () => {
    const { data } = await supabase.from('cost_settings').select('*');
    if (data) {
      const dbMap: { [key: string]: number } = {};
      data.forEach((item: any) => { dbMap[item.category] = Number(item.unit_cost); });
      setCostDb(dbMap);
    }
  };

  const handleCellChange = (key: string, value: number) => {
    setCostDb((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveAllCosts = async () => {
    const updates = Object.keys(costDb).map((key) => ({ category: key, unit_cost: costDb[key], updated_at: new Date().toISOString() }));
    await supabase.from('cost_settings').upsert(updates, { onConflict: 'category' });
    alert('전체 원가 단가가 성공적으로 저장되었습니다!');
  };

  const fullDensityKey = `${boardType}_${thickness}_${density}_${ecoGrade}`;
  const boardUnitCost = costDb[fullDensityKey] || 0;

  const surfaceKey = `SURFACE_${selectedSurfaceType}_${selectedSurfaceThick}`;
  const rawSurfaceCost = costDb[surfaceKey] || 0;
  const surfaceInfo = SURFACE_CONFIG[selectedSurfaceType];

  let calculatedSurfaceCost = 0;
  if (surfaceInfo?.unit === '장') {
    calculatedSurfaceCost = rawSurfaceCost * (processingType === '양면' ? 1 : 0.6);
  } else {
    calculatedSurfaceCost = rawSurfaceCost * 2.5 * (processingType === '양면' ? 2 : 1);
  }

  const processingUnitCost = costDb['PROCESSING_BASE'] || 3000;
  const lossRate = costDb['LOSS_RATE'] || 5;

  const baseCostPerItem = (boardUnitCost + calculatedSurfaceCost + processingUnitCost) * (1 + lossRate / 100);
  const recommendedUnitPrice = Math.ceil((baseCostPerItem / (1 - targetMargin / 100)) / 100) * 100;
  const totalPrice = recommendedUnitPrice * quantity;
  const totalProfit = totalPrice - baseCostPerItem * quantity;

  return (
    <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>🧮 원가 단가 매트릭스 & 실시간 산출기</h2>
        <button onClick={handleSaveAllCosts} style={{ background: '#059669', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>💾 전체 단가표 DB 저장</button>
      </div>

      {/* 보드 단가표 */}
      <div style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '14px', margin: '0 0 8px 0' }}>1. 보드 단가표 기입</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ padding: '6px', border: '1px solid #ddd' }}>두께</th>
                {ECO_GRADES.map((g) => <th key={g} style={{ padding: '6px', border: '1px solid #ddd' }}>{g} (원)</th>)}
              </tr>
            </thead>
            <tbody>
              {BOARD_CONFIG[tableBoard].thicknesses.map((th) => (
                <tr key={th}>
                  <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold' }}>{th}</td>
                  {ECO_GRADES.map((g) => {
                    const k = `${tableBoard}_${th}_${tableDensity}_${g}`;
                    return (
                      <td key={g} style={{ padding: '4px', border: '1px solid #ddd' }}>
                        <input type="number" value={costDb[k] || ''} onChange={(e) => handleCellChange(k, Number(e.target.value))} style={{ width: '90%', textAlign: 'right' }} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 실시간 계산 결과 */}
      <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
        <h3 style={{ fontSize: '16px', margin: '0 0 8px 0', color: '#166534' }}>📊 실시간 계산 산출 결과</h3>
        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>장당 제조원가: {Math.round(baseCostPerItem).toLocaleString()} 원</div>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#16a34a' }}>추천 판매 단가: {recommendedUnitPrice.toLocaleString()} 원</div>
        <div style={{ fontSize: '14px', color: '#15803d' }}>총 이익 금액: +{totalProfit.toLocaleString()} 원</div>
      </div>
    </div>
  );
}

// ==========================================
// 4. 견적서 작성 및 A4/PDF 출력 탭 콤포넌트
// ==========================================
function EstimateSection() {
  const [items, setItems] = useState<EstimateItem[]>([
    { id: 1, itemName: 'MDF 18t (LPM 양면)', spec: '1220 × 2440 mm', qty: 100, unitPrice: 23000, memo: '화이트 무광' },
  ]);

  const totalSupply = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
  const totalVat = Math.round(totalSupply * 0.1);
  const grandTotal = totalSupply + totalVat;

  return (
    <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>📄 견적서 작성 및 A4 출력</h2>
        <button onClick={() => window.print()} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>🖨️ A4/PDF 출력</button>
      </div>
      <div style={{ border: '2px solid #333', padding: '20px' }}>
        <h2 style={{ textAlign: 'center', letterSpacing: '8px' }}>견 적 서</h2>
        <div style={{ background: '#f1f5f9', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>
          총 견적합계 (VAT 포함): {grandTotal.toLocaleString()} 원
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 5. 거래처 관리 탭 콤포넌트
// ==========================================
function CompaniesSection() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [name, setName] = useState('');

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    const { data } = await supabase.from('companies').select('*').order('company_name');
    if (data) setCompanies(data);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('companies').insert([{ company_name: name }]);
    setName('');
    fetchCompanies();
  };

  return (
    <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginTop: 0, marginBottom: '16px' }}>🏢 거래처 등록 및 관리</h2>
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input type="text" placeholder="신규 거래처명" value={name} onChange={(e) => setName(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} required />
        <button type="submit" style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>+ 추가</button>
      </form>
      <ul>
        {companies.map((c) => (
          <li key={c.id} style={{ padding: '6px 0' }}>{c.company_name}</li>
        ))}
      </ul>
    </div>
  );
}
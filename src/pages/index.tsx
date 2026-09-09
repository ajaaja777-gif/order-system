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

interface EstimateItem {
  id: number;
  itemName: string;
  spec: string;
  qty: number;
  unitPrice: number;
  memo: string;
}

// --- 보드 및 표면재 규격 체계 ---
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

// 관리자 기본 접속 비밀번호
const ADMIN_PASSWORD = '1234';

export default function MainIntegratedSystem() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'order' | 'admin' | 'calculator' | 'estimate' | 'companies'>('order');
  const [passwordInput, setPasswordInput] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAdminLoggedIn(true);
      setShowLoginModal(false);
      setPasswordInput('');
      setActiveTab('admin');
      alert('관리자 모드로 로그인되었습니다.');
    } else {
      alert('비밀번호가 일치하지 않습니다.');
    }
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    setActiveTab('order');
    alert('로그아웃되었습니다 (발주처 화면으로 전환).');
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px', fontFamily: 'sans-serif', background: '#f8fafc', minHeight: '100vh' }}>
      {/* 📌 마스터 헤더 */}
      <header style={{ background: '#1e293b', padding: '16px 20px', borderRadius: '12px', color: '#fff', marginBottom: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold' }}>🏭 표면재 가공 통합 발주/생산 관리 시스템</h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
              {isAdminLoggedIn ? '🔑 관리자 모드 접속 중 (모든 데이터 접근 권한 활성화)' : '📋 발주처 전용 발주 접수 화면'}
            </p>
          </div>

          <div>
            {isAdminLoggedIn ? (
              <button onClick={handleLogout} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>
                🔓 관리자 로그아웃
              </button>
            ) : (
              <button onClick={() => setShowLoginModal(true)} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>
                🔒 당사 관리자 로그인
              </button>
            )}
          </div>
        </div>

        {/* 탭 메인 네비게이션 */}
        <nav style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('order')}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'order' ? '#2563eb' : '#334155',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div>📋 발주서 작성</div>
            <div style={{ fontSize: '10px', opacity: 0.7, fontWeight: 'normal' }}>발주처 공용</div>
          </button>

          {/* 관리자 모드 시에만 오픈되는 메뉴들 */}
          {isAdminLoggedIn && (
            <>
              <button
                onClick={() => setActiveTab('admin')}
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === 'admin' ? '#2563eb' : '#334155',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div>🏭 수주 관리 대시보드</div>
                <div style={{ fontSize: '10px', opacity: 0.7, fontWeight: 'normal' }}>생산/출고 상태</div>
              </button>

              <button
                onClick={() => setActiveTab('calculator')}
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === 'calculator' ? '#2563eb' : '#334155',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div>🧮 원가 단가 관리 & 계산기</div>
                <div style={{ fontSize: '10px', opacity: 0.7, fontWeight: 'normal' }}>단가표 / 마진 산출</div>
              </button>

              <button
                onClick={() => setActiveTab('estimate')}
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === 'estimate' ? '#2563eb' : '#334155',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div>📄 견적서 작성 및 출력</div>
                <div style={{ fontSize: '10px', opacity: 0.7, fontWeight: 'normal' }}>A4 정식 견적서</div>
              </button>

              <button
                onClick={() => setActiveTab('companies')}
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === 'companies' ? '#2563eb' : '#334155',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div>🏢 거래처 관리</div>
                <div style={{ fontSize: '10px', opacity: 0.7, fontWeight: 'normal' }}>거래처 등록</div>
              </button>
            </>
          )}
        </nav>
      </header>

      {/* 📌 메인 탭 출력 영역 */}
      <main>
        {activeTab === 'order' && <OrderSection />}
        {isAdminLoggedIn && (
          <>
            {activeTab === 'admin' && <AdminSection />}
            {activeTab === 'calculator' && <CalculatorSection />}
            {activeTab === 'estimate' && <EstimateSection />}
            {activeTab === 'companies' && <CompaniesSection />}
          </>
        )}
      </main>

      {/* 🔒 관리자 로그인 모달 */}
      {showLoginModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '320px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', textAlign: 'center', color: '#1e293b' }}>🔒 당사 관리자 로그인</h3>
            <form onSubmit={handleAdminLogin}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#475569' }}>관리자 비밀번호</label>
                <input
                  type="password"
                  placeholder="비밀번호 입력 (기본: 1234)"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  required
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => setShowLoginModal(false)} style={{ flex: 1, padding: '10px', border: 'none', background: '#94a3b8', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>취소</button>
                <button type="submit" style={{ flex: 1, padding: '10px', border: 'none', background: '#2563eb', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>로그인</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 1. 발주서 작성 탭 (발주처 전용)
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
      <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginTop: 0, marginBottom: '16px' }}>📋 표면재 가공 발주서 작성 (발주처용)</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>거래처 선택 / 검색 *</label>
            <input
              type="text"
              list="company-list"
              placeholder="등록된 거래처 검색 또는 직접 입력"
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

        {items.map((item, index) => {
          const currentConfig = BOARD_CONFIG[item.board_type as keyof typeof BOARD_CONFIG] || BOARD_CONFIG.MDF;
          return (
            <div key={index} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '16px', background: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontWeight: 'bold', color: '#2563eb' }}>품목 #{index + 1}</span>
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(index)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>삭제</button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#64748b' }}>보드 종류</label>
                  <select
                    value={item.board_type}
                    onChange={(e) => {
                      const newType = e.target.value as keyof typeof BOARD_CONFIG;
                      const newItems = [...items];
                      newItems[index].board_type = newType;
                      newItems[index].thickness = BOARD_CONFIG[newType].thicknesses[0];
                      newItems[index].density = BOARD_CONFIG[newType].densities[0];
                      setItems(newItems);
                    }}
                    style={{ width: '100%', padding: '6px' }}
                  >
                    <option value="MDF">MDF</option>
                    <option value="PB">PB</option>
                    <option value="합판">합판</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#64748b' }}>두께</label>
                  <select value={item.thickness} onChange={(e) => {
                    const newItems = [...items];
                    newItems[index].thickness = e.target.value;
                    setItems(newItems);
                  }} style={{ width: '100%', padding: '6px' }}>
                    {currentConfig.thicknesses.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#64748b' }}>비중 규격</label>
                  <select value={item.density} onChange={(e) => {
                    const newItems = [...items];
                    newItems[index].density = e.target.value;
                    setItems(newItems);
                  }} style={{ width: '100%', padding: '6px' }}>
                    {currentConfig.densities.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#64748b' }}>환경 등급</label>
                  <select value={item.eco_grade} onChange={(e) => {
                    const newItems = [...items];
                    newItems[index].eco_grade = e.target.value;
                    setItems(newItems);
                  }} style={{ width: '100%', padding: '6px' }}>
                    {ECO_GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#64748b' }}>표면재 종류</label>
                  <select value={item.surface_type} onChange={(e) => {
                    const newItems = [...items];
                    newItems[index].surface_type = e.target.value;
                    setItems(newItems);
                  }} style={{ width: '100%', padding: '6px' }}>
                    {Object.keys(SURFACE_CONFIG).map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#64748b' }}>가공 구분</label>
                  <select value={item.processing_type} onChange={(e) => {
                    const newItems = [...items];
                    newItems[index].processing_type = e.target.value;
                    setItems(newItems);
                  }} style={{ width: '100%', padding: '6px' }}>
                    <option value="양면">양면</option>
                    <option value="단면">단면</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#64748b' }}>패턴 / 색상명</label>
                  <input type="text" placeholder="예: 화이트 무광" value={item.pattern} onChange={(e) => {
                    const newItems = [...items];
                    newItems[index].pattern = e.target.value;
                    setItems(newItems);
                  }} style={{ width: '100%', padding: '6px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#64748b' }}>수량 (장)</label>
                  <input type="number" min="1" value={item.quantity} onChange={(e) => {
                    const newItems = [...items];
                    newItems[index].quantity = Number(e.target.value);
                    setItems(newItems);
                  }} style={{ width: '100%', padding: '6px' }} required />
                </div>
              </div>
            </div>
          );
        })}

        <button type="button" onClick={addItem} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '16px' }}>+ 품목 추가</button>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>전체 요청/메모 사항</label>
          <textarea rows={2} value={overallMemo} onChange={(e) => setOverallMemo(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
        </div>
        <button type="submit" style={{ width: '100%', background: '#2563eb', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>발주서 최종 제출하기</button>
      </form>
    </div>
  );
}

// ==========================================
// 2. 수주 관리 대시보드 탭 (관리자 전용)
// ==========================================
function AdminSection() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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
      <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginTop: 0, marginBottom: '16px' }}>🏭 수주 접수 현황 대시보드 (관리자 전용)</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
            <th style={{ padding: '8px' }}>발주번호</th>
            <th style={{ padding: '8px' }}>거래처명</th>
            <th style={{ padding: '8px' }}>접수일시</th>
            <th style={{ padding: '8px' }}>희망납기일</th>
            <th style={{ padding: '8px' }}>품목수</th>
            <th style={{ padding: '8px' }}>진행 상태</th>
            <th style={{ padding: '8px' }}>상세</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '8px', fontWeight: 'bold' }}>{o.order_number}</td>
              <td style={{ padding: '8px', fontWeight: 'bold', color: '#0f172a' }}>{o.company_name}</td>
              <td style={{ padding: '8px', color: '#64748b' }}>{o.created_at?.slice(0, 10)}</td>
              <td style={{ padding: '8px' }}>{o.delivery_date || '-'}</td>
              <td style={{ padding: '8px' }}>{o.order_items?.length || 0}건</td>
              <td style={{ padding: '8px' }}>
                <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)} style={{ padding: '4px', borderRadius: '4px', fontWeight: 'bold' }}>
                  <option value="신규접수">신규접수</option>
                  <option value="가공중">가공중</option>
                  <option value="출고대기">출고대기</option>
                  <option value="완료">완료</option>
                </select>
              </td>
              <td style={{ padding: '8px' }}>
                <button onClick={() => setSelectedOrder(o)} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>보기</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', maxWidth: '700px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>발주서 상세 #{selectedOrder.order_number}</h3>
              <button onClick={() => setSelectedOrder(null)} style={{ border: 'none', background: '#ef4444', color: '#fff', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>닫기</button>
            </div>
            <p><strong>거래처:</strong> {selectedOrder.company_name} | <strong>요청메모:</strong> {selectedOrder.overall_memo || '없음'}</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={{ padding: '6px', border: '1px solid #ddd' }}>보드</th>
                  <th style={{ padding: '6px', border: '1px solid #ddd' }}>두께</th>
                  <th style={{ padding: '6px', border: '1px solid #ddd' }}>비중</th>
                  <th style={{ padding: '6px', border: '1px solid #ddd' }}>표면재</th>
                  <th style={{ padding: '6px', border: '1px solid #ddd' }}>패턴</th>
                  <th style={{ padding: '6px', border: '1px solid #ddd' }}>수량</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.order_items.map((item) => (
                  <tr key={item.id}>
                    <td style={{ padding: '6px', border: '1px solid #ddd' }}>{item.board_type}</td>
                    <td style={{ padding: '6px', border: '1px solid #ddd' }}>{item.thickness}</td>
                    <td style={{ padding: '6px', border: '1px solid #ddd' }}>{item.density}</td>
                    <td style={{ padding: '6px', border: '1px solid #ddd' }}>{item.surface_type} ({item.processing_type})</td>
                    <td style={{ padding: '6px', border: '1px solid #ddd' }}>{item.pattern || '-'}</td>
                    <td style={{ padding: '6px', border: '1px solid #ddd', fontWeight: 'bold' }}>{item.quantity}장</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 3. 원가 단가 관리 & 실시간 산출기 탭 (관리자 전용)
// ==========================================
function CalculatorSection() {
  const [costDb, setCostDb] = useState<{ [key: string]: number }>({});
  const [tableBoard, setTableBoard] = useState<'MDF' | 'PB' | '합판'>('MDF');
  const [tableDensity, setTableDensity] = useState<string>('INT');
  const [tableSurface, setTableSurface] = useState<string>('PVC');

  const [boardType, setBoardType] = useState<'MDF' | 'PB' | '합판'>('MDF');
  const [thickness, setThickness] = useState('18t');
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
    alert('보드 및 표면재 전체 원가 단가가 DB에 성공적으로 저장되었습니다!');
  };

  const fullDensityKey = `${boardType}_${thickness}_${density}_${ecoGrade}`;
  const baseGradeKey = `${boardType}_${thickness}_${ecoGrade}`;
  const boardUnitCost = costDb[fullDensityKey] ?? costDb[baseGradeKey] ?? 0;

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
  const actualMarginRate = totalPrice > 0 ? ((totalProfit / totalPrice) * 100).toFixed(1) : '0';

  return (
    <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>🧮 원가 단가 매트릭스 & 실시간 산출기 (관리자 전용)</h2>
        <button onClick={handleSaveAllCosts} style={{ background: '#059669', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          💾 전체 단가표 DB 저장
        </button>
      </div>

      {/* 보드 단가표 */}
      <div style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '15px', margin: '0 0 10px 0', color: '#1e293b' }}>1. 보드 원판 단가 기입 (MDF / PB / 합판)</h3>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          {(['MDF', 'PB', '합판'] as const).map((tab) => (
            <button key={tab} onClick={() => setTableBoard(tab)} style={{ padding: '6px 12px', background: tableBoard === tab ? '#1e40af' : '#f8fafc', color: tableBoard === tab ? '#fff' : '#334155', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>{tab}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold' }}>비중 필터:</span>
          {BOARD_CONFIG[tableBoard].densities.map((d) => (
            <button key={d} onClick={() => setTableDensity(d)} style={{ padding: '3px 8px', background: tableDensity === d ? '#2563eb' : '#fff', color: tableDensity === d ? '#fff' : '#333', border: '1px solid #ccc', borderRadius: '3px', fontSize: '12px', cursor: 'pointer' }}>{d}</button>
          ))}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ padding: '6px', border: '1px solid #ddd' }}>두께</th>
                <th style={{ padding: '6px', border: '1px solid #ddd' }}>비중</th>
                {ECO_GRADES.map((g) => <th key={g} style={{ padding: '6px', border: '1px solid #ddd' }}>{g} (원)</th>)}
              </tr>
            </thead>
            <tbody>
              {BOARD_CONFIG[tableBoard].thicknesses.map((th) => (
                <tr key={th}>
                  <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold' }}>{th}</td>
                  <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center', color: '#2563eb' }}>{tableDensity}</td>
                  {ECO_GRADES.map((g) => {
                    const k = `${tableBoard}_${th}_${tableDensity}_${g}`;
                    const costVal = costDb[k] ?? 0;
                    return (
                      <td key={g} style={{ padding: '4px', border: '1px solid #ddd' }}>
                        <input type="number" value={costVal === 0 ? '' : costVal} placeholder="0" onChange={(e) => handleCellChange(k, Number(e.target.value))} style={{ width: '90%', textAlign: 'right', padding: '4px' }} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 표면재 단가표 */}
      <div style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '15px', margin: '0 0 10px 0', color: '#1e293b' }}>2. 표면재 단가 기입 (LPM, PVC, PP, PET, ASA, 포일)</h3>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
          {Object.keys(SURFACE_CONFIG).map((s) => (
            <button key={s} onClick={() => setTableSurface(s)} style={{ padding: '5px 10px', background: tableSurface === s ? '#0284c7' : '#f8fafc', color: tableSurface === s ? '#fff' : '#333', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>{s} ({SURFACE_CONFIG[s].unit}당)</button>
          ))}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ background: '#f0f9ff' }}>
              <th style={{ padding: '6px', border: '1px solid #ddd' }}>표면재</th>
              <th style={{ padding: '6px', border: '1px solid #ddd' }}>두께</th>
              <th style={{ padding: '6px', border: '1px solid #ddd' }}>단위</th>
              <th style={{ padding: '6px', border: '1px solid #ddd' }}>단가 (원)</th>
            </tr>
          </thead>
          <tbody>
            {SURFACE_CONFIG[tableSurface].thicknesses.map((th) => {
              const sk = `SURFACE_${tableSurface}_${th}`;
              const sc = costDb[sk] ?? 0;
              return (
                <tr key={th}>
                  <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold' }}>{tableSurface}</td>
                  <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>{th}</td>
                  <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>원 / {SURFACE_CONFIG[tableSurface].unit}</td>
                  <td style={{ padding: '4px', border: '1px solid #ddd' }}>
                    <input type="number" value={sc === 0 ? '' : sc} placeholder="0" onChange={(e) => handleCellChange(sk, Number(e.target.value))} style={{ width: '90%', textAlign: 'right', padding: '4px' }} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 실시간 산출 결과 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
          <h3 style={{ fontSize: '15px', marginTop: 0 }}>⚙️ 견적 조건 선택</h3>
          <div style={{ display: 'grid', gap: '8px', fontSize: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
              <div>
                <label style={{ fontWeight: 'bold' }}>보드</label>
                <select value={boardType} onChange={(e) => setBoardType(e.target.value as any)} style={{ width: '100%', padding: '4px' }}>
                  <option value="MDF">MDF</option>
                  <option value="PB">PB</option>
                  <option value="합판">합판</option>
                </select>
              </div>
              <div>
                <label style={{ fontWeight: 'bold' }}>두께</label>
                <select value={thickness} onChange={(e) => setThickness(e.target.value)} style={{ width: '100%', padding: '4px' }}>
                  {BOARD_CONFIG[boardType].thicknesses.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontWeight: 'bold' }}>비중</label>
                <select value={density} onChange={(e) => setDensity(e.target.value)} style={{ width: '100%', padding: '4px' }}>
                  {BOARD_CONFIG[boardType].densities.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
              <div>
                <label style={{ fontWeight: 'bold' }}>표면재</label>
                <select value={selectedSurfaceType} onChange={(e) => setSelectedSurfaceType(e.target.value)} style={{ width: '100%', padding: '4px' }}>
                  {Object.keys(SURFACE_CONFIG).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontWeight: 'bold' }}>두께</label>
                <select value={selectedSurfaceThick} onChange={(e) => setSelectedSurfaceThick(e.target.value)} style={{ width: '100%', padding: '4px' }}>
                  {SURFACE_CONFIG[selectedSurfaceType].thicknesses.map((th) => <option key={th} value={th}>{th}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontWeight: 'bold' }}>가공</label>
                <select value={processingType} onChange={(e) => setProcessingType(e.target.value as any)} style={{ width: '100%', padding: '4px' }}>
                  <option value="양면">양면</option>
                  <option value="단면">단면</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontWeight: 'bold' }}>수량 (장)</label>
                <input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} style={{ width: '100%', padding: '4px' }} />
              </div>
              <div>
                <label style={{ fontWeight: 'bold' }}>목표 마진율 (%)</label>
                <input type="number" value={targetMargin} onChange={(e) => setTargetMargin(Number(e.target.value))} style={{ width: '100%', padding: '4px' }} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
          <h3 style={{ fontSize: '15px', marginTop: 0, color: '#166534' }}>📊 실시간 연동 원가 산출 결과</h3>
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '12px', color: '#65a30d' }}>장당 제조원가</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#14532d' }}>{Math.round(baseCostPerItem).toLocaleString()} 원</div>
          </div>
          <div style={{ background: '#16a34a', color: '#fff', padding: '12px', borderRadius: '6px', marginBottom: '8px' }}>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>추천 판매 단가 (장당)</div>
            <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{recommendedUnitPrice.toLocaleString()} 원</div>
          </div>
          <div style={{ background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #22c55e' }}>
            <div style={{ fontSize: '12px', color: '#15803d' }}>예상 총 이익금 (마진율)</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#166534' }}>+{totalProfit.toLocaleString()} 원 ({actualMarginRate}%)</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. 견적서 작성 및 A4/PDF 출력 탭 (관리자 전용)
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
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>📄 정식 견적서 작성 및 A4/PDF 출력 (관리자 전용)</h2>
        <button onClick={() => window.print()} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>🖨️ A4/PDF 출력</button>
      </div>
      <div style={{ border: '2px solid #333', padding: '20px' }}>
        <h2 style={{ textAlign: 'center', letterSpacing: '8px' }}>견 적 서</h2>
        <div style={{ background: '#f1f5f9', padding: '12px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px', margin: '16px 0' }}>
          총 견적합계 (VAT 포함): 일금 {grandTotal.toLocaleString()} 원정 (₩{grandTotal.toLocaleString()})
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 5. 거래처 관리 탭 (관리자 전용)
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
    if (!name) return;
    await supabase.from('companies').insert([{ company_name: name }]);
    setName('');
    fetchCompanies();
  };

  return (
    <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginTop: 0, marginBottom: '16px' }}>🏢 거래처 등록 및 관리 (관리자 전용)</h2>
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input type="text" placeholder="신규 거래처명" value={name} onChange={(e) => setName(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '250px' }} required />
        <button type="submit" style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>+ 거래처 추가</button>
      </form>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
            <th style={{ padding: '8px' }}>등록 거래처명</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((c) => (
            <tr key={c.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '8px', fontWeight: 'bold' }}>{c.company_name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
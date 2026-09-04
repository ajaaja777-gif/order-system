import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
}

export default function Home() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [overallMemo, setOverallMemo] = useState('');

  const [items, setItems] = useState<Item[]>([
    {
      board_type: 'MDF',
      thickness: '18t',
      density: '일반(INT)',
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
        density: '일반(INT)',
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
    if (items.length === 1) {
      alert('최소 1개 이상의 품목이 필요합니다.');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof Item, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) {
      alert('거래처를 선택하거나 직접 입력해 주세요.');
      return;
    }

    try {
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
      
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            order_number: orderNumber,
            company_name: selectedCompany,
            delivery_date: deliveryDate || null,
            overall_memo: overallMemo,
            status: '신규접수',
          },
        ])
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

      alert(`발주서 제출이 완료되었습니다! (발주번호: ${orderNumber})`);
      setSelectedCompany('');
      setDeliveryDate('');
      setOverallMemo('');
      setItems([
        {
          board_type: 'MDF',
          thickness: '18t',
          density: '일반(INT)',
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
    } catch (err: any) {
      console.error(err);
      alert('발주서 제출 중 오류가 발생했습니다.');
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ marginBottom: '24px', paddingBottom: '12px', borderBottom: '2px solid #333' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>📋 표면재 가공 발주서 작성 (발주처용)</h1>
      </header>

      <form onSubmit={handleSubmit}>
        <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '14px' }}>거래처 선택 / 직접 입력 *</label>
              <input
                type="text"
                list="company-list"
                placeholder="등록된 거래처 검색 또는 직접 입력"
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                required
              />
              <datalist id="company-list">
                {companies.map((c) => (
                  <option key={c.id} value={c.company_name} />
                ))}
              </datalist>
            </div>

            <div style={{ width: '220px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '14px' }}>희망 납기일</label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>발주 품목 리스트 ({items.length}건)</h2>
          <button
            type="button"
            onClick={addItem}
            style={{ background: '#059669', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            + 품목 추가하기
          </button>
        </div>

        {items.map((item, index) => (
          <div key={index} style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '16px', marginBottom: '16px', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontWeight: 'bold', color: '#2563eb' }}>품목 #{index + 1}</span>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                >
                  삭제
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280' }}>보드 종류</label>
                <select
                  value={item.board_type}
                  onChange={(e) => handleItemChange(index, 'board_type', e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="MDF">MDF</option>
                  <option value="PB">PB</option>
                  <option value="합판">합판</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#6b7280' }}>두께</label>
                <select
                  value={item.thickness}
                  onChange={(e) => handleItemChange(index, 'thickness', e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="15t">15t</option>
                  <option value="18t">18t</option>
                  <option value="25t">25t</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#6b7280' }}>비중 규격</label>
                <select
                  value={item.density}
                  onChange={(e) => handleItemChange(index, 'density', e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="일반(INT)">일반(INT)</option>
                  <option value="고비중">고비중</option>
                  <option value="방수">방수</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#6b7280' }}>환경 등급</label>
                <select
                  value={item.eco_grade}
                  onChange={(e) => handleItemChange(index, 'eco_grade', e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="E0">E0</option>
                  <option value="E1">E1</option>
                  <option value="SE0">SE0</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#6b7280' }}>표면재 종류</label>
                <select
                  value={item.surface_type}
                  onChange={(e) => handleItemChange(index, 'surface_type', e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="LPM">LPM</option>
                  <option value="HPL">HPL</option>
                  <option value="PET">PET</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#6b7280' }}>가공 구분</label>
                <select
                  value={item.processing_type}
                  onChange={(e) => handleItemChange(index, 'processing_type', e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="양면">양면</option>
                  <option value="단면">단면</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#6b7280' }}>패턴 / 색상명</label>
                <input
                  type="text"
                  placeholder="예: 화이트 무광"
                  value={item.pattern}
                  onChange={(e) => handleItemChange(index, 'pattern', e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#6b7280' }}>가로 (mm)</label>
                <input
                  type="number"
                  value={item.width}
                  onChange={(e) => handleItemChange(index, 'width', e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#6b7280' }}>세로 (mm)</label>
                <input
                  type="number"
                  value={item.length}
                  onChange={(e) => handleItemChange(index, 'length', e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#6b7280' }}>수량 (장) *</label>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '12px', color: '#6b7280' }}>품목 메모</label>
                <input
                  type="text"
                  placeholder="개별 요청사항"
                  value={item.item_memo}
                  onChange={(e) => handleItemChange(index, 'item_memo', e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </div>
        ))}

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '14px' }}>전체 발주 메모 / 배송지 요청사항</label>
          <textarea
            rows={3}
            placeholder="배송 주소 및 하차 방식 등 전체 요청사항"
            value={overallMemo}
            onChange={(e) => setOverallMemo(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
          />
        </div>

        <button
          type="submit"
          style={{ width: '100%', background: '#2563eb', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          총 {items.length}개 품목 발주서 제출하기
        </button>
      </form>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Company {
  id: number;
  company_name: string;
}

interface OrderItem {
  id: string;
  boardType: string;
  thickness: string;
  density: string;
  ecoGrade: string;
  surfaceMaterial: string;
  surfaceSide: string;
  patternColor: string;
  width: string;
  height: string;
  quantity: number;
  itemMemo: string;
}

const BOARD_DATA: Record<string, { thicknesses: string[]; densities: string[]; ecoGrades: string[] }> = {
  MDF: {
    thicknesses: ['2.7t', '3t', '4.5t', '6t', '9t', '12t', '15t', '18t', '20t', '22t', '25t', '30t'],
    densities: ['일반(INT)', 'DL', 'D', 'R'],
    ecoGrades: ['E1', 'E0', 'SE0'],
  },
  PB: {
    thicknesses: ['9t', '12t', '15t', '18t', '23t', '30t'],
    densities: ['8형', '11형', '13형', '15형'],
    ecoGrades: ['E1', 'E0', 'SE0'],
  },
  합판: {
    thicknesses: ['4.8t', '8.5t', '11.5t', '14.5t', '17.5t'],
    densities: ['일반'],
    ecoGrades: ['E1', 'E0'],
  },
};

const SURFACE_MATERIALS = ['LPM', 'PET', 'UV 코팅', 'PVC', '피니싱포일'];

export default function OrderPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [memo, setMemo] = useState('');

  const [items, setItems] = useState<OrderItem[]>([
    {
      id: '1',
      boardType: 'MDF',
      thickness: '18t',
      density: '일반(INT)',
      ecoGrade: 'E1',
      surfaceMaterial: 'LPM',
      surfaceSide: '양면',
      patternColor: '',
      width: '1220',
      height: '2440',
      quantity: 100,
      itemMemo: '',
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchCompanies = async () => {
      const { data } = await supabase.from('companies').select('id, company_name').order('company_name');
      if (data) setCompanies(data);
    };
    fetchCompanies();
  }, []);

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        boardType: 'MDF',
        thickness: '18t',
        density: '일반(INT)',
        ecoGrade: 'E1',
        surfaceMaterial: 'LPM',
        surfaceSide: '양면',
        patternColor: '',
        width: '1220',
        height: '2440',
        quantity: 100,
        itemMemo: '',
      },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length === 1) {
      alert('최소 1개의 품목이 있어야 합니다.');
      return;
    }
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof OrderItem, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'boardType' && BOARD_DATA[value]) {
            updated.thickness = BOARD_DATA[value].thicknesses[0];
            updated.density = BOARD_DATA[value].densities[0];
            updated.ecoGrade = BOARD_DATA[value].ecoGrades[0];
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      alert('거래처명을 선택하거나 직접 입력해 주세요.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const totalQty = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            company_name: companyName.trim(),
            total_quantity: totalQty,
            due_date: dueDate || null,
            memo,
            status: '접수대기',
          },
        ])
        .select();

      if (orderError || !orderData || orderData.length === 0) {
        throw new Error(orderError?.message || '발주서 등록 오류');
      }

      const orderId = orderData[0].id;

      const orderItemsData = items.map((item) => ({
        order_id: orderId,
        board_type: item.boardType,
        thickness: item.thickness,
        density: item.density,
        eco_grade: item.ecoGrade,
        surface_material: item.surfaceMaterial,
        surface_side: item.surfaceSide,
        pattern_color: item.patternColor,
        width: item.width,
        height: item.height,
        quantity: Number(item.quantity),
        memo: item.itemMemo,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItemsData);

      if (itemsError) throw new Error(itemsError.message);

      setMessage(`✅ ${items.length}개 품목 (총 ${totalQty}장) 발주서가 성공적으로 접수되었습니다!`);
      setMemo('');
      setItems([
        {
          id: Date.now().toString(),
          boardType: 'MDF',
          thickness: '18t',
          density: '일반(INT)',
          ecoGrade: 'E1',
          surfaceMaterial: 'LPM',
          surfaceSide: '양면',
          patternColor: '',
          width: '1220',
          height: '2440',
          quantity: 100,
          itemMemo: '',
        },
      ]);
    } catch (err: any) {
      console.error(err);
      setMessage('❌ 저장에 실패했습니다: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">📋 표면재 가공 발주서 작성</h1>
          <div className="flex gap-4 text-sm font-semibold">
            <a href="/companies" className="text-indigo-600 hover:underline">🏢 거래처 관리</a>
            <a href="/admin" className="text-blue-600 hover:underline">수주 대시보드 $\rightarrow$</a>
          </div>
        </div>

        {message && (
          <div className={`p-4 mb-6 rounded-lg font-medium text-center ${message.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">거래처 선택 / 직접 입력 *</label>
              <input
                type="text"
                list="company-list"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="등록된 거래처 검색 또는 직접 입력"
                className="w-full p-2.5 border rounded bg-white text-slate-800 font-medium"
              />
              <datalist id="company-list">
                {companies.map((c) => (
                  <option key={c.id} value={c.company_name} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">희망 납기일</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2.5 border rounded bg-white text-slate-800"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="text-lg font-bold text-slate-800">발주 품목 리스트 ({items.length}건)</h2>
              <button
                type="button"
                onClick={addItem}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700"
              >
                + 품목 추가하기
              </button>
            </div>

            {items.map((item, index) => (
              <div key={item.id} className="p-4 border border-slate-300 rounded-lg bg-slate-50/50 space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-bold text-blue-700">품목 #{index + 1}</span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-xs font-bold text-red-500 hover:text-red-700"
                    >
                      ✕ 품목 삭제
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">보드 종류</label>
                    <select
                      value={item.boardType}
                      onChange={(e) => updateItem(item.id, 'boardType', e.target.value)}
                      className="w-full p-2 border rounded text-slate-800 font-bold bg-white"
                    >
                      <option value="MDF">MDF</option>
                      <option value="PB">PB</option>
                      <option value="합판">합판</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">두께</label>
                    <select
                      value={item.thickness}
                      onChange={(e) => updateItem(item.id, 'thickness', e.target.value)}
                      className="w-full p-2 border rounded text-slate-800 bg-white"
                    >
                      {BOARD_DATA[item.boardType]?.thicknesses.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">비중 규격</label>
                    <select
                      value={item.density}
                      onChange={(e) => updateItem(item.id, 'density', e.target.value)}
                      className="w-full p-2 border rounded text-slate-800 bg-white"
                    >
                      {BOARD_DATA[item.boardType]?.densities.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">환경 등급</label>
                    <select
                      value={item.ecoGrade}
                      onChange={(e) => updateItem(item.id, 'ecoGrade', e.target.value)}
                      className="w-full p-2 border rounded text-slate-800 bg-white"
                    >
                      {BOARD_DATA[item.boardType]?.ecoGrades.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">표면재 종류</label>
                    <select
                      value={item.surfaceMaterial}
                      onChange={(e) => updateItem(item.id, 'surfaceMaterial', e.target.value)}
                      className="w-full p-2 border rounded text-slate-800 bg-white"
                    >
                      {SURFACE_MATERIALS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">가공 구분</label>
                    <select
                      value={item.surfaceSide}
                      onChange={(e) => updateItem(item.id, 'surfaceSide', e.target.value)}
                      className="w-full p-2 border rounded text-slate-800 bg-white"
                    >
                      <option value="양면">양면</option>
                      <option value="단면">단면</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">패턴 / 색상명</label>
                    <input
                      type="text"
                      value={item.patternColor}
                      onChange={(e) => updateItem(item.id, 'patternColor', e.target.value)}
                      placeholder="예: 화이트 무광"
                      className="w-full p-2 border rounded text-slate-800 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">가로 (mm)</label>
                    <input
                      type="text"
                      value={item.width}
                      onChange={(e) => updateItem(item.id, 'width', e.target.value)}
                      className="w-full p-2 border rounded text-slate-800 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">세로 (mm)</label>
                    <input
                      type="text"
                      value={item.height}
                      onChange={(e) => updateItem(item.id, 'height', e.target.value)}
                      className="w-full p-2 border rounded text-slate-800 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">수량 (장) *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                      className="w-full p-2 border rounded text-slate-800 font-bold bg-white"
                    />
                  </div>
                  <div className="col-span-3 md:col-span-1">
                    <label className="block text-xs text-slate-500 mb-1">품목 메모</label>
                    <input
                      type="text"
                      value={item.itemMemo}
                      onChange={(e) => updateItem(item.id, 'itemMemo', e.target.value)}
                      placeholder="개별 요청사항"
                      className="w-full p-2 border rounded text-slate-800 bg-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">전체 발주 메모 / 배송지 요청사항</label>
            <textarea
              rows={2}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="배송 주소 및 하차 방식 등 전체 요청사항"
              className="w-full p-2.5 border rounded text-slate-800"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
          >
            {loading ? '제출 중...' : `총 ${items.length}개 품목 발주서 제출하기`}
          </button>
        </form>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { supabase } from '../lib/supabase';

// 규격 데이터 정의
const BOARD_DATA = {
  MDF: {
    thicknesses: ['2.7t', '3t', '4.5t', '6t', '12t', '15t', '18t', '20t', '22t', '25t', '30t'],
    densities: ['INT', 'DL', 'D', 'R'],
    ecoGrades: ['E1', 'E0', 'SE0'],
  },
  PB: {
    thicknesses: ['9t', '12t', '15t', '18t', '23t', '30t'],
    densities: ['8형', '11형', '13형', '15형'],
    ecoGrades: ['E1', 'E0', 'SE0'],
  },
};

const SURFACE_MATERIALS = ['LPM', 'PET', 'UV 코팅', 'PVC', '피니싱포일'];

export default function OrderPage() {
  const [boardType, setBoardType] = useState<'MDF' | 'PB'>('MDF');
  const [thickness, setThickness] = useState(BOARD_DATA.MDF.thicknesses[0]);
  const [density, setDensity] = useState(BOARD_DATA.MDF.densities[0]);
  const [ecoGrade, setEcoGrade] = useState(BOARD_DATA.MDF.ecoGrades[0]);
  
  const [surfaceMaterial, setSurfaceMaterial] = useState('LPM');
  const [surfaceSide, setSurfaceSide] = useState('양면');
  const [companyName, setCompanyName] = useState('');
  const [patternColor, setPatternColor] = useState('');
  const [quantity, setQuantity] = useState(100);
  const [dueDate, setDueDate] = useState('');
  const [memo, setMemo] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 보드 종류(MDF/PB) 변경 시 세부 옵션 초기화
  const handleBoardChange = (type: 'MDF' | 'PB') => {
    setBoardType(type);
    setThickness(BOARD_DATA[type].thicknesses[0]);
    setDensity(BOARD_DATA[type].densities[0]);
    setEcoGrade(BOARD_DATA[type].ecoGrades[0]);
  };

  // 발주서 제출 함수
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName) {
      alert('거래처명을 입력해주세요.');
      return;
    }

    setLoading(true);
    setMessage('');

    const { error } = await supabase.from('orders').insert([
      {
        company_name: companyName,
        board_type: boardType,
        thickness,
        density,
        eco_grade: ecoGrade,
        surface_material: surfaceMaterial,
        surface_side: surfaceSide,
        pattern_color: patternColor,
        quantity: Number(quantity),
        due_date: dueDate || null,
        memo,
        status: '접수대기',
      },
    ]);

    setLoading(false);

    if (error) {
      console.error(error);
      setMessage('❌ 발주 제출 중 오류가 발생했습니다.');
    } else {
      setMessage('✅ 발주가 성공적으로 접수되었습니다!');
      setPatternColor('');
      setMemo('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-md border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800 text-center mb-6">
          📋 표면재 가공 발주서 작성
        </h1>

        {message && (
          <div className={`p-4 mb-6 rounded-md font-medium text-center ${message.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. 거래처 정보 */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">거래처명 *</label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="회사명을 입력하세요 (예: (주)한샘가구)"
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-800"
            />
          </div>

          <hr className="border-slate-200" />

          {/* 2. 원자재 보드 선택 */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">1. 원자재 보드 선택</label>
            <div className="flex gap-4 mb-4">
              {(['MDF', 'PB'] as const).map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => handleBoardChange(type)}
                  className={`flex-1 py-2.5 rounded-lg font-bold border ${
                    boardType === type
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-lg border">
              <div>
                <label className="block text-xs text-slate-500 mb-1">두께</label>
                <select
                  value={thickness}
                  onChange={(e) => setThickness(e.target.value)}
                  className="w-full p-2 border rounded bg-white text-slate-800"
                >
                  {BOARD_DATA[boardType].thicknesses.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">비중 규격</label>
                <select
                  value={density}
                  onChange={(e) => setDensity(e.target.value)}
                  className="w-full p-2 border rounded bg-white text-slate-800"
                >
                  {BOARD_DATA[boardType].densities.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">환경 등급</label>
                <select
                  value={ecoGrade}
                  onChange={(e) => setEcoGrade(e.target.value)}
                  className="w-full p-2 border rounded bg-white text-slate-800"
                >
                  {BOARD_DATA[boardType].ecoGrades.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* 3. 표면재 선택 */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">2. 표면 마감재 선택</label>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">표면재 종류</label>
                <select
                  value={surfaceMaterial}
                  onChange={(e) => setSurfaceMaterial(e.target.value)}
                  className="w-full p-2.5 border rounded-lg bg-white text-slate-800"
                >
                  {SURFACE_MATERIALS.map((mat) => (
                    <option key={mat} value={mat}>{mat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">가공 구분</label>
                <select
                  value={surfaceSide}
                  onChange={(e) => setSurfaceSide(e.target.value)}
                  className="w-full p-2.5 border rounded-lg bg-white text-slate-800"
                >
                  <option value="양면">양면</option>
                  <option value="단면">단면</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">패턴 / 색상 / 사양</label>
              <input
                type="text"
                value={patternColor}
                onChange={(e) => setPatternColor(e.target.value)}
                placeholder="예: 화이트 무광, 내추럴 오크 등"
                className="w-full p-2.5 border rounded-lg text-slate-800"
              />
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* 4. 수량 및 납기일 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">발주 수량 (장) *</label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full p-2.5 border rounded-lg text-slate-800"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">희망 납기일</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2.5 border rounded-lg text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">기타 요청사항</label>
            <textarea
              rows={3}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="특이사항이 있다면 작성해 주세요."
              className="w-full p-2.5 border rounded-lg text-slate-800"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition duration-200"
          >
            {loading ? '제출 중...' : '발주서 제출하기'}
          </button>
        </form>
      </div>
    </div>
  );
}
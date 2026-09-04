import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';

interface Company {
  id: number;
  company_name: string;
  biz_num: string;
  phone: string;
  address: string;
  memo: string;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  // 개별 등록 폼
  const [companyName, setCompanyName] = useState('');
  const [bizNum, setBizNum] = useState('');
  const [phone, setPhone] = useState('');

  const fetchCompanies = async () => {
    setLoading(true);
    const { data } = await supabase.from('companies').select('*').order('company_name');
    if (data) setCompanies(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // 1. 단건 거래처 추가
  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName) return;

    const { error } = await supabase.from('companies').insert([
      { company_name: companyName, biz_num: bizNum, phone },
    ]);

    if (error) {
      alert('등록 중 오류가 발생했습니다. (중복된 거래처명 확인)');
    } else {
      setCompanyName('');
      setBizNum('');
      setPhone('');
      fetchCompanies();
    }
  };

  // 2. 엑셀 대량 등록
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];

      // 엑셀 데이터를 JSON으로 변환
      const data: any[] = XLSX.utils.sheet_to_json(ws);

      // 데이터 포맷팅 (엑셀 컬럼명 기준: 거래처명, 사업자번호, 연락처, 주소)
      const uploadData = data.map((row) => ({
        company_name: row['거래처명'] || row['회사명'],
        biz_num: row['사업자번호'] || '',
        phone: row['연락처'] || row['전화번호'] || '',
        address: row['주소'] || '',
      })).filter(row => row.company_name);

      if (uploadData.length === 0) {
        alert('엑셀 파일에서 거래처 정보를 읽을 수 없습니다.');
        return;
      }

      const { error } = await supabase.from('companies').upsert(uploadData, { onConflict: 'company_name' });

      if (error) {
        console.error(error);
        alert('엑셀 대량 업로드 중 오류가 발생했습니다.');
      } else {
        alert(`✅ 총 ${uploadData.length}개 거래처가 등록/업데이트되었습니다.`);
        fetchCompanies();
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow border">
          <h1 className="text-2xl font-bold text-slate-800">🏢 거래처 마스터 관리</h1>
          <a href="/admin" className="text-sm font-semibold text-blue-600 hover:underline">
            $\leftarrow$ 수주 대시보드로 돌아가기
          </a>
        </div>

        {/* 엑셀 대량 업로드 & 단건 등록 폼 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow border space-y-4">
            <h2 className="font-bold text-slate-800 text-lg">➕ 거래처 신규 등록</h2>
            <form onSubmit={handleAddCompany} className="space-y-3">
              <input
                type="text"
                required
                placeholder="거래처명 (필수)"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full p-2 border rounded"
              />
              <input
                type="text"
                placeholder="사업자등록번호"
                value={bizNum}
                onChange={(e) => setBizNum(e.target.value)}
                className="w-full p-2 border rounded"
              />
              <input
                type="text"
                placeholder="연락처"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2 border rounded"
              />
              <button type="submit" className="w-full py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700">
                거래처 추가하기
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-xl shadow border space-y-4">
            <h2 className="font-bold text-slate-800 text-lg">📁 엑셀을 통한 대량 등록</h2>
            <p className="text-xs text-slate-500">
              엑셀 첫 번째 행(헤더)에 <strong>'거래처명', '사업자번호', '연락처', '주소'</strong> 컬럼을 포함하여 업로드해 주세요.
            </p>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleExcelUpload}
              className="w-full p-2 border rounded bg-slate-50 text-sm"
            />
          </div>
        </div>

        {/* 거래처 리스트 */}
        <div className="bg-white rounded-xl shadow border overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-800 text-white text-xs uppercase">
              <tr>
                <th className="p-3">NO</th>
                <th className="p-3">거래처명</th>
                <th className="p-3">사업자번호</th>
                <th className="p-3">연락처</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {companies.map((c, idx) => (
                <tr key={c.id}>
                  <td className="p-3">{idx + 1}</td>
                  <td className="p-3 font-bold text-slate-800">{c.company_name}</td>
                  <td className="p-3">{c.biz_num || '-'}</td>
                  <td className="p-3">{c.phone || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
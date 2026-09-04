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

  const [companyName, setCompanyName] = useState('');
  const [bizNum, setBizNum] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const fetchCompanies = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('companies').select('*').order('company_name');
    if (!error && data) setCompanies(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;

    const { error } = await supabase.from('companies').insert([
      { company_name: companyName.trim(), biz_num: bizNum, phone, address },
    ]);

    if (error) {
      alert('등록 중 오류가 발생했습니다. (중복 거래처명 확인)');
    } else {
      setCompanyName('');
      setBizNum('');
      setPhone('');
      setAddress('');
      fetchCompanies();
    }
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        const uploadData = data
          .map((row) => ({
            company_name: String(row['거래처명'] || row['회사명'] || '').trim(),
            biz_num: String(row['사업자번호'] || row['사업자등록번호'] || ''),
            phone: String(row['연락처'] || row['전화번호'] || ''),
            address: String(row['주소'] || ''),
          }))
          .filter((row) => row.company_name);

        if (uploadData.length === 0) {
          alert('엑셀 파일에서 [거래처명] 컬럼을 찾을 수 없습니다.');
          return;
        }

        const { error } = await supabase.from('companies').upsert(uploadData, { onConflict: 'company_name' });

        if (error) {
          console.error(error);
          alert('엑셀 등록 실패: ' + error.message);
        } else {
          alert(`✅ 총 ${uploadData.length}개 거래처가 등록되었습니다.`);
          fetchCompanies();
        }
      } catch (err) {
        alert('엑셀 파일을 읽는 도중 에러가 발생했습니다.');
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow border">
          <h1 className="text-2xl font-bold text-slate-800">🏢 거래처 마스터 관리</h1>
          <div className="flex gap-4">
            <a href="/" className="text-sm font-semibold text-blue-600 hover:underline">
              발주서 작성
            </a>
            <a href="/admin" className="text-sm font-semibold text-blue-600 hover:underline">
              수주 대시보드
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow border space-y-4">
            <h2 className="font-bold text-slate-800 text-lg">➕ 개별 거래처 등록</h2>
            <form onSubmit={handleAddCompany} className="space-y-3">
              <input
                type="text"
                required
                placeholder="거래처명 (필수)"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full p-2.5 border rounded text-slate-800"
              />
              <input
                type="text"
                placeholder="사업자등록번호"
                value={bizNum}
                onChange={(e) => setBizNum(e.target.value)}
                className="w-full p-2.5 border rounded text-slate-800"
              />
              <input
                type="text"
                placeholder="연락처"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 border rounded text-slate-800"
              />
              <input
                type="text"
                placeholder="배송지 주소"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2.5 border rounded text-slate-800"
              />
              <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">
                거래처 등록하기
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-xl shadow border space-y-4">
            <h2 className="font-bold text-slate-800 text-lg">📁 엑셀 파일로 대량 등록</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              엑셀 첫 행(컬럼명)에 <strong>'거래처명', '사업자번호', '연락처', '주소'</strong> 항목이 포함되어 있으면 한 번에 등록됩니다.
            </p>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleExcelUpload}
              className="w-full p-3 border rounded-lg bg-slate-50 text-sm cursor-pointer"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border overflow-x-auto">
          <div className="p-4 border-b font-bold text-slate-700">등록된 거래처 목록 ({companies.length}개)</div>
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-800 text-white text-xs uppercase">
              <tr>
                <th className="p-3">NO</th>
                <th className="p-3">거래처명</th>
                <th className="p-3">사업자번호</th>
                <th className="p-3">연락처</th>
                <th className="p-3">주소</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center">로딩 중...</td>
                </tr>
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-400">등록된 거래처가 없습니다.</td>
                </tr>
              ) : (
                companies.map((c, idx) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono">{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-800">{c.company_name}</td>
                    <td className="p-3">{c.biz_num || '-'}</td>
                    <td className="p-3">{c.phone || '-'}</td>
                    <td className="p-3 text-xs">{c.address || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
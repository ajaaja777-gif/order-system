import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface OrderItem {
  id: number;
  board_type: string;
  thickness: string;
  density: string;
  eco_grade: string;
  surface_material: string;
  surface_side: string;
  pattern_color: string;
  width: string;
  height: string;
  quantity: number;
  memo: string;
}

interface Order {
  id: number;
  created_at: string;
  company_name: string;
  total_quantity: number;
  due_date: string;
  status: string;
  memo: string;
  order_items?: OrderItem[];
}

const STATUS_LIST = ['접수대기', '자재준비', '가공중', '검수완료', '출하/완료'];

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('id', { ascending: false });

    if (!error && data) {
      setOrders(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (id: number, newStatus: string) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id);
    if (!error) fetchOrders();
  };

  const exportToExcel = () => {
    const exportData: any[] = [];

    orders.forEach((o) => {
      if (o.order_items && o.order_items.length > 0) {
        o.order_items.forEach((item) => {
          exportData.push({
            발주번호: `#${o.id}`,
            접수일시: new Date(o.created_at).toLocaleString('ko-KR'),
            거래처명: o.company_name,
            보드종류: item.board_type,
            두께: item.thickness,
            비중: item.density,
            환경등급: item.eco_grade,
            표면재: item.surface_material,
            가공구분: item.surface_side,
            패턴색상: item.pattern_color,
            규격: `${item.width || '-'} x ${item.height || '-'}`,
            수량: item.quantity,
            희망납기일: o.due_date || '-',
            진행상태: o.status,
            메모: o.memo || '',
          });
        });
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '수주내역');
    XLSX.writeFile(workbook, `수주내역_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportToPDF = async () => {
    if (!printRef.current) return;

    const canvas = await html2canvas(printRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`작업지시서_발주번호_${selectedOrder?.id}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow border">
          <h1 className="text-2xl font-bold text-slate-800">🏭 표면재 가공 수주 대시보드</h1>
          <div className="flex gap-2">
            <a href="/companies" className="px-4 py-2 bg-indigo-600 text-white rounded font-semibold text-sm hover:bg-indigo-700">
              🏢 거래처 관리
            </a>
            <button onClick={exportToExcel} className="px-4 py-2 bg-emerald-600 text-white rounded font-semibold text-sm hover:bg-emerald-700">
              📊 엑셀 내보내기
            </button>
            <button onClick={fetchOrders} className="px-3 py-2 bg-slate-700 text-white rounded font-semibold text-sm hover:bg-slate-800">
              🔄 새로고침
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-slate-500">데이터 로딩 중...</div>
        ) : (
          <div className="bg-white rounded-xl shadow border overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-800 text-white text-xs uppercase">
                <tr>
                  <th className="p-3">NO</th>
                  <th className="p-3">거래처명</th>
                  <th className="p-3">총 수량</th>
                  <th className="p-3">품목 내역</th>
                  <th className="p-3">희망납기</th>
                  <th className="p-3">진행 상태</th>
                  <th className="p-3">작업지시서</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-slate-400">접수된 수주 건이 없습니다.</td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold">#{order.id}</td>
                      <td className="p-3 font-semibold text-slate-800">{order.company_name}</td>
                      <td className="p-3 font-bold text-blue-600">{order.total_quantity}장</td>
                      <td className="p-3 text-xs">
                        {order.order_items?.map((item, idx) => (
                          <div key={idx} className="mb-1">
                            • [{item.board_type}] {item.thickness} {item.surface_material}({item.surface_side}) - {item.quantity}장 ({item.width || '-'}x{item.height || '-'})
                          </div>
                        ))}
                      </td>
                      <td className="p-3 text-xs">{order.due_date || '-'}</td>
                      <td className="p-3">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className="p-1 border rounded text-xs bg-white text-slate-800 font-bold"
                        >
                          {STATUS_LIST.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-3 py-1 bg-slate-800 text-white rounded text-xs font-bold hover:bg-slate-900"
                        >
                          📄 지시서 출력
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h2 className="text-xl font-bold">📄 공장 작업지시서 미리보기</h2>
                <button onClick={() => setSelectedOrder(null)} className="text-slate-500 font-bold">✕ 닫기</button>
              </div>

              <div ref={printRef} className="p-6 bg-white border rounded space-y-4 text-slate-800">
                <div className="text-center border-b pb-4">
                  <h1 className="text-2xl font-bold tracking-widest">표면재 가공 작업지시서</h1>
                  <p className="text-xs text-slate-500">발주번호: #{selectedOrder.id} | 접수일시: {new Date(selectedOrder.created_at).toLocaleString('ko-KR')}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm border-b pb-4">
                  <div><strong>거래처명:</strong> {selectedOrder.company_name}</div>
                  <div><strong>희망납기일:</strong> {selectedOrder.due_date || '미정'}</div>
                  <div><strong>총 발주수량:</strong> {selectedOrder.total_quantity} 장</div>
                  <div><strong>진행 상태:</strong> {selectedOrder.status}</div>
                </div>

                <div>
                  <h3 className="font-bold text-sm mb-2">■ 세부 가공 품목</h3>
                  <table className="w-full text-xs text-center border-collapse border border-slate-300">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="border p-2">NO</th>
                        <th className="border p-2">보드종류</th>
                        <th className="border p-2">두께/비중/등급</th>
                        <th className="border p-2">표면재/구분</th>
                        <th className="border p-2">규격(mm)</th>
                        <th className="border p-2">수량</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.order_items?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="border p-2">{idx + 1}</td>
                          <td className="border p-2 font-bold">{item.board_type}</td>
                          <td className="border p-2">{item.thickness} / {item.density} / {item.eco_grade}</td>
                          <td className="border p-2">{item.surface_material} ({item.surface_side})</td>
                          <td className="border p-2">{item.width || '-'} x {item.height || '-'}</td>
                          <td className="border p-2 font-bold text-blue-600">{item.quantity}장</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {selectedOrder.memo && (
                  <div className="border p-3 rounded bg-slate-50 text-xs">
                    <strong>■ 전체 요청사항:</strong> {selectedOrder.memo}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={exportToPDF} className="px-4 py-2 bg-red-600 text-white font-bold rounded hover:bg-red-700 text-sm">
                  📥 PDF 다운로드 / 인쇄
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
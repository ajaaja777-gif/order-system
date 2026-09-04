import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Order {
  id: number;
  created_at: string;
  company_name: string;
  board_type: string;
  thickness: string;
  density: string;
  eco_grade: string;
  surface_material: string;
  surface_side: string;
  pattern_color: string;
  quantity: number;
  due_date: string;
  status: string;
  memo: string;
}

const STATUS_LIST = ['접수대기', '가공중', '검수완료', '출하대기', '완료'];

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('데이터 로딩 오류:', error);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (id: number, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      alert('상태 변경 중 오류가 발생했습니다.');
    } else {
      fetchOrders();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">
            🏭 표면재 가공 통합 수주 관리 대시보드
          </h1>
          <button
            onClick={fetchOrders}
            className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-800 text-sm font-medium"
          >
            🔄 새로고침
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10 text-slate-500">데이터를 불러오는 중입니다...</div>
        ) : (
          <div className="bg-white rounded-xl shadow border border-slate-200 overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-800 text-white text-xs uppercase">
                <tr>
                  <th className="p-3">NO</th>
                  <th className="p-3">거래처명</th>
                  <th className="p-3">원자재 보드 (규격/비중/등급)</th>
                  <th className="p-3">표면재 (구분/패턴)</th>
                  <th className="p-3">수량</th>
                  <th className="p-3">희망납기</th>
                  <th className="p-3">진행 상태</th>
                  <th className="p-3">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-400">
                      등록된 수주 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-500">#{order.id}</td>
                      <td className="p-3 font-semibold text-slate-800">{order.company_name}</td>
                      <td className="p-3">
                        <span className="font-bold text-blue-600">{order.board_type}</span>{' '}
                        {order.thickness} / {order.density} / {order.eco_grade}
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-emerald-600">{order.surface_material}</span> ({order.surface_side})
                        {order.pattern_color && <div className="text-xs text-slate-400">{order.pattern_color}</div>}
                      </td>
                      <td className="p-3 font-bold text-slate-800">{order.quantity}장</td>
                      <td className="p-3 text-xs">{order.due_date || '-'}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          order.status === '접수대기' ? 'bg-amber-100 text-amber-700' :
                          order.status === '가공중' ? 'bg-blue-100 text-blue-700' :
                          order.status === '완료' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className="p-1.5 border rounded text-xs bg-white text-slate-700 font-medium"
                        >
                          {STATUS_LIST.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
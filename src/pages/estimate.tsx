import React, { useState } from 'react';
import Link from 'next/link';

interface EstimateItem {
  id: number;
  itemName: string;
  spec: string;
  qty: number;
  unitPrice: number;
  memo: string;
}

export default function Estimate() {
  const [estimateNo, setEstimateNo] = useState(`EST-${Date.now().toString().slice(-6)}`);
  const [estimateDate, setEstimateDate] = useState(new Date().toISOString().slice(0, 10));
  const [clientCompany, setClientCompany] = useState('');
  const [clientManager, setClientManager] = useState('');
  const [myCompany, setMyCompany] = useState('(주)한국표면재가공');
  const [myManager, setMyManager] = useState('홍길동 팀장');
  const [myTel, setMyTel] = useState('02-123-4567');

  const [items, setItems] = useState<EstimateItem[]>([
    { id: 1, itemName: 'MDF 18t (LPM 양면)', spec: '1220 × 2440 mm', qty: 100, unitPrice: 23000, memo: '화이트 무광' },
  ]);

  const addItem = () => {
    setItems([
      ...items,
      { id: Date.now(), itemName: '', spec: '', qty: 1, unitPrice: 0, memo: '' },
    ]);
  };

  const removeItem = (id: number) => {
    if (items.length === 1) return;
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: number, field: keyof EstimateItem, value: any) => {
    setItems(
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const totalSupply = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
  const totalVat = Math.round(totalSupply * 0.1);
  const grandTotal = totalSupply + totalVat;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff; padding: 0; }
          .print-area { border: none !important; box-shadow: none !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
        }
      `}</style>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
        <header className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '2px solid #333' }}>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold' }}>📄 견적서 작성 및 출력</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link href="/admin" style={{ padding: '8px 12px', background: '#6b7280', color: '#fff', textDecoration: 'none', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold' }}>수주 대시보드</Link>
            <button onClick={handlePrint} style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
              🖨️ PDF / 인쇄 출력
            </button>
          </div>
        </header>

        <div className="print-area" style={{ background: '#fff', border: '1px solid #ccc', padding: '30px', borderRadius: '4px', color: '#111' }}>
          <h2 style={{ textAlign: 'center', fontSize: '28px', margin: '0 0 20px 0', letterSpacing: '8px', textDecoration: 'underline' }}>견 적 서</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px', fontSize: '13px' }}>
            <div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '4px 0', width: '80px', fontWeight: 'bold' }}>견적번호:</td>
                    <td><input type="text" value={estimateNo} onChange={(e) => setEstimateNo(e.target.value)} style={{ border: '1px solid #ccc', padding: '4px', width: '90%' }} /></td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 0', fontWeight: 'bold' }}>견적일자:</td>
                    <td><input type="date" value={estimateDate} onChange={(e) => setEstimateDate(e.target.value)} style={{ border: '1px solid #ccc', padding: '4px', width: '90%' }} /></td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 0', fontWeight: 'bold' }}>수신(업체):</td>
                    <td><input type="text" placeholder="수신 업체명" value={clientCompany} onChange={(e) => setClientCompany(e.target.value)} style={{ border: '1px solid #ccc', padding: '4px', width: '90%' }} /></td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 0', fontWeight: 'bold' }}>참조(담당):</td>
                    <td><input type="text" placeholder="담당자명" value={clientManager} onChange={(e) => setClientManager(e.target.value)} style={{ border: '1px solid #ccc', padding: '4px', width: '90%' }} /></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #333' }}>
                <tbody>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #333' }}>
                    <th rowSpan={4} style={{ width: '24px', borderRight: '1px solid #333', textAlign: 'center', padding: '4px' }}>공급자</th>
                    <td style={{ padding: '4px', width: '70px', borderRight: '1px solid #ccc', fontWeight: 'bold' }}>상호명</td>
                    <td style={{ padding: '4px' }}><input type="text" value={myCompany} onChange={(e) => setMyCompany(e.target.value)} style={{ border: 'none', width: '100%', fontWeight: 'bold' }} /></td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #333' }}>
                    <td style={{ padding: '4px', borderRight: '1px solid #ccc', fontWeight: 'bold' }}>담당자</td>
                    <td style={{ padding: '4px' }}><input type="text" value={myManager} onChange={(e) => setMyManager(e.target.value)} style={{ border: 'none', width: '100%' }} /></td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px', borderRight: '1px solid #ccc', fontWeight: 'bold' }}>연락처</td>
                    <td style={{ padding: '4px' }}><input type="text" value={myTel} onChange={(e) => setMyTel(e.target.value)} style={{ border: 'none', width: '100%' }} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background: '#f1f5f9', border: '2px solid #333', padding: '12px', textAlign: 'center', fontSize: '16px', fontWeight: 'bold', marginBottom: '20px' }}>
            합계금액 (VAT 포함): 일금 {grandTotal.toLocaleString()} 원정 (₩{grandTotal.toLocaleString()})
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '16px' }}>
            <thead>
              <tr style={{ background: '#e2e8f0', borderTop: '2px solid #333', borderBottom: '1px solid #333' }}>
                <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>품명 / 규격</th>
                <th style={{ padding: '8px', border: '1px solid #cbd5e1', width: '110px' }}>세부사양</th>
                <th style={{ padding: '8px', border: '1px solid #cbd5e1', width: '60px' }}>수량</th>
                <th style={{ padding: '8px', border: '1px solid #cbd5e1', width: '90px' }}>단가</th>
                <th style={{ padding: '8px', border: '1px solid #cbd5e1', width: '100px' }}>공급가액</th>
                <th style={{ padding: '8px', border: '1px solid #cbd5e1', width: '110px' }}>비고</th>
                <th className="no-print" style={{ padding: '8px', border: '1px solid #cbd5e1', width: '40px' }}>-</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const supply = item.qty * item.unitPrice;
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '4px', border: '1px solid #cbd5e1' }}>
                      <input type="text" value={item.itemName} onChange={(e) => updateItem(item.id, 'itemName', e.target.value)} style={{ width: '100%', border: 'none' }} placeholder="품명" />
                    </td>
                    <td style={{ padding: '4px', border: '1px solid #cbd5e1' }}>
                      <input type="text" value={item.spec} onChange={(e) => updateItem(item.id, 'spec', e.target.value)} style={{ width: '100%', border: 'none' }} placeholder="규격" />
                    </td>
                    <td style={{ padding: '4px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                      <input type="number" value={item.qty} onChange={(e) => updateItem(item.id, 'qty', Number(e.target.value))} style={{ width: '100%', border: 'none', textAlign: 'center' }} />
                    </td>
                    <td style={{ padding: '4px', border: '1px solid #cbd5e1', textAlign: 'right' }}>
                      <input type="number" value={item.unitPrice} onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))} style={{ width: '100%', border: 'none', textAlign: 'right' }} />
                    </td>
                    <td style={{ padding: '6px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold' }}>
                      {supply.toLocaleString()}
                    </td>
                    <td style={{ padding: '4px', border: '1px solid #cbd5e1' }}>
                      <input type="text" value={item.memo} onChange={(e) => updateItem(item.id, 'memo', e.target.value)} style={{ width: '100%', border: 'none' }} placeholder="비고" />
                    </td>
                    <td className="no-print" style={{ padding: '4px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                      <button onClick={() => removeItem(item.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '3px', padding: '2px 6px', cursor: 'pointer' }}>✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <button className="no-print" onClick={addItem} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '16px' }}>
            + 품목 줄 추가
          </button>

          <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '13px' }}>
            <table style={{ width: '260px', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '4px', fontWeight: 'bold' }}>공급가액:</td>
                  <td style={{ padding: '4px', textAlign: 'right' }}>{totalSupply.toLocaleString()} 원</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px', fontWeight: 'bold' }}>부가가치세 (10%):</td>
                  <td style={{ padding: '4px', textAlign: 'right' }}>{totalVat.toLocaleString()} 원</td>
                </tr>
                <tr style={{ borderTop: '2px solid #333', fontSize: '14px', fontWeight: 'bold' }}>
                  <td style={{ padding: '6px 4px' }}>총 견적합계:</td>
                  <td style={{ padding: '6px 4px', textAlign: 'right', color: '#2563eb' }}>{grandTotal.toLocaleString()} 원</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
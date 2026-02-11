"use client";

import { useRouter } from "next/navigation";

export default function TaxInvoicePage() {
  const router = useRouter();

  const invoiceData = {
    serialNo: "20260205-BT-001",
    supplier: {
      bizNo: "124-86-12345",
      name: "BaroTruck (바로트럭)",
      ceo: "윤관리",
      addr: "서울특별시 강남구 테헤란로 123",
      bizType: "서비스",
      bizItem: "화물운송중개",
      email: "sion.oh@barotruck.com"
    },
    client: {
      bizNo: "113-86-21886",
      name: "주식회사 미리디",
      ceo: "강창석",
      addr: "서울특별시 구로구 디지털로31길 12, 8층",
      bizType: "소매업",
      bizItem: "통신판매",
      email: "creative@miricanvas.com"
    },
    totalAmount: 111111,
    taxAmount: 11111,
    items: [
      { month: "06", day: "01", name: "디자인 로열티(2023년 O월~2023년 O월)", spec: "", qty: "", unitPrice: "", supplyValue: 111111, tax: 11111 },
    ]
  };

  return (
    <div className="p-10 bg-slate-100 min-h-screen flex flex-col items-center font-sans text-[12px]">
      <div className="w-[850px] mb-6 flex justify-between items-center no-print">
        <button onClick={() => router.back()} className="text-sm font-bold text-slate-500">⬅️ 돌아가기</button>
        <button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 shadow-md transition-all">인쇄 및 발행</button>
      </div>

      <div className="w-[850px] bg-white border-2 border-slate-800 shadow-xl relative print:shadow-none print:m-0">
        <div className="flex border-b-2 border-slate-800">
          <div className="flex-[5] py-4 text-center text-3xl font-black tracking-[10px] border-r-2 border-slate-800">전자세금계산서</div>
          <div className="flex-[3] flex flex-col">
            <div className="flex border-b border-slate-800 h-full">
              <div className="w-20 bg-slate-50 flex items-center justify-center border-r border-slate-800 font-bold">승인번호</div>
              <div className="flex-1 p-2"></div>
            </div>
          </div>
        </div>

        <div className="flex">
          {/* 공급자 영역 */}
          <div className="flex-1 flex border-r-2 border-slate-800">
            <div className="w-8 bg-slate-50 font-bold flex items-center justify-center text-center border-r border-slate-800 leading-tight">공<br/>급<br/>자</div>
            <table className="flex-1 border-collapse">
              <tbody>
                <tr className="border-b border-slate-800">
                  <td className="w-20 bg-slate-50 p-2 text-center border-r border-slate-800">등록번호</td>
                  <td colSpan={3} className="p-2 font-bold text-base tracking-widest">{invoiceData.supplier.bizNo}</td>
                  <td className="w-16 bg-slate-50 p-1 text-center border-l border-r border-slate-800 text-[10px]">종사업장<br/>번호</td>
                  <td className="w-10"></td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="bg-slate-50 p-2 text-center border-r border-slate-800 leading-tight">상호<br/>(법인명)</td>
                  <td className="p-2 border-r border-slate-800">{invoiceData.supplier.name}</td>
                  <td className="w-10 bg-slate-50 p-2 text-center border-r border-slate-800">성명</td>
                  <td colSpan={3} className="p-2 font-bold">{invoiceData.supplier.ceo}</td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="bg-slate-50 p-2 text-center border-r border-slate-800">사업장</td>
                  <td colSpan={5} className="p-2">{invoiceData.supplier.addr}</td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="bg-slate-50 p-2 text-center border-r border-slate-800">업태</td>
                  <td className="p-2 border-r border-slate-800">{invoiceData.supplier.bizType}</td>
                  <td className="w-10 bg-slate-50 p-2 text-center border-r border-slate-800">종목</td>
                  <td colSpan={3} className="p-2">{invoiceData.supplier.bizItem}</td>
                </tr>
                <tr>
                  <td className="bg-slate-50 p-2 text-center border-r border-slate-800">이메일</td>
                  <td colSpan={5} className="p-2 font-bold">{invoiceData.supplier.email}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 공급받는자 영역 */}
          <div className="flex-1 flex">
            <div className="w-8 bg-slate-50 font-bold flex items-center justify-center text-center border-r border-slate-800 leading-tight">공<br/>급<br/>받<br/>는<br/>자</div>
            <table className="flex-1 border-collapse">
              <tbody>
                <tr className="border-b border-slate-800">
                  <td className="w-20 bg-slate-50 p-2 text-center border-r border-slate-800">등록번호</td>
                  <td colSpan={3} className="p-2 font-bold text-base tracking-widest">{invoiceData.client.bizNo}</td>
                  <td className="w-16 bg-slate-50 p-1 text-center border-l border-r border-slate-800 text-[10px]">종사업장<br/>번호</td>
                  <td className="w-10"></td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="bg-slate-50 p-2 text-center border-r border-slate-800 leading-tight">상호<br/>(법인명)</td>
                  <td className="p-2 border-r border-slate-800">{invoiceData.client.name}</td>
                  <td className="w-10 bg-slate-50 p-2 text-center border-r border-slate-800">성명</td>
                  <td colSpan={3} className="p-2 font-bold">{invoiceData.client.ceo}</td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="bg-slate-50 p-2 text-center border-r border-slate-800">사업장</td>
                  <td colSpan={5} className="p-2">{invoiceData.client.addr}</td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="bg-slate-50 p-2 text-center border-r border-slate-800">업태</td>
                  <td className="p-2 border-r border-slate-800">{invoiceData.client.bizType}</td>
                  <td className="w-10 bg-slate-50 p-2 text-center border-r border-slate-800">종목</td>
                  <td colSpan={3} className="p-2">{invoiceData.client.bizItem}</td>
                </tr>
                <tr>
                  <td className="bg-slate-50 p-2 text-center border-r border-slate-800">이메일</td>
                  <td colSpan={5} className="p-2 font-bold">{invoiceData.client.email}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 작성일자/금액 요약 섹션 */}
        <table className="w-full border-collapse border-t-2 border-slate-800">
          <tbody>
            <tr className="bg-slate-50 text-center font-bold border-b border-slate-800">
              <td className="w-[20%] p-2 border-r border-slate-800">작성일자</td>
              <td className="w-[30%] p-2 border-r border-slate-800">공급가액</td>
              <td className="w-[20%] p-2 border-r border-slate-800 text-slate-800">세액</td>
              <td className="p-2 text-slate-800">수정사유</td>
            </tr>
            <tr className="text-center font-bold h-10 border-b border-slate-800">
              <td className="bg-yellow-100/50 border-r border-slate-800">2026 / 02 / 05</td>
              <td className="border-r border-slate-800 text-right px-4">{invoiceData.totalAmount.toLocaleString()}</td>
              <td className="border-r border-slate-800 text-right px-4">{invoiceData.taxAmount.toLocaleString()}</td>
              <td></td>
            </tr>
            <tr className="bg-slate-50 border-b border-slate-800 h-10">
              <td className="text-center font-bold border-r border-slate-800">비고</td>
              <td colSpan={3} className="px-4 text-slate-400 text-[10px]">{invoiceData.serialNo}</td>
            </tr>
          </tbody>
        </table>

        {/* 품목 리스트 섹션 */}
        <table className="w-full border-collapse">
          <tbody>
            <tr className="bg-slate-50 text-center font-bold border-b border-slate-800">
              <td className="w-10 border-r border-slate-800">월</td>
              <td className="w-10 border-r border-slate-800">일</td>
              <td className="border-r border-slate-800">품목</td>
              <td className="w-16 border-r border-slate-800">규격</td>
              <td className="w-12 border-r border-slate-800">수량</td>
              <td className="w-24 border-r border-slate-800">단가</td>
              <td className="w-24 border-r border-slate-800 font-bold">공급가액</td>
              <td className="w-20 border-r border-slate-800 font-bold">세액</td>
              <td className="w-16">비고</td>
            </tr>
            {invoiceData.items.map((item, i) => (
              <tr key={i} className="text-center h-10 border-b border-slate-200">
                <td className="bg-yellow-100/30 border-r border-slate-200">{item.month}</td>
                <td className="bg-yellow-100/30 border-r border-slate-200">{item.day}</td>
                <td className="border-r border-slate-200 text-left px-2 font-bold">{item.name}</td>
                <td className="border-r border-slate-200">{item.spec}</td>
                <td className="border-r border-slate-200">{item.qty}</td>
                <td className="border-r border-slate-200 text-right px-2">{item.unitPrice.toLocaleString()}</td>
                <td className="border-r border-slate-200 text-right px-2 font-bold">{item.supplyValue.toLocaleString()}</td>
                <td className="border-r border-slate-200 text-right px-2 font-bold">{item.tax.toLocaleString()}</td>
                <td></td>
              </tr>
            ))}
            {[...Array(6)].map((_, i) => (
              <tr key={i} className="h-10 border-b border-slate-200 text-center">
                <td className="bg-yellow-100/10 border-r border-slate-200"></td>
                <td className="bg-yellow-100/10 border-r border-slate-200"></td>
                <td className="border-r border-slate-200"></td>
                <td className="border-r border-slate-200"></td>
                <td className="border-r border-slate-200"></td>
                <td className="border-r border-slate-200"></td>
                <td className="border-r border-slate-200"></td>
                <td className="border-r border-slate-200"></td>
                <td></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 합계금액 섹션 */}
        <table className="w-full border-collapse border-t-2 border-slate-800">
          <tbody>
            <tr className="bg-slate-50 text-center font-bold border-b border-slate-800">
              <td className="w-24 border-r border-slate-800 p-2">합계금액</td>
              <td className="w-20 border-r border-slate-800 p-2">현금</td>
              <td className="w-20 border-r border-slate-800 p-2">수표</td>
              <td className="w-20 border-r border-slate-800 p-2">어음</td>
              <td className="w-24 border-r border-slate-800 p-2">외상미수금</td>
              <td rowSpan={2} className="p-2 text-lg font-bold">이 금액을 ( 청구 ) 함</td>
            </tr>
            <tr className="text-center font-black h-12">
              <td className="border-r border-slate-800 px-2 text-base">{(invoiceData.totalAmount + invoiceData.taxAmount).toLocaleString()}</td>
              <td className="border-r border-slate-800"></td>
              <td className="border-r border-slate-800"></td>
              <td className="border-r border-slate-800"></td>
              <td className="border-r border-slate-800"></td>
            </tr>
          </tbody>
        </table>
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none; }
          body { background: white; margin: 0; }
          .p-10 { padding: 0; }
        }
      `}</style>
    </div>
  );
}
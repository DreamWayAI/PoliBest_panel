import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Download, ArrowLeft, Printer, Edit } from "lucide-react";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const KPPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef(null);
  const [kp, setKp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRooms, setSelectedRooms] = useState({});

  useEffect(() => {
    const loadKP = async () => {
      try {
        const response = await axios.get(`${API}/kp/${id}`);
        setKp(response.data);
        const roomSelection = {};
        response.data.rooms?.forEach((_, idx) => { roomSelection[idx] = true; });
        setSelectedRooms(roomSelection);
      } catch (error) {
        toast.error("Помилка завантаження КП");
        navigate("/commercial");
      } finally {
        setLoading(false);
      }
    };
    loadKP();
  }, [id, navigate]);

  const toggleRoom = (idx) => setSelectedRooms(prev => ({ ...prev, [idx]: !prev[idx] }));
  const getSelectedRooms = () => kp?.rooms?.filter((_, idx) => selectedRooms[idx]) || [];
  const calculateGrandTotal = () => getSelectedRooms().reduce((sum, room) => sum + (room.totals?.total || 0), 0);
  const getTotalArea = () => getSelectedRooms().reduce((sum, room) => sum + (room.area || 0), 0);

  const formatCurrency = (value) => {
    if (!kp || value === undefined) return "0 грн";
    const symbols = { UAH: "грн", EUR: "€", USD: "$" };
    return `${Math.round(value).toLocaleString("uk-UA")} ${symbols[kp.settings?.currency] || "грн"}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("uk-UA", { day: "2-digit", month: "long", year: "numeric" });
  };

  const handlePrint = () => window.print();
  const handleDownloadPDF = () => {
    toast.info("Ctrl+P (⌘+P) → Зберегти як PDF", { duration: 5000 });
    setTimeout(() => window.print(), 500);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-[#A3A3A3]">Завантаження...</div></div>;
  if (!kp) return <div className="flex items-center justify-center h-64"><div className="text-[#A3A3A3]">КП не знайдено</div></div>;

  const filteredRooms = getSelectedRooms();
  const grandTotal = calculateGrandTotal();
  const totalArea = getTotalArea();
  const company = kp.additionalData?.company || {};

  return (
    <div data-testid="kp-preview" className="space-y-4">
      {/* Controls */}
      <div className="print:hidden flex flex-wrap items-center justify-between gap-4 bg-[#121212] border border-[#262626] p-4">
        <Button onClick={() => navigate("/commercial")} variant="ghost" className="text-[#A3A3A3] hover:text-[#EDEDED]">
          <ArrowLeft size={18} className="mr-2" />До комерційного
        </Button>
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/commercial/kp/edit/${id}`)} className="btn-secondary">
            <Edit size={18} className="mr-2" />Редагувати
          </Button>
          <Button onClick={handleDownloadPDF} className="bg-[#B5331B] hover:bg-red-700 text-white">
            <Download size={18} className="mr-2" />PDF
          </Button>
          <Button onClick={handlePrint} className="btn-secondary">
            <Printer size={18} className="mr-2" />Друк
          </Button>
        </div>
      </div>

      {/* Room Selection */}
      <div className="print:hidden bg-[#121212] border border-[#262626] p-4">
        <h3 className="text-sm font-bold text-[#EDEDED] uppercase mb-3">Вибір приміщень:</h3>
        <div className="space-y-2">
          {kp.rooms?.map((room, idx) => (
            <label key={idx} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-[#1A1A1A] rounded">
              <Checkbox checked={selectedRooms[idx]} onCheckedChange={() => toggleRoom(idx)} className="border-[#B5331B] data-[state=checked]:bg-[#B5331B]" />
              <span className="text-[#EDEDED]">{room.name}</span>
              <span className="text-[#737373] text-sm">({room.area} м²)</span>
              <span className="text-[#B5331B] ml-auto font-bold">{formatCurrency(room.totals?.total)}</span>
            </label>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-[#262626] flex justify-between items-center">
          <span className="text-[#A3A3A3] font-bold uppercase">Загальна сума:</span>
          <span className="text-xl font-bold text-[#B5331B]">{formatCurrency(grandTotal)}</span>
        </div>
      </div>

      {/* A4 Document */}
      <div ref={printRef} className="bg-white mx-auto shadow-2xl print:shadow-none" style={{ width: "210mm", minHeight: "297mm", maxWidth: "100%" }}>
        <div className="text-gray-900" style={{ fontFamily: "Arial, sans-serif" }}>
          
          {/* ===== MODERN HEADER ===== */}
          <div className="text-white px-8 py-6" style={{ backgroundColor: '#1f1f1f' }}>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-black text-xl">ВВ</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight">{company.name || 'ТОВ «ВедеВперед»'}</h1>
                  <p className="text-gray-400 text-xs">Полімерні покриття преміум класу</p>
                </div>
              </div>
              <div className="text-right text-sm">
                {company.phones && <p className="text-white font-semibold">{company.phones}</p>}
                {company.address && <p className="text-gray-400 text-xs mt-1">{company.address}</p>}
              </div>
            </div>
            
            {/* Requisites */}
            <div className="mt-4 pt-3 border-t border-gray-600 grid grid-cols-4 gap-3 text-xs">
              {company.edrpou && <div><span className="text-gray-500 text-[10px]">ЄДРПОУ</span><p className="text-white">{company.edrpou}</p></div>}
              {company.ipn && <div><span className="text-gray-500 text-[10px]">ІПН</span><p className="text-white">{company.ipn}</p></div>}
              {company.pdv && <div><span className="text-gray-500 text-[10px]">ПДВ</span><p className="text-white">№{company.pdv}</p></div>}
              {company.iban && <div><span className="text-gray-500 text-[10px]">IBAN</span><p className="text-white font-mono text-[9px]">{company.iban}</p></div>}
            </div>
            {company.bank && <p className="text-gray-500 text-[10px] mt-1">{company.bank}</p>}
          </div>

          {/* ===== CONTENT ===== */}
          <div className="px-8 py-6 text-xs">
            
            {/* Title */}
            <div className="text-center mb-6 pb-4 border-b-2 border-red-600">
              <h2 className="text-2xl font-black uppercase text-gray-800 mb-1">КОМЕРЦІЙНА ПРОПОЗИЦІЯ</h2>
              <p className="text-sm text-gray-600">
                Полімерні матеріали для захисного покриття <strong className="text-red-600">PoliBest 911</strong>
              </p>
              <p className="text-gray-500 mt-2">
                на бетонній підлозі площею <strong className="text-gray-800 text-base">{totalArea.toLocaleString()} м²</strong>
                {kp.location && <span> • {kp.location}</span>}
              </p>
            </div>

            {/* Client Info */}
            <div className="bg-gray-50 border-l-4 border-red-600 p-4 mb-6">
              <div className="grid grid-cols-3 gap-4">
                <div><span className="text-gray-400 text-[10px] uppercase">Клієнт</span><p className="font-bold text-gray-800">{kp.client}</p></div>
                <div><span className="text-gray-400 text-[10px] uppercase">Проект</span><p className="font-bold text-gray-800">{kp.title}</p></div>
                <div><span className="text-gray-400 text-[10px] uppercase">Дата КП</span><p className="text-gray-700">{formatDate(kp.date)}</p></div>
              </div>
            </div>

            {/* Description */}
            {kp.additionalData?.description && (
              <div className="mb-6 text-gray-600 leading-relaxed whitespace-pre-line">
                {kp.additionalData.description}
              </div>
            )}

            {/* ===== ROOMS ===== */}
            {filteredRooms.map((room, idx) => {
              // Calculate layers from consumption (1 layer = 0.1 kg/m²)
              // Using multiplication to avoid JavaScript floating-point precision issues
              const getLayersFromConsumption = (consumption) => Math.round(consumption * 10);
              
              // Calculate totals based on new layer logic
              let roomMaterialsSum = 0;
              let totalLayers = 0;
              room.materials?.forEach(m => {
                const materialLayers = getLayersFromConsumption(m.consumption);
                totalLayers += materialLayers;
                roomMaterialsSum += room.area * m.consumption * m.price;
              });
              
              const withVat = kp.settings?.includeVat ? roomMaterialsSum * (1 + (kp.settings?.vatRate || 20) / 100) : roomMaterialsSum;
              const discount = withVat * ((kp.settings?.dealerDiscount || 0) / 100);
              const total = withVat - discount;
              
              // Get layer suffix for Ukrainian
              const getLayerSuffix = (n) => {
                if (n === 1) return "";
                if (n >= 2 && n <= 4) return "и";
                return "ів";
              };

              return (
                <div key={idx} className="mb-6 page-break-inside-avoid">
                  {/* Room Header */}
                  <div className="text-white px-4 py-2 flex justify-between items-center" style={{ backgroundColor: '#1f1f1f' }}>
                    <h3 className="font-bold">{room.name} — {room.area} м²</h3>
                    <span className="text-gray-300 text-xs">{totalLayers} шар{getLayerSuffix(totalLayers)}</span>
                  </div>

                  {/* Materials Table */}
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-600">
                        <th className="border border-gray-300 p-2 text-center w-8">№</th>
                        <th className="border border-gray-300 p-2 text-left">Матеріал</th>
                        <th className="border border-gray-300 p-2 text-center w-16">Шари</th>
                        <th className="border border-gray-300 p-2 text-center w-20">Витрата<br/>кг/м²</th>
                        <th className="border border-gray-300 p-2 text-center w-16">К-сть<br/>кг</th>
                        <th className="border border-gray-300 p-2 text-center w-20">Ціна/кг<br/>з ПДВ</th>
                        <th className="border border-gray-300 p-2 text-right w-24">Сума<br/>з ПДВ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {room.materials?.map((mat, matIdx) => {
                        const materialLayers = getLayersFromConsumption(mat.consumption);
                        const totalKg = room.area * mat.consumption;
                        const sum = totalKg * mat.price;
                        const sumWithVat = kp.settings?.includeVat ? sum * (1 + (kp.settings?.vatRate || 20) / 100) : sum;
                        return (
                          <tr key={matIdx} className="hover:bg-gray-50">
                            <td className="border border-gray-300 p-2 text-center text-gray-500">{matIdx + 1}</td>
                            <td className="border border-gray-300 p-2 text-gray-700">{mat.name}</td>
                            <td className="border border-gray-300 p-2 text-center text-red-600 font-bold">{materialLayers}</td>
                            <td className="border border-gray-300 p-2 text-center text-gray-600">{mat.consumption.toFixed(2)}</td>
                            <td className="border border-gray-300 p-2 text-center font-medium">{Math.round(totalKg)}</td>
                            <td className="border border-gray-300 p-2 text-center text-gray-600">{mat.price.toLocaleString()}</td>
                            <td className="border border-gray-300 p-2 text-right font-bold">{Math.round(sumWithVat).toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Room Summary */}
                  <div className="bg-gray-50 border border-t-0 border-gray-300 p-3">
                    <div className="flex justify-end gap-6 text-gray-600">
                      <span>Вартість з ПДВ: <strong className="text-gray-800">{formatCurrency(withVat)}</strong></span>
                      {kp.settings?.dealerDiscount > 0 && (
                        <span className="text-green-600">Знижка {kp.settings.dealerDiscount}%: <strong>-{formatCurrency(discount)}</strong></span>
                      )}
                    </div>
                    <div className="flex justify-end mt-2 pt-2 border-t border-gray-200">
                      <span className="text-gray-800 font-bold">РАЗОМ: <span className="text-red-600 text-sm">{formatCurrency(total)}</span></span>
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="flex gap-4 mt-2 text-[10px] text-gray-500 border-l-2 border-gray-300 pl-3">
                    {kp.settings?.productionTime && <span>⏱ {kp.settings.productionTime}</span>}
                    {kp.settings?.warranty && <span>✓ {kp.settings.warranty}</span>}
                  </div>
                </div>
              );
            })}

            {/* ===== GRAND TOTAL ===== */}
            {filteredRooms.length > 0 && (
              <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 mb-6 flex justify-between items-center">
                <div>
                  <p className="text-red-200 text-xs uppercase">Загальна вартість з ПДВ</p>
                  <p className="text-red-200 text-[10px]">з урахуванням знижки</p>
                </div>
                <p className="text-3xl font-black">{formatCurrency(grandTotal)}</p>
              </div>
            )}

            {/* ===== ADVANTAGES & TECH ===== */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              {kp.additionalData?.advantages?.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-800 uppercase text-xs mb-2 pb-1 border-b-2 border-red-600">Переваги PoliBest 911</h4>
                  <ul className="space-y-1">
                    {kp.additionalData.advantages.map((adv, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-600">
                        <span className="text-red-600 font-bold">✓</span>{adv}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {kp.additionalData?.techParams?.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-800 uppercase text-xs mb-2 pb-1 border-b-2 border-red-600">Технічні параметри</h4>
                  <table className="w-full">
                    <tbody>
                      {kp.additionalData.techParams.map((param, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? "bg-gray-50" : ""}>
                          <td className="p-1.5 text-gray-500">{param.name}</td>
                          <td className="p-1.5 text-gray-800 font-medium text-right">{param.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ===== SIGNATURE ===== */}
            {kp.additionalData?.signature && (
              <div className="border-t-2 border-gray-200 pt-6 mt-6">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-gray-400 text-xs mb-1">З повагою,</p>
                    <p className="text-gray-800 font-bold text-sm">{kp.additionalData.signature.name || "________________"}</p>
                    <p className="text-gray-600">{kp.additionalData.signature.position}</p>
                    {kp.additionalData.signature.phone && <p className="text-gray-500 mt-1">{kp.additionalData.signature.phone}</p>}
                    {kp.additionalData.signature.email && <p className="text-gray-500">{kp.additionalData.signature.email}</p>}
                  </div>
                  <div className="text-center">
                    <div className="w-36 border-b-2 border-gray-300 mb-1"></div>
                    <p className="text-[10px] text-gray-400">(підпис)</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ===== FOOTER ===== */}
          <div className="bg-gray-100 px-8 py-3 border-t border-gray-200 text-[10px] text-gray-400 flex justify-between">
            <p>© {new Date().getFullYear()} {company.name || 'ТОВ «ВедеВперед»'}</p>
            <p>Ціни дійсні на момент формування пропозиції</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:hidden { display: none !important; }
          [data-testid="kp-preview"] > div:last-of-type,
          [data-testid="kp-preview"] > div:last-of-type * { visibility: visible; }
          [data-testid="kp-preview"] > div:last-of-type {
            position: absolute; left: 0; top: 0; width: 210mm; box-shadow: none !important;
          }
          @page { size: A4; margin: 0; }
          .page-break-inside-avoid { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
};

export default KPPreview;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, FileText, Copy, ChevronDown, ChevronUp, MessageCircle, Share2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Default prices (used as fallback)
const DEFAULT_PRICES = {
  primer: 720,
  paint: 990,
  enamel: 1260,
  floki: 1350,
  lacGlossy: 1440,
  lacMatte: 1800,
};

// Consumption rates kg/m²
const CONSUMPTION = {
  primer: 0.2,
  flokiEnamel: 0.2,
  floki: 0.025,
  lac: 0.12,
};

export const Calculator = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [prices, setPrices] = useState(DEFAULT_PRICES);
  const [pricesLoading, setPricesLoading] = useState(true);

  // Fetch prices from API
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await axios.get(`${API}/calculator-prices`);
        setPrices(response.data);
      } catch (error) {
        console.error("Error loading prices:", error);
        // Use default prices on error
      } finally {
        setPricesLoading(false);
      }
    };
    fetchPrices();
  }, []);

  const [sharing, setSharing] = useState(false);

  const getShareText = () => {
    if (!results) return "";
    const modeNames = { floki: "Флоки", enamel: "Емаль", paint: "Фарба" };
    
    let text = `📊 РОЗРАХУНОК МАТЕРІАЛІВ\nPoliBest 911\n\n`;
    text += `Тип: ${modeNames[mode]}${withPrimer ? " + Ґрунтівка" : ""}\n`;
    text += `Площа: ${results.area} м²\n\n`;
    text += `МАТЕРІАЛИ:\n`;
    results.items.forEach((item) => {
      text += `• ${item.name}: ${item.kg} кг × ${formatPrice(item.pricePerKg)} = ${formatPrice(item.total)} грн\n`;
    });
    text += `\n💰 РАЗОМ: ${formatPrice(results.total)} грн\n`;
    text += `📐 Ціна за м²: ${formatPrice(Math.round(results.pricePerM2))} грн/м²`;
    return text;
  };

  const createTextFile = () => {
    const text = getShareText();
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    return new File([blob], "Розрахунок_PoliBest911.txt", { type: "text/plain" });
  };

  const downloadTextFile = () => {
    const text = getShareText();
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Розрахунок_PoliBest911.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Native share for mobile
  const handleNativeShare = async () => {
    if (!results) return;
    setSharing(true);
    
    try {
      if (navigator.share) {
        const file = createTextFile();
        
        // Try sharing with file
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: "Розрахунок PoliBest 911" });
          toast.success("Файл надіслано!");
          return;
        }
        
        // Try sharing text
        const text = getShareText();
        await navigator.share({ title: "Розрахунок PoliBest 911", text });
        toast.success("Надіслано!");
        return;
      }
      
      // Fallback: download file
      downloadTextFile();
      toast.info("Файл завантажено. Надішліть його вручну.", { duration: 5000 });
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Share error:", error);
      downloadTextFile();
      toast.info("Файл завантажено. Надішліть його вручну.");
    } finally {
      setSharing(false);
    }
  };

  const shareToMessenger = (messenger) => {
    if (!results) return;
    
    // Download file first
    downloadTextFile();
    toast.info("Файл завантажено. Прикріпіть його в месенджері.", { duration: 5000 });
    
    // Open messenger
    setTimeout(() => {
      let url = "";
      switch (messenger) {
        case "telegram":
          url = `https://t.me/`;
          break;
        case "viber":
          url = `viber://forward?text=${encodeURIComponent("Розрахунок PoliBest 911")}`;
          break;
        case "whatsapp":
          url = `https://web.whatsapp.com/`;
          break;
        default:
          return;
      }
      window.open(url, "_blank");
    }, 500);
  };

  // Calculator state
  const [mode, setMode] = useState("");
  const [withPrimer, setWithPrimer] = useState(false);
  const [area, setArea] = useState("");
  const [layers, setLayers] = useState(2);
  const [lacType, setLacType] = useState("glossy");
  const [clientName, setClientName] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [orderSource, setOrderSource] = useState("");

  // Results
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (!pricesLoading) {
      calculate();
    }
  }, [mode, withPrimer, area, layers, lacType, prices, pricesLoading]);

  const calculate = () => {
    const areaNum = parseFloat(area);
    if (!areaNum || areaNum <= 0 || !mode) {
      setResults(null);
      return;
    }

    const items = [];
    let total = 0;
    const layerCoef = layers === 2 ? 0.2 : layers === 3 ? 0.3 : 0.4;

    if (withPrimer) {
      const kg = Math.ceil(areaNum * CONSUMPTION.primer);
      const price = kg * prices.primer;
      items.push({ name: "Ґрунтівка", kg, pricePerKg: prices.primer, total: price });
      total += price;
    }

    if (mode === "paint") {
      const kg = Math.ceil(areaNum * layerCoef);
      const price = kg * prices.paint;
      items.push({ name: `Фарба (${layers} шар.)`, kg, pricePerKg: prices.paint, total: price });
      total += price;
    } else if (mode === "enamel") {
      const kg = Math.ceil(areaNum * layerCoef);
      const price = kg * prices.enamel;
      items.push({ name: `Емаль (${layers} шар.)`, kg, pricePerKg: prices.enamel, total: price });
      total += price;
    } else if (mode === "floki") {
      const enamelKg = Math.ceil(areaNum * CONSUMPTION.flokiEnamel);
      const enamelPrice = enamelKg * prices.enamel;
      items.push({ name: "Емаль", kg: enamelKg, pricePerKg: prices.enamel, total: enamelPrice });
      total += enamelPrice;

      const flokiKg = Math.ceil(areaNum * CONSUMPTION.floki * 20) / 20;
      const flokiPrice = flokiKg * prices.floki;
      items.push({ name: "Флоки", kg: flokiKg, pricePerKg: prices.floki, total: flokiPrice });
      total += flokiPrice;

      const lacKg = Math.ceil(areaNum * CONSUMPTION.lac);
      const lacPricePerKg = lacType === "glossy" ? prices.lacGlossy : prices.lacMatte;
      const lacPrice = lacKg * lacPricePerKg;
      items.push({
        name: lacType === "glossy" ? "Лак глянц." : "Лак матовий",
        kg: lacKg,
        pricePerKg: lacPricePerKg,
        total: lacPrice,
      });
      total += lacPrice;
    }

    setResults({ items, total, pricePerM2: total / areaNum, area: areaNum });
  };

  const formatPrice = (price) => new Intl.NumberFormat("ru-RU").format(price);

  const handleSave = async () => {
    if (!results || !mode) {
      toast.error("Спочатку виконайте розрахунок");
      return;
    }
    setSaving(true);
    try {
      const modeNames = { floki: "Флоки", enamel: "Емаль", paint: "Фарба" };
      await axios.post(`${API}/calculations`, {
        product_id: mode,
        product_name: modeNames[mode] + (withPrimer ? " + Ґрунт" : ""),
        client_name: clientName,
        order_date: orderDate,
        order_source: orderSource,
        area_m2: results.area,
        layers: mode === "floki" ? 1 : layers,
        consumption_kg_m2: results.items.reduce((sum, i) => sum + i.kg, 0) / results.area,
        total_kg: results.items.reduce((sum, i) => sum + i.kg, 0),
        price_per_kg: results.total / results.items.reduce((sum, i) => sum + i.kg, 0),
        total_price: results.total,
        with_primer: withPrimer,
        lac_type: mode === "floki" ? lacType : null,
        items: results.items,
        include_in_total: true,
      });
      toast.success("Збережено!");
      // Не переходимо на іншу сторінку
    } catch (error) {
      toast.error("Помилка збереження");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyResult = () => {
    if (!results) return;
    const modeNames = { floki: "Флоки", enamel: "Емаль", paint: "Фарба" };
    let text = clientName ? `Клієнт: ${clientName}\n\n` : "";
    text += `${modeNames[mode]}${withPrimer ? " + Ґрунт" : ""} | ${results.area} м²\n`;
    results.items.forEach((item) => {
      text += `${item.name}: ${item.kg} кг × ${formatPrice(item.pricePerKg)} = ${formatPrice(item.total)} грн\n`;
    });
    text += `Разом: ${formatPrice(results.total)} грн (${formatPrice(Math.round(results.pricePerM2))} грн/м²)`;
    navigator.clipboard.writeText(text);
    toast.success("Скопійовано!");
  };

  const handleGenerateDoc = async () => {
    if (!results) return;
    try {
      const modeNames = { floki: "Флоки", enamel: "Емаль", paint: "Фарба" };
      let content = `КОМЕРЦІЙНА ПРОПОЗИЦІЯ\n\n`;
      if (clientName) content += `Клієнт: ${clientName}\n\n`;
      content += `Тип: ${modeNames[mode]}${withPrimer ? " + Ґрунтівка" : ""}\nПлоща: ${results.area} м²\n\n`;
      results.items.forEach((item) => {
        content += `${item.name}: ${item.kg} кг × ${formatPrice(item.pricePerKg)} = ${formatPrice(item.total)} грн\n`;
      });
      content += `\nРАЗОМ: ${formatPrice(results.total)} грн\nЦіна за м²: ${formatPrice(Math.round(results.pricePerM2))} грн`;
      
      await axios.post(`${API}/documents`, {
        title: `КП - ${modeNames[mode]} - ${results.area}м²`,
        doc_type: "commercial_proposal",
        content,
      });
      toast.success("Документ створено");
      navigate("/documents");
    } catch (error) {
      toast.error("Помилка");
    }
  };

  return (
    <div data-testid="calculator-page" className="space-y-4">
      {/* Mobile-first heading */}
      <h1 className="text-xl md:text-3xl font-bold uppercase text-[#EDEDED] tracking-tight">
        Калькулятор
      </h1>

      {/* Type Selection - Big Touch Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { id: "floki", label: "Флоки", emoji: "✨" },
          { id: "primer", label: "Ґрунт", emoji: "🧱", toggle: true },
          { id: "enamel", label: "Емаль", emoji: "🪣" },
          { id: "paint", label: "Фарба", emoji: "🎨" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => item.toggle ? setWithPrimer(!withPrimer) : setMode(item.id)}
            className={`flex flex-col items-center justify-center p-3 md:p-4 transition-all active:scale-95 ${
              (item.toggle ? withPrimer : mode === item.id)
                ? "bg-[#B5331B] text-white shadow-lg"
                : "bg-[#1A1A1A] text-[#A3A3A3] border border-[#262626]"
            }`}
            data-testid={`mode-${item.id}-btn`}
          >
            <span className="text-2xl md:text-3xl mb-1">{item.emoji}</span>
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wide">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Area Input - Big and Touch Friendly */}
      <div className="bg-[#121212] border border-[#262626] p-4">
        <label className="text-[#737373] text-xs uppercase tracking-wider mb-2 block">
          Площа (м²)
        </label>
        <Input
          type="number"
          inputMode="decimal"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="0"
          className="w-full h-14 text-2xl md:text-3xl font-mono bg-[#0A0A0A] border-[#262626] text-center text-[#EDEDED] placeholder:text-[#3A3A3A]"
          data-testid="area-input"
        />
      </div>

      {/* Layers Selection */}
      {(mode === "paint" || mode === "enamel") && (
        <div className="bg-[#121212] border border-[#262626] p-4">
          <label className="text-[#737373] text-xs uppercase tracking-wider mb-3 block">
            Кількість шарів
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[2, 3, 4].map((num) => (
              <button
                key={num}
                onClick={() => setLayers(num)}
                className={`py-3 text-lg font-bold transition-all active:scale-95 ${
                  layers === num
                    ? "bg-[#B5331B] text-white"
                    : "bg-[#1A1A1A] text-[#A3A3A3] border border-[#262626]"
                }`}
                data-testid={`layers-${num}-btn`}
              >
                {num} шари
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lac Type Selection */}
      {mode === "floki" && (
        <div className="bg-[#121212] border border-[#262626] p-4">
          <label className="text-[#737373] text-xs uppercase tracking-wider mb-3 block">
            Тип лаку
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setLacType("glossy")}
              className={`py-3 text-sm font-bold uppercase transition-all active:scale-95 ${
                lacType === "glossy"
                  ? "bg-[#B5331B] text-white"
                  : "bg-[#1A1A1A] text-[#A3A3A3] border border-[#262626]"
              }`}
              data-testid="lac-glossy-btn"
            >
              Глянцевий
            </button>
            <button
              onClick={() => setLacType("matte")}
              className={`py-3 text-sm font-bold uppercase transition-all active:scale-95 ${
                lacType === "matte"
                  ? "bg-[#B5331B] text-white"
                  : "bg-[#1A1A1A] text-[#A3A3A3] border border-[#262626]"
              }`}
              data-testid="lac-matte-btn"
            >
              Матовий
            </button>
          </div>
        </div>
      )}

      {/* Client Name Input */}
      <div className="bg-[#121212] border border-[#262626] p-4">
        <label className="text-[#737373] text-xs uppercase tracking-wider mb-2 block">
          Для кого (клієнт)
        </label>
        <Input
          type="text"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="Введіть ім'я клієнта"
          className="w-full h-12 text-base bg-[#0A0A0A] border-[#262626] text-[#EDEDED] placeholder:text-[#3A3A3A]"
          data-testid="client-name-input"
        />
      </div>

      {/* Order Info - Date and Source */}
      <div className="bg-[#121212] border border-[#262626] p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[#737373] text-xs uppercase tracking-wider mb-2 block">
              Дата
            </label>
            <Input
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              className="w-full h-12 text-base bg-[#0A0A0A] border-[#262626] text-[#EDEDED]"
              data-testid="order-date-input"
            />
          </div>
          <div>
            <label className="text-[#737373] text-xs uppercase tracking-wider mb-2 block">
              Звідки замовлення
            </label>
            <Input
              type="text"
              value={orderSource}
              onChange={(e) => setOrderSource(e.target.value)}
              placeholder="OLX, сайт, дзвінок..."
              className="w-full h-12 text-base bg-[#0A0A0A] border-[#262626] text-[#EDEDED] placeholder:text-[#3A3A3A]"
              data-testid="order-source-input"
            />
          </div>
        </div>
      </div>

      {/* Results Card */}
      <div className="bg-[#121212] border border-[#262626]">
        {results ? (
          <>
            {/* Client Info Header */}
            {(clientName || orderSource || orderDate) && (
              <div className="p-4 border-b border-[#262626] bg-[#0A0A0A] space-y-1">
                {clientName && (
                  <div>
                    <span className="text-[#737373] text-xs uppercase">Клієнт: </span>
                    <span className="text-[#EDEDED] font-bold">{clientName}</span>
                  </div>
                )}
                <div className="flex gap-4 text-xs">
                  {orderDate && (
                    <span className="text-[#A3A3A3]">
                      📅 {new Date(orderDate).toLocaleDateString("uk-UA")}
                    </span>
                  )}
                  {orderSource && (
                    <span className="text-[#A3A3A3]">
                      📍 {orderSource}
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {/* Items List */}
            <div className="divide-y divide-[#262626]">
              {results.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-4">
                  <div>
                    <div className="text-[#EDEDED] font-bold text-sm">{item.name}</div>
                    <div className="text-[#737373] text-xs font-mono">
                      {item.kg} кг × {formatPrice(item.pricePerKg)}
                    </div>
                  </div>
                  <div className="text-[#EDEDED] font-mono text-right">
                    {formatPrice(item.total)} <span className="text-[#737373] text-xs">грн</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="bg-[#B5331B]/20 p-4 border-t border-[#B5331B]/30">
              <div className="flex justify-between items-center">
                <span className="text-[#EDEDED] font-bold uppercase">Разом</span>
                <span className="text-[#B5331B] text-2xl md:text-3xl font-bold font-mono" data-testid="result-total">
                  {formatPrice(results.total)}
                  <span className="text-base ml-1">грн</span>
                </span>
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#B5331B]/20">
                <span className="text-[#A3A3A3] text-sm">Ціна за м²</span>
                <span className="text-[#EDEDED] font-mono" data-testid="result-per-m2">
                  {formatPrice(Math.round(results.pricePerM2))} грн/м²
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-[#737373]">
            {!mode ? "Оберіть тип покриття" : !area ? "Введіть площу" : "Введіть коректну площу"}
          </div>
        )}
      </div>

      {/* Action Buttons - Fixed Bottom on Mobile */}
      <div className="space-y-2">
        {/* Mobile: Single Share Button */}
        <Button
          onClick={handleNativeShare}
          disabled={!results || sharing}
          className="md:hidden w-full bg-[#B5331B] hover:bg-red-700 text-white py-4 flex items-center justify-center gap-3 disabled:opacity-50"
          data-testid="native-share-btn"
        >
          <Share2 size={22} />
          <span className="text-sm font-bold">{sharing ? "Надсилання..." : "Надіслати файл"}</span>
        </Button>
        
        {/* Desktop: Messenger Buttons */}
        <div className="hidden md:grid grid-cols-3 gap-2">
          <Button
            onClick={() => shareToMessenger("telegram")}
            disabled={!results}
            className="bg-[#0088cc] hover:bg-[#0077b5] text-white py-3 flex items-center justify-center gap-1 disabled:opacity-50"
            data-testid="share-telegram-btn"
          >
            <MessageCircle size={18} />
            <span className="text-xs font-bold">Telegram</span>
          </Button>
          <Button
            onClick={() => shareToMessenger("viber")}
            disabled={!results}
            className="bg-[#7360f2] hover:bg-[#6050e0] text-white py-3 flex items-center justify-center gap-1 disabled:opacity-50"
            data-testid="share-viber-btn"
          >
            <MessageCircle size={18} />
            <span className="text-xs font-bold">Viber</span>
          </Button>
          <Button
            onClick={() => shareToMessenger("whatsapp")}
            disabled={!results}
            className="bg-[#25D366] hover:bg-[#20bd5a] text-white py-3 flex items-center justify-center gap-1 disabled:opacity-50"
            data-testid="share-whatsapp-btn"
          >
            <MessageCircle size={18} />
            <span className="text-xs font-bold">WhatsApp</span>
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button
            onClick={handleSave}
            disabled={saving || !results}
            className="bg-[#262626] hover:bg-[#333] text-[#A3A3A3] font-bold py-3 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
            data-testid="save-calculation-btn"
          >
            <Save size={18} />
            <span className="text-xs">Зберегти</span>
          </Button>

          <Button
            onClick={handleGenerateDoc}
            disabled={!results}
            className="bg-[#262626] hover:bg-[#333] text-[#A3A3A3] font-bold py-3 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
            data-testid="generate-document-btn"
          >
            <FileText size={18} />
            <span className="text-xs">Документ</span>
          </Button>

          <Button
            onClick={handleCopyResult}
            disabled={!results}
            className="bg-[#262626] hover:bg-[#333] text-[#A3A3A3] font-bold py-3 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
            data-testid="copy-result-btn"
          >
            <Copy size={18} />
            <span className="text-xs">Копіювати</span>
          </Button>
        </div>
      </div>

      {/* Help Section - Collapsible */}
      <button
        onClick={() => setShowHelp(!showHelp)}
        className="w-full bg-[#1A1A1A] border border-[#262626] p-3 flex items-center justify-between text-[#A3A3A3]"
      >
        <span className="text-sm font-bold uppercase">Інструкція</span>
        {showHelp ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      
      {showHelp && (
        <div className="bg-[#121212] border border-[#262626] p-4 text-sm text-[#A3A3A3] space-y-2">
          <p>• <strong className="text-[#EDEDED]">Флоки</strong> — декоративне покриття з чіпсами</p>
          <p>• <strong className="text-[#EDEDED]">Ґрунтівка</strong> — додайте для сухої стяжки</p>
          <p>• <strong className="text-[#EDEDED]">Емаль/Фарба</strong> — оберіть кількість шарів</p>
          <p>• Для флоків оберіть тип лаку</p>
        </div>
      )}
    </div>
  );
};

export default Calculator;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Trash2, Plus, MessageCircle, Share2, ChevronDown, ChevronUp, ToggleLeft, ToggleRight, Edit2, Check, X } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const Calculations = () => {
  const navigate = useNavigate();
  const [calculations, setCalculations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [expandedCalc, setExpandedCalc] = useState(null);
  const [editingCalc, setEditingCalc] = useState(null);
  const [editName, setEditName] = useState("");

  const fetchCalculations = async () => {
    try {
      const response = await axios.get(`${API}/calculations`);
      setCalculations(response.data.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      ));
    } catch (error) {
      toast.error("Помилка завантаження");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalculations();
  }, []);

  const formatPrice = (price) => new Intl.NumberFormat("uk-UA").format(price);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  const handleDelete = async (calcId) => {
    try {
      await axios.delete(`${API}/calculations/${calcId}`);
      toast.success("Видалено");
      fetchCalculations();
    } catch (error) {
      toast.error("Помилка видалення");
    }
  };

  const handleToggleTotal = async (calcId, e) => {
    e.stopPropagation();
    try {
      const response = await axios.patch(`${API}/calculations/${calcId}/toggle-total`);
      setCalculations(calculations.map(c => 
        c.id === calcId ? { ...c, include_in_total: response.data.include_in_total } : c
      ));
      toast.success(response.data.include_in_total ? "Додано до суми" : "Виключено з суми");
    } catch (error) {
      toast.error("Помилка оновлення");
    }
  };

  const startEditing = (calc, e) => {
    e.stopPropagation();
    setEditingCalc(calc.id);
    setEditName(calc.client_name || "");
  };

  const cancelEditing = (e) => {
    e.stopPropagation();
    setEditingCalc(null);
    setEditName("");
  };

  const saveClientName = async (calcId, e) => {
    e.stopPropagation();
    try {
      const response = await axios.patch(`${API}/calculations/${calcId}`, {
        client_name: editName
      });
      setCalculations(calculations.map(c => 
        c.id === calcId ? { ...c, client_name: response.data.client_name } : c
      ));
      setEditingCalc(null);
      setEditName("");
      toast.success("Збережено!");
    } catch (error) {
      toast.error("Помилка збереження");
    }
  };

  const handleDuplicate = async (calc) => {
    try {
      await axios.post(`${API}/calculations`, {
        product_id: calc.product_id,
        product_name: calc.product_name,
        client_name: calc.client_name,
        order_date: calc.order_date,
        order_source: calc.order_source,
        area_m2: calc.area_m2,
        layers: calc.layers,
        consumption_kg_m2: calc.consumption_kg_m2,
        total_kg: calc.total_kg,
        price_per_kg: calc.price_per_kg,
        total_price: calc.total_price,
        with_primer: calc.with_primer,
        lac_type: calc.lac_type,
        items: calc.items,
        include_in_total: true,
      });
      toast.success("Скопійовано");
      fetchCalculations();
    } catch (error) {
      toast.error("Помилка копіювання");
    }
  };

  const generateCalcText = (calc) => {
    let text = `📊 РОЗРАХУНОК МАТЕРІАЛІВ\nPoliBest 911\n\n`;
    if (calc.client_name) text += `Клієнт: ${calc.client_name}\n`;
    if (calc.order_date) text += `Дата: ${new Date(calc.order_date).toLocaleDateString("uk-UA")}\n`;
    if (calc.order_source) text += `Джерело: ${calc.order_source}\n`;
    text += `\nПродукт: ${calc.product_name}\n`;
    text += `Площа: ${calc.area_m2} м²\n`;
    if (calc.items && calc.items.length > 0) {
      text += `\nМАТЕРІАЛИ:\n`;
      calc.items.forEach((item) => {
        text += `• ${item.name}: ${item.kg} кг × ${formatPrice(item.pricePerKg)} = ${formatPrice(item.total)} грн\n`;
      });
    } else {
      text += `Шари: ${calc.layers}\n`;
      text += `Матеріал: ${calc.total_kg.toFixed(1)} кг\n`;
      text += `Ціна за кг: ${formatPrice(calc.price_per_kg)} грн\n`;
    }
    text += `\n💰 РАЗОМ: ${formatPrice(calc.total_price)} грн\n`;
    text += `📐 Ціна за м²: ${formatPrice(Math.round(calc.total_price / calc.area_m2))} грн/м²`;
    return text;
  };

  const createTextFile = (calc) => {
    const text = generateCalcText(calc);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    return new File([blob], `Розрахунок_${calc.product_name}.txt`, { type: "text/plain" });
  };

  const downloadTextFile = (calc) => {
    const text = generateCalcText(calc);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Розрахунок_${calc.product_name}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Native share for mobile
  const handleNativeShare = async (calc) => {
    setSharing(true);
    
    try {
      if (navigator.share) {
        const file = createTextFile(calc);
        
        // Try sharing with file
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: `Розрахунок ${calc.product_name}` });
          toast.success("Файл надіслано!");
          return;
        }
        
        // Try sharing text
        const text = generateCalcText(calc);
        await navigator.share({ title: `Розрахунок ${calc.product_name}`, text });
        toast.success("Надіслано!");
        return;
      }
      
      // Fallback: download file
      downloadTextFile(calc);
      toast.info("Файл завантажено. Надішліть його вручну.", { duration: 5000 });
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Share error:", error);
      downloadTextFile(calc);
      toast.info("Файл завантажено. Надішліть його вручну.");
    } finally {
      setSharing(false);
    }
  };

  const shareToMessenger = (messenger, calc) => {
    // Download file first
    downloadTextFile(calc);
    toast.info("Файл завантажено. Прикріпіть його в месенджері.", { duration: 5000 });
    
    // Open messenger
    setTimeout(() => {
      let url = "";
      switch (messenger) {
        case "telegram":
          url = `https://t.me/`;
          break;
        case "viber":
          url = `viber://forward?text=${encodeURIComponent(`Розрахунок ${calc.product_name}`)}`;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#A3A3A3]">Завантаження...</div>
      </div>
    );
  }

  // Calculate total for included calculations
  const totalSum = calculations
    .filter(c => c.include_in_total !== false)
    .reduce((sum, c) => sum + c.total_price, 0);

  return (
    <div data-testid="calculations-page" className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl md:text-3xl font-bold uppercase text-[#EDEDED] tracking-tight">
          Розрахунки
        </h1>
        <Button
          onClick={() => navigate("/calculator")}
          className="btn-primary flex items-center gap-2"
          data-testid="new-calculation-btn"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Новий</span>
        </Button>
      </div>

      {/* Total Sum Card */}
      {calculations.length > 0 && (
        <div className="bg-[#B5331B]/20 border border-[#B5331B]/30 p-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[#A3A3A3] text-xs uppercase">Загальна сума</span>
              <div className="text-[#B5331B] text-2xl font-bold font-mono">
                {formatPrice(totalSum)} <span className="text-base">грн</span>
              </div>
            </div>
            <div className="text-xs text-[#A3A3A3]">
              {calculations.filter(c => c.include_in_total !== false).length} з {calculations.length}
            </div>
          </div>
        </div>
      )}

      {calculations.length > 0 ? (
        <div className="space-y-2">
          {calculations.map((calc) => (
            <div
              key={calc.id}
              className={`bg-[#121212] border ${calc.include_in_total !== false ? 'border-[#262626]' : 'border-[#262626] opacity-60'}`}
              data-testid={`calculation-row-${calc.id}`}
            >
              {/* Header - clickable to expand */}
              <div 
                className="p-4 cursor-pointer"
                onClick={() => setExpandedCalc(expandedCalc === calc.id ? null : calc.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {/* Client Name - Editable */}
                    {editingCalc === calc.id ? (
                      <div className="flex items-center gap-2 mb-1" onClick={(e) => e.stopPropagation()}>
                        <Input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Ім'я клієнта"
                          className="h-8 text-sm bg-[#0A0A0A] border-[#262626] text-[#EDEDED] w-40"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveClientName(calc.id, e);
                            if (e.key === 'Escape') cancelEditing(e);
                          }}
                        />
                        <button
                          onClick={(e) => saveClientName(calc.id, e)}
                          className="p-1 text-[#22C55E] hover:bg-[#22C55E]/20 rounded"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="p-1 text-[#737373] hover:bg-[#737373]/20 rounded"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mb-1">
                        {calc.client_name ? (
                          <span className="text-[#B5331B] text-sm font-bold">👤 {calc.client_name}</span>
                        ) : (
                          <span className="text-[#737373] text-sm italic">Без імені</span>
                        )}
                        <button
                          onClick={(e) => startEditing(calc, e)}
                          className="p-1 text-[#737373] hover:text-[#EDEDED] hover:bg-[#262626] rounded"
                          title="Редагувати ім'я"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    )}
                    <div className="font-bold text-[#EDEDED]">{calc.product_name}</div>
                    <div className="text-xs text-[#737373] font-mono mt-1 flex flex-wrap gap-2">
                      <span>{calc.order_date ? new Date(calc.order_date).toLocaleDateString("uk-UA") : formatDate(calc.created_at)}</span>
                      <span>• {calc.area_m2} м²</span>
                      {calc.order_source && <span>• 📍 {calc.order_source}</span>}
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    {/* Toggle Button */}
                    <button
                      onClick={(e) => handleToggleTotal(calc.id, e)}
                      className={`p-1 rounded ${calc.include_in_total !== false ? 'text-[#22C55E]' : 'text-[#737373]'}`}
                      title={calc.include_in_total !== false ? 'Включено в суму' : 'Виключено з суми'}
                    >
                      {calc.include_in_total !== false ? (
                        <ToggleRight size={24} />
                      ) : (
                        <ToggleLeft size={24} />
                      )}
                    </button>
                    <div>
                      <div className={`font-mono font-bold text-lg ${calc.include_in_total !== false ? 'text-[#B5331B]' : 'text-[#737373]'}`}>
                        {formatPrice(calc.total_price)}
                      </div>
                      <div className="text-xs text-[#737373]">грн</div>
                    </div>
                    {expandedCalc === calc.id ? (
                      <ChevronUp size={20} className="text-[#737373]" />
                    ) : (
                      <ChevronDown size={20} className="text-[#737373]" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedCalc === calc.id && (
                <div className="border-t border-[#262626]">
                  {/* Items list like in calculator */}
                  {calc.items && calc.items.length > 0 ? (
                    <div className="divide-y divide-[#262626]">
                      {calc.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-4 bg-[#0A0A0A]">
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
                  ) : (
                    <div className="p-4 bg-[#0A0A0A] text-[#A3A3A3] text-sm">
                      <div>Шари: {calc.layers}</div>
                      <div>Матеріал: {calc.total_kg.toFixed(1)} кг</div>
                      <div>Ціна за кг: {formatPrice(calc.price_per_kg)} грн</div>
                    </div>
                  )}

                  {/* Total */}
                  <div className="bg-[#B5331B]/20 p-4 border-t border-[#B5331B]/30">
                    <div className="flex justify-between items-center">
                      <span className="text-[#EDEDED] font-bold uppercase">Разом</span>
                      <span className="text-[#B5331B] text-xl font-bold font-mono">
                        {formatPrice(calc.total_price)} грн
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#B5331B]/20">
                      <span className="text-[#A3A3A3] text-sm">Ціна за м²</span>
                      <span className="text-[#EDEDED] font-mono">
                        {formatPrice(Math.round(calc.total_price / calc.area_m2))} грн/м²
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 space-y-2">
                    {/* Mobile: Single Share Button */}
                    <Button
                      onClick={(e) => { e.stopPropagation(); handleNativeShare(calc); }}
                      disabled={sharing}
                      className="md:hidden w-full bg-[#B5331B] hover:bg-red-700 text-white py-3 flex items-center justify-center gap-2"
                      data-testid={`share-calc-${calc.id}`}
                    >
                      <Share2 size={18} />
                      <span className="text-sm font-bold">{sharing ? "Надсилання..." : "Надіслати файл"}</span>
                    </Button>
                    
                    {/* Desktop: Messenger buttons */}
                    <div className="hidden md:grid grid-cols-3 gap-2">
                      <Button
                        onClick={(e) => { e.stopPropagation(); shareToMessenger("telegram", calc); }}
                        className="bg-[#0088cc] hover:bg-[#0077b5] text-white py-2 text-xs flex items-center justify-center gap-1"
                      >
                        <MessageCircle size={14} />
                        Telegram
                      </Button>
                      <Button
                        onClick={(e) => { e.stopPropagation(); shareToMessenger("viber", calc); }}
                        className="bg-[#7360f2] hover:bg-[#6050e0] text-white py-2 text-xs flex items-center justify-center gap-1"
                      >
                        <MessageCircle size={14} />
                        Viber
                      </Button>
                      <Button
                        onClick={(e) => { e.stopPropagation(); shareToMessenger("whatsapp", calc); }}
                        className="bg-[#25D366] hover:bg-[#20bd5a] text-white py-2 text-xs flex items-center justify-center gap-1"
                      >
                        <MessageCircle size={14} />
                        WhatsApp
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleDuplicate(calc); }}
                        className="bg-[#1A1A1A] text-[#A3A3A3] hover:text-[#EDEDED] py-2 flex items-center justify-center"
                        data-testid={`duplicate-calc-${calc.id}`}
                      >
                        <Copy size={16} className="mr-1" />
                        <span className="text-xs">Копіювати</span>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#1A1A1A] text-[#A3A3A3] hover:text-[#B5331B] py-2 flex items-center justify-center"
                            data-testid={`delete-calc-${calc.id}`}
                          >
                            <Trash2 size={16} className="mr-1" />
                            <span className="text-xs">Видалити</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-[#121212] border-[#262626] mx-4">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-[#EDEDED]">
                              Видалити розрахунок?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-[#A3A3A3]">
                              Цю дію не можна скасувати.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="btn-secondary">
                              Скасувати
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(calc.id)}
                              className="btn-primary bg-[#7F1D1D] hover:bg-red-900"
                            >
                              Видалити
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#121212] border border-[#262626] p-8 text-center">
          <p className="text-[#A3A3A3] mb-4">Немає збережених розрахунків</p>
          <Button
            onClick={() => navigate("/calculator")}
            className="btn-primary"
          >
            Створити розрахунок
          </Button>
        </div>
      )}
    </div>
  );
};

export default Calculations;

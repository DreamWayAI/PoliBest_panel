import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { 
  ChevronLeft, ChevronRight, Plus, Trash2, Save, Eye,
  Building2, Settings2, Layers, FileText
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Switch } from "../components/ui/switch";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Default materials for dropdown - based on PDF example
const DEFAULT_MATERIALS = [
  "PoliBest 911 (захисна епоксидна емаль, колір за погодженням)",
  "PoliBest 911 ґрунтівка (захисна епоксидна глибокопроникна)",
  "PoliBest 500 (зміцнюючий склад для бетону глибокопроникний)",
  "Флокове покриття PoliBest",
  "Лак глянцевий PoliBest",
  "Лак матовий PoliBest",
  "Кварцовий наповнювач",
  "Декоративні чіпси (флоки)",
  "Антистатичне покриття",
  "Іскробезпечне покриття",
];

// Default template texts
const DEFAULT_DESCRIPTION = `Полімерні матеріали для захисного полімерного покриття PoliBest 911 (без розчинників).

Призначене для:
• Виробничих цехів та приміщень
• Складських комплексів
• Паркінгів та автосервісів
• Торгових площ
• Харчових виробництв
• Фармацевтичних підприємств`;

const DEFAULT_ADVANTAGES = [
  "Безпечне та екологічне: без шкідливих домішок, можна використовувати в житлових приміщеннях",
  "Глибоко проникаюче: 3-7 мм в бетон, що забезпечує надійну адгезію",
  "Стійке до навантажень: витримує вилочні навантажувачі та важку техніку",
  "Паропроникне: немає ефекту відшарування покриття",
  "Легке в догляді: миється звичайними засобами для підлоги",
  "Хімічна стійкість: до масел, бензину, кислот та лугів",
  "Естетичний вигляд: широкий вибір кольорів",
  "Довговічність: термін служби 15-25 років",
];

const DEFAULT_TECH_PARAMS = [
  { name: "Тип", value: "Двокомпонентні" },
  { name: "Колір", value: "За погодженням із замовником" },
  { name: "Термін служби в змішаному стані", value: "40 хвилин (+20°C)" },
  { name: "Температура нанесення", value: "+10...+30°C" },
  { name: "Товщина шару", value: "0.3-0.5 мм" },
  { name: "Повна полімеризація", value: "7 діб" },
  { name: "Термін служби", value: "15-25 років" },
];

export const KPWizard = () => {
  const navigate = useNavigate();
  const { id: editId } = useParams(); // Get ID if editing
  const isEditMode = !!editId;
  
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditMode);
  const [prices, setPrices] = useState(null);

  // Step 1: KP Data
  const [kpData, setKpData] = useState({
    title: "",
    client: "",
    location: "",
    date: new Date().toISOString().split("T")[0],
  });

  // Step 2: Calculation Settings
  const [settings, setSettings] = useState({
    currency: "UAH",
    includeVat: true,
    vatRate: 20,
    dealerDiscount: 20,
    productionTime: "до 9 календарних днів, після 100% оплати",
    warranty: "7 років гарантії на матеріали",
  });

  // Step 3: Rooms
  const [rooms, setRooms] = useState([
    {
      id: Date.now(),
      name: "Цех №1",
      area: 500,
      materials: [
        { id: Date.now(), name: "PoliBest 911 ґрунтівка (захисна епоксидна глибокопроникна)", consumption: 0.15, price: 864 },
        { id: Date.now() + 1, name: "PoliBest 911 (захисна епоксидна емаль, колір за погодженням)", consumption: 0.30, price: 1512 },
      ],
    },
  ]);

  // Step 4: Additional blocks
  const [additionalData, setAdditionalData] = useState({
    description: DEFAULT_DESCRIPTION,
    advantages: DEFAULT_ADVANTAGES,
    techParams: DEFAULT_TECH_PARAMS,
    // Company details (header)
    company: {
      name: 'ТОВ «ВедеВперед»',
      address: '03195, м. Київ, пров. Павла Ле, буд. 21',
      edrpou: '41842552',
      iban: 'UA623052990000260000362068860',
      bank: 'Печерська філія ПАТ КБ "ПРИВАТБАНК", м.Київ МФО 300711',
      pdv: '1826504500200',
      ipn: '418425526506',
      phones: '067-402-11-17, 093-512-58-38',
    },
    // Signature
    signature: {
      position: "Комерційний директор",
      name: "",
      company: 'ТОВ «ВедеВперед»',
      phone: "067-402-11-17",
      email: "",
    },
  });

  // Load existing KP if editing
  useEffect(() => {
    const loadKP = async () => {
      if (!editId) return;
      
      try {
        const response = await axios.get(`${API}/kp/${editId}`);
        const kp = response.data;
        
        // Populate form with existing data
        setKpData({
          title: kp.title || "",
          client: kp.client || "",
          location: kp.location || "",
          date: kp.date || new Date().toISOString().split("T")[0],
        });
        
        if (kp.settings) {
          setSettings(kp.settings);
        }
        
        if (kp.rooms && kp.rooms.length > 0) {
          // Ensure each room and material has unique IDs
          const roomsWithIds = kp.rooms.map((room, rIdx) => ({
            ...room,
            id: room.id || Date.now() + rIdx,
            materials: (room.materials || []).map((mat, mIdx) => ({
              ...mat,
              id: mat.id || Date.now() + rIdx * 100 + mIdx,
            })),
          }));
          setRooms(roomsWithIds);
        }
        
        if (kp.additionalData) {
          setAdditionalData({
            description: kp.additionalData.description || DEFAULT_DESCRIPTION,
            advantages: kp.additionalData.advantages || DEFAULT_ADVANTAGES,
            techParams: kp.additionalData.techParams || DEFAULT_TECH_PARAMS,
            company: kp.additionalData.company || additionalData.company,
            signature: kp.additionalData.signature || additionalData.signature,
          });
        }
        
        toast.success("КП завантажено для редагування");
      } catch (error) {
        toast.error("Помилка завантаження КП");
        navigate("/commercial");
      } finally {
        setLoading(false);
      }
    };
    
    loadKP();
  }, [editId, navigate]);

  // Load prices from settings
  useEffect(() => {
    const loadPrices = async () => {
      try {
        const response = await axios.get(`${API}/calculator-prices`);
        setPrices(response.data);
      } catch (error) {
        console.error("Failed to load prices");
      }
    };
    loadPrices();
  }, []);

  const steps = [
    { num: 1, title: "Дані КП", icon: FileText },
    { num: 2, title: "Налаштування", icon: Settings2 },
    { num: 3, title: "Приміщення", icon: Building2 },
    { num: 4, title: "Додатково", icon: Layers },
  ];

  // Calculations
  // Calculate layers from consumption (1 layer = 0.1 kg/m²)
  // Using multiplication to avoid JavaScript floating-point precision issues
  const getLayersFromConsumption = (consumption) => {
    return Math.round(consumption * 10);
  };

  const calculateMaterialTotal = (room, material) => {
    // Total kg = Area × Consumption (layers are already included in consumption)
    const totalKg = room.area * material.consumption;
    const sum = totalKg * material.price;
    const layers = getLayersFromConsumption(material.consumption);
    return { totalKg, sum, layers };
  };

  const calculateRoomTotal = (room) => {
    let materialsSum = 0;
    let totalLayers = 0;
    room.materials.forEach((m) => {
      const { sum, layers } = calculateMaterialTotal(room, m);
      materialsSum += sum;
      totalLayers += layers;
    });

    const withVat = settings.includeVat
      ? materialsSum * (1 + settings.vatRate / 100)
      : materialsSum;
    const discount = withVat * (settings.dealerDiscount / 100);
    const total = withVat - discount;

    return { materialsSum, withVat, discount, total, totalLayers };
  };

  const calculateGrandTotal = () => {
    return rooms.reduce((sum, room) => sum + calculateRoomTotal(room).total, 0);
  };

  // Room handlers
  const addRoom = () => {
    setRooms([
      ...rooms,
      {
        id: Date.now(),
        name: `Приміщення ${rooms.length + 1}`,
        area: 200,
        materials: [
          { id: Date.now(), name: "PoliBest 911 ґрунтівка (захисна епоксидна глибокопроникна)", consumption: 0.15, price: prices?.primer || 864 },
          { id: Date.now() + 1, name: "PoliBest 911 (захисна епоксидна емаль, колір за погодженням)", consumption: 0.30, price: prices?.enamel || 1512 },
        ],
      },
    ]);
  };

  const updateRoom = (roomId, field, value) => {
    setRooms(rooms.map((r) => (r.id === roomId ? { ...r, [field]: value } : r)));
  };

  const deleteRoom = (roomId) => {
    if (rooms.length > 1) {
      setRooms(rooms.filter((r) => r.id !== roomId));
    } else {
      toast.error("Потрібно хоча б одне приміщення");
    }
  };

  // Material handlers
  const addMaterial = (roomId) => {
    setRooms(
      rooms.map((r) =>
        r.id === roomId
          ? {
              ...r,
              materials: [
                ...r.materials,
                { id: Date.now(), name: "", consumption: 0.2, price: 0 },
              ],
            }
          : r
      )
    );
  };

  const updateMaterial = (roomId, materialId, field, value) => {
    setRooms(
      rooms.map((r) =>
        r.id === roomId
          ? {
              ...r,
              materials: r.materials.map((m) =>
                m.id === materialId ? { ...m, [field]: value } : m
              ),
            }
          : r
      )
    );
  };

  const deleteMaterial = (roomId, materialId) => {
    setRooms(
      rooms.map((r) =>
        r.id === roomId
          ? {
              ...r,
              materials: r.materials.filter((m) => m.id !== materialId),
            }
          : r
      )
    );
  };

  // Advantage handlers
  const addAdvantage = () => {
    setAdditionalData({
      ...additionalData,
      advantages: [...additionalData.advantages, ""],
    });
  };

  const updateAdvantage = (index, value) => {
    const newAdvantages = [...additionalData.advantages];
    newAdvantages[index] = value;
    setAdditionalData({ ...additionalData, advantages: newAdvantages });
  };

  const deleteAdvantage = (index) => {
    setAdditionalData({
      ...additionalData,
      advantages: additionalData.advantages.filter((_, i) => i !== index),
    });
  };

  // Tech param handlers
  const addTechParam = () => {
    setAdditionalData({
      ...additionalData,
      techParams: [...additionalData.techParams, { name: "", value: "" }],
    });
  };

  const updateTechParam = (index, field, value) => {
    const newParams = [...additionalData.techParams];
    newParams[index][field] = value;
    setAdditionalData({ ...additionalData, techParams: newParams });
  };

  const deleteTechParam = (index) => {
    setAdditionalData({
      ...additionalData,
      techParams: additionalData.techParams.filter((_, i) => i !== index),
    });
  };

  // Save KP
  const saveKP = async (goToPreview = false) => {
    if (!kpData.title || !kpData.client) {
      toast.error("Заповніть назву КП та клієнта");
      setStep(1);
      return;
    }

    setSaving(true);
    try {
      const kpDocument = {
        ...kpData,
        settings,
        rooms: rooms.map((r) => ({
          ...r,
          totals: calculateRoomTotal(r),
        })),
        additionalData,
        grandTotal: calculateGrandTotal(),
      };

      let resultId;
      
      if (isEditMode) {
        // Update existing KP
        await axios.put(`${API}/kp/${editId}`, kpDocument);
        toast.success("КП оновлено");
        resultId = editId;
      } else {
        // Create new KP
        const response = await axios.post(`${API}/kp`, kpDocument);
        toast.success("КП збережено");
        resultId = response.data.id;
      }

      if (goToPreview) {
        navigate(`/commercial/kp/preview/${resultId}`);
      } else {
        navigate("/commercial");
      }
    } catch (error) {
      toast.error("Помилка збереження");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value) => {
    const symbols = { UAH: "₴", EUR: "€", USD: "$" };
    return `${value.toLocaleString("uk-UA", { minimumFractionDigits: 2 })} ${symbols[settings.currency]}`;
  };

  // Loading state for edit mode
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#A3A3A3]">Завантаження КП...</div>
      </div>
    );
  }

  return (
    <div data-testid="kp-wizard" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold uppercase text-[#EDEDED] tracking-tight">
          {isEditMode ? "Редагування КП" : "Створення КП"}
        </h1>
        <div className="flex gap-2">
          <Button
            onClick={() => saveKP(true)}
            disabled={saving}
            className="bg-[#B5331B] hover:bg-red-700 text-white"
            data-testid="preview-btn"
          >
            <Eye size={18} className="mr-2" />
            <span className="hidden sm:inline">Переглянути</span>
          </Button>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between bg-[#121212] border border-[#262626] p-4">
        {steps.map((s, idx) => (
          <button
            key={s.num}
            onClick={() => setStep(s.num)}
            className={`flex items-center gap-2 ${
              step === s.num
                ? "text-[#B5331B]"
                : step > s.num
                ? "text-[#A3A3A3]"
                : "text-[#4A4A4A]"
            }`}
            data-testid={`step-${s.num}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step === s.num
                  ? "bg-[#B5331B] text-white"
                  : step > s.num
                  ? "bg-[#262626] text-[#A3A3A3]"
                  : "bg-[#1A1A1A] text-[#4A4A4A]"
              }`}
            >
              {s.num}
            </div>
            <span className="hidden md:inline text-sm font-bold uppercase">
              {s.title}
            </span>
            {idx < steps.length - 1 && (
              <div className="hidden md:block w-8 h-px bg-[#262626] mx-2" />
            )}
          </button>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-[#121212] border border-[#262626] p-4 md:p-6">
        {/* Step 1: KP Data */}
        {step === 1 && (
          <div className="space-y-4" data-testid="step-1-content">
            <h2 className="text-lg font-bold text-[#EDEDED] uppercase mb-4">
              Дані комерційної пропозиції
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-[#A3A3A3]">Назва КП / Проект *</Label>
                <Input
                  value={kpData.title}
                  onChange={(e) => setKpData({ ...kpData, title: e.target.value })}
                  placeholder="Наприклад: Склад №5, вул. Промислова"
                  className="bg-[#0A0A0A] border-[#262626] text-[#EDEDED] mt-1"
                  data-testid="kp-title"
                />
              </div>
              <div>
                <Label className="text-[#A3A3A3]">Клієнт *</Label>
                <Input
                  value={kpData.client}
                  onChange={(e) => setKpData({ ...kpData, client: e.target.value })}
                  placeholder="Назва компанії або ПІБ"
                  className="bg-[#0A0A0A] border-[#262626] text-[#EDEDED] mt-1"
                  data-testid="kp-client"
                />
              </div>
              <div>
                <Label className="text-[#A3A3A3]">Локація</Label>
                <Input
                  value={kpData.location}
                  onChange={(e) => setKpData({ ...kpData, location: e.target.value })}
                  placeholder="Країна, місто"
                  className="bg-[#0A0A0A] border-[#262626] text-[#EDEDED] mt-1"
                  data-testid="kp-location"
                />
              </div>
              <div>
                <Label className="text-[#A3A3A3]">Дата КП</Label>
                <Input
                  type="date"
                  value={kpData.date}
                  onChange={(e) => setKpData({ ...kpData, date: e.target.value })}
                  className="bg-[#0A0A0A] border-[#262626] text-[#EDEDED] mt-1"
                  data-testid="kp-date"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Settings */}
        {step === 2 && (
          <div className="space-y-4" data-testid="step-2-content">
            <h2 className="text-lg font-bold text-[#EDEDED] uppercase mb-4">
              Налаштування розрахунку
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-[#A3A3A3]">Валюта</Label>
                <Select
                  value={settings.currency}
                  onValueChange={(v) => setSettings({ ...settings, currency: v })}
                >
                  <SelectTrigger className="bg-[#0A0A0A] border-[#262626] text-[#EDEDED] mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#121212] border-[#262626]">
                    <SelectItem value="UAH">UAH (₴)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-[#0A0A0A] border border-[#262626] rounded">
                <Label className="text-[#A3A3A3]">ПДВ ({settings.vatRate}%)</Label>
                <Switch
                  checked={settings.includeVat}
                  onCheckedChange={(v) => setSettings({ ...settings, includeVat: v })}
                  data-testid="vat-switch"
                />
              </div>
              
              <div>
                <Label className="text-[#A3A3A3]">Дилерська знижка (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.dealerDiscount}
                  onChange={(e) => setSettings({ ...settings, dealerDiscount: parseFloat(e.target.value) || 0 })}
                  className="bg-[#0A0A0A] border-[#262626] text-[#EDEDED] mt-1"
                  data-testid="discount-input"
                />
              </div>
              
              <div>
                <Label className="text-[#A3A3A3]">Термін виготовлення</Label>
                <Input
                  value={settings.productionTime}
                  onChange={(e) => setSettings({ ...settings, productionTime: e.target.value })}
                  className="bg-[#0A0A0A] border-[#262626] text-[#EDEDED] mt-1"
                  data-testid="production-time"
                />
              </div>
              
              <div>
                <Label className="text-[#A3A3A3]">Гарантія</Label>
                <Input
                  value={settings.warranty}
                  onChange={(e) => setSettings({ ...settings, warranty: e.target.value })}
                  className="bg-[#0A0A0A] border-[#262626] text-[#EDEDED] mt-1"
                  data-testid="warranty-input"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Rooms */}
        {step === 3 && (
          <div className="space-y-4" data-testid="step-3-content">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#EDEDED] uppercase">
                Приміщення
              </h2>
              <Button
                onClick={addRoom}
                className="bg-[#B5331B] hover:bg-red-700 text-white"
                data-testid="add-room-btn"
              >
                <Plus size={18} className="mr-1" />
                Додати
              </Button>
            </div>

            {rooms.map((room, roomIdx) => (
              <div
                key={room.id}
                className="bg-[#0A0A0A] border border-[#262626] p-4 space-y-4"
                data-testid={`room-${roomIdx}`}
              >
                <div className="flex items-center justify-between">
                  <Input
                    value={room.name}
                    onChange={(e) => updateRoom(room.id, "name", e.target.value)}
                    className="bg-[#121212] border-[#262626] text-[#EDEDED] font-bold text-lg max-w-xs"
                    data-testid={`room-name-${roomIdx}`}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteRoom(room.id)}
                    className="text-[#737373] hover:text-[#B5331B]"
                    data-testid={`delete-room-${roomIdx}`}
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>

                <div>
                  <Label className="text-[#737373] text-xs">Площа (м²)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={room.area}
                    onChange={(e) => updateRoom(room.id, "area", parseFloat(e.target.value) || 0)}
                    className="bg-[#121212] border-[#262626] text-[#EDEDED] mt-1 max-w-[200px]"
                    data-testid={`room-area-${roomIdx}`}
                  />
                </div>

                {/* Materials Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[#A3A3A3] text-sm font-bold">Матеріали</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addMaterial(room.id)}
                      className="text-[#B5331B] hover:text-red-400 text-xs"
                      data-testid={`add-material-${roomIdx}`}
                    >
                      <Plus size={14} className="mr-1" />
                      Додати
                    </Button>
                  </div>

                  {/* Table Header */}
                  <div className="hidden md:grid grid-cols-12 gap-2 text-xs text-[#737373] font-bold uppercase py-2 border-b border-[#262626]">
                    <div className="col-span-3">Матеріал</div>
                    <div className="col-span-2">Витрата</div>
                    <div className="col-span-1 text-center">Шари</div>
                    <div className="col-span-2">Ціна/кг</div>
                    <div className="col-span-1">Кг</div>
                    <div className="col-span-2">Сума</div>
                    <div className="col-span-1"></div>
                  </div>

                  {room.materials.map((mat, matIdx) => {
                    const { totalKg, sum, layers } = calculateMaterialTotal(room, mat);
                    return (
                      <div
                        key={mat.id}
                        className="grid grid-cols-1 md:grid-cols-12 gap-2 py-2 border-b border-[#1A1A1A]"
                        data-testid={`material-${roomIdx}-${matIdx}`}
                      >
                        <div className="md:col-span-3">
                          <Label className="md:hidden text-[#737373] text-xs">Матеріал</Label>
                          <Select
                            value={mat.name}
                            onValueChange={(v) => updateMaterial(room.id, mat.id, "name", v)}
                          >
                            <SelectTrigger className="bg-[#121212] border-[#262626] text-[#EDEDED] text-sm h-9">
                              <SelectValue placeholder="Виберіть..." />
                            </SelectTrigger>
                            <SelectContent className="bg-[#121212] border-[#262626]">
                              {DEFAULT_MATERIALS.map((m) => (
                                <SelectItem key={m} value={m}>{m}</SelectItem>
                              ))}
                              <SelectItem value="custom">Інше...</SelectItem>
                            </SelectContent>
                          </Select>
                          {mat.name === "custom" && (
                            <Input
                              placeholder="Введіть назву"
                              className="bg-[#121212] border-[#262626] text-[#EDEDED] text-sm h-9 mt-1"
                              onChange={(e) => updateMaterial(room.id, mat.id, "name", e.target.value)}
                            />
                          )}
                        </div>
                        <div className="md:col-span-2">
                          <Label className="md:hidden text-[#737373] text-xs">Витрата кг/м²</Label>
                          <Input
                            type="number"
                            step="0.05"
                            min="0"
                            value={mat.consumption}
                            onChange={(e) => updateMaterial(room.id, mat.id, "consumption", parseFloat(e.target.value) || 0)}
                            className="bg-[#121212] border-[#262626] text-[#EDEDED] text-sm h-9"
                          />
                        </div>
                        <div className="md:col-span-1 flex items-center justify-center">
                          <span className="md:hidden text-[#737373] text-xs mr-2">Шари:</span>
                          <span className="text-[#B5331B] text-sm font-bold">{layers}</span>
                        </div>
                        <div className="md:col-span-2">
                          <Label className="md:hidden text-[#737373] text-xs">Ціна за 1 кг</Label>
                          <Input
                            type="number"
                            min="0"
                            value={mat.price}
                            onChange={(e) => updateMaterial(room.id, mat.id, "price", parseFloat(e.target.value) || 0)}
                            className="bg-[#121212] border-[#262626] text-[#EDEDED] text-sm h-9"
                          />
                        </div>
                        <div className="md:col-span-1 flex items-center">
                          <span className="md:hidden text-[#737373] text-xs mr-2">Кг:</span>
                          <span className="text-[#A3A3A3] text-sm">{totalKg.toFixed(1)}</span>
                        </div>
                        <div className="md:col-span-2 flex items-center">
                          <span className="md:hidden text-[#737373] text-xs mr-2">Сума:</span>
                          <span className="text-[#EDEDED] text-sm font-bold">{formatCurrency(sum)}</span>
                        </div>
                        <div className="md:col-span-1 flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMaterial(room.id, mat.id)}
                            className="text-[#737373] hover:text-[#B5331B] h-9 w-9 p-0"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Room Totals */}
                <div className="bg-[#121212] p-3 space-y-2 text-sm">
                  {(() => {
                    const totals = calculateRoomTotal(room);
                    return (
                      <>
                        <div className="flex justify-between text-[#A3A3A3]">
                          <span>Всього шарів: <span className="text-[#B5331B] font-bold">{totals.totalLayers}</span></span>
                          <span>Вартість: {formatCurrency(totals.materialsSum)}</span>
                        </div>
                        {settings.includeVat && (
                          <div className="flex justify-between text-[#A3A3A3]">
                            <span>З ПДВ ({settings.vatRate}%):</span>
                            <span>{formatCurrency(totals.withVat)}</span>
                          </div>
                        )}
                        {settings.dealerDiscount > 0 && (
                          <div className="flex justify-between text-green-500">
                            <span>Знижка ({settings.dealerDiscount}%):</span>
                            <span>-{formatCurrency(totals.discount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-[#EDEDED] font-bold text-base border-t border-[#262626] pt-2">
                          <span>Разом по приміщенню:</span>
                          <span className="text-[#B5331B]">{formatCurrency(totals.total)}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            ))}

            {/* Grand Total */}
            <div className="bg-[#B5331B]/20 border border-[#B5331B] p-4">
              <div className="flex justify-between items-center">
                <span className="text-[#EDEDED] font-bold uppercase">
                  Загальна вартість:
                </span>
                <span className="text-2xl font-bold text-[#B5331B]">
                  {formatCurrency(calculateGrandTotal())}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Additional */}
        {step === 4 && (
          <div className="space-y-6" data-testid="step-4-content">
            <h2 className="text-lg font-bold text-[#EDEDED] uppercase mb-4">
              Реквізити та додаткові блоки
            </h2>

            {/* Company Details */}
            <div className="bg-[#0A0A0A] border border-[#B5331B] p-4">
              <Label className="text-[#B5331B] font-bold mb-3 block uppercase">
                Реквізити компанії (шапка КП)
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#737373] text-xs">Назва компанії</Label>
                  <Input
                    value={additionalData.company?.name || ''}
                    onChange={(e) => setAdditionalData({
                      ...additionalData,
                      company: { ...additionalData.company, name: e.target.value }
                    })}
                    className="bg-[#121212] border-[#262626] text-[#EDEDED] mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[#737373] text-xs">Телефони</Label>
                  <Input
                    value={additionalData.company?.phones || ''}
                    onChange={(e) => setAdditionalData({
                      ...additionalData,
                      company: { ...additionalData.company, phones: e.target.value }
                    })}
                    className="bg-[#121212] border-[#262626] text-[#EDEDED] mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-[#737373] text-xs">Адреса</Label>
                  <Input
                    value={additionalData.company?.address || ''}
                    onChange={(e) => setAdditionalData({
                      ...additionalData,
                      company: { ...additionalData.company, address: e.target.value }
                    })}
                    className="bg-[#121212] border-[#262626] text-[#EDEDED] mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[#737373] text-xs">ЄДРПОУ</Label>
                  <Input
                    value={additionalData.company?.edrpou || ''}
                    onChange={(e) => setAdditionalData({
                      ...additionalData,
                      company: { ...additionalData.company, edrpou: e.target.value }
                    })}
                    className="bg-[#121212] border-[#262626] text-[#EDEDED] mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[#737373] text-xs">ІПН</Label>
                  <Input
                    value={additionalData.company?.ipn || ''}
                    onChange={(e) => setAdditionalData({
                      ...additionalData,
                      company: { ...additionalData.company, ipn: e.target.value }
                    })}
                    className="bg-[#121212] border-[#262626] text-[#EDEDED] mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-[#737373] text-xs">IBAN</Label>
                  <Input
                    value={additionalData.company?.iban || ''}
                    onChange={(e) => setAdditionalData({
                      ...additionalData,
                      company: { ...additionalData.company, iban: e.target.value }
                    })}
                    className="bg-[#121212] border-[#262626] text-[#EDEDED] mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-[#737373] text-xs">Банк</Label>
                  <Input
                    value={additionalData.company?.bank || ''}
                    onChange={(e) => setAdditionalData({
                      ...additionalData,
                      company: { ...additionalData.company, bank: e.target.value }
                    })}
                    className="bg-[#121212] border-[#262626] text-[#EDEDED] mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[#737373] text-xs">№ витягу з реєстру ПДВ</Label>
                  <Input
                    value={additionalData.company?.pdv || ''}
                    onChange={(e) => setAdditionalData({
                      ...additionalData,
                      company: { ...additionalData.company, pdv: e.target.value }
                    })}
                    className="bg-[#121212] border-[#262626] text-[#EDEDED] mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <Label className="text-[#A3A3A3] font-bold">Опис та застосування</Label>
              <Textarea
                value={additionalData.description}
                onChange={(e) => setAdditionalData({ ...additionalData, description: e.target.value })}
                rows={6}
                className="bg-[#0A0A0A] border-[#262626] text-[#EDEDED] mt-2"
                data-testid="description-input"
              />
            </div>

            {/* Advantages */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-[#A3A3A3] font-bold">Переваги</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addAdvantage}
                  className="text-[#B5331B] hover:text-red-400 text-xs"
                >
                  <Plus size={14} className="mr-1" />
                  Додати
                </Button>
              </div>
              <div className="space-y-2">
                {additionalData.advantages.map((adv, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      value={adv}
                      onChange={(e) => updateAdvantage(idx, e.target.value)}
                      className="bg-[#0A0A0A] border-[#262626] text-[#EDEDED]"
                      data-testid={`advantage-${idx}`}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteAdvantage(idx)}
                      className="text-[#737373] hover:text-[#B5331B]"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Tech Params */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-[#A3A3A3] font-bold">Технічні параметри</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addTechParam}
                  className="text-[#B5331B] hover:text-red-400 text-xs"
                >
                  <Plus size={14} className="mr-1" />
                  Додати
                </Button>
              </div>
              <div className="space-y-2">
                {additionalData.techParams.map((param, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      value={param.name}
                      onChange={(e) => updateTechParam(idx, "name", e.target.value)}
                      placeholder="Параметр"
                      className="bg-[#0A0A0A] border-[#262626] text-[#EDEDED] flex-1"
                    />
                    <Input
                      value={param.value}
                      onChange={(e) => updateTechParam(idx, "value", e.target.value)}
                      placeholder="Значення"
                      className="bg-[#0A0A0A] border-[#262626] text-[#EDEDED] flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTechParam(idx)}
                      className="text-[#737373] hover:text-[#B5331B]"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Signature */}
            <div>
              <Label className="text-[#A3A3A3] font-bold mb-2 block">Підпис</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#737373] text-xs">Посада</Label>
                  <Input
                    value={additionalData.signature.position}
                    onChange={(e) => setAdditionalData({
                      ...additionalData,
                      signature: { ...additionalData.signature, position: e.target.value }
                    })}
                    className="bg-[#0A0A0A] border-[#262626] text-[#EDEDED] mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[#737373] text-xs">ПІБ</Label>
                  <Input
                    value={additionalData.signature.name}
                    onChange={(e) => setAdditionalData({
                      ...additionalData,
                      signature: { ...additionalData.signature, name: e.target.value }
                    })}
                    className="bg-[#0A0A0A] border-[#262626] text-[#EDEDED] mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[#737373] text-xs">Телефон</Label>
                  <Input
                    value={additionalData.signature.phone}
                    onChange={(e) => setAdditionalData({
                      ...additionalData,
                      signature: { ...additionalData.signature, phone: e.target.value }
                    })}
                    className="bg-[#0A0A0A] border-[#262626] text-[#EDEDED] mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[#737373] text-xs">Email</Label>
                  <Input
                    value={additionalData.signature.email}
                    onChange={(e) => setAdditionalData({
                      ...additionalData,
                      signature: { ...additionalData.signature, email: e.target.value }
                    })}
                    className="bg-[#0A0A0A] border-[#262626] text-[#EDEDED] mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
          className="btn-secondary"
          data-testid="prev-step"
        >
          <ChevronLeft size={18} className="mr-1" />
          Назад
        </Button>

        {step < 4 ? (
          <Button
            onClick={() => setStep(step + 1)}
            className="bg-[#B5331B] hover:bg-red-700 text-white"
            data-testid="next-step"
          >
            Далі
            <ChevronRight size={18} className="ml-1" />
          </Button>
        ) : (
          <Button
            onClick={() => saveKP(false)}
            disabled={saving}
            className="bg-[#B5331B] hover:bg-red-700 text-white"
            data-testid="save-kp"
          >
            <Save size={18} className="mr-2" />
            {saving ? "Збереження..." : isEditMode ? "Оновити КП" : "Зберегти КП"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default KPWizard;

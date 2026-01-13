import { useEffect, useState } from "react";
import { Plus, Trash2, Edit2, Save, X, Calculator } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const Settings = () => {
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState({
    currency: "UAH",
    unit: "m2",
    company_name: "PoliBest 911",
  });
  const [calculatorPrices, setCalculatorPrices] = useState({
    primer: 720,
    paint: 990,
    enamel: 1260,
    floki: 1350,
    lacGlossy: 1440,
    lacMatte: 1800,
  });
  const [loading, setLoading] = useState(true);
  const [savingPrices, setSavingPrices] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: "",
    price_per_kg: "",
    consumption_kg_m2: "",
    description: "",
  });

  const fetchData = async () => {
    try {
      const [productsRes, settingsRes, pricesRes] = await Promise.all([
        axios.get(`${API}/products`),
        axios.get(`${API}/settings`),
        axios.get(`${API}/calculator-prices`),
      ]);
      setProducts(productsRes.data);
      setSettings(settingsRes.data);
      setCalculatorPrices(pricesRes.data);
    } catch (error) {
      console.error("Помилка завантаження даних:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.price_per_kg || !productForm.consumption_kg_m2) {
      toast.error("Заповніть всі обов'язкові поля");
      return;
    }

    try {
      const data = {
        name: productForm.name,
        price_per_kg: parseFloat(productForm.price_per_kg),
        consumption_kg_m2: parseFloat(productForm.consumption_kg_m2),
        description: productForm.description,
      };

      if (editingProduct) {
        await axios.put(`${API}/products/${editingProduct.id}`, data);
        toast.success("Продукт оновлено");
      } else {
        await axios.post(`${API}/products`, data);
        toast.success("Продукт додано");
      }

      setShowProductForm(false);
      setEditingProduct(null);
      setProductForm({ name: "", price_per_kg: "", consumption_kg_m2: "", description: "" });
      fetchData();
    } catch (error) {
      console.error("Помилка збереження:", error);
      toast.error("Помилка збереження продукту");
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      price_per_kg: product.price_per_kg.toString(),
      consumption_kg_m2: product.consumption_kg_m2.toString(),
      description: product.description || "",
    });
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await axios.delete(`${API}/products/${productId}`);
      toast.success("Продукт видалено");
      fetchData();
    } catch (error) {
      console.error("Помилка видалення:", error);
      toast.error("Помилка видалення продукту");
    }
  };

  const handleSaveSettings = async () => {
    try {
      await axios.put(`${API}/settings`, settings);
      toast.success("Налаштування збережено");
    } catch (error) {
      console.error("Помилка збереження:", error);
      toast.error("Помилка збереження налаштувань");
    }
  };

  const handleSaveCalculatorPrices = async () => {
    setSavingPrices(true);
    try {
      await axios.put(`${API}/calculator-prices`, calculatorPrices);
      toast.success("Ціни калькулятора збережено");
    } catch (error) {
      console.error("Помилка збереження:", error);
      toast.error("Помилка збереження цін");
    } finally {
      setSavingPrices(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("uk-UA").format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#A3A3A3]">Завантаження...</div>
      </div>
    );
  }

  return (
    <div data-testid="settings-page" className="space-y-6">
      <h1 className="text-xl md:text-3xl font-bold uppercase text-[#EDEDED] tracking-tight">
        Налаштування
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calculator Prices Section */}
        <div className="bg-[#121212] border border-[#262626] p-4 md:p-6">
          <div className="flex items-center gap-3 mb-6">
            <Calculator size={24} className="text-[#B5331B]" />
            <h2 className="text-lg md:text-xl font-bold uppercase text-[#EDEDED]">
              Ціни калькулятора
            </h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#A3A3A3] uppercase text-xs tracking-wider mb-2 block">
                  Ґрунтівка (грн/кг)
                </Label>
                <Input
                  type="number"
                  value={calculatorPrices.primer}
                  onChange={(e) =>
                    setCalculatorPrices({ ...calculatorPrices, primer: parseFloat(e.target.value) || 0 })
                  }
                  className="input-industrial w-full"
                  data-testid="price-primer-input"
                />
              </div>
              <div>
                <Label className="text-[#A3A3A3] uppercase text-xs tracking-wider mb-2 block">
                  Фарба (грн/кг)
                </Label>
                <Input
                  type="number"
                  value={calculatorPrices.paint}
                  onChange={(e) =>
                    setCalculatorPrices({ ...calculatorPrices, paint: parseFloat(e.target.value) || 0 })
                  }
                  className="input-industrial w-full"
                  data-testid="price-paint-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#A3A3A3] uppercase text-xs tracking-wider mb-2 block">
                  Емаль (грн/кг)
                </Label>
                <Input
                  type="number"
                  value={calculatorPrices.enamel}
                  onChange={(e) =>
                    setCalculatorPrices({ ...calculatorPrices, enamel: parseFloat(e.target.value) || 0 })
                  }
                  className="input-industrial w-full"
                  data-testid="price-enamel-input"
                />
              </div>
              <div>
                <Label className="text-[#A3A3A3] uppercase text-xs tracking-wider mb-2 block">
                  Флоки (грн/кг)
                </Label>
                <Input
                  type="number"
                  value={calculatorPrices.floki}
                  onChange={(e) =>
                    setCalculatorPrices({ ...calculatorPrices, floki: parseFloat(e.target.value) || 0 })
                  }
                  className="input-industrial w-full"
                  data-testid="price-floki-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#A3A3A3] uppercase text-xs tracking-wider mb-2 block">
                  Лак глянц. (грн/кг)
                </Label>
                <Input
                  type="number"
                  value={calculatorPrices.lacGlossy}
                  onChange={(e) =>
                    setCalculatorPrices({ ...calculatorPrices, lacGlossy: parseFloat(e.target.value) || 0 })
                  }
                  className="input-industrial w-full"
                  data-testid="price-lacglossy-input"
                />
              </div>
              <div>
                <Label className="text-[#A3A3A3] uppercase text-xs tracking-wider mb-2 block">
                  Лак матовий (грн/кг)
                </Label>
                <Input
                  type="number"
                  value={calculatorPrices.lacMatte}
                  onChange={(e) =>
                    setCalculatorPrices({ ...calculatorPrices, lacMatte: parseFloat(e.target.value) || 0 })
                  }
                  className="input-industrial w-full"
                  data-testid="price-lacmatte-input"
                />
              </div>
            </div>

            <Button
              onClick={handleSaveCalculatorPrices}
              disabled={savingPrices}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-4"
              data-testid="save-calculator-prices-btn"
            >
              <Save size={18} />
              <span>{savingPrices ? "Збереження..." : "Зберегти ціни"}</span>
            </Button>
          </div>
        </div>

        {/* General Settings Section */}
        <div className="bg-[#121212] border border-[#262626] p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold uppercase text-[#EDEDED] mb-6">
            Загальні налаштування
          </h2>

          <div className="space-y-4">
            <div>
              <Label className="text-[#A3A3A3] uppercase text-xs tracking-wider mb-2 block">
                Назва компанії
              </Label>
              <Input
                value={settings.company_name}
                onChange={(e) =>
                  setSettings({ ...settings, company_name: e.target.value })
                }
                className="input-industrial w-full"
                data-testid="company-name-input"
              />
            </div>

            <div>
              <Label className="text-[#A3A3A3] uppercase text-xs tracking-wider mb-2 block">
                Валюта
              </Label>
              <Select
                value={settings.currency}
                onValueChange={(value) =>
                  setSettings({ ...settings, currency: value })
                }
              >
                <SelectTrigger className="input-industrial w-full" data-testid="currency-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UAH">Гривня (₴)</SelectItem>
                  <SelectItem value="USD">Долар ($)</SelectItem>
                  <SelectItem value="EUR">Євро (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[#A3A3A3] uppercase text-xs tracking-wider mb-2 block">
                Одиниці виміру
              </Label>
              <Select
                value={settings.unit}
                onValueChange={(value) =>
                  setSettings({ ...settings, unit: value })
                }
              >
                <SelectTrigger className="input-industrial w-full" data-testid="unit-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="m2">Квадратні метри (м²)</SelectItem>
                  <SelectItem value="ft2">Квадратні фути (ft²)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSaveSettings}
              className="btn-primary w-full flex items-center justify-center gap-2"
              data-testid="save-settings-btn"
            >
              <Save size={18} />
              <span>Зберегти налаштування</span>
            </Button>
          </div>
        </div>

        {/* Products Section */}
        <div className="bg-[#121212] border border-[#262626] p-4 md:p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg md:text-xl font-bold uppercase text-[#EDEDED]">
              Продукти
            </h2>
            <Button
              onClick={() => {
                setEditingProduct(null);
                setProductForm({ name: "", price_per_kg: "", consumption_kg_m2: "", description: "" });
                setShowProductForm(true);
              }}
              className="btn-primary flex items-center gap-2"
              data-testid="add-product-btn"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Додати</span>
            </Button>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 bg-[#0A0A0A] border border-[#262626]"
                  data-testid={`product-row-${product.id}`}
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-[#EDEDED] truncate">{product.name}</h3>
                    <p className="text-sm text-[#A3A3A3]">
                      {formatPrice(product.price_per_kg)} грн/кг • {product.consumption_kg_m2} кг/м²
                    </p>
                  </div>
                  <div className="flex gap-2 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditProduct(product)}
                      className="text-[#A3A3A3] hover:text-[#EDEDED]"
                      data-testid={`edit-product-${product.id}`}
                    >
                      <Edit2 size={16} />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[#A3A3A3] hover:text-[#B5331B]"
                          data-testid={`delete-product-${product.id}`}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-[#121212] border-[#262626] mx-4">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-[#EDEDED]">
                            Видалити продукт?
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
                            onClick={() => handleDeleteProduct(product.id)}
                            className="btn-primary bg-[#7F1D1D] hover:bg-red-900"
                          >
                            Видалити
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#A3A3A3] text-center py-8">
              Немає доданих продуктів
            </p>
          )}
        </div>

        {/* App Info */}
        <div className="bg-[#121212] border border-[#262626] p-4 md:p-6 lg:col-span-2">
          <h2 className="text-lg md:text-xl font-bold uppercase text-[#EDEDED] mb-4">
            Про додаток
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-[#A3A3A3]">
            <p>
              <span className="text-[#737373]">Версія:</span> 1.0.0
            </p>
            <p>
              <span className="text-[#737373]">Розробник:</span> PoliBest 911
            </p>
            <p>
              <span className="text-[#737373]">Підтримка:</span> support@polibest911.com
            </p>
          </div>
        </div>
      </div>

      {/* Product Form Dialog */}
      <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
        <DialogContent className="bg-[#121212] border-[#262626] mx-4 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#EDEDED]">
              {editingProduct ? "Редагувати продукт" : "Новий продукт"}
            </DialogTitle>
            <DialogDescription className="text-[#A3A3A3]">
              Заповніть інформацію про продукт
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-[#A3A3A3] uppercase text-xs tracking-wider mb-2 block">
                Назва *
              </Label>
              <Input
                value={productForm.name}
                onChange={(e) =>
                  setProductForm({ ...productForm, name: e.target.value })
                }
                className="input-industrial w-full"
                placeholder="Епоксидне покриття ПБ-911"
                data-testid="product-name-input"
              />
            </div>

            <div>
              <Label className="text-[#A3A3A3] uppercase text-xs tracking-wider mb-2 block">
                Ціна за кг (грн) *
              </Label>
              <Input
                type="number"
                value={productForm.price_per_kg}
                onChange={(e) =>
                  setProductForm({ ...productForm, price_per_kg: e.target.value })
                }
                className="input-industrial w-full"
                placeholder="500"
                data-testid="product-price-input"
              />
            </div>

            <div>
              <Label className="text-[#A3A3A3] uppercase text-xs tracking-wider mb-2 block">
                Витрата (кг/м²) *
              </Label>
              <Input
                type="number"
                step="0.01"
                value={productForm.consumption_kg_m2}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    consumption_kg_m2: e.target.value,
                  })
                }
                className="input-industrial w-full"
                placeholder="1.5"
                data-testid="product-consumption-input"
              />
            </div>

            <div>
              <Label className="text-[#A3A3A3] uppercase text-xs tracking-wider mb-2 block">
                Опис
              </Label>
              <Input
                value={productForm.description}
                onChange={(e) =>
                  setProductForm({ ...productForm, description: e.target.value })
                }
                className="input-industrial w-full"
                placeholder="Короткий опис продукту"
                data-testid="product-description-input"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                onClick={() => setShowProductForm(false)}
                className="btn-secondary flex-1 flex items-center justify-center gap-2"
              >
                <X size={18} />
                <span>Скасувати</span>
              </Button>
              <Button
                onClick={handleSaveProduct}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
                data-testid="save-product-btn"
              >
                <Save size={18} />
                <span>Зберегти</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;

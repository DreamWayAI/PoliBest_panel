import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, FileText, Eye, Edit, FilePlus2, Plus, Download, ChevronRight, Filter } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Status configuration
const STATUSES = [
  { id: "draft", label: "Чернетка", color: "bg-[#4A4A4A]", textColor: "text-[#A3A3A3]" },
  { id: "sent", label: "Відправлено", color: "bg-blue-600", textColor: "text-blue-400" },
  { id: "paid", label: "Оплачено", color: "bg-green-600", textColor: "text-green-400" },
  { id: "cancelled", label: "Скасовано", color: "bg-red-900", textColor: "text-red-400" },
];

const getStatusConfig = (status) => STATUSES.find(s => s.id === status) || STATUSES[0];

// Allow selecting any status except current
const getAvailableStatuses = (currentStatus) => {
  return STATUSES.filter(s => s.id !== currentStatus);
};

export const Commercial = () => {
  const navigate = useNavigate();
  const [kpList, setKpList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [funnelStats, setFunnelStats] = useState(null);

  const fetchKP = async () => {
    try {
      const [kpRes, statsRes] = await Promise.all([
        axios.get(`${API}/kp`),
        axios.get(`${API}/kp/stats/funnel`)
      ]);
      setKpList(kpRes.data.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      ));
      setFunnelStats(statsRes.data);
    } catch (error) {
      toast.error("Помилка завантаження");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKP();
  }, []);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  const formatCurrency = (value, currency = "UAH") => {
    const symbols = { UAH: "₴", EUR: "€", USD: "$" };
    return `${value?.toLocaleString("uk-UA", { minimumFractionDigits: 0 })} ${symbols[currency] || "₴"}`;
  };

  const handleDelete = async (kpId) => {
    try {
      await axios.delete(`${API}/kp/${kpId}`);
      toast.success("КП видалено");
      fetchKP();
    } catch (error) {
      toast.error("Помилка видалення");
    }
  };

  const handleStatusChange = async (kpId, newStatus) => {
    try {
      await axios.patch(`${API}/kp/${kpId}/status`, { status: newStatus });
      const statusLabel = getStatusConfig(newStatus).label;
      toast.success(`Статус змінено: ${statusLabel}`);
      fetchKP();
    } catch (error) {
      toast.error("Помилка зміни статусу");
    }
  };

  // Filter KPs
  const filteredKpList = filterStatus === "all" 
    ? kpList 
    : kpList.filter(kp => (kp.status || "draft") === filterStatus);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#A3A3A3]">Завантаження...</div>
      </div>
    );
  }

  return (
    <div data-testid="commercial-page" className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg sm:text-xl md:text-3xl font-bold uppercase text-[#EDEDED] tracking-tight">
          Комерційне
        </h1>
        <Button
          onClick={() => navigate("/commercial/kp/new")}
          className="bg-[#B5331B] hover:bg-red-700 text-white font-bold uppercase tracking-wide text-xs sm:text-sm px-3 sm:px-4"
          data-testid="create-kp-btn"
        >
          <FilePlus2 size={16} className="mr-1 sm:mr-2" />
          <span className="hidden xs:inline">Створити</span> КП
        </Button>
      </div>

      {/* Funnel Stats */}
      {funnelStats && (
        <div className="bg-[#121212] border border-[#262626] p-3 sm:p-4">
          <h3 className="text-xs font-bold text-[#737373] uppercase mb-3">Воронка продажів</h3>
          <div className="flex flex-wrap gap-1 sm:gap-0 sm:flex-nowrap items-center">
            {funnelStats.funnel?.map((stage, idx) => {
              const config = getStatusConfig(stage.status);
              const isLast = idx === funnelStats.funnel.length - 1;
              return (
                <div key={stage.status} className="flex items-center">
                  <button
                    onClick={() => setFilterStatus(stage.status)}
                    className={`px-2 sm:px-3 py-2 sm:py-3 text-center transition-all hover:opacity-80 ${
                      filterStatus === stage.status ? 'ring-2 ring-[#B5331B]' : ''
                    }`}
                    style={{ 
                      clipPath: idx === 0 
                        ? 'polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%)'
                        : isLast
                        ? 'polygon(10px 0, 100% 0, 100% 100%, 10px 100%, 0 50%)'
                        : 'polygon(10px 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 10px 100%, 0 50%)',
                      minWidth: '70px'
                    }}
                  >
                    <div className={`text-lg sm:text-2xl font-bold ${config.textColor}`}>
                      {stage.count}
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-[#737373] uppercase truncate">
                      {stage.label}
                    </div>
                    {stage.conversion < 100 && idx > 0 && (
                      <div className="text-[8px] text-[#4A4A4A]">
                        {stage.conversion}%
                      </div>
                    )}
                  </button>
                  {!isLast && (
                    <ChevronRight size={14} className="text-[#4A4A4A] hidden sm:block mx-0.5" />
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Summary row */}
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#262626] text-xs">
            <div className="flex gap-4">
              <span className="text-[#737373]">
                Всього: <span className="text-[#EDEDED] font-bold">{funnelStats.total_count}</span> КП
              </span>
              {funnelStats.cancelled?.count > 0 && (
                <button
                  onClick={() => setFilterStatus("cancelled")}
                  className="text-red-400 hover:text-red-300"
                >
                  Скасовано: {funnelStats.cancelled.count}
                </button>
              )}
            </div>
            <span className="text-[#B5331B] font-bold">
              {formatCurrency(funnelStats.total_sum)}
            </span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter size={14} className="text-[#737373]" />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px] bg-[#121212] border-[#262626] text-[#EDEDED] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#121212] border-[#262626]">
            <SelectItem value="all">Всі статуси</SelectItem>
            {STATUSES.map(s => (
              <SelectItem key={s.id} value={s.id}>
                <span className={s.textColor}>{s.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filterStatus !== "all" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilterStatus("all")}
            className="text-[#737373] hover:text-[#EDEDED] text-xs"
          >
            Скинути
          </Button>
        )}
        <span className="text-[#4A4A4A] text-xs ml-auto">
          {filteredKpList.length} КП
        </span>
      </div>

      {/* KP List */}
      {filteredKpList.length > 0 ? (
        <div className="space-y-3">
          {filteredKpList.map((kp) => {
            const status = kp.status || "draft";
            const statusConfig = getStatusConfig(status);
            const availableStatuses = getAvailableStatuses(status);
            
            return (
              <div
                key={kp.id}
                className="bg-[#121212] border border-[#262626] p-3 sm:p-4"
                data-testid={`kp-row-${kp.id}`}
              >
                {/* KP Info */}
                <div className="flex items-start gap-3 mb-3">
                  <div 
                    className="p-2 shrink-0 cursor-pointer active:opacity-70"
                    onClick={() => navigate(`/commercial/kp/preview/${kp.id}`)}
                  >
                    <FileText size={18} className="text-[#B5331B]" />
                  </div>
                  <div 
                    className="flex-1 min-w-0 cursor-pointer active:opacity-70"
                    onClick={() => navigate(`/commercial/kp/preview/${kp.id}`)}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#EDEDED] text-sm truncate max-w-[150px] sm:max-w-none">
                        {kp.title}
                      </span>
                      <span className={`px-1.5 py-0.5 text-[10px] font-bold uppercase ${statusConfig.color} text-white rounded`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] sm:text-xs text-[#737373]">
                      <span>{formatDate(kp.created_at)}</span>
                      {kp.client && (
                        <span className="text-[#A3A3A3] truncate max-w-[100px] sm:max-w-none">• {kp.client}</span>
                      )}
                    </div>
                    {kp.grandTotal > 0 && (
                      <p className="text-base sm:text-lg text-[#B5331B] font-bold mt-1">
                        {formatCurrency(kp.grandTotal, kp.settings?.currency)}
                      </p>
                    )}
                  </div>
                  
                  {/* Quick status change */}
                  {availableStatuses.length > 0 && (
                    <div className="shrink-0">
                      <Select 
                        value="" 
                        onValueChange={(value) => handleStatusChange(kp.id, value)}
                      >
                        <SelectTrigger className="w-[100px] sm:w-[130px] bg-[#1A1A1A] border-[#262626] text-[#A3A3A3] h-8 text-xs">
                          <SelectValue placeholder="Статус" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#121212] border-[#262626]">
                          {availableStatuses.map(s => (
                            <SelectItem key={s.id} value={s.id}>
                              <span className={s.textColor}>{s.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/commercial/kp/preview/${kp.id}`)}
                    className="bg-[#B5331B]/20 text-[#B5331B] hover:bg-[#B5331B]/30 h-10 sm:h-9 px-1 sm:px-3"
                    data-testid={`view-kp-${kp.id}`}
                  >
                    <Eye size={16} />
                    <span className="hidden sm:inline text-xs ml-1">Перегляд</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/commercial/kp/edit/${kp.id}`)}
                    className="bg-[#1A1A1A] text-[#A3A3A3] hover:text-[#EDEDED] h-10 sm:h-9 px-1 sm:px-3"
                    data-testid={`edit-kp-${kp.id}`}
                  >
                    <Edit size={16} />
                    <span className="hidden sm:inline text-xs ml-1">Редагувати</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/commercial/kp/preview/${kp.id}`)}
                    className="bg-[#1A1A1A] text-[#A3A3A3] hover:text-[#EDEDED] h-10 sm:h-9 px-1 sm:px-3"
                    data-testid={`pdf-kp-${kp.id}`}
                  >
                    <Download size={16} />
                    <span className="hidden sm:inline text-xs ml-1">PDF</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="bg-[#1A1A1A] text-[#A3A3A3] hover:text-[#B5331B] h-10 sm:h-9 px-1 sm:px-3"
                        data-testid={`delete-kp-${kp.id}`}
                      >
                        <Trash2 size={16} />
                        <span className="hidden sm:inline text-xs ml-1">Видалити</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-[#121212] border-[#262626] mx-4 max-w-[calc(100vw-2rem)]">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-[#EDEDED]">
                          Видалити КП?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-[#A3A3A3]">
                          "{kp.title}" буде видалено. Цю дію не можна скасувати.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel className="btn-secondary w-full sm:w-auto">
                          Скасувати
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(kp.id)}
                          className="btn-primary bg-[#7F1D1D] hover:bg-red-900 w-full sm:w-auto"
                        >
                          Видалити
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#121212] border border-[#262626] p-6 sm:p-8 text-center">
          <FileText size={40} className="mx-auto text-[#262626] mb-4" />
          <p className="text-[#A3A3A3] mb-4 text-sm sm:text-base">
            {filterStatus !== "all" 
              ? `Немає КП зі статусом "${getStatusConfig(filterStatus).label}"`
              : "Немає комерційних пропозицій"
            }
          </p>
          {filterStatus !== "all" ? (
            <Button
              onClick={() => setFilterStatus("all")}
              className="bg-[#262626] hover:bg-[#333] text-white"
            >
              Показати всі КП
            </Button>
          ) : (
            <Button
              onClick={() => navigate("/commercial/kp/new")}
              className="bg-[#B5331B] hover:bg-red-700 text-white w-full sm:w-auto"
            >
              <Plus size={18} className="mr-2" />
              Створити першу КП
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default Commercial;

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calculator, FileText, FolderOpen, TrendingUp } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const Dashboard = () => {
  const [stats, setStats] = useState({
    products_count: 0,
    calculations_count: 0,
    documents_count: 0,
    total_revenue: 0,
    recent_calculations: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${API}/stats`);
        setStats(response.data);
      } catch (error) {
        console.error("Помилка завантаження:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("uk-UA", {
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#A3A3A3]">Завантаження...</div>
      </div>
    );
  }

  return (
    <div data-testid="dashboard-page" className="space-y-4">
      <h1 className="text-xl md:text-3xl font-bold uppercase text-[#EDEDED] tracking-tight">
        Панель
      </h1>

      {/* Stats Grid - 2x2 on mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="stat-card" data-testid="stat-products">
          <div className="flex items-center gap-3">
            <div className="p-2 md:p-3 bg-[#B5331B]/20 text-[#B5331B]">
              <Calculator size={20} />
            </div>
            <div>
              <div className="stat-value">{stats.products_count}</div>
              <div className="stat-label">Продуктів</div>
            </div>
          </div>
        </div>

        <div className="stat-card" data-testid="stat-calculations">
          <div className="flex items-center gap-3">
            <div className="p-2 md:p-3 bg-[#B5331B]/20 text-[#B5331B]">
              <FileText size={20} />
            </div>
            <div>
              <div className="stat-value">{stats.calculations_count}</div>
              <div className="stat-label">Розрахунків</div>
            </div>
          </div>
        </div>

        <div className="stat-card" data-testid="stat-documents">
          <div className="flex items-center gap-3">
            <div className="p-2 md:p-3 bg-[#B5331B]/20 text-[#B5331B]">
              <FolderOpen size={20} />
            </div>
            <div>
              <div className="stat-value">{stats.documents_count}</div>
              <div className="stat-label">Документів</div>
            </div>
          </div>
        </div>

        <div className="stat-card" data-testid="stat-revenue">
          <div className="flex items-center gap-3">
            <div className="p-2 md:p-3 bg-[#B5331B]/20 text-[#B5331B]">
              <TrendingUp size={20} />
            </div>
            <div>
              <div className="stat-value text-lg md:text-2xl">{formatPrice(stats.total_revenue)}</div>
              <div className="stat-label">Сума (грн)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions - Full width on mobile */}
      <div className="space-y-3">
        <Link
          to="/calculator"
          className="card-industrial flex items-center gap-4 active:scale-[0.99] transition-transform"
          data-testid="quick-action-calculator"
        >
          <div className="p-3 md:p-4 bg-[#B5331B] text-white">
            <Calculator size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-base md:text-lg font-bold uppercase text-[#EDEDED]">Новий розрахунок</h3>
            <p className="text-xs md:text-sm text-[#A3A3A3]">Створити розрахунок матеріалів</p>
          </div>
        </Link>

        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/documents"
            className="card-industrial flex items-center gap-3 active:scale-[0.99] transition-transform"
            data-testid="quick-action-documents"
          >
            <div className="p-2 md:p-3 bg-[#262626] text-[#A3A3A3]">
              <FolderOpen size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase text-[#EDEDED]">Документи</h3>
            </div>
          </Link>

          <Link
            to="/calculations"
            className="card-industrial flex items-center gap-3 active:scale-[0.99] transition-transform"
            data-testid="quick-action-calculations"
          >
            <div className="p-2 md:p-3 bg-[#262626] text-[#A3A3A3]">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase text-[#EDEDED]">Розрахунки</h3>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Calculations */}
      <div className="card-industrial">
        <h2 className="text-base md:text-xl font-bold uppercase text-[#EDEDED] mb-4">
          Останні розрахунки
        </h2>
        {stats.recent_calculations.length > 0 ? (
          <div className="space-y-2">
            {stats.recent_calculations.map((calc) => (
              <div
                key={calc.id}
                className="flex items-center justify-between p-3 bg-[#0A0A0A] border border-[#262626]"
                data-testid={`recent-calc-${calc.id}`}
              >
                <div>
                  <div className="font-bold text-sm text-[#EDEDED]">
                    {calc.client_name && <span className="text-[#B5331B]">{calc.client_name} • </span>}
                    {calc.product_name}
                  </div>
                  <div className="text-xs text-[#737373] font-mono">
                    {formatDate(calc.created_at)} • {calc.area_m2} м²
                  </div>
                </div>
                <div className="text-[#B5331B] font-mono font-bold">
                  {formatPrice(calc.total_price)} <span className="text-xs">грн</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[#737373] text-sm">Немає розрахунків. Створіть перший в калькуляторі.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

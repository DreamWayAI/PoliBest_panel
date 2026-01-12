import { 
  Truck, 
  Wrench, 
  GraduationCap, 
  HeadphonesIcon, 
  Calculator, 
  FileText,
  Building2,
  Beaker
} from "lucide-react";
import { Button } from "../components/ui/button";
import { toast } from "sonner";

const servicesData = [
  {
    id: "delivery",
    title: "Доставка матеріалів",
    description: "Оперативна доставка полімерних покриттів по всій Україні",
    icon: Truck,
    status: "active",
    action: "Замовити",
  },
  {
    id: "installation",
    title: "Монтаж покриттів",
    description: "Професійний монтаж нашими спеціалістами",
    icon: Wrench,
    status: "active",
    action: "Залишити заявку",
  },
  {
    id: "training",
    title: "Навчання",
    description: "Курси з роботи з полімерними покриттями",
    icon: GraduationCap,
    status: "coming_soon",
    action: "Скоро",
  },
  {
    id: "support",
    title: "Техпідтримка",
    description: "Консультації з вибору та застосування матеріалів",
    icon: HeadphonesIcon,
    status: "active",
    action: "Зв'язатися",
  },
  {
    id: "calculator",
    title: "Розрахунок проєкту",
    description: "Безкоштовний розрахунок матеріалів для вашого об'єкта",
    icon: Calculator,
    status: "active",
    action: "Розрахувати",
  },
  {
    id: "documentation",
    title: "Проєктна документація",
    description: "Підготовка технічної документації",
    icon: FileText,
    status: "coming_soon",
    action: "Скоро",
  },
  {
    id: "objects",
    title: "Супровід об'єктів",
    description: "Контроль якості на всіх етапах робіт",
    icon: Building2,
    status: "active",
    action: "Детальніше",
  },
  {
    id: "lab",
    title: "Лабораторні випробування",
    description: "Тестування покриттів та матеріалів",
    icon: Beaker,
    status: "coming_soon",
    action: "Скоро",
  },
];

export const Services = () => {
  const handleAction = (service) => {
    if (service.status === "coming_soon") {
      toast.info("Цей сервіс скоро буде доступний");
    } else {
      toast.success(`Заявку на "${service.title}" прийнято`);
    }
  };

  return (
    <div data-testid="services-page">
      <h1 className="page-header">Сервіси та послуги</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {servicesData.map((service) => (
          <div
            key={service.id}
            className={`service-card transition-colors ${
              service.status === "coming_soon" ? "opacity-60" : ""
            }`}
            data-testid={`service-card-${service.id}`}
          >
            <div
              className={`p-4 inline-block mb-4 ${
                service.status === "active"
                  ? "bg-[#B5331B]/20 text-[#B5331B]"
                  : "bg-[#262626] text-[#737373]"
              }`}
            >
              <service.icon size={32} />
            </div>

            <h3 className="text-lg font-bold text-[#EDEDED] uppercase mb-2">
              {service.title}
            </h3>

            <p className="text-sm text-[#A3A3A3] mb-6 min-h-[40px]">
              {service.description}
            </p>

            <Button
              onClick={() => handleAction(service)}
              className={`w-full ${
                service.status === "active" ? "btn-primary" : "btn-secondary"
              }`}
              disabled={service.status === "coming_soon"}
              data-testid={`service-action-${service.id}`}
            >
              {service.action}
            </Button>
          </div>
        ))}
      </div>

      {/* Contact Section */}
      <div className="card-industrial mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-bold uppercase text-[#EDEDED] mb-4">
              Потрібна допомога?
            </h2>
            <p className="text-[#A3A3A3] mb-4">
              Наші спеціалісти готові відповісти на будь-які питання щодо полімерних
              покриттів та допомогти з вибором оптимального рішення для вашого
              об'єкта.
            </p>
            <div className="space-y-2 text-[#EDEDED]">
              <p className="font-mono">Тел: +38 (067) 123-45-67</p>
              <p className="font-mono">Email: info@polibest911.ua</p>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <Button
              onClick={() => toast.success("Заявку на зворотній дзвінок відправлено")}
              className="btn-primary text-lg px-8 py-4"
              data-testid="callback-btn"
            >
              Замовити дзвінок
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Services;

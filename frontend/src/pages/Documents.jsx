import { useEffect, useState } from "react";
import { Download, Trash2, FileText, Eye, MessageCircle, Share2 } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [sharing, setSharing] = useState(false);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API}/documents`);
      setDocuments(response.data.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      ));
    } catch (error) {
      toast.error("Помилка завантаження");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (value, currency = "UAH") => {
    const symbols = { UAH: "₴", EUR: "€", USD: "$" };
    return `${value?.toLocaleString("uk-UA", { minimumFractionDigits: 0 })} ${symbols[currency] || "₴"}`;
  };

  const handleDelete = async (docId) => {
    try {
      await axios.delete(`${API}/documents/${docId}`);
      toast.success("Видалено");
      setSelectedDoc(null);
      fetchDocuments();
    } catch (error) {
      toast.error("Помилка видалення");
    }
  };

  const handleDownload = (doc) => {
    const blob = new Blob([doc.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${doc.title}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Завантажено");
  };

  const shareToMessenger = async (messenger, doc) => {
    handleDownload(doc);
    toast.info("Файл завантажено. Прикріпіть його в месенджері.", { duration: 5000 });
    
    setTimeout(() => {
      let url = "";
      const text = `📄 ${doc.title}\n\n— PoliBest 911`;
      const encodedText = encodeURIComponent(text);
      
      switch (messenger) {
        case "telegram":
          url = `https://t.me/`;
          break;
        case "viber":
          url = `viber://forward?text=${encodedText}`;
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

  const handleNativeShare = async (doc) => {
    setSharing(true);
    
    try {
      const blob = new Blob([doc.content], { type: "text/plain;charset=utf-8" });
      const file = new File([blob], `${doc.title}.txt`, { type: "text/plain" });
      
      if (navigator.share) {
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: doc.title });
          toast.success("Файл надіслано!");
          return;
        }
        
        const fileUrl = `${API}/documents/${doc.id}/file`;
        try {
          await navigator.share({ 
            title: doc.title, 
            text: `📄 ${doc.title}`,
            url: fileUrl 
          });
          toast.success("Посилання надіслано!");
          return;
        } catch (e) {
          console.log("URL share failed:", e);
        }
      }
      
      handleDownload(doc);
      toast.info("Файл завантажено. Надішліть його вручну.", { duration: 5000 });
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Share error:", error);
      handleDownload(doc);
      toast.info("Файл завантажено. Надішліть його вручну.");
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#A3A3A3]">Завантаження...</div>
      </div>
    );
  }

  return (
    <div data-testid="documents-page" className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl md:text-3xl font-bold uppercase text-[#EDEDED] tracking-tight">
          Документи
        </h1>
        <span className="text-[#737373] text-sm">{documents.length} документів</span>
      </div>

      {documents.length > 0 ? (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-[#121212] border border-[#262626] p-4"
              data-testid={`document-row-${doc.id}`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 shrink-0 bg-[#262626] text-[#737373]">
                  <FileText size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-[#EDEDED] text-sm truncate block">
                    {doc.title}
                  </span>
                  <span className="text-xs text-[#737373]">{formatDate(doc.created_at)}</span>
                </div>
              </div>

              {/* Mobile: Single Share Button */}
              <Button
                onClick={() => handleNativeShare(doc)}
                disabled={sharing}
                className="md:hidden w-full bg-[#B5331B] hover:bg-red-700 text-white py-3 mb-2 flex items-center justify-center gap-2"
                data-testid={`share-doc-${doc.id}`}
              >
                <Share2 size={18} />
                <span className="text-sm font-bold">{sharing ? "Надсилання..." : "Надіслати файл"}</span>
              </Button>
              
              {/* Desktop: Messenger Buttons */}
              <div className="hidden md:grid grid-cols-3 gap-2 mb-2">
                <Button
                  onClick={() => shareToMessenger("telegram", doc)}
                  className="bg-[#0088cc] hover:bg-[#0077b5] text-white py-2 text-xs flex items-center justify-center gap-1"
                >
                  <MessageCircle size={14} />
                  Telegram
                </Button>
                <Button
                  onClick={() => shareToMessenger("viber", doc)}
                  className="bg-[#7360f2] hover:bg-[#6050e0] text-white py-2 text-xs flex items-center justify-center gap-1"
                >
                  <MessageCircle size={14} />
                  Viber
                </Button>
                <Button
                  onClick={() => shareToMessenger("whatsapp", doc)}
                  className="bg-[#25D366] hover:bg-[#20bd5a] text-white py-2 text-xs flex items-center justify-center gap-1"
                >
                  <MessageCircle size={14} />
                  WhatsApp
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDoc(doc)}
                  className="bg-[#1A1A1A] text-[#A3A3A3] hover:text-[#EDEDED] py-2"
                  data-testid={`view-doc-${doc.id}`}
                >
                  <Eye size={16} className="mr-1" />
                  <span className="text-xs">Перегляд</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(doc)}
                  className="bg-[#1A1A1A] text-[#A3A3A3] hover:text-[#EDEDED] py-2"
                  data-testid={`download-doc-${doc.id}`}
                >
                  <Download size={16} className="mr-1" />
                  <span className="text-xs">Зберегти</span>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="bg-[#1A1A1A] text-[#A3A3A3] hover:text-[#B5331B] py-2"
                      data-testid={`delete-doc-${doc.id}`}
                    >
                      <Trash2 size={16} className="mr-1" />
                      <span className="text-xs">Видалити</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-[#121212] border-[#262626] mx-4">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-[#EDEDED]">
                        Видалити документ?
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
                        onClick={() => handleDelete(doc.id)}
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
        <div className="bg-[#121212] border border-[#262626] p-8 text-center">
          <FileText size={48} className="mx-auto text-[#262626] mb-4" />
          <p className="text-[#A3A3A3]">Немає збережених документів</p>
          <p className="text-[#737373] text-sm mt-2">
            Документи з'являться тут після створення розрахунків
          </p>
        </div>
      )}

      {/* Document Preview Dialog */}
      <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
        <DialogContent className="bg-[#121212] border-[#262626] mx-4 max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-[#EDEDED] text-base pr-8">
              {selectedDoc?.title}
            </DialogTitle>
            <DialogDescription className="text-[#737373] text-xs">
              Перегляд документа
            </DialogDescription>
          </DialogHeader>
          <div className="bg-[#0A0A0A] border border-[#262626] p-4 font-mono text-xs text-[#EDEDED] whitespace-pre-wrap max-h-[40vh] overflow-y-auto">
            {selectedDoc?.content}
          </div>
          
          {/* Mobile: Single Share Button */}
          <Button
            onClick={() => handleNativeShare(selectedDoc)}
            disabled={sharing}
            className="md:hidden w-full bg-[#B5331B] hover:bg-red-700 text-white py-3 flex items-center justify-center gap-2"
          >
            <Share2 size={18} />
            <span className="text-sm font-bold">{sharing ? "Надсилання..." : "Надіслати файл"}</span>
          </Button>
          
          {/* Desktop: Messenger Buttons */}
          <div className="hidden md:grid grid-cols-3 gap-2">
            <Button
              onClick={() => shareToMessenger("telegram", selectedDoc)}
              className="bg-[#0088cc] hover:bg-[#0077b5] text-white py-2 text-xs"
            >
              Telegram
            </Button>
            <Button
              onClick={() => shareToMessenger("viber", selectedDoc)}
              className="bg-[#7360f2] hover:bg-[#6050e0] text-white py-2 text-xs"
            >
              Viber
            </Button>
            <Button
              onClick={() => shareToMessenger("whatsapp", selectedDoc)}
              className="bg-[#25D366] hover:bg-[#20bd5a] text-white py-2 text-xs"
            >
              WhatsApp
            </Button>
          </div>
          <Button
            onClick={() => handleDownload(selectedDoc)}
            className="btn-secondary w-full py-3"
          >
            <Download size={18} className="mr-2" />
            Завантажити
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Documents;

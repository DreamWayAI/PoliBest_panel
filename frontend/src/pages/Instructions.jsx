import { useState, useEffect, useRef } from "react";
import { 
  FileText, File, Download, Plus, Trash2, Edit2, Save, X, 
  Upload, Share2, Image, FileIcon, MessageCircle
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
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

const categories = [
  { id: "tech_paint", title: "Тех карта фарба" },
  { id: "tech_enamel", title: "Тех карта емаль" },
  { id: "tech_floki", title: "Тех карта флоки" },
  { id: "mistakes", title: "Типові помилки" },
  { id: "repair", title: "Ремонт покриттів" },
  { id: "safety", title: "Безпека" },
];

// Check if we're on mobile
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const Instructions = () => {
  const [instructions, setInstructions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstruction, setSelectedInstruction] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingInstruction, setEditingInstruction] = useState(null);
  const [sharing, setSharing] = useState(false);
  const fileInputRef = useRef(null);
  
  const [form, setForm] = useState({
    title: "",
    category: "tech_paint",
    content: "",
    file_name: null,
    file_data: null,
    file_type: "text",
  });

  const fetchInstructions = async () => {
    try {
      const response = await axios.get(`${API}/instructions`);
      setInstructions(response.data);
    } catch (error) {
      console.error("Помилка завантаження:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructions();
  }, []);

  const getCategoryTitle = (categoryId) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat ? cat.title : categoryId;
  };

  const getInstructionsByCategory = (categoryId) => {
    return instructions.filter((i) => i.category === categoryId);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Файл занадто великий (макс. 10MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      let fileType = "text";
      if (file.type.startsWith("image/")) fileType = "image";
      else if (file.type === "application/pdf") fileType = "pdf";

      setForm({
        ...form,
        title: form.title || file.name.replace(/\.[^/.]+$/, ""),
        file_name: file.name,
        file_data: base64,
        file_type: fileType,
        content: "",
      });
      toast.success(`Файл "${file.name}" обрано`);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.title) {
      toast.error("Введіть назву");
      return;
    }
    if (!form.file_data && !form.content) {
      toast.error("Завантажте файл або введіть текст");
      return;
    }

    try {
      if (editingInstruction) {
        await axios.put(`${API}/instructions/${editingInstruction.id}`, form);
        toast.success("Інструкцію оновлено");
      } else {
        await axios.post(`${API}/instructions`, form);
        toast.success("Інструкцію додано");
      }
      setShowForm(false);
      setEditingInstruction(null);
      setForm({ title: "", category: "tech_paint", content: "", file_name: null, file_data: null, file_type: "text" });
      await fetchInstructions();
    } catch (error) {
      toast.error("Помилка збереження");
    }
  };

  const handleEdit = (instruction) => {
    setEditingInstruction(instruction);
    setForm({
      title: instruction.title,
      category: instruction.category,
      content: instruction.content || "",
      file_name: instruction.file_name,
      file_data: instruction.file_data,
      file_type: instruction.file_type,
    });
    setShowForm(true);
  };

  const handleDelete = async (instructionId) => {
    try {
      await axios.delete(`${API}/instructions/${instructionId}`);
      toast.success("Інструкцію видалено");
      if (selectedInstruction?.id === instructionId) {
        setSelectedInstruction(null);
      }
      fetchInstructions();
    } catch (error) {
      toast.error("Помилка видалення");
    }
  };

  // Convert base64 to Blob
  const base64ToBlob = (base64, mimeType) => {
    try {
      const byteString = atob(base64.split(',')[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      return new Blob([ab], { type: mimeType });
    } catch (e) {
      console.error("Base64 conversion error:", e);
      return null;
    }
  };

  const getMimeType = (instruction) => {
    if (instruction.file_data) {
      const match = instruction.file_data.match(/^data:([^;]+);/);
      if (match) return match[1];
    }
    if (instruction.file_type === "pdf") return "application/pdf";
    if (instruction.file_type === "image") return "image/png";
    return "text/plain";
  };

  const getShareText = (instruction) => {
    let text = `📋 ${instruction.title}\n`;
    text += `📁 ${getCategoryTitle(instruction.category)}\n\n`;
    if (instruction.content) {
      text += instruction.content.substring(0, 500);
      if (instruction.content.length > 500) text += "...";
    }
    text += `\n\n— PoliBest 911`;
    return text;
  };

  // Download file helper
  const downloadFile = (instruction) => {
    if (instruction.file_data) {
      const link = document.createElement("a");
      link.href = instruction.file_data;
      link.download = instruction.file_name || `${instruction.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Share to specific messenger
  const shareToMessenger = async (messenger, instruction) => {
    // On mobile - try native share with file
    if (isMobile() && instruction.file_data && navigator.share) {
      try {
        const mimeType = getMimeType(instruction);
        const blob = base64ToBlob(instruction.file_data, mimeType);
        if (blob) {
          const fileName = instruction.file_name || `${instruction.title}.${instruction.file_type === 'pdf' ? 'pdf' : 'png'}`;
          const file = new File([blob], fileName, { type: mimeType });
          
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: instruction.title });
            toast.success("Файл надіслано!");
            return;
          }
        }
      } catch (e) {
        if (e.name === "AbortError") return;
        console.log("Mobile file share failed:", e);
      }
    }
    
    // On desktop - download file first, then open messenger
    if (instruction.file_data) {
      // Download the file
      downloadFile(instruction);
      toast.info("Файл завантажено. Прикріпіть його в месенджері.", { duration: 5000 });
      
      // Small delay then open messenger
      setTimeout(() => {
        let url = "";
        const text = `📋 ${instruction.title}\n📁 ${getCategoryTitle(instruction.category)}\n\n— PoliBest 911`;
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
      return;
    }
    
    // No file - share text only
    const text = getShareText(instruction);
    const encodedText = encodeURIComponent(text);
    
    let url = "";
    switch (messenger) {
      case "telegram":
        url = `https://t.me/share/url?url=&text=${encodedText}`;
        break;
      case "viber":
        url = `viber://forward?text=${encodedText}`;
        break;
      case "whatsapp":
        url = `https://api.whatsapp.com/send?text=${encodedText}`;
        break;
      default:
        return;
    }
    
    window.open(url, "_blank");
    toast.success("Відкрито месенджер");
  };

  // Native share (for mobile)
  const handleNativeShare = async (instruction) => {
    setSharing(true);
    
    try {
      // Try to share with file on mobile
      if (navigator.share && instruction.file_data) {
        try {
          const mimeType = getMimeType(instruction);
          const blob = base64ToBlob(instruction.file_data, mimeType);
          if (blob) {
            const fileName = instruction.file_name || `${instruction.title}.${instruction.file_type === 'pdf' ? 'pdf' : 'png'}`;
            const file = new File([blob], fileName, { type: mimeType });
            
            // Try sharing with file
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({ files: [file], title: instruction.title });
              toast.success("Файл надіслано!");
              return;
            }
            
            // If can't share file, try sharing file URL  
            const fileUrl = `${API}/instructions/${instruction.id}/file`;
            try {
              await navigator.share({ 
                title: instruction.title, 
                text: `📋 ${instruction.title}\n📁 ${getCategoryTitle(instruction.category)}`,
                url: fileUrl 
              });
              toast.success("Посилання надіслано!");
              return;
            } catch (urlShareError) {
              console.log("URL share failed:", urlShareError);
            }
          }
        } catch (e) {
          console.log("File share prep failed:", e);
        }
      }
      
      // Fallback: download file and show instruction
      if (instruction.file_data) {
        downloadFile(instruction);
        toast.info("Файл завантажено. Надішліть його вручну.", { duration: 5000 });
        return;
      }
      
      // No file - share text
      const text = getShareText(instruction);
      if (navigator.share) {
        await navigator.share({ title: instruction.title, text: text });
        toast.success("Надіслано!");
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Текст скопійовано!");
      }
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Share error:", error);
      
      // Last fallback - download file
      if (instruction.file_data) {
        downloadFile(instruction);
        toast.info("Файл завантажено. Надішліть його вручну.");
      } else {
        toast.error("Не вдалося поділитися");
      }
    } finally {
      setSharing(false);
    }
  };

  const handleDownload = (instruction) => {
    if (instruction.file_data) {
      const link = document.createElement("a");
      link.href = instruction.file_data;
      link.download = instruction.file_name || `${instruction.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const content = `${instruction.title}\n\n${getCategoryTitle(instruction.category)}\n\n${instruction.content}`;
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${instruction.title}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
    toast.success("Файл завантажено");
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  const getFileIcon = (instruction) => {
    if (instruction.file_type === "image") return <Image size={16} className="text-green-500" />;
    if (instruction.file_type === "pdf") return <FileIcon size={16} className="text-red-500" />;
    return <FileText size={16} className="text-[#B5331B]" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#A3A3A3]">Завантаження...</div>
      </div>
    );
  }

  return (
    <div data-testid="instructions-page" className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl md:text-3xl font-bold uppercase text-[#EDEDED] tracking-tight">
          Інструкції
        </h1>
        <Button
          onClick={() => {
            setEditingInstruction(null);
            setForm({ title: "", category: "tech_paint", content: "", file_name: null, file_data: null, file_type: "text" });
            setShowForm(true);
          }}
          className="btn-primary flex items-center gap-2"
          data-testid="add-instruction-btn"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Додати</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Categories */}
        <div className="lg:col-span-1 space-y-2">
          <Accordion type="single" collapsible className="space-y-2">
            {categories.map((category) => {
              const categoryInstructions = getInstructionsByCategory(category.id);
              return (
                <AccordionItem
                  key={category.id}
                  value={category.id}
                  className="bg-[#121212] border border-[#262626]"
                >
                  <AccordionTrigger
                    className="px-4 py-3 text-[#EDEDED] font-bold text-sm hover:text-[#B5331B] hover:no-underline"
                    data-testid={`category-${category.id}`}
                  >
                    <span className="flex items-center gap-2 text-left">
                      {category.title}
                      <span className="text-[#737373] text-xs font-normal">
                        ({categoryInstructions.length})
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-0 pb-0">
                    {categoryInstructions.length > 0 ? (
                      categoryInstructions.map((instruction) => (
                        <div
                          key={instruction.id}
                          className={`flex items-center justify-between p-3 border-b border-[#262626] cursor-pointer transition-colors ${
                            selectedInstruction?.id === instruction.id
                              ? "bg-[#B5331B]/10 text-[#B5331B]"
                              : "hover:bg-white/5"
                          }`}
                          onClick={() => setSelectedInstruction(instruction)}
                          data-testid={`instruction-${instruction.id}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {getFileIcon(instruction)}
                            <span className="text-sm truncate">{instruction.title}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-[#737373] text-sm p-4">Немає інструкцій</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>

        {/* Content View */}
        <div className="lg:col-span-2">
          {selectedInstruction ? (
            <div className="bg-[#121212] border border-[#262626]" data-testid="instruction-content">
              {/* Header */}
              <div className="p-4 border-b border-[#262626]">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-xs text-[#B5331B] uppercase tracking-wider">
                      {getCategoryTitle(selectedInstruction.category)}
                    </span>
                    <h2 className="text-lg font-bold text-[#EDEDED] mt-1 truncate">
                      {selectedInstruction.title}
                    </h2>
                    <p className="text-xs text-[#737373] mt-1">
                      {formatDate(selectedInstruction.created_at)}
                      {selectedInstruction.file_name && ` • ${selectedInstruction.file_name}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                {selectedInstruction.file_type === "image" && selectedInstruction.file_data ? (
                  <img 
                    src={selectedInstruction.file_data} 
                    alt={selectedInstruction.title}
                    className="max-w-full h-auto border border-[#262626]"
                  />
                ) : selectedInstruction.file_type === "pdf" && selectedInstruction.file_data ? (
                  <div className="bg-[#0A0A0A] border border-[#262626] p-8 text-center">
                    <FileIcon size={48} className="mx-auto text-red-500 mb-4" />
                    <p className="text-[#EDEDED] mb-2">{selectedInstruction.file_name}</p>
                    <p className="text-sm text-[#737373]">PDF файл</p>
                  </div>
                ) : (
                  <div className="bg-[#0A0A0A] border border-[#262626] p-4 font-mono text-sm text-[#EDEDED] whitespace-pre-wrap max-h-[40vh] overflow-y-auto">
                    {selectedInstruction.content || "Немає тексту"}
                  </div>
                )}
              </div>

              {/* Share Actions */}
              <div className="p-4 border-t border-[#262626] space-y-3">
                {/* Mobile: Single Share Button */}
                <Button
                  onClick={() => handleNativeShare(selectedInstruction)}
                  disabled={sharing}
                  className="md:hidden w-full bg-[#B5331B] hover:bg-red-700 text-white py-4 flex items-center justify-center gap-3"
                  data-testid="native-share-btn"
                >
                  <Share2 size={22} />
                  <span className="text-sm font-bold">{sharing ? "Надсилання..." : "Надіслати файл"}</span>
                </Button>
                
                {/* Desktop: Messenger Buttons */}
                <div className="hidden md:grid grid-cols-3 gap-2">
                  <Button
                    onClick={() => shareToMessenger("telegram", selectedInstruction)}
                    className="bg-[#0088cc] hover:bg-[#0077b5] text-white py-3 flex items-center justify-center gap-2"
                    data-testid="share-telegram-btn"
                  >
                    <MessageCircle size={18} />
                    <span className="text-xs font-bold">Telegram</span>
                  </Button>
                  <Button
                    onClick={() => shareToMessenger("viber", selectedInstruction)}
                    className="bg-[#7360f2] hover:bg-[#6050e0] text-white py-3 flex items-center justify-center gap-2"
                    data-testid="share-viber-btn"
                  >
                    <MessageCircle size={18} />
                    <span className="text-xs font-bold">Viber</span>
                  </Button>
                  <Button
                    onClick={() => shareToMessenger("whatsapp", selectedInstruction)}
                    className="bg-[#25D366] hover:bg-[#20bd5a] text-white py-3 flex items-center justify-center gap-2"
                    data-testid="share-whatsapp-btn"
                  >
                    <MessageCircle size={18} />
                    <span className="text-xs font-bold">WhatsApp</span>
                  </Button>
                </div>

                {/* Download button */}
                <Button
                  onClick={() => handleDownload(selectedInstruction)}
                  className="w-full bg-[#1A1A1A] hover:bg-[#262626] text-[#A3A3A3] py-3 flex items-center justify-center gap-2"
                  data-testid="download-instruction-btn"
                >
                  <Download size={18} />
                  <span className="text-xs font-bold">Завантажити</span>
                </Button>

                {/* Edit/Delete */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleEdit(selectedInstruction)}
                    className="bg-[#1A1A1A] hover:bg-[#262626] text-[#A3A3A3] py-2 flex items-center justify-center gap-2"
                    data-testid="edit-instruction-btn"
                  >
                    <Edit2 size={16} />
                    <span className="text-xs">Редагувати</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        className="bg-[#1A1A1A] hover:bg-[#262626] text-[#A3A3A3] hover:text-[#B5331B] py-2 flex items-center justify-center gap-2"
                        data-testid="delete-instruction-btn"
                      >
                        <Trash2 size={16} />
                        <span className="text-xs">Видалити</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-[#121212] border-[#262626] mx-4">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-[#EDEDED]">
                          Видалити інструкцію?
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
                          onClick={() => handleDelete(selectedInstruction.id)}
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
          ) : (
            <div className="bg-[#121212] border border-[#262626] p-8 text-center">
              <File size={48} className="mx-auto text-[#262626] mb-4" />
              <p className="text-[#A3A3A3]">
                Оберіть інструкцію зі списку
              </p>
              <p className="text-sm text-[#737373] mt-2">
                або додайте нову кнопкою "Додати"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-[#121212] border-[#262626] mx-4 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#EDEDED]">
              {editingInstruction ? "Редагувати інструкцію" : "Нова інструкція"}
            </DialogTitle>
            <DialogDescription className="text-[#A3A3A3]">
              Завантажте файл або введіть текст
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* File Upload */}
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf,.png,.jpg,.jpeg,.gif,.txt"
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-[#1A1A1A] hover:bg-[#262626] text-[#A3A3A3] py-6 border-2 border-dashed border-[#262626] flex flex-col items-center gap-2"
                data-testid="upload-file-btn"
              >
                <Upload size={32} />
                <span>Завантажити файл</span>
                <span className="text-xs text-[#737373]">PDF, PNG, JPG (макс. 10MB)</span>
              </Button>
              {form.file_name && (
                <div className="mt-2 p-2 bg-[#0A0A0A] border border-[#262626] flex items-center justify-between">
                  <span className="text-sm text-[#EDEDED] truncate">{form.file_name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setForm({ ...form, file_name: null, file_data: null, file_type: "text" })}
                    className="text-[#737373] hover:text-[#B5331B]"
                  >
                    <X size={16} />
                  </Button>
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <Label className="text-[#A3A3A3] uppercase text-xs tracking-wider mb-2 block">
                Назва *
              </Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="input-industrial w-full"
                placeholder="Назва інструкції"
                data-testid="instruction-title-input"
              />
            </div>

            {/* Category */}
            <div>
              <Label className="text-[#A3A3A3] uppercase text-xs tracking-wider mb-2 block">
                Категорія
              </Label>
              <Select
                value={form.category}
                onValueChange={(value) => setForm({ ...form, category: value })}
              >
                <SelectTrigger className="input-industrial w-full" data-testid="instruction-category-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Text Content (if no file) */}
            {!form.file_data && (
              <div>
                <Label className="text-[#A3A3A3] uppercase text-xs tracking-wider mb-2 block">
                  Або введіть текст
                </Label>
                <Textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="input-industrial w-full min-h-[150px] font-mono text-sm"
                  placeholder="Текст інструкції..."
                  data-testid="instruction-content-input"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => {
                  setShowForm(false);
                  setEditingInstruction(null);
                }}
                className="flex-1 btn-secondary flex items-center justify-center gap-2"
              >
                <X size={18} />
                Скасувати
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
                data-testid="save-instruction-btn"
              >
                <Save size={18} />
                Зберегти
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Instructions;

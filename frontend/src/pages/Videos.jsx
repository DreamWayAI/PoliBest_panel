import { useState } from "react";
import { Play, ExternalLink } from "lucide-react";
import { Button } from "../components/ui/button";

const videosData = [
  {
    id: "v1",
    title: "Підготовка бетонної основи",
    category: "Підготовка",
    description: "Повний процес підготовки бетону перед нанесенням покриття",
    youtubeId: "dQw4w9WgXcQ",
    duration: "12:34",
  },
  {
    id: "v2",
    title: "Нанесення епоксидного покриття",
    category: "Нанесення",
    description: "Покрокова інструкція з нанесення епоксидної підлоги",
    youtubeId: "dQw4w9WgXcQ",
    duration: "18:45",
  },
  {
    id: "v3",
    title: "Поліуретанові покриття",
    category: "Нанесення",
    description: "Особливості роботи з поліуретановими системами",
    youtubeId: "dQw4w9WgXcQ",
    duration: "15:20",
  },
  {
    id: "v4",
    title: "Ремонт полімерних покриттів",
    category: "Ремонт",
    description: "Як правильно ремонтувати пошкоджені ділянки",
    youtubeId: "dQw4w9WgXcQ",
    duration: "09:15",
  },
  {
    id: "v5",
    title: "Антистатичні покриття",
    category: "Спеціальні",
    description: "Технологія нанесення антистатичних підлог",
    youtubeId: "dQw4w9WgXcQ",
    duration: "14:30",
  },
  {
    id: "v6",
    title: "Хімостійкі покриття",
    category: "Спеціальні",
    description: "Покриття для агресивних середовищ",
    youtubeId: "dQw4w9WgXcQ",
    duration: "16:45",
  },
];

const categories = ["Всі", "Підготовка", "Нанесення", "Ремонт", "Спеціальні"];

export const Videos = () => {
  const [selectedCategory, setSelectedCategory] = useState("Всі");
  const [playingVideo, setPlayingVideo] = useState(null);

  const filteredVideos =
    selectedCategory === "Всі"
      ? videosData
      : videosData.filter((v) => v.category === selectedCategory);

  return (
    <div data-testid="videos-page">
      <h1 className="page-header">Відеоінструкції</h1>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((cat) => (
          <Button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`${
              selectedCategory === cat
                ? "btn-primary"
                : "btn-secondary"
            }`}
            data-testid={`filter-${cat}`}
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredVideos.map((video) => (
          <div
            key={video.id}
            className="video-card"
            data-testid={`video-card-${video.id}`}
          >
            {/* Video Thumbnail/Player */}
            <div className="relative aspect-video bg-[#0A0A0A]">
              {playingVideo === video.id ? (
                <iframe
                  src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1`}
                  title={video.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center cursor-pointer group"
                  onClick={() => setPlayingVideo(video.id)}
                >
                  <img
                    src={`https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`}
                    alt={video.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-50"
                    onError={(e) => {
                      e.target.src = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
                    }}
                  />
                  <div className="relative z-10 p-4 bg-[#B5331B] text-white group-hover:scale-110 transition-transform">
                    <Play size={32} fill="white" />
                  </div>
                  <span className="absolute bottom-4 right-4 bg-black/80 text-white text-sm px-2 py-1 font-mono">
                    {video.duration}
                  </span>
                </div>
              )}
            </div>

            {/* Video Info */}
            <div className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs text-[#B5331B] uppercase tracking-wider">
                    {video.category}
                  </span>
                  <h3 className="text-lg font-bold text-[#EDEDED] mt-1">
                    {video.title}
                  </h3>
                  <p className="text-sm text-[#A3A3A3] mt-2">
                    {video.description}
                  </p>
                </div>
                <a
                  href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#A3A3A3] hover:text-[#B5331B] shrink-0"
                  data-testid={`youtube-link-${video.id}`}
                >
                  <ExternalLink size={20} />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredVideos.length === 0 && (
        <div className="card-industrial text-center py-12">
          <p className="text-[#A3A3A3]">Немає відео в цій категорії</p>
        </div>
      )}
    </div>
  );
};

export default Videos;

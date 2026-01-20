"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Bot, Check, CheckCheck, FileText, Image as ImageIcon, Video, X, Download, File, RefreshCw, AlertCircle } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { AudioPlayer } from "./AudioPlayer";
import { formatPhoneE164, isPhoneLike } from "@/lib/formatters/phone";

interface MessageBubbleProps {
  content: string;
  time: string;
  isOwn: boolean;
  isBot?: boolean;
  status?: "sent" | "delivered" | "read";
  isRTL?: boolean;
  isGroup?: boolean;
  type?: string;
  senderName?: string;
  senderPic?: string | null;
  mediaUrl?: string | null;
  mediaMimetype?: string | null;
  mediaDuration?: number | null;
  mediaThumbnail?: string | null;
  customerPic?: string | null;
  customerName?: string;
  highlightQuery?: string;
}

export function MessageBubble({ 
  content, 
  time, 
  isOwn, 
  isBot, 
  status, 
  isRTL = false,
  isGroup = false,
  type = "text",
  senderName,
  senderPic,
  mediaUrl,
  mediaMimetype,
  mediaDuration,
  mediaThumbnail,
  customerPic,
  customerName,
  highlightQuery
}: MessageBubbleProps) {
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const [stickerError, setStickerError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // Retry loading media
  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    setImageError(false);
    setVideoError(false);
    setStickerError(false);
    setImageLoading(true);
  }, []);
  
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  
  // In RTL: own messages go LEFT, customer messages go RIGHT
  // In LTR: own messages go RIGHT, customer messages go LEFT
  const isMessageOnRight = isRTL ? !isOwn : isOwn;
  
  // Build full media URL
  const fullMediaUrl = mediaUrl?.startsWith("/") ? `${API_BASE}${mediaUrl}` : mediaUrl;
  
  // Format sender name - if it's a long number, format as phone
  const formatSenderName = (name: string | undefined): string => {
    if (!name) return "";
    
    if (isPhoneLike(name)) {
      return formatPhoneE164(name);
    }
    
    // Truncate very long names
    if (name.length > 25) {
      return name.slice(0, 22) + "...";
    }
    
    return name;
  };
  
  const displaySenderName = formatSenderName(senderName);

  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const renderHighlightedText = (text: string) => {
    if (!highlightQuery) return text;
    const query = highlightQuery.trim();
    if (!query) return text;
    const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, "ig"));
    const queryLower = query.toLowerCase();

    return parts.map((part, index) =>
      part.toLowerCase() === queryLower ? (
        <mark
          key={`${part}-${index}`}
          className={cn(
            "rounded px-0.5",
            isOwn ? "bg-white/30 text-white" : "bg-yellow-200/70 text-foreground"
          )}
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };
  
  // Format duration for audio/video
  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Get file extension from mimetype
  const getFileExtension = (mimetype?: string | null): string => {
    if (!mimetype) return "FILE";
    const parts = mimetype.split("/");
    if (parts[1]) {
      const ext = parts[1].toUpperCase();
      // Handle common types
      if (ext === "VND.OPENXMLFORMATS-OFFICEDOCUMENT.WORDPROCESSINGML.DOCUMENT") return "DOCX";
      if (ext === "VND.OPENXMLFORMATS-OFFICEDOCUMENT.SPREADSHEETML.SHEET") return "XLSX";
      if (ext === "VND.OPENXMLFORMATS-OFFICEDOCUMENT.PRESENTATIONML.PRESENTATION") return "PPTX";
      return ext;
    }
    return "FILE";
  };

  // Render media content based on type
  const renderMediaContent = () => {
    switch (type) {
      case "image":
        // Add retry param to bust cache on retry
        const imageUrl = fullMediaUrl ? `${fullMediaUrl}${fullMediaUrl.includes('?') ? '&' : '?'}retry=${retryCount}` : null;
        return (
          <div className="relative rounded-lg overflow-hidden">
            {(imageUrl || mediaThumbnail) && !imageError ? (
              <>
                {/* Show thumbnail instantly while full image loads */}
                {imageLoading && mediaThumbnail && (
                  <div className="relative">
                    <img
                      src={mediaThumbnail}
                      alt="Preview"
                      className="max-w-[280px] max-h-[320px] rounded-lg cursor-pointer object-cover blur-[2px]"
                      onClick={() => setShowImageModal(true)}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={cn(
                        "w-8 h-8 border-3 rounded-full animate-spin",
                        isOwn ? "border-white/30 border-t-white" : "border-primary/30 border-t-primary"
                      )} />
                    </div>
                  </div>
                )}
                {/* Fallback spinner if no thumbnail */}
                {imageLoading && !mediaThumbnail && (
                  <div className="w-[240px] h-[180px] bg-black/10 flex items-center justify-center rounded-lg">
                    <div className={cn(
                      "w-8 h-8 border-3 rounded-full animate-spin",
                      isOwn ? "border-white/30 border-t-white" : "border-primary/30 border-t-primary"
                    )} />
                  </div>
                )}
                {/* Full quality image - hidden while loading */}
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt="Image"
                    className={cn(
                      "max-w-[280px] max-h-[320px] rounded-lg cursor-pointer object-cover transition-opacity duration-200",
                      imageLoading ? "absolute opacity-0 pointer-events-none" : "opacity-100"
                    )}
                    onClick={() => setShowImageModal(true)}
                    onError={() => {
                      setImageError(true);
                      setImageLoading(false);
                    }}
                    onLoad={() => setImageLoading(false)}
                  />
                )}
                {content && !imageLoading && (
                  <p className="text-sm mt-2 leading-relaxed" dir="auto">
                    {renderHighlightedText(content)}
                  </p>
                )}
              </>
            ) : mediaThumbnail ? (
              // Show thumbnail when full image is unavailable (expired)
              <div className="relative">
                <img
                  src={mediaThumbnail}
                  alt="Image preview"
                  className="max-w-[280px] max-h-[320px] rounded-lg cursor-pointer object-cover"
                  onClick={() => setShowImageModal(true)}
                />
                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  معاينة فقط
                </div>
                {content && (
                  <p className="text-sm mt-2 leading-relaxed" dir="auto">
                    {renderHighlightedText(content)}
                  </p>
                )}
              </div>
            ) : (
              <div className={cn(
                "flex flex-col items-center gap-3 p-5 rounded-lg min-w-[200px]",
                isOwn ? "bg-white/10" : "bg-black/5"
              )}>
                <AlertCircle className={cn(
                  "w-10 h-10",
                  isOwn ? "text-white/50" : "text-muted"
                )} />
                <div className="text-center">
                  <span className="text-sm font-medium block">الصورة غير متاحة</span>
                  <span className="text-xs opacity-60">انتهت صلاحية الوسائط</span>
                </div>
                {retryCount < 3 && (
                  <button
                    onClick={handleRetry}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                      isOwn 
                        ? "bg-white/20 hover:bg-white/30 text-white" 
                        : "bg-primary/10 hover:bg-primary/20 text-primary"
                    )}
                  >
                    <RefreshCw className="w-3 h-3" />
                    إعادة المحاولة
                  </button>
                )}
              </div>
            )}
          </div>
        );
      
      case "video":
        // Add retry param to bust cache on retry
        const videoUrl = fullMediaUrl ? `${fullMediaUrl}${fullMediaUrl.includes('?') ? '&' : '?'}retry=${retryCount}` : null;
        return (
          <div className="relative">
            {(videoUrl || mediaThumbnail) && !videoError ? (
              <div className="relative max-w-[300px]">
                {/* Show thumbnail while video loads */}
                {videoLoading && mediaThumbnail && (
                  <div className="relative">
                    <img
                      src={mediaThumbnail}
                      alt="Video preview"
                      className="rounded-lg max-h-[320px] w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center",
                        isOwn ? "bg-white/30" : "bg-primary/30"
                      )}>
                        <Video className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    {mediaDuration && (
                      <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                        {formatDuration(mediaDuration)}
                      </span>
                    )}
                  </div>
                )}
                {videoUrl && (
                  <video
                    src={videoUrl}
                    className={cn(
                      "rounded-lg max-h-[320px] w-full",
                      videoLoading && mediaThumbnail && "hidden"
                    )}
                    controls
                    preload="metadata"
                    playsInline
                    onError={() => setVideoError(true)}
                    onLoadedData={() => setVideoLoading(false)}
                    poster={mediaThumbnail || undefined}
                  />
                )}
                {content && (
                  <p className="text-sm mt-2 leading-relaxed" dir="auto">
                    {renderHighlightedText(content)}
                  </p>
                )}
              </div>
            ) : mediaThumbnail ? (
              // Show thumbnail when video is unavailable (expired)
              <div className="relative max-w-[300px]">
                <img
                  src={mediaThumbnail}
                  alt="Video preview"
                  className="rounded-lg max-h-[320px] w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                  <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                    <Video className="w-6 h-6 text-white/70" />
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  معاينة فقط
                </div>
                {mediaDuration && (
                  <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                    {formatDuration(mediaDuration)}
                  </span>
                )}
                {content && (
                  <p className="text-sm mt-2 leading-relaxed" dir="auto">
                    {renderHighlightedText(content)}
                  </p>
                )}
              </div>
            ) : (
              <div className={cn(
                "flex flex-col items-center gap-3 p-5 rounded-lg min-w-[200px]",
                isOwn ? "bg-white/10" : "bg-black/5"
              )}>
                <AlertCircle className={cn(
                  "w-10 h-10",
                  isOwn ? "text-white/50" : "text-muted"
                )} />
                <div className="text-center">
                  <span className="text-sm font-medium block">الفيديو غير متاح</span>
                  <span className="text-xs opacity-60">انتهت صلاحية الوسائط</span>
                </div>
                {mediaDuration && (
                  <span className="text-xs opacity-50">{formatDuration(mediaDuration)}</span>
                )}
                {retryCount < 3 && (
                  <button
                    onClick={handleRetry}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                      isOwn 
                        ? "bg-white/20 hover:bg-white/30 text-white" 
                        : "bg-primary/10 hover:bg-primary/20 text-primary"
                    )}
                  >
                    <RefreshCw className="w-3 h-3" />
                    إعادة المحاولة
                  </button>
                )}
              </div>
            )}
          </div>
        );
      
      case "audio":
      case "voice":
        if (fullMediaUrl) {
          return (
            <AudioPlayer 
              src={fullMediaUrl} 
              duration={mediaDuration} 
              isOwn={isOwn}
              isVoice={type === "voice"}
            />
          );
        }
        // Fallback when no URL
        return (
          <div className={cn(
            "flex items-center gap-3 p-3 rounded-lg min-w-[200px]",
            isOwn ? "bg-white/10" : "bg-black/5"
          )}>
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              isOwn ? "bg-white/25" : "bg-primary/20"
            )}>
              <span className="text-xl">🎤</span>
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium">رسالة صوتية</span>
              {mediaDuration && (
                <span className="text-xs opacity-70 block">{formatDuration(mediaDuration)}</span>
              )}
            </div>
          </div>
        );
      
      case "sticker":
        return (
          <div className="relative">
            {fullMediaUrl && !stickerError ? (
              <img
                src={fullMediaUrl}
                alt="Sticker"
                className="w-40 h-40 object-contain"
                loading="lazy"
                onError={() => setStickerError(true)}
              />
            ) : (
              <div className="w-32 h-32 flex items-center justify-center text-6xl bg-transparent">
                🏷️
              </div>
            )}
          </div>
        );
      
      case "document":
        const isPdf = mediaMimetype?.includes("pdf");
        return (
          <div className={cn(
            "flex items-center gap-3 p-3 rounded-lg min-w-[220px] max-w-[300px]",
            isOwn ? "bg-white/10" : "bg-black/5"
          )}>
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
              isOwn ? "bg-white/20" : "bg-primary/15"
            )}>
              {isPdf ? (
                <span className="text-2xl">📄</span>
              ) : (
                <File className={cn("w-6 h-6", isOwn ? "text-white" : "text-primary")} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{content || "Document"}</p>
              <span className="text-xs opacity-70">
                {getFileExtension(mediaMimetype)}
              </span>
            </div>
            {fullMediaUrl && (
              <a 
                href={fullMediaUrl} 
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "p-2 rounded-full transition-all hover:scale-110",
                  isOwn ? "hover:bg-white/20" : "hover:bg-black/10"
                )}
                download
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="w-4 h-4" />
              </a>
            )}
          </div>
        );
      
      case "reaction":
        return (
          <span className={cn(
            "inline-flex items-center px-2 py-1 rounded-full text-sm leading-none",
            isOwn ? "bg-primary/20 text-white" : "bg-surface-elevated text-foreground"
          )}>
            {content}
          </span>
        );
      
      default:
        // Text message - render with emoji support
        return (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words" dir="auto">
            {renderHighlightedText(content)}
          </p>
        );
    }
  };
  
  // Determine which avatar to show for non-own messages
  const showAvatar = !isOwn;
  const avatarPic = isGroup ? senderPic : customerPic;
  const avatarName = isGroup ? (displaySenderName || senderName || "?") : (customerName || "?");
  
  return (
    <>
      <div
        className={cn(
          "flex items-end gap-2",
          isMessageOnRight ? "justify-end" : "justify-start"
        )}
      >
        {/* Avatar for incoming messages */}
        {showAvatar && type !== "reaction" && (
          <div className={cn(
            "flex-shrink-0",
            isRTL && "order-last"
          )}>
            <Avatar
              name={avatarName}
              src={avatarPic}
              size="sm"
            />
          </div>
        )}
        
        {/* Message bubble */}
        <div
          className={cn(
            "max-w-[75%] rounded-2xl shadow-soft",
            isOwn
              ? "bg-primary text-white"
              : "bg-surface text-foreground",
            // Padding based on message type
            type === "sticker" || type === "reaction" 
              ? "p-0 bg-transparent shadow-none" 
              : "px-3 py-2",
            // Rounded corners based on message position
            type !== "sticker" && type !== "reaction" && (
              isMessageOnRight
                ? "rounded-br-md"
                : "rounded-bl-md"
            )
          )}
        >
          {/* Sender name for group messages */}
          {!isOwn && isGroup && displaySenderName && type !== "reaction" && (
            <div 
              className="text-xs font-semibold mb-1 text-primary truncate max-w-[200px]"
              dir={isPhoneLike(senderName || "") || displaySenderName.startsWith("+") ? "ltr" : undefined}
            >
              {displaySenderName}
            </div>
          )}
          
          {/* Bot indicator */}
          {isBot && !isGroup && type !== "reaction" && (
            <div className={cn(
              "flex items-center gap-1 mb-1.5",
              isRTL && "flex-row-reverse"
            )}>
              <Bot className="w-3 h-3" />
              <span className="text-xs opacity-75">البوت</span>
            </div>
          )}
          
          {/* Message content */}
          {renderMediaContent()}
          
          {/* Time and status */}
          {type !== "sticker" && type !== "reaction" && (
            <div className={cn(
              "flex items-center gap-1 mt-1.5",
              isRTL ? "flex-row-reverse justify-start" : "justify-end"
            )}>
              <span className={cn(
                "text-[10px] font-medium",
                isOwn ? "text-white/80" : "text-muted"
              )}>
                {time}
              </span>
              {isOwn && status && (
                <>
                  {status === "sent" && <Check className="w-3.5 h-3.5 text-white/80" />}
                  {status === "delivered" && <CheckCheck className="w-3.5 h-3.5 text-white/80" />}
                  {status === "read" && <CheckCheck className="w-3.5 h-3.5 text-blue-300" />}
                </>
              )}
            </div>
          )}
        </div>
        
        {/* Bot avatar - shows next to own messages when bot */}
        {isOwn && isBot && type !== "reaction" && (
          <div className={cn(
            "w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0",
            isRTL && "order-first"
          )}>
            <Bot className="w-4 h-4 text-primary" />
          </div>
        )}
      </div>
      
      {/* Image Modal - Enhanced */}
      {showImageModal && fullMediaUrl && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowImageModal(false)}
        >
          <button
            className="absolute top-4 right-4 text-white p-3 hover:bg-white/10 rounded-full transition-all hover:scale-110"
            onClick={() => setShowImageModal(false)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={fullMediaUrl}
            alt="Full size"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <a
            href={fullMediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="absolute bottom-6 right-6 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-5 py-3 rounded-full flex items-center gap-2 transition-all hover:scale-105 font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            <Download className="w-5 h-5" />
            تحميل
          </a>
        </div>
      )}
    </>
  );
}

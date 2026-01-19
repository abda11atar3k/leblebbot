"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  RefreshCw,
  ChevronRight,
  Target,
  Users,
  Package,
  Clock
} from "lucide-react";

interface Insight {
  id: string;
  type: "positive" | "warning" | "suggestion" | "info";
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  metric?: string;
  change?: number;
  action?: string;
  actionAr?: string;
}

const insights: Insight[] = [
  {
    id: "1",
    type: "positive",
    title: "Order Peak Detected",
    titleAr: "تم اكتشاف ذروة الطلبات",
    description: "Orders increased by 45% on weekends. Consider extending support hours during Saturday and Sunday.",
    descriptionAr: "زادت الطلبات بنسبة 45% في عطلات نهاية الأسبوع. فكر في تمديد ساعات الدعم يومي السبت والأحد.",
    metric: "+45%",
    change: 45,
    action: "View Weekend Analytics",
    actionAr: "عرض تحليلات نهاية الأسبوع"
  },
  {
    id: "2",
    type: "warning",
    title: "Response Time Alert",
    titleAr: "تنبيه وقت الرد",
    description: "Average response time increased to 3.2s during 6-8 PM. This may affect customer satisfaction.",
    descriptionAr: "زاد متوسط وقت الرد إلى 3.2 ثانية خلال الفترة من 6-8 مساءً. هذا قد يؤثر على رضا العملاء.",
    metric: "3.2s",
    change: -15,
    action: "Optimize Bot",
    actionAr: "تحسين البوت"
  },
  {
    id: "3",
    type: "suggestion",
    title: "Product Recommendation",
    titleAr: "توصية منتج",
    description: "Customers who buy 'Charcoal Mask' often ask about 'Vitamin C Serum'. Consider cross-selling.",
    descriptionAr: "العملاء الذين يشترون 'ماسك الفحم' غالباً يسألون عن 'سيروم فيتامين سي'. فكر في البيع المتقاطع.",
    action: "Create Bundle",
    actionAr: "إنشاء حزمة"
  },
  {
    id: "4",
    type: "info",
    title: "Top Governorate: Cairo",
    titleAr: "المحافظة الأولى: القاهرة",
    description: "32% of all orders come from Cairo. Consider targeted promotions for other governorates.",
    descriptionAr: "32% من جميع الطلبات تأتي من القاهرة. فكر في عروض موجهة للمحافظات الأخرى.",
    metric: "32%",
    action: "View Geographic Analytics",
    actionAr: "عرض التحليلات الجغرافية"
  },
  {
    id: "5",
    type: "positive",
    title: "Customer Retention Improved",
    titleAr: "تحسن الاحتفاظ بالعملاء",
    description: "Repeat customer rate increased from 23% to 31% this month. Your follow-up messages are working!",
    descriptionAr: "زاد معدل العملاء المتكررين من 23% إلى 31% هذا الشهر. رسائل المتابعة تعمل بشكل ممتاز!",
    metric: "+8%",
    change: 8
  }
];

interface AIInsightsProps {
  className?: string;
}

export function AIInsights({ className }: AIInsightsProps) {
  const { isRTL } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
  };

  const typeConfig = {
    positive: {
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
      borderColor: "border-success/20"
    },
    warning: {
      icon: AlertTriangle,
      color: "text-warning",
      bgColor: "bg-warning/10",
      borderColor: "border-warning/20"
    },
    suggestion: {
      icon: Lightbulb,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20"
    },
    info: {
      icon: Target,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20"
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className={cn(
          "flex items-center justify-between",
          isRTL && "flex-row-reverse"
        )}>
          <CardTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            {isRTL ? "تحليلات الذكاء الاصطناعي" : "AI Insights"}
            <Badge variant="primary" className="text-xs">
              <Sparkles className="w-3 h-3 me-1" />
              {isRTL ? "مدعوم بالـ AI" : "AI Powered"}
            </Badge>
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight) => {
          const config = typeConfig[insight.type];
          const Icon = config.icon;

          return (
            <div
              key={insight.id}
              className={cn(
                "p-4 rounded-xl border transition-all hover:shadow-soft",
                config.bgColor,
                config.borderColor
              )}
            >
              <div className={cn(
                "flex items-start gap-3",
                isRTL && "flex-row-reverse"
              )}>
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                  config.bgColor
                )}>
                  <Icon className={cn("w-5 h-5", config.color)} />
                </div>

                <div className={cn("flex-1 min-w-0", isRTL && "text-end")}>
                  <div className={cn(
                    "flex items-center gap-2 mb-1",
                    isRTL && "flex-row-reverse justify-end"
                  )}>
                    <h4 className="font-semibold text-foreground">
                      {isRTL ? insight.titleAr : insight.title}
                    </h4>
                    {insight.metric && (
                      <Badge 
                        variant={insight.change && insight.change > 0 ? "success" : insight.change && insight.change < 0 ? "error" : "secondary"}
                        className="text-xs"
                      >
                        {insight.metric}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted mb-3">
                    {isRTL ? insight.descriptionAr : insight.description}
                  </p>
                  {insight.action && (
                    <Button variant="ghost" size="sm" className={cn(
                      "px-0 hover:bg-transparent",
                      config.color,
                      isRTL && "flex-row-reverse"
                    )}>
                      {isRTL ? insight.actionAr : insight.action}
                      <ChevronRight className={cn("w-4 h-4", isRTL && "rotate-180")} />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Summary Stats */}
        <div className={cn(
          "grid grid-cols-3 gap-3 pt-4 border-t border-border",
          isRTL && "direction-rtl"
        )}>
          <div className="text-center p-3 bg-surface-elevated rounded-xl">
            <p className="text-2xl font-bold text-success">5</p>
            <p className="text-xs text-muted">{isRTL ? "رؤى إيجابية" : "Positive"}</p>
          </div>
          <div className="text-center p-3 bg-surface-elevated rounded-xl">
            <p className="text-2xl font-bold text-warning">2</p>
            <p className="text-xs text-muted">{isRTL ? "تحتاج انتباه" : "Needs Attention"}</p>
          </div>
          <div className="text-center p-3 bg-surface-elevated rounded-xl">
            <p className="text-2xl font-bold text-primary">3</p>
            <p className="text-xs text-muted">{isRTL ? "اقتراحات" : "Suggestions"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

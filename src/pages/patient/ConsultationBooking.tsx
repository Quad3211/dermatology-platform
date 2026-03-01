import { useState } from "react";
import { Calendar, Clock, MessageSquare, CheckCircle2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/core/Card";
import { Button } from "../../components/core/Button";
import { cn } from "../../utils/cn";

export function ConsultationBooking() {
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isBooked, setIsBooked] = useState(false);

  // Mock dates for next 3 days
  const dates = Array.from({ length: 3 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d;
  });

  const slots = ["09:00 AM", "10:30 AM", "01:00 PM", "03:30 PM"];

  if (isBooked) {
    return (
      <Card className="max-w-xl mx-auto text-center border-primary-200 fade-in">
        <CardContent className="pt-10 pb-10">
          <div className="flex justify-center mb-6">
            <CheckCircle2 className="h-16 w-16 text-status-safe" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Consultation Confirmed
          </h2>
          <p className="text-slate-600 mb-8">
            Your secure text consultation is scheduled. You will receive an
            email and SMS reminder 15 minutes prior to the start time.
          </p>
          <Button onClick={() => (window.location.href = "/patient")}>
            Return to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Book a Consultation
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Schedule a secure, text-based chat with a board-certified
          dermatologist to review your risk assessment.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Calendar className="w-5 h-5 mr-3 text-primary-600" /> Select Date
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dates.map((d, i) => (
              <button
                key={i}
                onClick={() => setSelectedDate(i)}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer",
                  selectedDate === i
                    ? "bg-primary-50 border-primary-500 text-primary-700 font-medium"
                    : "border-surface-border text-slate-700 hover:bg-slate-50",
                )}
              >
                <span>
                  {d.toLocaleDateString("en-US", { weekday: "long" })}
                </span>
                <span className="text-sm opacity-80">
                  {d.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card
          className={cn(
            "transition-opacity",
            selectedDate === null && "opacity-50 pointer-events-none",
          )}
        >
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Clock className="w-5 h-5 mr-3 text-primary-600" /> Select Time
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {slots.map((time) => (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={cn(
                  "p-3 rounded-lg border text-sm text-center transition-colors font-medium cursor-pointer",
                  selectedTime === time
                    ? "bg-primary-50 border-primary-500 text-primary-700"
                    : "border-surface-border text-slate-700 hover:bg-slate-50",
                )}
              >
                {time}
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="flex bg-surface-muted p-6 rounded-xl border border-surface-border">
        <MessageSquare className="h-6 w-6 text-primary-600 mr-4 flex-shrink-0" />
        <div>
          <h4 className="font-semibold text-slate-900">
            Text & Image Modality (V1)
          </h4>
          <p className="text-sm text-slate-600 mt-1">
            As requested, your consultation will be conducted entirely over our
            secure, encrypted text & image chat interface. Video capabilities
            are disabled for this session to ensure low bandwidth and
            zero-plugin requirements.
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          size="lg"
          disabled={selectedDate === null || selectedTime === null}
          onClick={() => setIsBooked(true)}
        >
          Confirm Secure Booking
        </Button>
      </div>
    </div>
  );
}

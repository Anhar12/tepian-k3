import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const surveyQuestions = [
  {
    id: 1,
    question:
      "Informasi tentang mekanisme prosedur pelayanan Balai K3 Samarinda",
  },
  {
    id: 2,
    question: "Kecepatan balasan permintaan pengujian",
  },
  {
    id: 3,
    question: "Kejelasan isi penawaran",
  },
  {
    id: 4,
    question: "Kompetensi petugas pengambil sampel",
  },
  {
    id: 5,
    question: "Ketepatan waktu penyelesaian pengujian",
  },
  {
    id: 6,
    question: "Kualitas data hasil pengujian",
  },
];

export function SurveyForm() {
  const [ratings, setRatings] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState("");

  const handleRatingChange = (questionId: number, value: string) => {
    setRatings((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    console.log("Ratings:", ratings);
    console.log("Feedback:", feedback);
  };

  return (
    <Card className="mx-auto w-full max-w-4xl pt-0">
      <CardHeader className="mb-6 rounded-t-xl bg-primary px-4 py-8 text-center text-white">
        <h1 className="mb-2 text-2xl font-bold">Survei Kepuasan Pelanggan</h1>
        <p className="text-sm opacity-90">
          Bantu kami meningkatkan layanan dengan memberikan penilaian Anda
        </p>
      </CardHeader>

      {/* Main Form */}
      <div className="px-4">
        {/* Company Info Card */}
        <Card className="mb-6 shadow-sm">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label
                  htmlFor="company"
                  className="text-sm text-muted-foreground"
                >
                  Nama Perusahaan
                </Label>
                <Input
                  id="company"
                  value="Lorem Ipsum"
                  readOnly
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm text-muted-foreground">
                  Date
                </Label>
                <Input
                  id="date"
                  value="20/11/2026"
                  readOnly
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="userCode"
                  className="text-sm text-muted-foreground"
                >
                  Kode pengguna
                </Label>
                <Input
                  id="userCode"
                  value="1234809823408"
                  readOnly
                  className="text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Survey Questions */}
        <Card className="shadow-sm">
          <CardContent className="space-y-6 pt-6">
            {surveyQuestions.map((item) => (
              <div
                key={item.id}
                className="border-l-4 border-primary py-2 pl-4"
              >
                <Badge className="mb-3 rounded-md text-sm font-semibold text-white hover:opacity-90">
                  {item.id}
                </Badge>
                <p className="mb-4 font-medium text-foreground">
                  {item.question}
                </p>
                <div className="flex items-center gap-4">
                  <span className="min-w-25 text-sm text-muted-foreground">
                    Tingkat kepuasan
                  </span>
                  <ToggleGroup
                    type="single"
                    value={ratings[item.id]}
                    onValueChange={(value) =>
                      handleRatingChange(item.id, value)
                    }
                    className="gap-1"
                  >
                    {[1, 2, 3, 4, 5].map((num) => (
                      <ToggleGroupItem
                        key={num}
                        value={num.toString()}
                        className="h-10 w-10 rounded-md border font-medium text-foreground hover:bg-primary/10 data-[state=on]:bg-primary data-[state=on]:text-white"
                      >
                        {num}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
              </div>
            ))}

            {/* Feedback Section */}
            <div className="border-l-4 border-primary py-2 pl-4">
              <Label className="mb-2 block text-sm font-medium text-foreground">
                Kritik & Saran
              </Label>
              <Textarea
                placeholder="masukkan kritik & saran anda"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="min-h-25 resize-none"
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSubmit}
                className="px-8 text-white hover:opacity-90"
              >
                Kirim
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Card>
  );
}

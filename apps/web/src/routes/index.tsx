import GridBackground from "@/components/grid-background";
import LandingNavbar from "@/components/navbar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { trpc } from "@/utils/trpc";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, type LinkProps } from "@tanstack/react-router";
import { AlarmClock, ArrowRight, Mail, PhoneCall } from "lucide-react";

export const Route = createFileRoute("/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(context.trpc.auth.me.queryOptions()),
  component: HomeComponent,
});

const pusatLayananItems: {
  imageSrc: string;
  title: string;
  to: LinkProps["to"];
}[] = [
  {
    imageSrc: "/assets/pengujian.jpg",
    title: "Pengujian",
    to: "/",
  },
  {
    imageSrc: "/assets/pelatihan.jpg",
    title: "Pelatihan",
    to: "/",
  },
  {
    imageSrc: "/assets/uji-kompetensi.jpg",
    title: "Uji Kompetensi",
    to: "/",
  },
  {
    imageSrc: "/assets/konsultasi.jpg",
    title: "Konsultasi",
    to: "/",
  },
];

function HomeComponent() {
  const { data: user } = useSuspenseQuery(trpc.auth.me.queryOptions());

  return (
    <div className="w-full overflow-x-hidden overflow-y-scroll bg-white dark:bg-neutral-950">
      {/* Landing Page Navbar */}
      <LandingNavbar />

      {/* Hero */}
      <section
        className="relative flex h-[80vh] flex-col justify-center px-10 text-center"
        id="beranda"
      >
        {/* Background Image/SVG */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <img
            src="/assets/hero-banner.jpg"
            className="h-full w-full object-fill"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex h-full w-full flex-1 flex-col items-start justify-center">
          {/* Hero Title */}
          <div className="mb-25">
            <h1 className="relative text-start text-6xl font-semibold text-white">
              Pusat Pelatihan
            </h1>
            <h1 className="relative text-start text-6xl font-semibold text-white">
              K3 Samarinda
            </h1>
          </div>
          {/* Hero Footer */}
          <div className="absolute bottom-15 w-full text-center">
            <div className="mt-32 flex items-center gap-6">
              <div className="flex flex-col items-start gap-1">
                <h2 className="text-2xl font-bold text-white">500+</h2>
                <p className="text-sm text-white">Perusahaan Mitra</p>
              </div>
              <div className="h-12 w-px bg-white/50" />
              <div className="flex flex-col items-start gap-1">
                <h2 className="text-2xl font-bold text-white">10K+</h2>
                <p className="text-sm text-white">Pelatihan Selesai</p>
              </div>
              <div className="h-12 w-px bg-white/50" />
              <div className="flex flex-col items-start gap-1">
                <h2 className="text-2xl font-bold text-white">98%</h2>
                <p className="text-sm text-white">Tingkat Kepuasan</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pusat layanan kami */}
      <section
        className="relative flex min-h-screen flex-col bg-muted/50 px-10 py-16"
        id="layanan"
      >
        <GridBackground />
        <div className="relative z-10 mx-auto mb-8 flex w-fit flex-col items-center gap-2">
          <h2 className="mb-2 text-center text-6xl font-semibold text-primary">
            Pusat Layanan Kami
          </h2>
          <div className="mx-auto h-2 w-full bg-linear-to-r from-accent-linear-1 via-accent-linear-2 to-accent-linear-3" />
        </div>
        <div className="relative z-10 mt-12 flex flex-row flex-wrap items-center justify-center gap-6">
          {/* Service Cards */}
          {pusatLayananItems.map((item) => (
            <Card key={item.title} className="w-64 overflow-hidden rounded-4xl">
              <CardHeader>
                <img
                  src={item.imageSrc}
                  alt={item.title}
                  className="h-40 w-full object-contain"
                />
              </CardHeader>
              <CardFooter className="flex flex-row items-center">
                <a
                  href={item.to}
                  className="w-full text-center text-2xl font-semibold text-primary"
                >
                  {item.title}
                </a>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Profile */}
      <section
        className="relative flex h-[60vh] flex-row gap-4 px-10 py-16"
        id="profile"
      >
        {/* Logo */}
        <img
          src="/assets/logo-balai-k3.png"
          alt="Balai Tepian K3 Logo"
          className="mx-auto w-64 object-contain"
        />
        <div className="relative z-10 mx-auto flex h-full w-fit flex-col items-start justify-between gap-4">
          <h2 className="text-start text-4xl font-semibold text-primary">
            Balai K3 Samarinda
          </h2>
          <h3 className="text-justify text-2xl font-medium text-balance text-foreground">
            Balai Keselamatan dan Kesehatan Kerja (K3) Samarinda merupakan
            lembaga yang berperan dalam mendukung penerapan keselamatan dan
            kesehatan kerja melalui pembinaan, pengujian, dan pelatihan K3.
            Balai ini bertujuan membantu menciptakan lingkungan kerja yang aman,
            sehat, dan produktif sesuai dengan peraturan yang berlaku.
          </h3>
          <Button
            variant="outline"
            className="inline-flex h-10 items-center justify-center rounded-3xl border-primary bg-white px-6 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            Baca selengkapnya
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </section>

      {/* Informasi Kesalamatan & Kesehatan Kerja */}
      <section
        className="relative flex min-h-screen flex-col bg-accent/10 px-10 py-16"
        id="informasi"
      >
        <GridBackground />
        <div className="relative z-10 mx-auto mb-8 flex w-fit flex-col items-center gap-2">
          <h2 className="mb-2 w-200 text-center text-6xl font-semibold text-primary">
            Informasi Keselamatan & Kesehatan Kerja
          </h2>
          <div className="mx-auto h-2 w-full bg-linear-to-r from-accent-linear-1 via-accent-linear-2 to-accent-linear-3" />
        </div>
        {/* Cards */}
        <div className="flex flex-col gap-4">
          {/* Infographic Card */}
          <div className="relative z-10 flex w-full items-center justify-center">
            <Carousel className="w-full">
              <CarouselContent>
                {Array.from({ length: 5 }).map((_, index) => (
                  <CarouselItem key={index}>
                    <div className="p-1">
                      <Card className="h-96 w-full rounded-2xl">
                        <CardContent className="flex h-full flex-col items-center justify-center">
                          <span className="text-4xl font-semibold">
                            {index + 1}
                          </span>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="absolute top-1/2 left-0 ml-2 -translate-y-1/2 rounded-none border-0 bg-transparent p-2 shadow-none" />
              <CarouselNext className="absolute top-1/2 right-0 mr-2 -translate-y-1/2 rounded-none border-0 bg-transparent p-2 shadow-none" />
            </Carousel>
          </div>
          {/* Small News Card */}
          <div className="relative z-10 flex flex-row flex-wrap items-center justify-center gap-6">
            {[1, 2, 3].map((item) => (
              <Card
                key={item}
                className="flex size-96 flex-col overflow-hidden rounded-4xl"
              >
                <CardHeader>
                  <img
                    src="/assets/info-k3.jpg"
                    alt="Informasi K3"
                    className="h-32 w-full object-contain"
                  />
                </CardHeader>
                <CardFooter className="flex flex-row items-center">
                  <a
                    href="#"
                    className="w-full text-center text-lg font-semibold text-primary"
                  >
                    Informasi K3 #{item}
                  </a>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative flex h-screen flex-col px-10 py-16" id="faq">
        <div className="relative z-10 mx-auto mb-8 flex w-fit flex-col items-center gap-2">
          <h2 className="mb-2 w-137.5 text-center text-6xl font-semibold text-balance text-primary">
            Frequently Asked Questions
          </h2>
          <div className="mx-auto h-2 w-full bg-linear-to-r from-accent-linear-1 via-accent-linear-2 to-accent-linear-3" />
        </div>
        {/* FAQ Items */}
        <div className="relative z-10 mx-auto flex w-150 flex-col gap-6">
          <Accordion
            type="single"
            collapsible
            className="w-full"
            defaultValue="item-1"
          >
            <AccordionItem value="item-1">
              <AccordionTrigger>Product Information</AccordionTrigger>
              <AccordionContent className="flex flex-col gap-4 text-balance">
                <p>
                  Our flagship product combines cutting-edge technology with
                  sleek design. Built with premium materials, it offers
                  unparalleled performance and reliability.
                </p>
                <p>
                  Key features include advanced processing capabilities, and an
                  intuitive user interface designed for both beginners and
                  experts.
                </p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Shipping Details</AccordionTrigger>
              <AccordionContent className="flex flex-col gap-4 text-balance">
                <p>
                  We offer worldwide shipping through trusted courier partners.
                  Standard delivery takes 3-5 business days, while express
                  shipping ensures delivery within 1-2 business days.
                </p>
                <p>
                  All orders are carefully packaged and fully insured. Track
                  your shipment in real-time through our dedicated tracking
                  portal.
                </p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Return Policy</AccordionTrigger>
              <AccordionContent className="flex flex-col gap-4 text-balance">
                <p>
                  We stand behind our products with a comprehensive 30-day
                  return policy. If you&apos;re not completely satisfied, simply
                  return the item in its original condition.
                </p>
                <p>
                  Our hassle-free return process includes free return shipping
                  and full refunds processed within 48 hours of receiving the
                  returned item.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Stakeholder */}
      <section
        className="relative flex h-[50vh] flex-col bg-primary px-10 py-16"
        id="stakeholder"
      >
        <div className="flex h-full w-full flex-col justify-center gap-4">
          <img
            src="/assets/stakeholder-tepian-k3.png"
            alt="Tepian K3 Stakeholder Logos"
            className="h-32 w-96 self-end object-contain"
          />
        </div>
        {/* Bottom of Stakeholder Section Text */}
        <div className="absolute bottom-4 container w-full text-center text-sm text-primary-foreground">
          <div className="flex flex-row gap-6">
            {/* Jam Kerja */}
            <div className="flex flex-row items-center gap-1">
              <AlarmClock className="mx-auto size-4" />
              <p className="text-sm font-normal">
                Senin - Jumat, 08.00 - 16.00 WITA
              </p>
            </div>
            {/* Email */}
            <div className="flex flex-row items-center gap-1">
              <Mail className="mx-auto size-4" />
              <p className="text-sm font-normal">balaik3samarinda@gmail.com</p>
            </div>
            {/* Phone */}
            <div className="flex flex-row items-center gap-1">
              <PhoneCall className="mx-auto size-4" />
              <p className="text-sm font-normal">+0232 4522 4023</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative flex h-11 items-center justify-center bg-muted/50 px-10 py-4">
        <p className="text-center text-sm font-normal text-foreground">
          &copy; 2025 Balai K3 Samarinda
        </p>
      </footer>
    </div>
  );
}

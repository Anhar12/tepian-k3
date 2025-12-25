import GridBackground from "@/components/grid-background";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createFileRoute, type LinkProps } from "@tanstack/react-router";
import { AlarmClock, ArrowRight, Mail, PhoneCall } from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

const TITLE_TEXT = `
 ██████╗ ███████╗████████╗████████╗███████╗██████╗
 ██╔══██╗██╔════╝╚══██╔══╝╚══██╔══╝██╔════╝██╔══██╗
 ██████╔╝█████╗     ██║      ██║   █████╗  ██████╔╝
 ██╔══██╗██╔══╝     ██║      ██║   ██╔══╝  ██╔══██╗
 ██████╔╝███████╗   ██║      ██║   ███████╗██║  ██║
 ╚═════╝ ╚══════╝   ╚═╝      ╚═╝   ╚══════╝╚═╝  ╚═╝

 ████████╗    ███████╗████████╗ █████╗  ██████╗██╗  ██╗
 ╚══██╔══╝    ██╔════╝╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝
    ██║       ███████╗   ██║   ███████║██║     █████╔╝
    ██║       ╚════██║   ██║   ██╔══██║██║     ██╔═██╗
    ██║       ███████║   ██║   ██║  ██║╚██████╗██║  ██╗
    ╚═╝       ╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
 `;

function HomeComponent() {
  const navItems = [
    { label: "Beranda", href: "#" },
    { label: "Transaksi", href: "#" },
    { label: "FAQ", href: "#" },
    { label: "PPID", href: "#" },
  ];

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

  return (
    <div className="relative h-screen w-full bg-white dark:bg-neutral-950">
      {/* Landing Page Navbar */}
      <nav className="sticky top-0 z-50 container mx-auto flex h-16 items-center justify-between py-3.5 px-5 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-sm">
        <a href="/" className="text-xl font-bold text-primary">
          {/* image */}
          <img
            src="/assets/logo-tepiank3.png"
            alt="Tepian K3 Logo"
            className="object-contain w-44"
          />
        </a>
        <div className="flex items-center gap-4">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-lg font-medium text-primary hover:underline hover:cursor-pointer"
            >
              {item.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <a
            href="/login"
            className="text-sm font-medium text-primary hover:underline"
          >
            Login
          </a>
          <a
            href="/register"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors"
          >
            Sign Up
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section
        className="relative flex h-[80vh] flex-col justify-center px-10 text-center"
        id="#beranda"
      >
        {/* Background Image/SVG */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <img
            src="/assets/hero-banner.jpg"
            className="object-fill w-full h-full"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col w-full h-full flex-1 justify-center items-start">
          {/* Hero Title */}
          <div className="mb-25">
            <h1 className="relative text-6xl text-white text-start font-semibold">
              Pusat Pelatihan
            </h1>
            <h1 className="relative text-6xl text-white text-start font-semibold">
              K3 Samarinda
            </h1>
          </div>
          {/* Hero Footer */}
          <div className="absolute bottom-15 w-full text-center">
            <div className="mt-32 flex items-center gap-6">
              <div className="flex flex-col items-start gap-1">
                <h2 className="text-2xl text-white font-bold">500+</h2>
                <p className="text-white text-sm">Perusahaan Mitra</p>
              </div>
              <div className="h-12 w-px bg-white/50" />
              <div className="flex flex-col items-start gap-1">
                <h2 className="text-2xl text-white font-bold">10K+</h2>
                <p className="text-white text-sm">Pelatihan Selesai</p>
              </div>
              <div className="h-12 w-px bg-white/50" />
              <div className="flex flex-col items-start gap-1">
                <h2 className="text-2xl text-white font-bold">98%</h2>
                <p className="text-white text-sm">Tingkat Kepuasan</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pusat layanan kami */}
      <section
        className="relative container min-h-screen bg-muted/50 py-16 px-10 flex flex-col"
        id="#layanan"
      >
        <GridBackground />
        <div className="relative z-10 mb-8 w-fit flex flex-col items-center mx-auto gap-2">
          <h2 className="text-6xl font-semibold text-center text-primary mb-2">
            Pusat Layanan Kami
          </h2>
          <div className="mx-auto h-2 w-full bg-linear-to-r from-accent-linear-1 via-accent-linear-2 to-accent-linear-3" />
        </div>
        <div className="flex flex-row flex-wrap gap-6 items-center justify-center relative z-10 mt-12">
          {/* Service Cards */}
          {pusatLayananItems.map((item) => (
            <Card key={item.title} className="overflow-hidden rounded-4xl w-64">
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
                  className="text-2xl font-semibold text-primary text-center w-full"
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
        className="relative container h-[60vh] py-16 px-10 flex flex-row gap-4"
        id="#profile"
      >
        {/* Logo */}
        <img
          src="/assets/logo-balai-k3.png"
          alt="Balai Tepian K3 Logo"
          className="object-contain w-64 mx-auto"
        />
        <div className="relative z-10 w-fit flex flex-col items-start mx-auto gap-4 justify-between h-full">
          <h2 className="text-4xl font-semibold text-start text-primary">
            Balai K3 Samarinda
          </h2>
          <h3 className="text-2xl font-medium text-balance text-justify text-foreground">
            Balai Keselamatan dan Kesehatan Kerja (K3) Samarinda merupakan
            lembaga yang berperan dalam mendukung penerapan keselamatan dan
            kesehatan kerja melalui pembinaan, pengujian, dan pelatihan K3.
            Balai ini bertujuan membantu menciptakan lingkungan kerja yang aman,
            sehat, dan produktif sesuai dengan peraturan yang berlaku.
          </h3>
          <Button
            variant="outline"
            className="text-sm font-semibold border-primary rounded-3xl text-primary hover:bg-primary/10 inline-flex h-10 items-center justify-center px-6 transition-colors bg-white"
          >
            Baca selengkapnya
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </section>

      {/* Informasi Kesalamatan & Kesehatan Kerja */}
      <section
        className="relative container min-h-screen bg-accent/10 py-16 px-10 flex flex-col"
        id="#informasi"
      >
        <GridBackground />
        <div className="relative z-10 mb-8 w-fit flex flex-col items-center mx-auto gap-2">
          <h2 className="text-6xl font-semibold text-center text-primary w-200 mb-2">
            Informasi Keselamatan & Kesehatan Kerja
          </h2>
          <div className="mx-auto h-2 w-full bg-linear-to-r from-accent-linear-1 via-accent-linear-2 to-accent-linear-3" />
        </div>
        {/* Cards */}
        <div className="flex flex-col gap-4">
          {/* Infographic Card */}
          <div className="flex items-center justify-center relative z-10">
            <Card className="overflow-hidden rounded-4xl w-full h-96 flex flex-col">
              <CardHeader>
                <img
                  src="/assets/infographic-k3.jpg"
                  alt="Infographic K3"
                  className="h-64 w-full object-contain"
                />
              </CardHeader>
              <CardFooter className="flex flex-row items-center">
                <a
                  href="#"
                  className="text-2xl font-semibold text-primary text-center w-full"
                >
                  Infographic Keselamatan & Kesehatan Kerja
                </a>
              </CardFooter>
            </Card>
          </div>
          {/* Small News Card */}
          <div className="flex flex-row flex-wrap gap-6 items-center justify-center relative z-10">
            {[1, 2, 3].map((item) => (
              <Card
                key={item}
                className="overflow-hidden rounded-4xl size-96 flex flex-col"
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
                    className="text-lg font-semibold text-primary text-center w-full"
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
      <section
        className="relative container h-screen py-16 px-10 flex flex-col"
        id="#faq"
      >
        <div className="relative z-10 mb-8 w-fit flex flex-col items-center mx-auto gap-2">
          <h2 className="text-6xl font-semibold text-center text-primary mb-2 w-137.5 text-balance">
            Frequently Asked Questions
          </h2>
          <div className="mx-auto h-2 w-full bg-linear-to-r from-accent-linear-1 via-accent-linear-2 to-accent-linear-3" />
        </div>
        {/* FAQ Items */}
        <div className="flex flex-col gap-6 relative z-10 w-150 mx-auto">
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
        className="relative container h-[75vh] py-16 px-10 flex flex-col bg-primary"
        id="#stakeholder"
      >
        <div className="flex flex-col justify-center gap-4 w-full h-full">
          <img
            src="/assets/stakeholder-tepian-k3.png"
            alt="Tepian K3 Stakeholder Logos"
            className="object-contain w-96 h-32 self-end"
          />
        </div>
        {/* Bottom of Stakeholder Section Text */}
        <div className="absolute bottom-4 w-full text-center text-sm text-primary-foreground container">
          <div className="flex flex-row gap-6">
            {/* Jam Kerja */}
            <div className="flex flex-row items-center gap-1">
              <AlarmClock className="size-4 mx-auto" />
              <p className="font-normal text-sm">
                Senin - Jumat, 08.00 - 16.00 WITA
              </p>
            </div>
            {/* Email */}
            <div className="flex flex-row items-center gap-1">
              <Mail className="size-4 mx-auto" />
              <p className="font-normal text-sm">balaik3samarinda@gmail.com</p>
            </div>
            {/* Phone */}
            <div className="flex flex-row items-center gap-1">
              <PhoneCall className="size-4 mx-auto" />
              <p className="font-normal text-sm">+0232 4522 4023</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative container h-11 py-4 px-10 flex items-center justify-center bg-muted/50">
        <p className="text-sm font-normal text-center text-foreground">
          &copy; 2025 Balai K3 Samarinda
        </p>
      </footer>
    </div>
  );
}

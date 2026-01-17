import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Mail, MapIcon, MapPin, PhoneCall, User } from "lucide-react";

export function WorksheetSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="#" className="flex flex-row items-center justify-start">
                <img
                  src="/assets/tepian-k3.png"
                  alt="Tepian K3 Logo"
                  className="size-6"
                />
                <span className="text-base font-semibold">Tepian K3</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="p-4">
        {/* Worksheet sidebar content goes here */}
        <div className="mx-auto flex flex-col gap-12">
          {/* Company Picture */}
          <div className="flex justify-center">
            <img
              src="https://picsum.photos/200"
              alt="Company"
              className="size-48 rounded-lg object-cover"
            />
          </div>

          {/* Company Name */}
          <h2 className="text-center text-lg font-semibold">
            Long ass company name that might overflow
          </h2>

          {/* Company Details */}
          <div className="flex flex-col gap-4">
            {/* Address */}
            <div className="flex flex-row gap-4">
              <MapPin className="size-5 text-gray-500" />
              <span className="text-gray-700">123 Main St, City, Country</span>
            </div>

            {/* Contact Person */}
            <div className="flex flex-row gap-4">
              <User className="size-5 text-gray-500" />
              <span className="text-gray-700">John Doe</span>
            </div>

            {/* Contact Number */}
            <div className="flex flex-row gap-4">
              <PhoneCall className="size-5 text-gray-500" />
              <span className="text-gray-700">+1 234 567 890</span>
            </div>

            {/* Contact Email */}
            <div className="flex flex-row gap-4">
              <Mail className="size-5 text-gray-500" />
              <span className="text-gray-700">contact@example.com</span>
            </div>
          </div>
        </div>
      </SidebarContent>
      {/* <SidebarFooter>
          <NavUser />
        </SidebarFooter> */}
    </Sidebar>
  );
}

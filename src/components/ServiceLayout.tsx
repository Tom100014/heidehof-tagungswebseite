import React from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ConferenceProgressBar } from "@/components/conference/ConferenceProgressBar";

interface ServiceLayoutProps {
  title?: string;
  description?: string;
  serviceId?: string;
  backgroundImage?: string;
  children: React.ReactNode;
}

const ServiceLayout: React.FC<ServiceLayoutProps> = ({
  serviceId,
  backgroundImage = "/heidehof/saal-heidehof.jpg",
  children,
}) => {
  const isConference = serviceId === "conference";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative">
      {isConference && (
        <div className="fixed inset-0 -z-10">
          <img
            src={backgroundImage}
            alt=""
            aria-hidden
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />
        </div>
      )}

      <SiteHeader transparentOnTop={false} />

      <main className="flex-1 pt-24">
        {isConference && (
          <div className="max-w-3xl mx-auto px-4 pt-2">
            <ConferenceProgressBar />
          </div>
        )}
        {children}
      </main>

      {!isConference && <SiteFooter />}
    </div>
  );
};

export default ServiceLayout;

import { useEffect, useRef } from "react";

interface AdBannerProps {
  /** ID do bloco de anúncio (ex: "1234567890") */
  adSlot?: string;
  /** ID do cliente AdSense (ex: "ca-pub-XXXXXXXXXXXXXXXX"). Se omitido, usa import.meta.env.VITE_ADSENSE_CLIENT */
  adClient?: string;
  /** Formato do anúncio */
  format?: "auto" | "horizontal" | "rectangle";
  /** Classes Tailwind adicionais */
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

export function AdBanner({
  adSlot,
  adClient,
  format = "auto",
  className = "",
}: AdBannerProps) {
  const adRef = useRef<HTMLModElement | null>(null);
  const client = adClient || import.meta.env.VITE_ADSENSE_CLIENT || "";

  useEffect(() => {
    // Apenas tenta inicializar se houver client e slot configurados e o anúncio ainda não tiver sido processado
    if (!client || !adSlot) return;

    try {
      if (adRef.current && !adRef.current.getAttribute("data-adsbygoogle-status")) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (err) {
      // Ignorar erros normais de AdBlocker ou re-render em dev
      console.warn("[AdBanner] Anúncio não pôde ser carregado (possível bloqueador ativo):", err);
    }
  }, [client, adSlot]);

  // Se ainda não estiver configurado nenhum ID, renderiza um espaço reservado discreto apenas em desenvolvimento
  if (!client || !adSlot) {
    if (import.meta.env.DEV) {
      return (
        <div
          className={`my-4 flex items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-muted/30 p-4 text-center text-xs text-muted-foreground ${className}`}
        >
          <span>Área de Anúncio ({format}) — Configura VITE_ADSENSE_CLIENT e adSlot</span>
        </div>
      );
    }
    return null;
  }

  return (
    <div className={`my-4 flex justify-center overflow-hidden transition-opacity ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block", width: "100%" }}
        data-ad-client={client}
        data-ad-slot={adSlot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}

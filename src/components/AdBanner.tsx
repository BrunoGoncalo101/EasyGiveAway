import { useEffect, useRef, useState } from "react";

interface AdBannerProps {
  /** Adsterra Banner Key (se omitido, usa a chave padrão) */
  adsterraKey?: string;
  adsterraWidth?: number;
  adsterraHeight?: number;
  /** Google AdSense (se configurado no futuro) */
  adSlot?: string;
  adClient?: string;
  format?: "auto" | "horizontal" | "rectangle";
  className?: string;
}

export function AdBanner({
  adsterraKey = "820c2232fbf182cb97e3a24034eb4d23",
  adsterraWidth = 728,
  adsterraHeight = 90,
  adSlot,
  adClient,
  className = "",
}: AdBannerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  // Ajuste responsivo para ecrãs mobile (ecrãs com menos de 728px de largura)
  useEffect(() => {
    function handleResize() {
      if (!wrapperRef.current) return;
      const width = wrapperRef.current.offsetWidth;
      if (width > 0 && width < adsterraWidth) {
        setScale(Math.min(1, width / adsterraWidth));
      } else {
        setScale(1);
      }
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adsterraWidth]);

  // Carrega o banner Adsterra dentro de um iframe isolado para não poluir o React DOM nem disparar bloqueios
  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const iframe = document.createElement("iframe");
    iframe.width = `${adsterraWidth}`;
    iframe.height = `${adsterraHeight}`;
    iframe.style.border = "none";
    iframe.style.overflow = "hidden";
    iframe.scrolling = "no";
    iframe.title = "Publicidade";
    iframe.style.display = "block";

    containerRef.current.appendChild(iframe);

    try {
      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8" />
              <base target="_blank" />
              <style>
                html, body {
                  margin: 0;
                  padding: 0;
                  width: 100%;
                  height: 100%;
                  overflow: hidden;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  background: transparent;
                }
              </style>
            </head>
            <body>
              <script type="text/javascript">
                atOptions = {
                  'key' : '${adsterraKey}',
                  'format' : 'iframe',
                  'height' : ${adsterraHeight},
                  'width' : ${adsterraWidth},
                  'params' : {}
                };
              </script>
              <script type="text/javascript" src="https://bauval.org/22/${adsterraKey}"></script>
            </body>
          </html>
        `);
        doc.close();
      }
    } catch (e) {
      console.warn("[AdBanner] Erro ao carregar anúncio:", e);
    }
  }, [adsterraKey, adsterraWidth, adsterraHeight]);

  return (
    <div
      ref={wrapperRef}
      className={`my-6 flex w-full flex-col items-center justify-center overflow-hidden ${className}`}
    >
      <div
        style={{
          width: adsterraWidth * scale,
          height: adsterraHeight * scale,
          position: "relative",
        }}
        className="flex items-center justify-center"
      >
        <div
          ref={containerRef}
          style={{
            width: adsterraWidth,
            height: adsterraHeight,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        />
      </div>
      <span className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground/60">
        Publicidade
      </span>
    </div>
  );
}

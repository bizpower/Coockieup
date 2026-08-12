import { ImageResponse } from "next/og";
import { BRAND_NAME, BRAND_TAGLINE } from "@/config/brand";

/**
 * Immagine di anteprima per la condivisione.
 *
 * Generata dal codice, quindi cambia insieme a BRAND_NAME come tutto il resto
 * dell'identità: nessun file da rifare quando il nome verrà deciso.
 *
 * Niente font remoti: l'API di generazione ricade sui caratteri di sistema, e
 * la resa è comunque pulita. Scaricare un font a ogni generazione aggiungerebbe
 * un punto di rottura per un'immagine che deve solo funzionare.
 */

export const alt = `${BRAND_NAME} — ${BRAND_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#FDFBF6",
        }}
      >
        {/* Macchia calda in alto a destra, come nella hero del sito. */}
        <div
          style={{
            position: "absolute",
            top: -180,
            right: -140,
            width: 620,
            height: 620,
            borderRadius: "50%",
            background: "#F4EADA",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: 70,
            left: 80,
            display: "flex",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 6,
            color: "#6B5445",
          }}
        >
          MINI PROTEIN COOKIES
        </div>

        <div style={{ display: "flex", fontSize: 128, fontWeight: 800, color: "#241812" }}>
          {BRAND_NAME}
          <span style={{ color: "#FF4B26" }}>.</span>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 40,
            color: "#6B5445",
            maxWidth: 800,
          }}
        >
          Il biscotto proteico che non sembra proteico.
        </div>

        <div style={{ display: "flex", gap: 18, marginTop: 48 }}>
          {["15 mini cookie", "3 gusti"].map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                padding: "14px 28px",
                borderRadius: 999,
                background: "#FF4B26",
                color: "#241812",
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}

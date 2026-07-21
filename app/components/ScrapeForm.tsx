"use client";

import { useState } from "react";
import { Search, MapPin, Loader2, Zap, CheckCircle2, AlertCircle } from "lucide-react";

interface ScrapeResult {
  success: boolean;
  message: string;
  count: number;
  saved: number;
  error?: string;
  details?: string;
}

interface ScrapeFormProps {
  onScrapeComplete: () => void;
}

export default function ScrapeForm({ onScrapeComplete }: ScrapeFormProps) {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScrapeResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !location.trim()) return;

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), location: location.trim() }),
      });

      const data: ScrapeResult = await response.json();
      setResult(data);

      if (data.success) {
        onScrapeComplete();
      }
    } catch {
      setResult({
        success: false,
        message: "Gagal terhubung ke server.",
        count: 0,
        saved: 0,
        error: "Network error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exampleKeywords = [
    "Klinik Gigi",
    "Warung Makan",
    "Bengkel Motor",
    "Salon Kecantikan",
    "Toko Baju",
    "Apotek",
  ];

  const exampleLocations = ["Bandung", "Jakarta", "Surabaya", "Yogyakarta", "Medan"];

  return (
    <div className="scrape-form-card">
      <div className="scrape-form-header">
        <div className="scrape-icon-wrapper">
          <Zap size={20} />
        </div>
        <div>
          <h2 className="scrape-form-title">Google Maps Scraper</h2>
          <p className="scrape-form-subtitle">
            Temukan UMKM tanpa website dan jadikan mereka klien potensial
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="scrape-form">
        <div className="form-fields-row">
          {/* Keyword Input */}
          <div className="form-field-group">
            <label htmlFor="scrape-query" className="form-label">
              Kata Kunci Bisnis
            </label>
            <div className="form-input-wrapper">
              <Search size={16} className="form-input-icon" />
              <input
                id="scrape-query"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Contoh: Klinik Gigi, Bengkel Motor..."
                className="form-input"
                disabled={isLoading}
                required
              />
            </div>
            <div className="form-suggestions">
              {exampleKeywords.map((kw) => (
                <button
                  key={kw}
                  type="button"
                  className="suggestion-chip"
                  onClick={() => setQuery(kw)}
                  disabled={isLoading}
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>

          {/* Location Input */}
          <div className="form-field-group">
            <label htmlFor="scrape-location" className="form-label">
              Kota / Lokasi
            </label>
            <div className="form-input-wrapper">
              <MapPin size={16} className="form-input-icon" />
              <input
                id="scrape-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Contoh: Bandung, Jakarta Selatan..."
                className="form-input"
                disabled={isLoading}
                required
              />
            </div>
            <div className="form-suggestions">
              {exampleLocations.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  className="suggestion-chip"
                  onClick={() => setLocation(loc)}
                  disabled={isLoading}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          id="btn-start-scrape"
          type="submit"
          className="scrape-submit-btn"
          disabled={isLoading || !query.trim() || !location.trim()}
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="spin" />
              <span>Sedang Scraping...</span>
            </>
          ) : (
            <>
              <Zap size={18} />
              <span>Mulai Scrape</span>
            </>
          )}
        </button>
      </form>

      {/* Result Status */}
      {isLoading && (
        <div className="scrape-status scrape-status--loading">
          <Loader2 size={16} className="spin" />
          <span>
            Membuka Google Maps dan mengumpulkan data... Proses ini membutuhkan 1–2 menit.
          </span>
        </div>
      )}

      {result && !isLoading && (
        <div
          className={`scrape-status ${
            result.success ? "scrape-status--success" : "scrape-status--error"
          }`}
        >
          {result.success ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span>
            {result.success
              ? result.message
              : result.details ?? result.error ?? "Terjadi kesalahan."}
          </span>
        </div>
      )}
    </div>
  );
}
